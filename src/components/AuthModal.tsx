import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../lib/auth'

interface AuthModalProps {
  onClose: () => void
  onSuccess: () => void
  initialMode?: 'login' | 'register' | 'forgot' | 'reset'
}

export default function AuthModal({ onClose, onSuccess, initialMode = 'login' }: AuthModalProps) {
  const { t } = useTranslation()
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
        setSuccess(t('auth.reset_link_sent'))
      }
      return
    }

    if (mode === 'reset') {
      if (password !== confirmPassword) {
        setError(t('auth.password_mismatch'))
        setSubmitting(false)
        return
      }
      const err = await updatePassword(password)
      setSubmitting(false)
      if (err) {
        setError(err)
      } else {
        setSuccess(t('auth.password_reset_done'))
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
    login: t('auth.login'),
    register: t('auth.register'),
    forgot: t('auth.forgot'),
    reset: t('auth.reset'),
  }

  const subtitleKeys: Record<string, string> = {
    login: 'auth.login_subtitle',
    register: 'auth.register_subtitle',
    forgot: 'auth.forgot_subtitle',
    reset: 'auth.reset_subtitle',
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
            {t(subtitleKeys[mode])}
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
              {t('auth.login')}
            </button>
            <button
              onClick={() => switchMode('register')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                mode === 'register' ? 'bg-white text-dark-900 shadow-sm' : 'text-dark-500'
              }`}
            >
              {t('auth.register')}
            </button>
          </div>
        )}

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 邮箱 — login / register / forgot */}
          {mode !== 'reset' && (
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">{t('auth.email')}</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t('auth.email_placeholder')}
                className="input-field"
                autoFocus
              />
            </div>
          )}

          {/* 密码 — login / register / reset */}
          {mode !== 'forgot' && (
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">
                {mode === 'reset' ? t('auth.new_password') : t('auth.password')}
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={t('auth.password_placeholder')}
                className="input-field"
                autoFocus={mode === 'reset'}
              />
            </div>
          )}

          {/* 确认密码 — reset */}
          {mode === 'reset' && (
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">{t('auth.confirm_password')}</label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder={t('auth.confirm_password_placeholder')}
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
            {submitting ? t('auth.submitting') : (
              mode === 'login' ? t('auth.login') :
              mode === 'register' ? t('auth.register') :
              mode === 'forgot' ? t('auth.send_reset_link') :
              t('auth.confirm_reset')
            )}
          </button>
        </form>

        {/* 忘记密码 — 仅 login 模式 */}
        {mode === 'login' && (
          <button
            onClick={() => switchMode('forgot')}
            className="mt-3 w-full text-center text-sm text-primary-600 hover:text-primary-800 transition-colors"
          >
            {t('auth.forgot_password')}
          </button>
        )}

        {/* 返回登录 — forgot / reset 模式 */}
        {(mode === 'forgot' || mode === 'reset') && (
          <button
            onClick={() => switchMode('login')}
            className="mt-3 w-full text-center text-sm text-primary-600 hover:text-primary-800 transition-colors"
          >
            {t('auth.back_to_login')}
          </button>
        )}

        {/* 关闭 */}
        <button
          onClick={onClose}
          className="mt-4 w-full text-center text-sm text-dark-400 hover:text-dark-600 transition-colors"
        >
          {t('auth.skip_login')}
        </button>
      </div>
    </div>
  )
}
