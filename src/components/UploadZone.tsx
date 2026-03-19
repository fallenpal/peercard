import { useCallback, useRef, useState } from 'react'

/** 支持的图片格式 */
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/heif']
const ACCEPTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.heic', '.heif']

interface UploadZoneProps {
  onFilesAdded: (files: File[]) => void
  hasContacts?: boolean
}

export default function UploadZone({ onFilesAdded, hasContacts = false }: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  /** 校验并过滤文件 */
  const validateAndAddFiles = useCallback((fileList: FileList | File[]) => {
    const files = Array.from(fileList)
    const validFiles: File[] = []
    const invalidFiles: string[] = []

    files.forEach(file => {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase()
      if (ACCEPTED_TYPES.includes(file.type) || ACCEPTED_EXTENSIONS.includes(ext)) {
        validFiles.push(file)
      } else {
        invalidFiles.push(file.name)
      }
    })

    if (invalidFiles.length > 0) {
      setErrorMsg(`以下文件格式不支持：${invalidFiles.join('、')}。仅支持 JPG、PNG、HEIC 格式。`)
      setTimeout(() => setErrorMsg(null), 5000)
    }

    if (validFiles.length > 0) {
      onFilesAdded(validFiles)
      setErrorMsg(null)
    }
  }, [onFilesAdded])

  /** 拖拽事件处理 */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    if (e.dataTransfer.files.length > 0) {
      validateAndAddFiles(e.dataTransfer.files)
    }
  }, [validateAndAddFiles])

  /** 点击选择文件 */
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndAddFiles(e.target.files)
      e.target.value = '' // 重置 input，允许重复选择同一文件
    }
  }, [validateAndAddFiles])

  return (
    <div className="space-y-3">
      {/* 拖拽上传区域 */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative cursor-pointer rounded-2xl border-2 border-dashed
          transition-all duration-200 ease-in-out
          ${isDragOver
            ? 'border-primary-500 bg-primary-50 scale-[1.01]'
            : 'border-dark-300 bg-white hover:border-primary-400 hover:bg-primary-50/50'
          }
        `}
      >
        <div className={`flex flex-col items-center justify-center ${hasContacts ? 'py-6' : 'py-12'} px-6 text-center`}>
          {/* 上传图标 */}
          <div className={`
            ${hasContacts ? 'w-10 h-10 rounded-xl mb-2' : 'w-16 h-16 rounded-2xl mb-4'}
            flex items-center justify-center
            transition-all duration-200
            ${isDragOver ? 'bg-primary-100 scale-110' : 'bg-dark-100'}
          `}>
            <svg className={`${hasContacts ? 'w-5 h-5' : 'w-8 h-8'} ${isDragOver ? 'text-primary-600' : 'text-dark-500'}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          </div>

          <h3 className={`${hasContacts ? 'text-sm' : 'text-lg'} font-semibold text-dark-800 mb-1`}>
            {isDragOver ? '松开即可上传' : (hasContacts ? '继续上传更多名片' : '上传名片照片')}
          </h3>
          {!hasContacts && (
            <p className="text-sm text-dark-500 mb-4">
              拖拽图片到此处，或点击选择文件
            </p>
          )}
          <p className="text-xs text-dark-400">
            支持 JPG、PNG、HEIC 格式 · 可同时上传多张
          </p>

          {/* 移动端相机按钮 */}
          <div className={`${hasContacts ? 'mt-2' : 'mt-4'} flex gap-3 sm:hidden`}>
            <button
              onClick={(e) => { e.stopPropagation(); cameraInputRef.current?.click() }}
              className="btn-primary text-xs gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
              拍照识别
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
              className="btn-secondary text-xs gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
              </svg>
              从相册选择
            </button>
          </div>
        </div>

        {/* 隐藏的文件输入 */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.heic,.heif"
          onChange={handleFileChange}
          className="hidden"
        />
        {/* 移动端相机输入 */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* 错误提示 */}
      {errorMsg && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm animate-fade-in">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 空状态引导 */}
      {!hasContacts && <EmptyGuide />}
    </div>
  )
}

/** 首次使用引导 */
function EmptyGuide() {
  return (
    <div className="bg-white rounded-2xl border border-dark-200 p-6">
      <h3 className="text-sm font-semibold text-dark-700 mb-4 flex items-center gap-2">
        <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
        </svg>
        快速上手
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { step: '1', icon: '📸', title: '上传名片', desc: '拖拽或点击上传名片照片，支持一次多张' },
          { step: '2', icon: '🤖', title: 'AI 自动识别', desc: '系统自动提取姓名、公司、邮箱、电话等信息' },
          { step: '3', icon: '📥', title: '导出通讯录', desc: '确认后导出 vCard 或 CSV，导入手机或 Excel' },
        ].map(item => (
          <div key={item.step} className="flex gap-3 p-3 rounded-xl bg-dark-50">
            <div className="text-2xl">{item.icon}</div>
            <div>
              <div className="text-sm font-medium text-dark-800">{item.title}</div>
              <div className="text-xs text-dark-500 mt-0.5">{item.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}