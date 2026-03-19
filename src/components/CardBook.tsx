import { useState, useEffect, useMemo } from 'react'
import type { StoredContact } from '../types/contact'
import { getAllContacts } from '../lib/db'

interface CardBookProps {
  userId: string
  onSelectContact: (id: string) => void
  onBack: () => void
}

/** 按日期分组 */
function groupByDate(contacts: StoredContact[]): Map<string, StoredContact[]> {
  const map = new Map<string, StoredContact[]>()
  for (const c of contacts) {
    const dateStr = new Date(c.createdAt).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).replace(/\//g, '-')
    const group = map.get(dateStr) || []
    group.push(c)
    map.set(dateStr, group)
  }
  return map
}

export default function CardBook({ userId, onSelectContact, onBack }: CardBookProps) {
  const [contacts, setContacts] = useState<StoredContact[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    getAllContacts(userId).then(list => {
      setContacts(list)
      setLoading(false)
    })
  }, [userId])

  const filtered = useMemo(() => {
    if (!query.trim()) return contacts
    const q = query.toLowerCase().trim()
    return contacts.filter(c => {
      const fields = [c.name, c.organization, c.title, ...c.emails, ...c.phones, c.address]
      return fields.some(f => f && f.toLowerCase().includes(q))
    })
  }, [contacts, query])

  const grouped = useMemo(() => groupByDate(filtered), [filtered])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-[60vh]">
      {/* 顶部标题 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="text-dark-500 hover:text-dark-800 transition-colors text-sm"
          >
            ← 返回
          </button>
          <h2 className="text-xl font-bold text-dark-900">
            名片夹
            <span className="text-dark-400 text-base font-normal ml-2">({contacts.length}张)</span>
          </h2>
        </div>
      </div>

      {/* 搜索框 — 常驻 */}
      <div className="mb-4 relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="搜索姓名、公司、电话、邮箱..."
          className="input-field !pl-9"
        />
      </div>

      {/* 空状态 */}
      {filtered.length === 0 && (
        <div className="text-center py-16 text-dark-400">
          {query ? '没有找到匹配的名片' : '名片夹为空，识别名片后会自动保存'}
        </div>
      )}

      {/* 按日期分组列表 */}
      <div className="space-y-4">
        {Array.from(grouped.entries()).map(([date, group]) => (
          <div key={date}>
            <div className="text-sm text-dark-400 mb-2 px-1">{date}</div>
            <div className="bg-white rounded-xl overflow-hidden shadow-sm divide-y divide-dark-100">
              {group.map(contact => (
                <button
                  key={contact.id}
                  onClick={() => onSelectContact(contact.id)}
                  className="w-full flex items-center gap-4 p-3 hover:bg-dark-50 transition-colors text-left"
                >
                  {/* 名片缩略图 */}
                  <div className="flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden bg-dark-100">
                    {contact.image_url ? (
                      <img
                        src={contact.image_url}
                        alt={contact.name || '名片'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-dark-400 text-xs">📇</div>
                    )}
                  </div>
                  {/* 信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-dark-900 text-base truncate">
                      {contact.name || '未知姓名'}
                    </div>
                    {contact.title && (
                      <div className="text-sm text-dark-500 truncate">{contact.title}</div>
                    )}
                    {contact.organization && (
                      <div className="text-sm text-dark-500 truncate">{contact.organization}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
