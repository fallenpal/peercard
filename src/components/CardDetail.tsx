import { useState, useEffect, useCallback } from 'react'
import type { StoredContact } from '../types/contact'
import { getContact, deleteContact } from '../lib/db'
import { downloadFile } from '../lib/vcard'

interface CardDetailProps {
  contactId: string
  onBack: () => void
  /** 删除后回调 */
  onDeleted: () => void
}

/** 从 StoredContact 生成 vCard 字符串 */
function generateVCardFromStored(c: StoredContact): string {
  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n')
  const lines: string[] = ['BEGIN:VCARD', 'VERSION:3.0']
  if (c.name) {
    lines.push(`FN:${esc(c.name)}`)
    const parts = c.name.trim().split(/\s+/)
    lines.push(parts.length >= 2
      ? `N:${esc(parts.slice(1).join(' '))};${esc(parts[0])};;;`
      : `N:${esc(c.name)};;;;`)
  }
  if (c.organization) lines.push(`ORG:${esc(c.organization)}`)
  if (c.title) lines.push(`TITLE:${esc(c.title)}`)
  c.phones.forEach(p => p.trim() && lines.push(`TEL;TYPE=WORK:${esc(p.trim())}`))
  c.emails.forEach(e => e.trim() && lines.push(`EMAIL;TYPE=WORK:${esc(e.trim())}`))
  if (c.url?.trim()) lines.push(`URL:${esc(c.url.trim())}`)
  if (c.address?.trim()) lines.push(`ADR;TYPE=WORK:;;${esc(c.address.trim())};;;;`)
  if (c.notes?.trim()) lines.push(`NOTE:${esc(c.notes.trim())}`)
  lines.push('END:VCARD')
  return lines.join('\r\n')
}

export default function CardDetail({ contactId, onBack, onDeleted }: CardDetailProps) {
  const [contact, setContact] = useState<StoredContact | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getContact(contactId).then(c => {
      if (c) {
        setContact(c)
        setImageUrl(URL.createObjectURL(c.imageBlob))
      }
      setLoading(false)
    })
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactId])

  const handleExportVCard = useCallback(() => {
    if (!contact) return
    const vcf = generateVCardFromStored(contact)
    const filename = `${contact.name || 'contact'}.vcf`
    downloadFile(vcf, filename, 'text/vcard')
  }, [contact])

  const handleDelete = useCallback(async () => {
    if (!contact) return
    if (!confirm('确定要删除这张名片吗？')) return
    await deleteContact(contact.id)
    onDeleted()
  }, [contact, onDeleted])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!contact) {
    return (
      <div className="text-center py-16 text-dark-400">
        名片不存在
        <button onClick={onBack} className="block mx-auto mt-4 btn-secondary">返回名片夹</button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 返回按钮 */}
      <button
        onClick={onBack}
        className="text-dark-400 hover:text-dark-700 transition-colors text-sm"
      >
        ← 返回名片夹
      </button>

      {/* 原始名片照片 */}
      {imageUrl && (
        <div className="rounded-xl overflow-hidden shadow-md bg-dark-100">
          <img
            src={imageUrl}
            alt={contact.name || '名片'}
            className="w-full object-contain max-h-80"
          />
        </div>
      )}

      {/* 字段列表 */}
      <div className="bg-white rounded-xl shadow-sm divide-y divide-dark-100">
        <FieldRow label="姓名" value={contact.name} />
        <FieldRow label="职位" value={contact.title} />
        <FieldRow label="公司" value={contact.organization} />
        {contact.phones.map((p, i) => (
          <FieldRow key={`phone-${i}`} label={i === 0 ? '电话' : ''} value={p}>
            <a href={`tel:${p}`} className="text-primary-700 hover:underline">{p}</a>
          </FieldRow>
        ))}
        {contact.emails.map((e, i) => (
          <FieldRow key={`email-${i}`} label={i === 0 ? '邮箱' : ''} value={e}>
            <a href={`mailto:${e}`} className="text-primary-700 hover:underline">{e}</a>
          </FieldRow>
        ))}
        <FieldRow label="地址" value={contact.address} />
        <FieldRow label="网站" value={contact.url}>
          {contact.url && (
            <a href={contact.url.startsWith('http') ? contact.url : `https://${contact.url}`}
              target="_blank" rel="noreferrer"
              className="text-primary-700 hover:underline">{contact.url}</a>
          )}
        </FieldRow>
        <FieldRow label="备注" value={contact.notes} />
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-3">
        <button onClick={handleExportVCard} className="btn-primary flex-1">
          导出 vCard
        </button>
        <button onClick={handleDelete} className="btn-secondary flex-1 !text-red-600 hover:!bg-red-50">
          删除
        </button>
      </div>
    </div>
  )
}

/** 单行字段 */
function FieldRow({ label, value, children }: {
  label: string
  value: string | null | undefined
  children?: React.ReactNode
}) {
  if (!value && !children) return null
  return (
    <div className="flex items-start px-4 py-3 gap-4">
      <span className="text-sm text-dark-400 w-12 flex-shrink-0">{label}</span>
      <span className="text-sm text-dark-800 flex-1">
        {children || value}
      </span>
    </div>
  )
}
