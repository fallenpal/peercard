import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'

const MODEL_OPTIONS = [
  { key: '72b', labelKey: 'settings.model_72b', descKey: 'settings.model_72b_desc' },
  { key: '32b', labelKey: 'settings.model_32b', descKey: 'settings.model_32b_desc' },
] as const

interface AboutPageProps {
  onBack: () => void
}

export default function AboutPage({ onBack }: AboutPageProps) {
  const { t } = useTranslation()
  const [visitCount, setVisitCount] = useState<number | null>(null)
  const [selectedModel, setSelectedModel] = useState(() =>
    localStorage.getItem('peercard_model') || '72b'
  )
  const [showSaved, setShowSaved] = useState(false)

  useEffect(() => {
    supabase.from('visits').select('count').eq('id', 1).single()
      .then(({ data }) => {
        if (data) setVisitCount(data.count)
      })
  }, [])

  const guides = [
    { icon: '📸', title: t('about.guide1_title'), desc: t('about.guide1_desc') },
    { icon: '🤖', title: t('about.guide2_title'), desc: t('about.guide2_desc') },
    { icon: '✏️', title: t('about.guide3_title'), desc: t('about.guide3_desc') },
    { icon: '📥', title: t('about.guide4_title'), desc: t('about.guide4_desc') },
    { icon: '📒', title: t('about.guide5_title'), desc: t('about.guide5_desc') },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button
        onClick={onBack}
        className="text-dark-500 hover:text-dark-800 transition-colors text-sm"
      >
        {t('action.back')}
      </button>

      {/* Logo */}
      <div className="text-center py-4">
        <span className="text-5xl">📇</span>
        <h2 className="text-2xl font-bold text-dark-900 mt-3">PeerCard</h2>
        <p className="text-sm text-dark-500 mt-1">{t('about.subtitle')}</p>
      </div>

      {/* 使用说明 */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="font-semibold text-dark-800 mb-4">{t('about.guide_title')}</h3>
        <div className="space-y-3">
          {guides.map(item => (
            <div key={item.title} className="flex gap-3 items-start">
              <span className="text-xl flex-shrink-0">{item.icon}</span>
              <div>
                <div className="text-sm font-medium text-dark-800">{item.title}</div>
                <div className="text-xs text-dark-500 mt-0.5">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 高级设置 */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="font-semibold text-dark-800 mb-4">{t('settings.title')}</h3>
        <div>
          <label className="text-sm text-dark-600 mb-2 block">{t('settings.model_label')}</label>
          <div className="space-y-2">
            {MODEL_OPTIONS.map(opt => (
              <label
                key={opt.key}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedModel === opt.key
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-dark-200 hover:border-dark-300'
                }`}
              >
                <input
                  type="radio"
                  name="model"
                  value={opt.key}
                  checked={selectedModel === opt.key}
                  onChange={() => {
                    setSelectedModel(opt.key)
                    localStorage.setItem('peercard_model', opt.key)
                    setShowSaved(true)
                    setTimeout(() => setShowSaved(false), 1500)
                  }}
                  className="mt-0.5 accent-primary-600"
                />
                <div>
                  <div className="text-sm font-medium text-dark-800">{t(opt.labelKey)}</div>
                  <div className="text-xs text-dark-500 mt-0.5">{t(opt.descKey)}</div>
                </div>
              </label>
            ))}
          </div>
          {showSaved && (
            <div className="text-xs text-emerald-600 mt-2">✓ {t('settings.model_saved')}</div>
          )}
        </div>
      </div>

      {/* 统计 + 版权 */}
      <div className="bg-white rounded-xl shadow-sm p-5 text-center space-y-3">
        {visitCount !== null && (
          <div>
            <span className="text-2xl font-bold text-primary-700">{visitCount.toLocaleString()}</span>
            <span className="text-sm text-dark-500 ml-2">{t('about.visits')}</span>
          </div>
        )}
        <div className="text-xs text-dark-400">
          {t('about.copyright')}
        </div>
      </div>
    </div>
  )
}
