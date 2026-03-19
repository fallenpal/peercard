import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface AboutPageProps {
  onBack: () => void
}

export default function AboutPage({ onBack }: AboutPageProps) {
  const [visitCount, setVisitCount] = useState<number | null>(null)

  useEffect(() => {
    supabase.from('visits').select('count').eq('id', 1).single()
      .then(({ data }) => {
        if (data) setVisitCount(data.count)
      })
  }, [])

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button
        onClick={onBack}
        className="text-dark-500 hover:text-dark-800 transition-colors text-sm"
      >
        ← 返回
      </button>

      {/* Logo */}
      <div className="text-center py-4">
        <span className="text-5xl">📇</span>
        <h2 className="text-2xl font-bold text-dark-900 mt-3">PeerCard</h2>
        <p className="text-sm text-dark-500 mt-1">名片识别 · 快速录入通讯录</p>
      </div>

      {/* 使用说明 */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="font-semibold text-dark-800 mb-4">使用说明</h3>
        <div className="space-y-3">
          {[
            { icon: '📸', title: '拍照/上传', desc: '点击底部「拍照」按钮直接拍摄名片，或在首页上传名片图片' },
            { icon: '🤖', title: 'AI 自动识别', desc: '上传后 AI 自动提取姓名、公司、电话、邮箱等信息' },
            { icon: '✏️', title: '编辑确认', desc: '识别完成后可预览和编辑结果，确保信息准确' },
            { icon: '📥', title: '导出通讯录', desc: '支持导出 vCard（.vcf）和 CSV 格式，直接导入手机通讯录' },
            { icon: '📒', title: '名片夹', desc: '注册登录后，识别过的名片自动保存到名片夹，支持搜索和管理' },
          ].map(item => (
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
            <span className="text-sm text-dark-500 ml-2">次访问</span>
          </div>
        )}
        <div className="text-xs text-dark-400">
          © 2026 PeerCard. Built for Peering & Interconnect professionals.
        </div>
      </div>
    </div>
  )
}
