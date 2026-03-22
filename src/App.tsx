import { useState, useCallback, useEffect, useRef } from 'react'
import type { Contact, AppView } from './types/contact'
import { AuthProvider, useAuth } from './lib/auth'
import { supabase } from './lib/supabase'
import UploadZone from './components/UploadZone'
import CardQueue from './components/CardQueue'
import CardEditor from './components/CardEditor'
import ExportPanel from './components/ExportPanel'
import RecognizePreview from './components/RecognizePreview'
import CardBook from './components/CardBook'
import CardDetail from './components/CardDetail'
import AuthModal from './components/AuthModal'
import AboutPage from './components/AboutPage'
import { recognizeCard } from './lib/recognize'
import { saveContact as dbSave } from './lib/db'

function AppInner() {
  const { user, signOut } = useAuth()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [currentView, setCurrentView] = useState<AppView>('upload')
  const [selectedIndex, setSelectedIndex] = useState<number>(0)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [detailContactId, setDetailContactId] = useState<string | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<'login' | 'reset'>('login')
  const processingRef = useRef(false)
  const bottomCameraRef = useRef<HTMLInputElement>(null)

  /** 预览弹窗状态 */
  const [previewContactId, setPreviewContactId] = useState<string | null>(null)
  const previewQueueRef = useRef<string[]>([])

  const completedContacts = contacts.filter(c => c.status === 'completed')

  const previewContact = previewContactId
    ? contacts.find(c => c.id === previewContactId) ?? null
    : null

  /** 页面加载时 increment visit count */
  useEffect(() => {
    supabase.rpc('increment_visits').then(() => {}, () => {})
  }, [])

  /** 检测密码重置回调 */
  useEffect(() => {
    if (window.location.hash.includes('reset-password')) {
      // Supabase 会自动从 URL fragment 恢复 session
      setAuthModalMode('reset')
      setShowAuthModal(true)
      // 清除 hash
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [])

  /** 登录后自动把当前会话中已识别的名片补存到云端 */
  useEffect(() => {
    if (!user) return
    const completed = contacts.filter(c => c.status === 'completed')
    if (completed.length === 0) return

    completed.forEach(c => {
      dbSave(user.id, {
        id: c.id,
        image_path: null,
        createdAt: c.createdAt || Date.now(),
        name: c.name,
        organization: c.organization,
        title: c.title,
        emails: c.emails,
        phones: c.phones,
        url: c.url,
        address: c.address,
        notes: c.notes,
      }, c.imageFile).catch(err => console.error('Sync to cloud failed:', err))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

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

  /** 识别队列调度 */
  useEffect(() => {
    const processNext = async () => {
      if (processingRef.current) return
      const pendingIndex = contacts.findIndex(c => c.status === 'pending')
      if (pendingIndex === -1) return

      processingRef.current = true
      setContacts(prev => prev.map((c, i) =>
        i === pendingIndex ? { ...c, status: 'processing' as const } : c
      ))

      const contact = contacts[pendingIndex]
      try {
        const result = await recognizeCard(contact.imageFile)
        const now = Date.now()
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
                createdAt: now,
              }
            : c
        ))
        // 已登录才持久化
        if (user) {
          dbSave(user.id, {
            id: contact.id,
            image_path: null,
            createdAt: now,
            name: result.name,
            organization: result.organization,
            title: result.title,
            emails: result.emails,
            phones: result.phones,
            url: result.url || '',
            address: result.address || '',
            notes: '',
          }, contact.imageFile).catch(err => console.error('Cloud save failed:', err))
        }
        previewQueueRef.current.push(contact.id)
        setSelectedIds(prev => new Set(prev).add(contact.id))
        setPreviewContactId(prev => {
          if (prev === null) return previewQueueRef.current.shift() ?? null
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
  }, [contacts, user])

  const handlePreviewConfirm = useCallback((updates: Partial<Contact>) => {
    if (previewContactId) {
      setContacts(prev => prev.map(c =>
        c.id === previewContactId ? { ...c, ...updates } : c
      ))
    }
    showNextPreview()
  }, [previewContactId, showNextPreview])

  const handlePreviewClose = useCallback(() => {
    showNextPreview()
  }, [showNextPreview])

  const handleRetry = useCallback((contactId: string) => {
    setContacts(prev => prev.map(c =>
      c.id === contactId ? { ...c, status: 'pending' as const, error: undefined } : c
    ))
  }, [])

  const handleToggleSelect = useCallback((contactId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(contactId)) next.delete(contactId)
      else next.add(contactId)
      return next
    })
  }, [])

  const handleToggleAll = useCallback(() => {
    const allCompletedIds = contacts.filter(c => c.status === 'completed').map(c => c.id)
    const allSelected = allCompletedIds.every(id => selectedIds.has(id))
    setSelectedIds(allSelected ? new Set() : new Set(allCompletedIds))
  }, [contacts, selectedIds])

  const handleUpdateContact = useCallback((id: string, updates: Partial<Contact>) => {
    setContacts(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
  }, [])

  const handleCardClick = useCallback((contactId: string) => {
    const idx = contacts.findIndex(c => c.id === contactId)
    if (idx !== -1 && contacts[idx].status === 'completed') {
      setSelectedIndex(idx)
      setCurrentView('editor')
    }
  }, [contacts])

  const completedIndices = contacts
    .map((c, i) => c.status === 'completed' ? i : -1)
    .filter(i => i !== -1)
  const currentCompletedPos = completedIndices.indexOf(selectedIndex)

  const handlePrev = useCallback(() => {
    if (currentCompletedPos > 0) setSelectedIndex(completedIndices[currentCompletedPos - 1])
  }, [currentCompletedPos, completedIndices])

  const handleNext = useCallback(() => {
    if (currentCompletedPos < completedIndices.length - 1)
      setSelectedIndex(completedIndices[currentCompletedPos + 1])
  }, [currentCompletedPos, completedIndices])

  const selectedContact = contacts[selectedIndex] || null

  /** 名片夹入口：未登录弹登录，已登录直接进 */
  const handleCardBookClick = useCallback(() => {
    if (!user) {
      setShowAuthModal(true)
    } else {
      setCurrentView('cardbook')
    }
  }, [user])

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-dark-50 to-primary-50">
      {/* Header */}
      <header className="bg-dark-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => setCurrentView('upload')}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <span className="text-2xl">📇</span>
            <div className="text-left">
              <h1 className="text-xl font-bold tracking-tight">PeerCard</h1>
              <p className="text-xs text-dark-400 hidden sm:block">名片识别 · 快速录入通讯录</p>
            </div>
          </button>
          <div className="flex items-center gap-3">
            {currentView === 'editor' && (
              <button
                onClick={() => setCurrentView('upload')}
                className="btn-secondary text-xs !bg-dark-700 !text-dark-200 hover:!bg-dark-600"
              >
                ← 返回队列
              </button>
            )}
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-dark-400 hidden sm:inline truncate max-w-[120px]">
                  {user.email}
                </span>
                <button
                  onClick={signOut}
                  className="text-xs text-dark-500 hover:text-dark-300 transition-colors"
                >
                  登出
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="text-xs text-dark-400 hover:text-white transition-colors"
              >
                登录
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 pb-24">
        {currentView === 'about' ? (
          <AboutPage onBack={() => setCurrentView('upload')} />
        ) : currentView === 'cardbook' && user ? (
          <CardBook
            userId={user.id}
            onSelectContact={(id) => { setDetailContactId(id); setCurrentView('carddetail') }}
            onBack={() => setCurrentView('upload')}
          />
        ) : currentView === 'carddetail' && detailContactId && user ? (
          <CardDetail
            userId={user.id}
            contactId={detailContactId}
            onBack={() => setCurrentView('cardbook')}
            onDeleted={() => setCurrentView('cardbook')}
          />
        ) : currentView === 'upload' ? (
          <div className="space-y-6">
            <UploadZone onFilesAdded={handleFilesAdded} hasContacts={contacts.length > 0} />
            {contacts.length > 0 && (
              <CardQueue
                contacts={contacts}
                onCardClick={handleCardClick}
                onRetry={handleRetry}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
              />
            )}
            {completedContacts.length > 0 && (
              <ExportPanel
                contacts={completedContacts}
                allContacts={contacts}
                selectedIds={selectedIds}
                onToggleAll={handleToggleAll}
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

      {/* 底部 Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-dark-200 shadow-lg z-40">
        <div className="max-w-7xl mx-auto flex">
          <button
            onClick={() => bottomCameraRef.current?.click()}
            className="flex-1 flex flex-col items-center gap-1 py-3 text-dark-500 hover:text-primary-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
            </svg>
            <span className="text-xs font-medium">拍照</span>
          </button>
          <button
            onClick={handleCardBookClick}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
              currentView === 'cardbook' || currentView === 'carddetail'
                ? 'text-primary-700'
                : 'text-dark-500 hover:text-primary-700'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            <span className="text-xs font-medium">名片夹</span>
          </button>
          <button
            onClick={() => setCurrentView('about')}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
              currentView === 'about'
                ? 'text-primary-700'
                : 'text-dark-500 hover:text-primary-700'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
            </svg>
            <span className="text-xs font-medium">关于</span>
          </button>
        </div>
        <input
          ref={bottomCameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFilesAdded(Array.from(e.target.files))
              e.target.value = ''
              if (currentView !== 'upload') setCurrentView('upload')
            }
          }}
          className="hidden"
        />
      </nav>

      {/* 识别成功预览弹窗 */}
      {previewContact && previewContact.status === 'completed' && (
        <RecognizePreview
          contact={previewContact}
          onConfirm={handlePreviewConfirm}
          onClose={handlePreviewClose}
        />
      )}

      {/* 登录弹窗 */}
      {showAuthModal && (
        <AuthModal
          initialMode={authModalMode}
          onClose={() => { setShowAuthModal(false); setAuthModalMode('login') }}
          onSuccess={() => { setShowAuthModal(false); setAuthModalMode('login'); setCurrentView('cardbook') }}
        />
      )}
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}

export default App
