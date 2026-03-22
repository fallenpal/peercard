import { useState, useEffect, useCallback } from 'react'
import type { StoredContact } from '../types/contact'
import { getContact, deleteContact, saveContact } from '../lib/db'
import { downloadFile } from '../lib/vcard'

interface CardDetailProps {
  userId: string
  contactId: string
  onBack: () => void
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
  if (c.asn?.trim()) lines.push(`X-ASN:${esc(c.asn.trim())}`)
  if (c.title) lines.push(`TITLE:${esc(c.title)}`)
  c.phones.forEach(p => p.trim() && lines.push(`TEL;TYPE=WORK:${esc(p.trim())}`))
  c.emails.forEach(e => e.trim() && lines.push(`EMAIL;TYPE=WORK:${esc(e.trim())}`))
  if (c.url?.trim()) lines.push(`URL:${esc(c.url.trim())}`)
  if (c.address?.trim()) lines.push(`ADR;TYPE=WORK:;;${esc(c.address.trim())};;;;`)
  if (c.notes?.trim()) lines.push(`NOTE:${esc(c.notes.trim())}`)
  lines.push('END:VCARD')
  return lines.join('\r\n')
}

export default function CardDetail({ userId, contactId, onBack, onDeleted }: CardDetailProps) {
  const [contact, setContact] = useState<StoredContact | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  // 编辑态的本地字段
  const [editName, setEditName] = useState('')
  const [editOrg, setEditOrg] = useState('')
  const [editAsn, setEditAsn] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [editPhones, setEditPhones] = useState<string[]>([])
  const [editEmails, setEditEmails] = useState<string[]>([])
  const [editUrl, setEditUrl] = useState('')
  const [editAddress, setEditAddress] = useState('')
  const [editNotes, setEditNotes] = useState('')

  useEffect(() => {
    getContact(userId, contactId).then(c => {
      if (c) setContact(c)
      setLoading(false)
    })
  }, [userId, contactId])

  /** 进入编辑模式，用当前值填充表单 */
  const enterEdit = useCallback(() => {
    if (!contact) return
    setEditName(contact.name || '')
    setEditOrg(contact.organization || '')
    setEditAsn(contact.asn || '')
    setEditTitle(contact.title || '')
    setEditPhones(contact.phones.length > 0 ? [...contact.phones] : [''])
    setEditEmails(contact.emails.length > 0 ? [...contact.emails] : [''])
    setEditUrl(contact.url || '')
    setEditAddress(contact.address || '')
    setEditNotes(contact.notes || '')
    setEditing(true)
  }, [contact])

  /** 保存编辑 */
  const handleSave = useCallback(async () => {
    if (!contact) return
    setSaving(true)
    try {
      const updated: StoredContact = {
        ...contact,
        name: editName.trim() || null,
        organization: editOrg.trim() || null,
        asn: editAsn.trim(),
        title: editTitle.trim() || null,
        phones: editPhones.filter(p => p.trim()),
        emails: editEmails.filter(e => e.trim()),
        url: editUrl.trim(),
        address: editAddress.trim(),
        notes: editNotes.trim(),
      }
      await saveContact(userId, {
        id: updated.id,
        image_path: updated.image_path,
        createdAt: updated.createdAt,
        name: updated.name,
        organization: updated.organization,
        asn: updated.asn,
        title: updated.title,
        emails: updated.emails,
        phones: updated.phones,
        url: updated.url,
        address: updated.address,
        notes: updated.notes,
      })
      setContact(updated)
      setEditing(false)
    } catch (err) {
      console.error('Save failed:', err)
      alert('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }, [contact, editName, editOrg, editAsn, editTitle, editPhones, editEmails, editUrl, editAddress, editNotes, userId])

  const handleExportVCard = useCallback(() => {
    if (!contact) return
    const vcf = generateVCardFromStored(contact)
    const filename = `${contact.name || 'contact'}.vcf`
    downloadFile(vcf, filename, 'text/vcard')
  }, [contact])

  const handleDelete = useCallback(async () => {
    if (!contact) return
    if (!confirm('确定要删除这张名片吗？')) return
    await deleteContact(userId, contact.id)
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
      {contact.image_url && (
        <div className="rounded-xl overflow-hidden shadow-md bg-dark-100">
          <img
            src={contact.image_url}
            alt={contact.name || '名片'}
            className="w-full object-contain max-h-80"
          />
        </div>
      )}

      {/* 字段列表 */}
      {editing ? (
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
          <EditField label="姓名" value={editName} onChange={setEditName} placeholder="联系人姓名" />
          <EditField label="公司" value={editOrg} onChange={setEditOrg} placeholder="公司/组织名称" />
          <EditField label="ASN" value={editAsn} onChange={setEditAsn} placeholder="如 AS13335（选填）" />
          <EditField label="职位" value={editTitle} onChange={setEditTitle} placeholder="职位头衔" />

          {/* 电话列表 */}
          <div>
            <span className="text-sm text-dark-500 mb-1 block">电话</span>
            {editPhones.map((p, i) => (
              <div key={i} className="flex items-center gap-2 mb-2">
                <input
                  type="tel"
                  value={p}
                  onChange={e => { const a = [...editPhones]; a[i] = e.target.value; setEditPhones(a) }}
                  placeholder="+86 138-0000-0000"
                  className="input-field flex-1"
                />
                {editPhones.length > 1 && (
                  <button onClick={() => setEditPhones(editPhones.filter((_, idx) => idx !== i))}
                    className="p-1.5 text-dark-400 hover:text-red-500 rounded transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
            <button onClick={() => setEditPhones([...editPhones, ''])}
              className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              添加电话
            </button>
          </div>

          {/* 邮箱列表 */}
          <div>
            <span className="text-sm text-dark-500 mb-1 block">邮箱</span>
            {editEmails.map((e, i) => (
              <div key={i} className="flex items-center gap-2 mb-2">
                <input
                  type="email"
                  value={e}
                  onChange={ev => { const a = [...editEmails]; a[i] = ev.target.value; setEditEmails(a) }}
                  placeholder="email@example.com"
                  className="input-field flex-1"
                />
                {editEmails.length > 1 && (
                  <button onClick={() => setEditEmails(editEmails.filter((_, idx) => idx !== i))}
                    className="p-1.5 text-dark-400 hover:text-red-500 rounded transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
            <button onClick={() => setEditEmails([...editEmails, ''])}
              className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              添加邮箱
            </button>
          </div>

          <EditField label="地址" value={editAddress} onChange={setEditAddress} placeholder="联系人地址" />
          <EditField label="网站" value={editUrl} onChange={setEditUrl} placeholder="https://example.com" />
          <div>
            <span className="text-sm text-dark-500 mb-1 block">备注</span>
            <textarea
              value={editNotes}
              onChange={e => setEditNotes(e.target.value)}
              placeholder="添加备注"
              rows={3}
              className="input-field resize-none"
            />
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm divide-y divide-dark-100">
          <FieldRow label="姓名" value={contact.name} />
          <FieldRow label="公司" value={contact.organization} />
          <FieldRow label="ASN" value={contact.asn} />
          <FieldRow label="职位" value={contact.title} />
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
      )}

      {/* 操作按钮 */}
      {editing ? (
        <div className="flex gap-3">
          <button
            onClick={() => setEditing(false)}
            className="btn-secondary flex-1"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex-1"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      ) : (
        <div className="flex gap-3">
          <button onClick={enterEdit} className="btn-secondary flex-1">
            编辑
          </button>
          <button onClick={handleExportVCard} className="btn-primary flex-1">
            导出 vCard
          </button>
          <button onClick={handleDelete} className="btn-secondary flex-1 !text-red-600 hover:!bg-red-50">
            删除
          </button>
        </div>
      )}
    </div>
  )
}

/** 单行只读字段 */
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

/** 单行编辑字段 */
function EditField({ label, value, onChange, placeholder }: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div>
      <span className="text-sm text-dark-500 mb-1 block">{label}</span>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-field"
      />
    </div>
  )
}
