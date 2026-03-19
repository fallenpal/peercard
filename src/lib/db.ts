import type { StoredContact } from '../types/contact'

const DB_NAME = 'peercard'
const DB_VERSION = 1
const STORE_NAME = 'contacts'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function txStore(db: IDBDatabase, mode: IDBTransactionMode): IDBObjectStore {
  return db.transaction(STORE_NAME, mode).objectStore(STORE_NAME)
}

/** 保存联系人到 IndexedDB */
export async function saveContact(contact: StoredContact): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = txStore(db, 'readwrite').put(contact)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

/** 获取全部联系人，按 createdAt 降序 */
export async function getAllContacts(): Promise<StoredContact[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = txStore(db, 'readonly').getAll()
    req.onsuccess = () => {
      const list = req.result as StoredContact[]
      list.sort((a, b) => b.createdAt - a.createdAt)
      resolve(list)
    }
    req.onerror = () => reject(req.error)
  })
}

/** 获取单个联系人 */
export async function getContact(id: string): Promise<StoredContact | undefined> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = txStore(db, 'readonly').get(id)
    req.onsuccess = () => resolve(req.result as StoredContact | undefined)
    req.onerror = () => reject(req.error)
  })
}

/** 删除联系人 */
export async function deleteContact(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = txStore(db, 'readwrite').delete(id)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

/** 搜索联系人（前端模糊匹配） */
export async function searchContacts(query: string): Promise<StoredContact[]> {
  const all = await getAllContacts()
  if (!query.trim()) return all
  const q = query.toLowerCase().trim()
  return all.filter(c => {
    const fields = [
      c.name,
      c.organization,
      c.title,
      ...c.emails,
      ...c.phones,
      c.address,
    ]
    return fields.some(f => f && f.toLowerCase().includes(q))
  })
}
