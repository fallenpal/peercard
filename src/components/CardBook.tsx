import { useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { StoredContact } from '../types/contact'
import { getAllContacts, getCachedContactList } from '../lib/db'
import { supabase } from '../lib/supabase'

interface CardBookProps {
  userId: string
  onSelectContact: (id: string) => void
  onBack: () => void
}

/** 按日期分组 */
function groupByDate(contacts: StoredContact[], lang: string): Map<string, StoredContact[]> {
  const map = new Map<string, StoredContact[]>()
  const locale = lang.startsWith('zh') ? 'zh-CN' : 'en-US'
  for (const c of contacts) {
    const dateStr = new Date(c.createdAt).toLocaleDateString(locale, {
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
  const { t, i18n } = useTranslation()
  const [contacts, setContacts] = useState<StoredContact[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    let cancelled = false
    getCachedContactList(userId).then(cached => {
      if (cancelled) return
      if (cached.length > 0) {
        setContacts(cached)
        setLoading(false)
      }
    })
    getAllContacts(userId).then(list => {
      if (cancelled) return
      setContacts(list)
      setLoading(false)
    }).catch(() => setLoading(false))
    return () => { cancelled = true }
  }, [userId])

  const filtered = useMemo(() => {
    if (!query.trim()) return contacts
    const q = query.toLowerCase().trim()
    return contacts.filter(c => {
      const fields = [c.name, c.organization, c.title, c.asn, ...c.emails, ...c.phones, c.address]
      return fields.some(f => f && f.toLowerCase().includes(q))
    })
  }, [contacts, query])

  const grouped = useMemo(() => groupByDate(filtered, i18n.language), [filtered, i18n.language])

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
            {t('action.back')}
          </button>
          <h2 className="text-xl font-bold text-dark-900">
            {t('cardbook.title')}
            <span className="text-dark-400 text-base font-normal ml-2">{t('cardbook.count', { count: contacts.length })}</span>
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
          placeholder={t('placeholder.search')}
          className="input-field !pl-9"
        />
      </div>

      {/* 空状态 */}
      {filtered.length === 0 && (
        <div className="text-center py-16 text-dark-400">
          {query ? t('cardbook.no_match') : t('cardbook.empty')}
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
                  <Thumbnail contact={contact} />
                  {/* 信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-dark-900 text-base truncate">
                      {contact.name || t('cardbook.unknown_name')}
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

/** 缩略图：有缓存直接显示，没缓存懒加载签名 URL */
function Thumbnail({ contact }: { contact: StoredContact }) {
  const { t } = useTranslation()
  const [src, setSrc] = useState<string | undefined>(contact.image_url)

  useEffect(() => {
    if (src || !contact.image_path) return
    supabase.storage
      .from('card-images')
      .createSignedUrl(contact.image_path, 3600)
      .then(({ data }) => {
        if (data?.signedUrl) setSrc(data.signedUrl)
      })
  }, [src, contact.image_path])

  return (
    <div className="flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden bg-dark-100">
      {src ? (
        <img src={src} alt={contact.name || t('editor.original')} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-dark-400 text-xs">📇</div>
      )}
    </div>
  )
}
