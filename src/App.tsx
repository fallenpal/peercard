import { useState, useCallback, useEffect, useRef } from 'react'
import type { Contact, AppView } from './types/contact'
import UploadZone from './components/UploadZone'
import CardQueue from './components/CardQueue'
import CardEditor from './components/CardEditor'
import ExportPanel from './components/ExportPanel'
import RecognizePreview from './components/RecognizePreview'
import { recognizeCard } from './lib/recognize'

function App() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [currentView, setCurrentView] = useState<AppView>('upload')
  const [selectedIndex, setSelectedIndex] = useState<number>(0)
  const processingRef = useRef(false)

  /** 预览弹窗状态：当前正在预览的联系人 ID */
  const [previewContactId, setPreviewContactId] = useState<string | null>(null)
  /** 待预览队列：识别完成后自动加入，逐个弹出预览 */
  const previewQueueRef = useRef<string[]>([])

  /** 已完成识别的联系人 */
  const completedContacts = contacts.filter(c => c.status === 'completed')

  /** 当前正在预览的联系人对象 */
  const previewContact = previewContactId
    ? contacts.find(c => c.id === previewContactId) ?? null
    : null

  /** 处理新上传的文件 */
  const handleFilesAdded = useCallback((files: File[]) => {
    const newContacts: Contact[] = files.map(file => ({
      id: crypto.randomUUID(),
      imageFile: file,
      imageUrl: URL.createObjectURL(file),
      status: 'pending' as const,
      name: null,
      organization: null,
      title: null,
      emails: [],
      phones: [],
      notes: '',
      url: '',
      address: '',
    }))
    setContacts(prev => [...prev, ...newContacts])
  }, [])

  /** 弹出下一个预览 */
  const showNextPreview = useCallback(() => {
    if (previewQueueRef.current.length > 0) {
      const nextId = previewQueueRef.current.shift()!
      setPreviewContactId(nextId)
    } else {
      setPreviewContactId(null)
    }
  }, [])

  /** 识别队列调度 —— 逐张处理 pending 状态的名片 */
  useEffect(() => {
    const processNext = async () => {
      if (processingRef.current) return

      const pendingIndex = contacts.findIndex(c => c.status === 'pending')
      if (pendingIndex === -1) return

      processingRef.current = true

      // 标记为处理中
      setContacts(prev => prev.map((c, i) =>
        i === pendingIndex ? { ...c, status: 'processing' as const } : c
      ))

      const contact = contacts[pendingIndex]
      try {
        const result = await recognizeCard(contact.imageFile)
        setContacts(prev => prev.map((c, i) =>
          i === pendingIndex
            ? {
                ...c,
                status: 'completed' as const,
                name: result.name,
                organization: result.organization,
                title: result.title,
                emails: result.emails,
                phones: result.phones,
                url: result.url || '',
                address: result.address || '',
              }
            : c
        ))
        // 识别成功：加入预览队列
        previewQueueRef.current.push(contact.id)
        // 如果当前没有正在预览的弹窗，立即显示
        setPreviewContactId(prev => {
          if (prev === null) {
            return previewQueueRef.current.shift() ?? null
          }
          return prev
        })
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '识别失败，请重试'
        setContacts(prev => prev.map((c, i) =>
          i === pendingIndex
            ? { ...c, status: 'failed' as const, error: errorMessage }
            : c
        ))
      } finally {
        processingRef.current = false
      }
    }

    processNext()
  }, [contacts])

  /** 预览弹窗 - 确认保存 */
  const handlePreviewConfirm = useCallback((updates: Partial<Contact>) => {
    if (previewContactId) {
      setContacts(prev => prev.map(c =>
        c.id === previewContactId ? { ...c, ...updates } : c
      ))
    }
    showNextPreview()
  }, [previewContactId, showNextPreview])

  /** 预览弹窗 - 关闭（稍后编辑） */
  const handlePreviewClose = useCallback(() => {
    showNextPreview()
  }, [showNextPreview])

  /** 重试失败的名片 */
  const handleRetry = useCallback((contactId: string) => {
    setContacts(prev => prev.map(c =>
      c.id === contactId
        ? { ...c, status: 'pending' as const, error: undefined }
        : c
    ))
  }, [])

  /** 更新联系人数据 */
  const handleUpdateContact = useCallback((id: string, updates: Partial<Contact>) => {
    setContacts(prev => prev.map(c =>
      c.id === id ? { ...c, ...updates } : c
    ))
  }, [])

  /** 点击名片进入编辑视图 */
  const handleCardClick = useCallback((contactId: string) => {
    const idx = contacts.findIndex(c => c.id === contactId)
    if (idx !== -1 && contacts[idx].status === 'completed') {
      setSelectedIndex(idx)
      setCurrentView('editor')
    }
  }, [contacts])

  /** 切换到上一张/下一张已完成名片 */
  const completedIndices = contacts
    .map((c, i) => c.status === 'completed' ? i : -1)
    .filter(i => i !== -1)

  const currentCompletedPos = completedIndices.indexOf(selectedIndex)

  const handlePrev = useCallback(() => {
    if (currentCompletedPos > 0) {
      setSelectedIndex(completedIndices[currentCompletedPos - 1])
    }
  }, [currentCompletedPos, completedIndices])

  const handleNext = useCallback(() => {
    if (currentCompletedPos < completedIndices.length - 1) {
      setSelectedIndex(completedIndices[currentCompletedPos + 1])
    }
  }, [currentCompletedPos, completedIndices])

  const selectedContact = contacts[selectedIndex] || null

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-dark-50 to-primary-50">
      {/* Header */}
      <header className="bg-dark-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📇</span>
            <div>
              <h1 className="text-xl font-bold tracking-tight">PeerCard</h1>
              <p className="text-xs text-dark-400 hidden sm:block">名片识别 · 快速录入通讯录</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {currentView === 'editor' && (
              <button
                onClick={() => setCurrentView('upload')}
                className="btn-secondary text-xs !bg-dark-700 !text-dark-200 hover:!bg-dark-600"
              >
                ← 返回队列
              </button>
            )}
            {contacts.length > 0 && (
              <div className="text-xs text-dark-400">
                <span className="text-emerald-400 font-medium">{completedContacts.length}</span>
                <span> / {contacts.length} 已识别</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {currentView === 'upload' ? (
          <div className="space-y-6">
            {/* 上传区 */}
            <UploadZone onFilesAdded={handleFilesAdded} hasContacts={contacts.length > 0} />

            {/* 名片队列 */}
            {contacts.length > 0 && (
              <CardQueue
                contacts={contacts}
                onCardClick={handleCardClick}
                onRetry={handleRetry}
              />
            )}

            {/* 导出面板 */}
            {completedContacts.length > 0 && (
              <ExportPanel
                contacts={completedContacts}
                allContacts={contacts}
              />
            )}
          </div>
        ) : (
          selectedContact && (
            <CardEditor
              contact={selectedContact}
              onUpdate={(updates) => handleUpdateContact(selectedContact.id, updates)}
              onPrev={handlePrev}
              onNext={handleNext}
              hasPrev={currentCompletedPos > 0}
              hasNext={currentCompletedPos < completedIndices.length - 1}
              currentNum={currentCompletedPos + 1}
              totalNum={completedIndices.length}
            />
          )
        )}
      </main>

      {/* 识别成功预览弹窗 */}
      {previewContact && previewContact.status === 'completed' && (
        <RecognizePreview
          contact={previewContact}
          onConfirm={handlePreviewConfirm}
          onClose={handlePreviewClose}
        />
      )}

      {/* Footer */}
      <footer className="bg-dark-900 text-dark-500 text-center py-4 text-xs">
        <p>PeerCard — Peering CRM 产品路线第一站</p>
        <p className="mt-1">由 <a href="https://with.woa.com/" style={{ color: '#8A2BE2' }} target="_blank" rel="noreferrer">With</a> 通过自然语言生成</p>
      </footer>
    </div>
  )
}

export default App
