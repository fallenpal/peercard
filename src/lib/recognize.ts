import type { RecognizeResult } from '../types/contact'

/**
 * 将图片文件转为 base64 字符串
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // 移除 data:image/xxx;base64, 前缀
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsDataURL(file)
  })
}

/**
 * 获取文件的 MIME 类型
 */
function getMediaType(file: File): string {
  const type = file.type
  if (type === 'image/heic' || type === 'image/heif') {
    return 'image/jpeg' // HEIC 转换后通常作为 JPEG 处理
  }
  return type || 'image/jpeg'
}

/**
 * 调用后端 API 识别名片（API Key 安全存放在服务端）
 */
export async function recognizeCard(imageFile: File): Promise<RecognizeResult> {
  const base64 = await fileToBase64(imageFile)
  const mediaType = getMediaType(imageFile)

  const response = await fetch('/api/recognize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64, mediaType }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: '服务器错误' }))
    throw new Error(errorData.error || `识别请求失败 (${response.status})`)
  }

  const data = await response.json()

  // 校验返回数据结构
  return {
    name: data.name ?? null,
    organization: data.organization ?? null,
    title: data.title ?? null,
    emails: Array.isArray(data.emails) ? data.emails.filter((e: unknown) => typeof e === 'string' && e.length > 0) : [],
    phones: Array.isArray(data.phones) ? data.phones.filter((p: unknown) => typeof p === 'string' && p.length > 0) : [],
    url: typeof data.url === 'string' ? data.url : null,
    address: typeof data.address === 'string' ? data.address : null,
  }
}
