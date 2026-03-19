import { useState } from 'react'
import { useAuth } from '../lib/auth'

interface AuthModalProps {
  onClose: () => void
  onSuccess: () => void
}

export default function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const fn = mode === 'login' ? signIn : signUp
    const err = await fn(email.trim(), password)

    setSubmitting(false)
    if (err) {
      setError(err)
    } else {
      onSuccess()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        {/* 标题 */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-dark-900">
            {mode === 'login' ? '登录' : '注册'}
          </h2>
          <p className="text-sm text-dark-500 mt-1">
            登录后可使用名片夹功能，数据长期保存
          </p>
        </div>

        {/* Tab 切换 */}
        <div className="flex mb-5 bg-dark-100 rounded-lg p-1">
          <button
            onClick={() => { setMode('login'); setError(null) }}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              mode === 'login' ? 'bg-white text-dark-900 shadow-sm' : 'text-dark-500'
            }`}
          >
            登录
          </button>
          <button
            onClick={() => { setMode('register'); setError(null) }}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              mode === 'register' ? 'bg-white text-dark-900 shadow-sm' : 'text-dark-500'
            }`}
          >
            注册
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">邮箱</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="input-field"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">密码</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="至少 6 位"
              className="input-field"
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full"
          >
            {submitting ? '处理中...' : (mode === 'login' ? '登录' : '注册')}
          </button>
        </form>

        {/* 关闭 */}
        <button
          onClick={onClose}
          className="mt-4 w-full text-center text-sm text-dark-400 hover:text-dark-600 transition-colors"
        >
          暂不登录，继续体验
        </button>
      </div>
    </div>
  )
}
