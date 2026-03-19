import type { StoredContact } from '../types/contact'
import { supabase } from './supabase'

// ==================== IndexedDB 本地缓存 ====================

const CACHE_DB_VERSION = 1
const CACHE_STORE = 'contacts'
const IMAGE_STORE = 'images'

function openCacheDB(userId: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(`peercard_cache_${userId}`, CACHE_DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(CACHE_STORE)) {
        db.createObjectStore(CACHE_STORE, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(IMAGE_STORE)) {
        db.createObjectStore(IMAGE_STORE)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

/** 写入缓存（联系人元数据） */
async function cacheContacts(userId: string, contacts: StoredContact[]): Promise<void> {
  const db = await openCacheDB(userId)
  const tx = db.transaction(CACHE_STORE, 'readwrite')
  const store = tx.objectStore(CACHE_STORE)
  // 先清空再写入，保持与云端一致
  store.clear()
  for (const c of contacts) {
    store.put({ ...c, image_url: undefined }) // 不缓存签名 URL
  }
}

/** 读取缓存 */
async function getCachedContacts(userId: string): Promise<StoredContact[]> {
  try {
    const db = await openCacheDB(userId)
    return new Promise((resolve, reject) => {
      const req = db.transaction(CACHE_STORE, 'readonly').objectStore(CACHE_STORE).getAll()
      req.onsuccess = () => {
        const list = (req.result as StoredContact[])
        list.sort((a, b) => b.createdAt - a.createdAt)
        resolve(list)
      }
      req.onerror = () => reject(req.error)
    })
  } catch {
    return []
  }
}

/** 缓存图片 Blob */
async function cacheImage(userId: string, contactId: string, blob: Blob): Promise<void> {
  try {
    const db = await openCacheDB(userId)
    const tx = db.transaction(IMAGE_STORE, 'readwrite')
    tx.objectStore(IMAGE_STORE).put(blob, contactId)
  } catch { /* 缓存失败不阻塞 */ }
}

/** 读取缓存图片 */
async function getCachedImage(userId: string, contactId: string): Promise<Blob | undefined> {
  try {
    const db = await openCacheDB(userId)
    return new Promise((resolve) => {
      const req = db.transaction(IMAGE_STORE, 'readonly').objectStore(IMAGE_STORE).get(contactId)
      req.onsuccess = () => resolve(req.result as Blob | undefined)
      req.onerror = () => resolve(undefined)
    })
  } catch {
    return undefined
  }
}

/** 删除缓存图片 */
async function deleteCachedImage(userId: string, contactId: string): Promise<void> {
  try {
    const db = await openCacheDB(userId)
    const tx = db.transaction(IMAGE_STORE, 'readwrite')
    tx.objectStore(IMAGE_STORE).delete(contactId)
  } catch { /* ignore */ }
}

/** 从签名 URL 下载图片并缓存 */
async function fetchAndCacheImage(userId: string, contactId: string, url: string): Promise<string> {
  try {
    const resp = await fetch(url)
    if (resp.ok) {
      const blob = await resp.blob()
      await cacheImage(userId, contactId, blob)
      return URL.createObjectURL(blob)
    }
  } catch { /* fallback to url */ }
  return url
}

// ==================== 云端 API ====================

/** 保存联系人到 Supabase（Postgres + Storage）+ 写入本地缓存 */
export async function saveContact(
  userId: string,
  contact: Omit<StoredContact, 'image_url'>,
  imageFile?: File | Blob,
): Promise<void> {
  // 上传图片到 Storage
  let imagePath: string | null = null
  if (imageFile) {
    const ext = imageFile instanceof File
      ? imageFile.name.split('.').pop() || 'jpg'
      : 'jpg'
    imagePath = `${userId}/${contact.id}.${ext}`
    const { error: uploadErr } = await supabase.storage
      .from('card-images')
      .upload(imagePath, imageFile, { upsert: true })
    if (uploadErr) console.error('Image upload failed:', uploadErr)

    // 同时缓存图片到本地
    await cacheImage(userId, contact.id, imageFile)
  }

  // 插入联系人记录
  const { error } = await supabase.from('contacts').upsert({
    id: contact.id,
    user_id: userId,
    name: contact.name,
    organization: contact.organization,
    title: contact.title,
    emails: contact.emails,
    phones: contact.phones,
    notes: contact.notes,
    url: contact.url,
    address: contact.address,
    image_path: imagePath ?? contact.image_path,
    created_at: contact.createdAt,
  })
  if (error) throw error
}

/** 获取全部联系人：先返回缓存，后台同步云端 */
export async function getAllContacts(userId: string): Promise<StoredContact[]> {
  // 尝试从云端获取
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  if (!data || data.length === 0) return []

  // 构建联系人列表，优先用本地缓存图片
  const contacts: StoredContact[] = []
  for (const row of data) {
    let imageUrl: string | undefined
    if (row.image_path) {
      const cached = await getCachedImage(userId, row.id)
      if (cached) {
        imageUrl = URL.createObjectURL(cached)
      }
    }
    contacts.push({
      id: row.id,
      image_path: row.image_path,
      image_url: imageUrl, // 可能为 undefined，后面懒加载
      createdAt: row.created_at,
      name: row.name,
      organization: row.organization,
      title: row.title,
      emails: row.emails || [],
      phones: row.phones || [],
      notes: row.notes || '',
      url: row.url || '',
      address: row.address || '',
    })
  }

  // 写入联系人元数据缓存
  cacheContacts(userId, contacts).catch(() => {})

  return contacts
}

/** 获取缓存的联系人列表（秒开用） */
export async function getCachedContactList(userId: string): Promise<StoredContact[]> {
  const contacts = await getCachedContacts(userId)
  // 给缓存的联系人附上本地图片 URL
  for (const c of contacts) {
    if (c.image_path) {
      const cached = await getCachedImage(userId, c.id)
      if (cached) {
        c.image_url = URL.createObjectURL(cached)
      }
    }
  }
  return contacts
}

/** 获取单个联系人（优先本地缓存图片） */
export async function getContact(userId: string, id: string): Promise<StoredContact | undefined> {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (error || !data) return undefined

  let imageUrl: string | undefined
  if (data.image_path) {
    // 先查本地缓存
    const cached = await getCachedImage(userId, id)
    if (cached) {
      imageUrl = URL.createObjectURL(cached)
    } else {
      // 缓存没有，从云端签名 URL 下载并缓存
      const { data: signedData } = await supabase.storage
        .from('card-images')
        .createSignedUrl(data.image_path, 3600)
      if (signedData?.signedUrl) {
        imageUrl = await fetchAndCacheImage(userId, id, signedData.signedUrl)
      }
    }
  }

  return {
    id: data.id,
    image_path: data.image_path,
    image_url: imageUrl,
    createdAt: data.created_at,
    name: data.name,
    organization: data.organization,
    title: data.title,
    emails: data.emails || [],
    phones: data.phones || [],
    notes: data.notes || '',
    url: data.url || '',
    address: data.address || '',
  }
}

/** 删除联系人（云端 + 本地缓存） */
export async function deleteContact(userId: string, id: string): Promise<void> {
  const { data } = await supabase
    .from('contacts')
    .select('image_path')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
  if (error) throw error

  if (data?.image_path) {
    await supabase.storage.from('card-images').remove([data.image_path])
  }

  // 清理本地缓存
  await deleteCachedImage(userId, id)
}
