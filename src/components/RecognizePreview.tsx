import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Contact } from '../types/contact'
import { getWhatsAppUrl } from '../lib/vcard'

interface RecognizePreviewProps {
  contact: Contact
  onConfirm: (updates: Partial<Contact>) => void
  onClose: () => void
}

/**
 * 识别成功后的预览弹窗
 * 展示识别结果，允许用户在确认前快速编辑
 */
export default function RecognizePreview({ contact, onConfirm, onClose }: RecognizePreviewProps) {
  const { t } = useTranslation()
  // 本地编辑状态（确认后才同步到父组件）
  const [name, setName] = useState(contact.name || '')
  const [organization, setOrganization] = useState(contact.organization || '')
  const [title, setTitle] = useState(contact.title || '')
  const [emails, setEmails] = useState<string[]>(
    contact.emails.length > 0 ? [...contact.emails] : ['']
  )
  const [phones, setPhones] = useState<string[]>(
    contact.phones.length > 0 ? [...contact.phones] : ['']
  )
  const [asn, setAsn] = useState(contact.asn || '')
  const [url, setUrl] = useState(contact.url || '')
  const [address, setAddress] = useState(contact.address || '')
  const [notes, setNotes] = useState(contact.notes || '')

  /** 确认并保存 */
  const handleConfirm = () => {
    onConfirm({
      name: name.trim() || null,
      organization: organization.trim() || null,
      asn: asn.trim(),
      title: title.trim() || null,
      emails: emails.filter(e => e.trim().length > 0),
      phones: phones.filter(p => p.trim().length > 0),
      url: url.trim(),
      address: address.trim(),
      notes: notes.trim(),
    })
  }

  /** 更新邮箱列表中的某项 */
  const updateEmail = (index: number, value: string) => {
    const updated = [...emails]
    updated[index] = value
    setEmails(updated)
  }

  /** 更新电话列表中的某项 */
  const updatePhone = (index: number, value: string) => {
    const updated = [...phones]
    updated[index] = value
    setPhones(updated)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 遮罩层 */}
      <div
        className="absolute inset-0 bg-dark-900/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* 弹窗主体 */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden
        animate-scale-in flex flex-col">
        {/* 头部 */}
        <div className="px-6 py-4 border-b border-dark-200 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-primary-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-dark-800">{t('preview.title')}</h2>
              <p className="text-xs text-dark-500">{t('preview.subtitle')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-dark-400 hover:text-dark-600 hover:bg-dark-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 内容区：左侧名片图片 + 右侧识别结果 */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
            {/* 左侧名片原图 */}
            <div className="lg:col-span-2 bg-dark-50 p-4 flex items-start justify-center border-b lg:border-b-0 lg:border-r border-dark-200">
              <img
                src={contact.imageUrl}
                alt={t('editor.original')}
                className="rounded-xl shadow-md max-h-[50vh] object-contain w-full"
                draggable={false}
              />
            </div>

            {/* 右侧识别结果表单 */}
            <div className="lg:col-span-3 p-6 space-y-4">
              {/* 基本信息 */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-dark-500 uppercase tracking-wider">{t('preview.basic_info')}</h3>

                {/* 姓名 */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-dark-600 mb-1">
                    <span>👤</span> {t('field.name')}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder={t('placeholder.name')}
                    className="input-field text-base font-medium"
                    autoFocus
                  />
                </div>

                {/* 公司 + 职位 一行 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-medium text-dark-600 mb-1">
                      <span>🏢</span> {t('field.company')}
                    </label>
                    <input
                      type="text"
                      value={organization}
                      onChange={e => setOrganization(e.target.value)}
                      placeholder={t('placeholder.company')}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-medium text-dark-600 mb-1">
                      <span>💼</span> {t('field.title')}
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder={t('placeholder.job_title')}
                      className="input-field"
                    />
                  </div>
                </div>

                {/* ASN */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-dark-600 mb-1">
                    <span>🌐</span> {t('field.asn')} <span className="text-xs text-dark-400 font-normal">({t('field.asn_optional')})</span>
                  </label>
                  <input
                    type="text"
                    value={asn}
                    onChange={e => setAsn(e.target.value)}
                    placeholder={t('placeholder.asn')}
                    className="input-field"
                  />
                </div>
              </div>

              {/* 联系方式 */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-dark-500 uppercase tracking-wider">{t('preview.contact_info')}</h3>

                {/* 邮箱 */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-dark-600 mb-1">
                    <span>✉️</span> {t('field.email')}
                  </label>
                  <div className="space-y-2">
                    {emails.map((email, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="email"
                          value={email}
                          onChange={e => updateEmail(i, e.target.value)}
                          placeholder={t('placeholder.email')}
                          className="input-field flex-1"
                        />
                        {emails.length > 1 && (
                          <button
                            onClick={() => setEmails(emails.filter((_, idx) => idx !== i))}
                            className="p-1.5 text-dark-400 hover:text-red-500 rounded transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => setEmails([...emails, ''])}
                      className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      {t('action.add_email')}
                    </button>
                  </div>
                </div>

                {/* 电话 */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-dark-600 mb-1">
                    <span>📱</span> {t('field.phone')}
                  </label>
                  <div className="space-y-2">
                    {phones.map((phone, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="tel"
                          value={phone}
                          onChange={e => updatePhone(i, e.target.value)}
                          placeholder={t('placeholder.phone')}
                          className="input-field flex-1"
                        />
                        {phone.trim() && (
                          <a
                            href={getWhatsAppUrl(phone)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#25D366] hover:bg-[#1da851] transition-colors flex-shrink-0"
                            title={t('action.whatsapp')}
                            onClick={e => e.stopPropagation()}
                          >
                            <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                          </a>
                        )}
                        {phones.length > 1 && (
                          <button
                            onClick={() => setPhones(phones.filter((_, idx) => idx !== i))}
                            className="p-1.5 text-dark-400 hover:text-red-500 rounded transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => setPhones([...phones, ''])}
                      className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      {t('action.add_phone')}
                    </button>
                  </div>
                </div>
              </div>

              {/* VCF 扩展字段 */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-dark-500 uppercase tracking-wider">{t('preview.extra_info')}</h3>

                {/* 网站 URL */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-dark-600 mb-1">
                    <span>🌐</span> {t('field.website')} <span className="text-xs text-dark-400 font-normal">({t('field.url_tag')})</span>
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    placeholder={t('placeholder.website')}
                    className="input-field"
                  />
                </div>

                {/* 地址 */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-dark-600 mb-1">
                    <span>📍</span> {t('field.address')} <span className="text-xs text-dark-400 font-normal">({t('field.adr_tag')})</span>
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder={t('placeholder.address')}
                    className="input-field"
                  />
                </div>

                {/* 备注 */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-dark-600 mb-1">
                    <span>📝</span> {t('field.notes')} <span className="text-xs text-dark-400 font-normal">({t('field.note_tag')})</span>
                  </label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder={t('placeholder.notes')}
                    rows={2}
                    className="input-field resize-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 底部操作按钮 */}
        <div className="px-6 py-4 border-t border-dark-200 bg-dark-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="btn-secondary text-sm"
          >
            {t('preview.edit_later')}
          </button>
          <div className="flex items-center gap-3">
            <p className="text-xs text-dark-400 hidden sm:block">{t('preview.confirm_hint')}</p>
            <button
              onClick={handleConfirm}
              className="btn-success text-sm gap-1.5 !px-6"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              {t('preview.confirm_save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
