import { useCallback } from 'react'
import type { Contact } from '../types/contact'

interface ContactFormProps {
  contact: Contact
  onUpdate: (updates: Partial<Contact>) => void
}

export default function ContactForm({ contact, onUpdate }: ContactFormProps) {
  /** 更新单个邮箱 */
  const updateEmail = useCallback((index: number, value: string) => {
    const newEmails = [...contact.emails]
    newEmails[index] = value
    onUpdate({ emails: newEmails })
  }, [contact.emails, onUpdate])

  /** 删除邮箱 */
  const removeEmail = useCallback((index: number) => {
    const newEmails = contact.emails.filter((_, i) => i !== index)
    onUpdate({ emails: newEmails })
  }, [contact.emails, onUpdate])

  /** 添加邮箱 */
  const addEmail = useCallback(() => {
    onUpdate({ emails: [...contact.emails, ''] })
  }, [contact.emails, onUpdate])

  /** 更新单个电话 */
  const updatePhone = useCallback((index: number, value: string) => {
    const newPhones = [...contact.phones]
    newPhones[index] = value
    onUpdate({ phones: newPhones })
  }, [contact.phones, onUpdate])

  /** 删除电话 */
  const removePhone = useCallback((index: number) => {
    const newPhones = contact.phones.filter((_, i) => i !== index)
    onUpdate({ phones: newPhones })
  }, [contact.phones, onUpdate])

  /** 添加电话 */
  const addPhone = useCallback(() => {
    onUpdate({ phones: [...contact.phones, ''] })
  }, [contact.phones, onUpdate])

  return (
    <div className="space-y-5">
      {/* 姓名 */}
      <FieldGroup label="姓名" icon="👤">
        <input
          type="text"
          value={contact.name || ''}
          onChange={e => onUpdate({ name: e.target.value || null })}
          placeholder="请输入联系人姓名"
          className="input-field text-base font-medium"
        />
      </FieldGroup>

      {/* 公司 */}
      <FieldGroup label="公司 / 组织" icon="🏢">
        <input
          type="text"
          value={contact.organization || ''}
          onChange={e => onUpdate({ organization: e.target.value || null })}
          placeholder="请输入公司名称"
          className="input-field"
        />
      </FieldGroup>

      {/* ASN */}
      <FieldGroup label="ASN" icon="🌐">
        <input
          type="text"
          value={contact.asn || ''}
          onChange={e => onUpdate({ asn: e.target.value })}
          placeholder="如 AS13335、AS9808（选填）"
          className="input-field"
        />
      </FieldGroup>

      {/* 职位 */}
      <FieldGroup label="职位" icon="💼">
        <input
          type="text"
          value={contact.title || ''}
          onChange={e => onUpdate({ title: e.target.value || null })}
          placeholder="请输入职位"
          className="input-field"
        />
      </FieldGroup>

      {/* 邮箱列表 */}
      <FieldGroup label="邮箱" icon="✉️">
        <div className="space-y-2">
          {contact.emails.length === 0 ? (
            <p className="text-sm text-dark-400 italic">未识别到邮箱</p>
          ) : (
            contact.emails.map((email, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={e => updateEmail(index, e.target.value)}
                  placeholder="email@example.com"
                  className="input-field flex-1"
                />
                <button
                  onClick={() => removeEmail(index)}
                  className="p-2 text-dark-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="删除此邮箱"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))
          )}
          <button
            onClick={addEmail}
            className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 hover:underline"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            添加邮箱
          </button>
        </div>
      </FieldGroup>

      {/* 电话列表 */}
      <FieldGroup label="电话" icon="📱">
        <div className="space-y-2">
          {contact.phones.length === 0 ? (
            <p className="text-sm text-dark-400 italic">未识别到电话</p>
          ) : (
            contact.phones.map((phone, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="tel"
                  value={phone}
                  onChange={e => updatePhone(index, e.target.value)}
                  placeholder="+86 138-0000-0000"
                  className="input-field flex-1"
                />
                <button
                  onClick={() => removePhone(index)}
                  className="p-2 text-dark-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="删除此电话"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))
          )}
          <button
            onClick={addPhone}
            className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 hover:underline"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            添加电话
          </button>
        </div>
      </FieldGroup>

      {/* 分隔线 — VCF 扩展标准字段 */}
      <div className="pt-2">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 h-px bg-dark-200" />
          <span className="text-xs font-medium text-dark-400 uppercase tracking-wider">VCF 标准字段</span>
          <div className="flex-1 h-px bg-dark-200" />
        </div>
      </div>

      {/* 网站 URL */}
      <FieldGroup label="网站" icon="🌐" vcfField="URL">
        <input
          type="url"
          value={contact.url || ''}
          onChange={e => onUpdate({ url: e.target.value })}
          placeholder="https://example.com"
          className="input-field"
        />
      </FieldGroup>

      {/* 地址 */}
      <FieldGroup label="地址" icon="📍" vcfField="ADR">
        <input
          type="text"
          value={contact.address || ''}
          onChange={e => onUpdate({ address: e.target.value })}
          placeholder="输入联系人地址"
          className="input-field"
        />
      </FieldGroup>

      {/* 备注 */}
      <FieldGroup label="备注" icon="📝" vcfField="NOTE">
        <textarea
          value={contact.notes}
          onChange={e => onUpdate({ notes: e.target.value })}
          placeholder="添加备注信息，如：负责东南亚 peering、在 HKIX 有 presence、APRICOT 2025 认识"
          rows={3}
          className="input-field resize-none"
        />
      </FieldGroup>
    </div>
  )
}

/** 表单字段分组容器 */
function FieldGroup({
  label,
  icon,
  vcfField,
  children,
}: {
  label: string
  icon: string
  vcfField?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-sm font-medium text-dark-700 mb-1.5">
        <span>{icon}</span>
        {label}
        {vcfField && (
          <span className="text-xs text-dark-400 font-normal">({vcfField})</span>
        )}
      </label>
      {children}
    </div>
  )
}
