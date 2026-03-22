import { useState } from 'react'
import { useAuth } from '../lib/auth'

interface AuthModalProps {
  onClose: () => void
  onSuccess: () => void
  initialMode?: 'login' | 'register' | 'forgot' | 'reset'
}

export default function AuthModal({ onClose, onSuccess, initialMode = 'login' }: AuthModalProps) {
  const { signIn, signUp, resetPassword, updatePassword } = useAuth()
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset'>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSubmitting(true)

    if (mode === 'forgot') {
      const err = await resetPassword(email.trim())
      setSubmitting(false)
      if (err) {
        setError(err)
      } else {
        setSuccess('重置链接已发送到邮箱，请查收')
      }
      return
    }

    if (mode === 'reset') {
      if (password !== confirmPassword) {
        setError('两次输入的密码不一致')
        setSubmitting(false)
        return
      }
      const err = await updatePassword(password)
      setSubmitting(false)
      if (err) {
        setError(err)
      } else {
        setSuccess('密码已重置')
        setTimeout(() => onSuccess(), 1500)
      }
      return
    }

    const fn = mode === 'login' ? signIn : signUp
    const err = await fn(email.trim(), password)

    setSubmitting(false)
    if (err) {
      setError(err)
    } else {
      onSuccess()
    }
  }

  const switchMode = (newMode: 'login' | 'register' | 'forgot' | 'reset') => {
    setMode(newMode)
    setError(null)
    setSuccess(null)
  }

  const titles: Record<string, string> = {
    login: '登录',
    register: '注册',
    forgot: '找回密码',
    reset: '设置新密码',
  }

  const subtitles: Record<string, string> = {
    login: '登录后可使用名片夹功能，数据长期保存',
    register: '登录后可使用名片夹功能，数据长期保存',
    forgot: '输入注册邮箱，我们将发送重置链接',
    reset: '请输入新密码',
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
            {titles[mode]}
          </h2>
          <p className="text-sm text-dark-500 mt-1">
            {subtitles[mode]}
          </p>
        </div>

        {/* Tab 切换 — 仅 login / register 模式 */}
        {(mode === 'login' || mode === 'register') && (
          <div className="flex mb-5 bg-dark-100 rounded-lg p-1">
            <button
              onClick={() => switchMode('login')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                mode === 'login' ? 'bg-white text-dark-900 shadow-sm' : 'text-dark-500'
              }`}
            >
              登录
            </button>
            <button
              onClick={() => switchMode('register')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                mode === 'register' ? 'bg-white text-dark-900 shadow-sm' : 'text-dark-500'
              }`}
            >
              注册
            </button>
          </div>
        )}

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 邮箱 — login / register / forgot */}
          {mode !== 'reset' && (
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
          )}

          {/* 密码 — login / register / reset */}
          {mode !== 'forgot' && (
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">
                {mode === 'reset' ? '新密码' : '密码'}
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="至少 6 位"
                className="input-field"
                autoFocus={mode === 'reset'}
              />
            </div>
          )}

          {/* 确认密码 — reset */}
          {mode === 'reset' && (
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">确认新密码</label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="再次输入新密码"
                className="input-field"
              />
            </div>
          )}

          {error && (
            <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {success && (
            <div className="text-sm text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full"
          >
            {submitting ? '处理中...' : (
              mode === 'login' ? '登录' :
              mode === 'register' ? '注册' :
              mode === 'forgot' ? '发送重置链接' :
              '确认重置'
            )}
          </button>
        </form>

        {/* 忘记密码 — 仅 login 模式 */}
        {mode === 'login' && (
          <button
            onClick={() => switchMode('forgot')}
            className="mt-3 w-full text-center text-sm text-primary-600 hover:text-primary-800 transition-colors"
          >
            忘记密码？
          </button>
        )}

        {/* 返回登录 — forgot / reset 模式 */}
        {(mode === 'forgot' || mode === 'reset') && (
          <button
            onClick={() => switchMode('login')}
            className="mt-3 w-full text-center text-sm text-primary-600 hover:text-primary-800 transition-colors"
          >
            ← 返回登录
          </button>
        )}

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
