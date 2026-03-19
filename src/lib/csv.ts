import type { Contact } from '../types/contact'

/**
 * 转义 CSV 字段值（处理逗号、引号、换行）
 */
function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/**
 * 生成 CSV 文件内容
 */
export function generateCSV(contacts: Contact[]): string {
  const headers = ['Name', 'Organization', 'Title', 'Emails', 'Phones', 'URL', 'Address', 'Notes']

  const rows = contacts.map(contact => [
    escapeCsvField(contact.name || ''),
    escapeCsvField(contact.organization || ''),
    escapeCsvField(contact.title || ''),
    escapeCsvField(contact.emails.join('; ')),
    escapeCsvField(contact.phones.join('; ')),
    escapeCsvField(contact.url || ''),
    escapeCsvField(contact.address || ''),
    escapeCsvField(contact.notes || ''),
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')

  return csvContent
}
