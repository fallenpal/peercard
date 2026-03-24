import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'

interface AboutPageProps {
  onBack: () => void
}

export default function AboutPage({ onBack }: AboutPageProps) {
  const { t } = useTranslation()
  const [visitCount, setVisitCount] = useState<number | null>(null)

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
