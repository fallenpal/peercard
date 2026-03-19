import type { StoredContact } from '../types/contact'
import { supabase } from './supabase'

/** 保存联系人到 Supabase（Postgres + Storage） */
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

/** 获取全部联系人，按 createdAt 降序 */
export async function getAllContacts(userId: string): Promise<StoredContact[]> {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  if (!data || data.length === 0) return []

  // 批量获取图片签名 URL
  const paths = data
    .map(c => c.image_path)
    .filter((p): p is string => !!p)

  let urlMap: Record<string, string> = {}
  if (paths.length > 0) {
    const { data: signedData } = await supabase.storage
      .from('card-images')
      .createSignedUrls(paths, 3600) // 1 小时有效
    if (signedData) {
      for (const item of signedData) {
        if (item.signedUrl && item.path) {
          urlMap[item.path] = item.signedUrl
        }
      }
    }
  }

  return data.map(row => ({
    id: row.id,
    image_path: row.image_path,
    image_url: row.image_path ? urlMap[row.image_path] : undefined,
    createdAt: row.created_at,
    name: row.name,
    organization: row.organization,
    title: row.title,
    emails: row.emails || [],
    phones: row.phones || [],
    notes: row.notes || '',
    url: row.url || '',
    address: row.address || '',
  }))
}

/** 获取单个联系人 */
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
    const { data: signedData } = await supabase.storage
      .from('card-images')
      .createSignedUrl(data.image_path, 3600)
    if (signedData) imageUrl = signedData.signedUrl
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

/** 删除联系人（数据 + 图片） */
export async function deleteContact(userId: string, id: string): Promise<void> {
  // 先查 image_path
  const { data } = await supabase
    .from('contacts')
    .select('image_path')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  // 删数据库记录
  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
  if (error) throw error

  // 删 Storage 文件
  if (data?.image_path) {
    await supabase.storage.from('card-images').remove([data.image_path])
  }
}
