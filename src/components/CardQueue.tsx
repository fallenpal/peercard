import { useTranslation } from 'react-i18next'
import type { Contact } from '../types/contact'

interface CardQueueProps {
  contacts: Contact[]
  onCardClick: (contactId: string) => void
  onRetry: (contactId: string) => void
  selectedIds: Set<string>
  onToggleSelect: (contactId: string) => void
}

export default function CardQueue({ contacts, onCardClick, onRetry, selectedIds, onToggleSelect }: CardQueueProps) {
  const { t } = useTranslation()
  const completedCount = contacts.filter(c => c.status === 'completed').length
  const processingCount = contacts.filter(c => c.status === 'processing').length
  const failedCount = contacts.filter(c => c.status === 'failed').length

  return (
    <div className="bg-white rounded-2xl border border-dark-200 overflow-hidden">
      {/* 队列头部 */}
      <div className="px-5 py-4 border-b border-dark-100 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-dark-800 flex items-center gap-2">
          <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
          </svg>
          {t('queue.title')}
          <span className="text-dark-400 font-normal">{t('queue.count', { count: contacts.length })}</span>
        </h2>
        <div className="flex items-center gap-3 text-xs text-dark-500">
          {processingCount > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              {t('queue.processing')} {processingCount}
            </span>
          )}
          {completedCount > 0 && (
            <span className="text-emerald-600 font-medium">✓ {completedCount} {t('queue.completed')}</span>
          )}
          {failedCount > 0 && (
            <span className="text-red-500">✕ {failedCount} {t('queue.failed')}</span>
          )}
        </div>
      </div>

      {/* 进度条 */}
      {contacts.length > 0 && (
        <div className="h-1 bg-dark-100">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-emerald-500 transition-all duration-500 ease-out"
            style={{ width: `${(completedCount / contacts.length) * 100}%` }}
          />
        </div>
      )}

      {/* 名片网格 */}
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {contacts.map(contact => (
          <CardItem
            key={contact.id}
            contact={contact}
            onClick={() => onCardClick(contact.id)}
            onRetry={() => onRetry(contact.id)}
            selected={selectedIds.has(contact.id)}
            onToggleSelect={() => onToggleSelect(contact.id)}
          />
        ))}
      </div>
    </div>
  )
}

/** 单张名片卡片 */
function CardItem({
  contact,
  onClick,
  onRetry,
  selected,
  onToggleSelect,
}: {
  contact: Contact
  onClick: () => void
  onRetry: () => void
  selected: boolean
  onToggleSelect: () => void
}) {
  const { t } = useTranslation()

  const STATUS_CONFIG = {
    pending: { label: t('status.pending'), className: 'badge-pending', icon: '⏳' },
    processing: { label: t('status.processing'), className: 'badge-processing', icon: '' },
    completed: { label: t('status.completed'), className: 'badge-completed', icon: '✓' },
    failed: { label: t('status.failed'), className: 'badge-failed', icon: '✕' },
  } as const

  const config = STATUS_CONFIG[contact.status]
  const isClickable = contact.status === 'completed'

  return (
    <div
      onClick={isClickable ? onClick : undefined}
      className={`
        relative group rounded-xl overflow-hidden border transition-all duration-200
        ${isClickable
          ? 'cursor-pointer border-dark-200 hover:border-primary-400 hover:shadow-md hover:scale-[1.02]'
          : 'border-dark-200'
        }
        ${contact.status === 'failed' ? 'border-red-200 bg-red-50/30' : 'bg-white'}
      `}
    >
      {/* 缩略图 */}
      <div className="relative aspect-[3/2] bg-dark-100 overflow-hidden">
        <img
          src={contact.imageUrl}
          alt={t('editor.original')}
          className={`
            w-full h-full object-cover
            ${contact.status === 'processing' ? 'opacity-60' : ''}
            ${contact.status === 'failed' ? 'opacity-40 grayscale' : ''}
          `}
        />

        {/* 识别中遮罩 */}
        {contact.status === 'processing' && (
          <div className="absolute inset-0 flex items-center justify-center bg-dark-900/20">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* 状态标签 */}
        <div className="absolute top-2 right-2">

        {/* 勾选框 — 仅已完成的卡片显示 */}
        {contact.status === 'completed' && (
          <label
            className="absolute top-2 left-2 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="checkbox"
              checked={selected}
              onChange={onToggleSelect}
              className="w-4 h-4 rounded border-dark-300 text-primary-600
                focus:ring-primary-500 cursor-pointer accent-primary-600"
            />
          </label>
        )}
          <span className={config.className}>
            {contact.status === 'processing' ? (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                {config.label}
              </span>
            ) : (
              <>
                {config.icon && <span className="mr-0.5">{config.icon}</span>}
                {config.label}
              </>
            )}
          </span>
        </div>

        {/* 已完成悬浮提示 */}
        {isClickable && (
          <div className="absolute inset-0 bg-primary-900/0 group-hover:bg-primary-900/40
            flex items-center justify-center transition-all duration-200">
            <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100
              transition-opacity duration-200">
              {t('queue.click_edit')}
            </span>
          </div>
        )}
      </div>

      {/* 卡片底部信息 */}
      <div className="p-2">
        {contact.status === 'completed' && contact.name ? (
          <div>
            <p className="text-xs font-medium text-dark-800 truncate">{contact.name}</p>
            {contact.organization && (
              <p className="text-xs text-dark-500 truncate">{contact.organization}</p>
            )}
          </div>
        ) : contact.status === 'failed' ? (
          <div className="flex items-center justify-between">
            <p className="text-xs text-red-600 truncate flex-1" title={contact.error}>
              {contact.error || t('queue.recognize_failed')}
            </p>
            <button
              onClick={(e) => { e.stopPropagation(); onRetry() }}
              className="text-xs text-primary-600 hover:text-primary-700 font-medium ml-2
                flex-shrink-0 hover:underline"
            >
              {t('action.retry')}
            </button>
          </div>
        ) : (
          <p className="text-xs text-dark-400">
            {contact.status === 'pending' ? t('queue.waiting') : t('queue.recognizing')}
          </p>
        )}
      </div>
    </div>
  )
}
