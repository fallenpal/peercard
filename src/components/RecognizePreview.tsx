import { useState } from 'react'
import type { Contact } from '../types/contact'

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
  const [url, setUrl] = useState(contact.url || '')
  const [address, setAddress] = useState(contact.address || '')
  const [notes, setNotes] = useState(contact.notes || '')

  /** 确认并保存 */
  const handleConfirm = () => {
    onConfirm({
      name: name.trim() || null,
      organization: organization.trim() || null,
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
              <h2 className="text-lg font-semibold text-dark-800">识别完成</h2>
              <p className="text-xs text-dark-500">请确认或编辑以下识别结果</p>
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
                alt="名片原图"
                className="rounded-xl shadow-md max-h-[50vh] object-contain w-full"
                draggable={false}
              />
            </div>

            {/* 右侧识别结果表单 */}
            <div className="lg:col-span-3 p-6 space-y-4">
              {/* 基本信息 */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-dark-500 uppercase tracking-wider">基本信息</h3>

                {/* 姓名 */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-dark-600 mb-1">
                    <span>👤</span> 姓名
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="联系人姓名"
                    className="input-field text-base font-medium"
                    autoFocus
                  />
                </div>

                {/* 公司 + 职位 一行 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-medium text-dark-600 mb-1">
                      <span>🏢</span> 公司
                    </label>
                    <input
                      type="text"
                      value={organization}
                      onChange={e => setOrganization(e.target.value)}
                      placeholder="公司/组织名称"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-medium text-dark-600 mb-1">
                      <span>💼</span> 职位
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="职位头衔"
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              {/* 联系方式 */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-dark-500 uppercase tracking-wider">联系方式</h3>

                {/* 邮箱 */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-dark-600 mb-1">
                    <span>✉️</span> 邮箱
                  </label>
                  <div className="space-y-2">
                    {emails.map((email, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="email"
                          value={email}
                          onChange={e => updateEmail(i, e.target.value)}
                          placeholder="email@example.com"
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
                      添加邮箱
                    </button>
                  </div>
                </div>

                {/* 电话 */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-dark-600 mb-1">
                    <span>📱</span> 电话
                  </label>
                  <div className="space-y-2">
                    {phones.map((phone, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="tel"
                          value={phone}
                          onChange={e => updatePhone(i, e.target.value)}
                          placeholder="+86 138-0000-0000"
                          className="input-field flex-1"
                        />
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
                      添加电话
                    </button>
                  </div>
                </div>
              </div>

              {/* VCF 扩展字段 */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-dark-500 uppercase tracking-wider">附加信息 (VCF 标准字段)</h3>

                {/* 网站 URL */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-dark-600 mb-1">
                    <span>🌐</span> 网站 <span className="text-xs text-dark-400 font-normal">(URL)</span>
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="input-field"
                  />
                </div>

                {/* 地址 */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-dark-600 mb-1">
                    <span>📍</span> 地址 <span className="text-xs text-dark-400 font-normal">(ADR)</span>
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="输入联系人地址"
                    className="input-field"
                  />
                </div>

                {/* 备注 */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-dark-600 mb-1">
                    <span>📝</span> 备注 <span className="text-xs text-dark-400 font-normal">(NOTE)</span>
                  </label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="添加备注，如：负责东南亚 peering、在 HKIX 有 presence、APRICOT 2025 认识"
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
            稍后编辑
          </button>
          <div className="flex items-center gap-3">
            <p className="text-xs text-dark-400 hidden sm:block">确认后仍可在编辑视图中修改</p>
            <button
              onClick={handleConfirm}
              className="btn-success text-sm gap-1.5 !px-6"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              确认保存
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
