import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Contact } from '../types/contact'
import ContactForm from './ContactForm'
import { generateSingleVCard, downloadFile } from '../lib/vcard'

interface CardEditorProps {
  contact: Contact
  onUpdate: (updates: Partial<Contact>) => void
  onPrev: () => void
  onNext: () => void
  hasPrev: boolean
  hasNext: boolean
  currentNum: number
  totalNum: number
}

export default function CardEditor({
  contact,
  onUpdate,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  currentNum,
  totalNum,
}: CardEditorProps) {
  const { t } = useTranslation()
  const [imageScale, setImageScale] = useState(1)

  /** 缩放控制 */
  const handleZoomIn = () => setImageScale(s => Math.min(s + 0.25, 3))
  const handleZoomOut = () => setImageScale(s => Math.max(s - 0.25, 0.5))
  const handleZoomReset = () => setImageScale(1)

  /** 导出单张 vCard */
  const handleExportSingle = () => {
    const vcfContent = generateSingleVCard(contact)
    const fileName = contact.name
      ? `${contact.name}.vcf`
      : `contact_${contact.id.slice(0, 8)}.vcf`
    downloadFile(vcfContent, fileName, 'text/vcard')
  }

  return (
    <div className="space-y-4">
      {/* 顶部导航栏 */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-dark-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={onPrev}
            disabled={!hasPrev}
            className="btn-secondary !px-3 !py-1.5 text-xs gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            {t('editor.prev')}
          </button>
          <span className="text-sm text-dark-500 tabular-nums">
            {currentNum} / {totalNum}
          </span>
          <button
            onClick={onNext}
            disabled={!hasNext}
            className="btn-secondary !px-3 !py-1.5 text-xs gap-1"
          >
            {t('editor.next')}
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>

        <button
          onClick={handleExportSingle}
          className="btn-success text-xs gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          {t('action.export_vcard')}
        </button>
      </div>

      {/* 主内容：左右分栏 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 左侧：名片原图 */}
        <div className="bg-white rounded-xl border border-dark-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-dark-100 flex items-center justify-between">
            <h3 className="text-sm font-medium text-dark-700 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
              </svg>
              {t('editor.original')}
            </h3>
            <div className="flex items-center gap-1">
              <button
                onClick={handleZoomOut}
                className="p-1.5 rounded-md text-dark-500 hover:bg-dark-100 hover:text-dark-700 transition-colors"
                title={t('editor.zoom_out')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM13.5 10.5h-6" />
                </svg>
              </button>
              <button
                onClick={handleZoomReset}
                className="px-2 py-0.5 rounded-md text-xs text-dark-500 hover:bg-dark-100 hover:text-dark-700
                  tabular-nums transition-colors"
                title={t('editor.zoom_reset')}
              >
                {Math.round(imageScale * 100)}%
              </button>
              <button
                onClick={handleZoomIn}
                className="p-1.5 rounded-md text-dark-500 hover:bg-dark-100 hover:text-dark-700 transition-colors"
                title={t('editor.zoom_in')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
                </svg>
              </button>
            </div>
          </div>
          <div className="p-4 overflow-auto bg-dark-50" style={{ maxHeight: '70vh' }}>
            <img
              src={contact.imageUrl}
              alt={t('editor.original')}
              className="rounded-lg shadow-sm mx-auto transition-transform duration-200 origin-center"
              style={{ transform: `scale(${imageScale})` }}
              draggable={false}
            />
          </div>
        </div>

        {/* 右侧：联系人表单 */}
        <div className="bg-white rounded-xl border border-dark-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-dark-100">
            <h3 className="text-sm font-medium text-dark-700 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              {t('editor.result')}
              <span className="text-dark-400 font-normal text-xs">{t('editor.result_hint')}</span>
            </h3>
          </div>
          <div className="p-4 overflow-y-auto" style={{ maxHeight: '70vh' }}>
            <ContactForm contact={contact} onUpdate={onUpdate} />
          </div>
        </div>
      </div>
    </div>
  )
}
