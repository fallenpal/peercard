import type { RecognizeResult } from '../types/contact'

// 压缩后的最大尺寸（长边），名片识别不需要太高分辨率
const MAX_DIMENSION = 1600
// JPEG 压缩质量
const JPEG_QUALITY = 0.8

/**
 * 将图片文件加载为 HTMLImageElement
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = URL.createObjectURL(file)
  })
}

/**
 * 压缩图片并返回 base64 字符串（不含 data URI 前缀）
 * 通过 Canvas 缩小尺寸 + JPEG 压缩，确保不超过 Vercel 4.5MB body 限制
 */
async function compressImageToBase64(file: File): Promise<string> {
  const img = await loadImage(file)

  let { width, height } = img

  // 按长边等比缩放
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    if (width > height) {
      height = Math.round(height * (MAX_DIMENSION / width))
      width = MAX_DIMENSION
    } else {
      width = Math.round(width * (MAX_DIMENSION / height))
      height = MAX_DIMENSION
    }
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, width, height)

  // 释放 ObjectURL
  URL.revokeObjectURL(img.src)

  // 转为 JPEG base64
  const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY)
  return dataUrl.split(',')[1]
}

/**
 * 调用后端 API 识别名片（API Key 安全存放在服务端）
 */
export async function recognizeCard(imageFile: File): Promise<RecognizeResult> {
  const base64 = await compressImageToBase64(imageFile)
  const mediaType = 'image/jpeg'

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
