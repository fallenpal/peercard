import type { Contact } from '../types/contact'

/**
 * 转义 vCard 特殊字符
 */
function escapeVCard(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\n/g, '\\n')
}

/**
 * 生成单个联系人的 vCard 3.0 字符串
 */
export function generateSingleVCard(contact: Contact): string {
  const lines: string[] = [
    'BEGIN:VCARD',
    'VERSION:3.0',
  ]

  // 姓名 (FN + N)
  if (contact.name) {
    lines.push(`FN:${escapeVCard(contact.name)}`)
    // N 字段：尝试拆分姓/名（简单处理，以空格分割）
    const parts = contact.name.trim().split(/\s+/)
    if (parts.length >= 2) {
      lines.push(`N:${escapeVCard(parts.slice(1).join(' '))};${escapeVCard(parts[0])};;;`)
    } else {
      lines.push(`N:${escapeVCard(contact.name)};;;;`)
    }
  }

  // 公司 (ORG)
  if (contact.organization) {
    lines.push(`ORG:${escapeVCard(contact.organization)}`)
  }

  // 职位 (TITLE)
  if (contact.title) {
    lines.push(`TITLE:${escapeVCard(contact.title)}`)
  }

  // 电话 (TEL)
  contact.phones.forEach(phone => {
    if (phone.trim()) {
      lines.push(`TEL;TYPE=WORK:${escapeVCard(phone.trim())}`)
    }
  })

  // 邮箱 (EMAIL)
  contact.emails.forEach(email => {
    if (email.trim()) {
      lines.push(`EMAIL;TYPE=WORK:${escapeVCard(email.trim())}`)
    }
  })

  // 网站 (URL)
  if (contact.url && contact.url.trim()) {
    lines.push(`URL:${escapeVCard(contact.url.trim())}`)
  }

  // 地址 (ADR) — vCard 3.0 地址格式：PO Box;Extended;Street;City;Region;Postal;Country
  // 简化处理：将整个地址放在 Street 字段
  if (contact.address && contact.address.trim()) {
    lines.push(`ADR;TYPE=WORK:;;${escapeVCard(contact.address.trim())};;;;`)
  }

  // 备注 (NOTE)
  if (contact.notes.trim()) {
    lines.push(`NOTE:${escapeVCard(contact.notes.trim())}`)
  }

  lines.push('END:VCARD')

  return lines.join('\r\n')
}

/**
 * 触发浏览器文件下载
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  // 使用 UTF-8 BOM 确保中文正确显示
  const bom = mimeType.includes('csv') ? '\uFEFF' : ''
  const blob = new Blob([bom + content], { type: `${mimeType};charset=utf-8` })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()

  // 清理
  setTimeout(() => {
    URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }, 100)
}
