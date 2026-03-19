import type { StoredContact } from '../types/contact'

const DB_VERSION = 1
const STORE_NAME = 'contacts'

function dbName(userId: string): string {
  return `peercard_${userId}`
}

function openDB(userId: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(dbName(userId), DB_VERSION)
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
export async function saveContact(userId: string, contact: StoredContact): Promise<void> {
  const db = await openDB(userId)
  return new Promise((resolve, reject) => {
    const req = txStore(db, 'readwrite').put(contact)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

/** 获取全部联系人，按 createdAt 降序 */
export async function getAllContacts(userId: string): Promise<StoredContact[]> {
  const db = await openDB(userId)
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
export async function getContact(userId: string, id: string): Promise<StoredContact | undefined> {
  const db = await openDB(userId)
  return new Promise((resolve, reject) => {
    const req = txStore(db, 'readonly').get(id)
    req.onsuccess = () => resolve(req.result as StoredContact | undefined)
    req.onerror = () => reject(req.error)
  })
}

/** 删除联系人 */
export async function deleteContact(userId: string, id: string): Promise<void> {
  const db = await openDB(userId)
  return new Promise((resolve, reject) => {
    const req = txStore(db, 'readwrite').delete(id)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}
