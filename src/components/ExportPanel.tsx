import type { Contact } from '../types/contact'
import { generateSingleVCard, generateBatchVCard, downloadFile } from '../lib/vcard'
import { generateCSV } from '../lib/csv'

interface ExportPanelProps {
  contacts: Contact[] // 已完成识别的联系人
  allContacts: Contact[] // 所有联系人（用于显示统计）
  selectedIds: Set<string>
  onToggleAll: () => void
}

export default function ExportPanel({ contacts, allContacts, selectedIds, onToggleAll }: ExportPanelProps) {
  const selectedContacts = contacts.filter(c => selectedIds.has(c.id))
  const hasSelected = selectedContacts.length > 0
  const allDone = allContacts.every(c => c.status === 'completed' || c.status === 'failed')
  const processingCount = allContacts.filter(c => c.status === 'processing' || c.status === 'pending').length
  const allSelected = contacts.length > 0 && contacts.every(c => selectedIds.has(c.id))

  /** 批量导出 vCard */
  const handleExportAllVCard = () => {
    if (!hasSelected) return
    const content = generateBatchVCard(selectedContacts)
    downloadFile(content, `peercard_contacts_${selectedContacts.length}.vcf`, 'text/vcard')
  }

  /** 导出 CSV */
  const handleExportCSV = () => {
    if (!hasSelected) return
    const content = generateCSV(selectedContacts)
    downloadFile(content, `peercard_contacts_${selectedContacts.length}.csv`, 'text/csv')
  }

  return (
    <div className={`
      rounded-2xl border-2 overflow-hidden transition-all duration-300
      ${allDone && hasSelected
        ? 'border-emerald-300 bg-gradient-to-r from-emerald-50 to-primary-50 shadow-lg shadow-emerald-100'
        : 'border-dark-200 bg-white'
      }
    `}>
      <div className="px-5 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* 左侧标题 */}
          <div>
            <h2 className="text-sm font-semibold text-dark-800 flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              导出联系人
            </h2>
            <p className="text-xs text-dark-500 mt-1">
              {contacts.length > 0 ? (
                <>
                  已选择 <span className="font-medium text-emerald-600">{selectedContacts.length}</span> / {contacts.length} 位联系人
                  {processingCount > 0 && (
                    <span className="text-amber-600">，还有 {processingCount} 张识别中...</span>
                  )}
                </>
              ) : (
                '等待名片识别完成后即可导出'
              )}
            </p>
          </div>

          {/* 右侧按钮 */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* 全选切换 */}
            {contacts.length > 0 && (
              <button
                onClick={onToggleAll}
                className="btn-secondary text-xs !py-1.5"
              >
                {allSelected ? '取消全选' : '全选'}
              </button>
            )}

            <button
              onClick={handleExportAllVCard}
              disabled={!hasSelected}
              className={`
                btn-success gap-1.5 text-sm
                ${allDone && hasSelected ? 'animate-pulse-once !bg-emerald-600 !shadow-md' : ''}
              `}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
              </svg>
              导出 vCard ({selectedContacts.length})
            </button>

            <button
              onClick={handleExportCSV}
              disabled={!hasSelected}
              className="btn-secondary gap-1.5 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M10.875 12h-1.5m1.5 0c.621 0 1.125.504 1.125 1.125M12 12h7.5m-7.5 0c0 .621.504 1.125 1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 0v.375" />
              </svg>
              导出 CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
