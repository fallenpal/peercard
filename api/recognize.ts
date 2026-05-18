// Vercel Serverless Function — 代理 SiliconFlow Vision API 调用
// API Key 仅在服务端使用，不暴露给前端

export const config = {
  maxDuration: 60,
}

interface RequestBody {
  image: string    // base64 编码的图片
  mediaType: string // MIME 类型
  model?: string   // 可选：前端传入的模型选择
}

// 允许的模型白名单
const ALLOWED_MODELS: Record<string, string> = {
  'deepseek-ocr': 'deepseek-ai/DeepSeek-OCR',
}
const DEFAULT_MODEL = 'deepseek-ocr'

const RECOGNITION_PROMPT = `<image>
Free OCR. Read all visible text from this business card.
Return plain text only, one item per line. Do not explain.`

function extractJsonObject(content: string) {
  let jsonStr = content.trim()
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
  }

  const start = jsonStr.indexOf('{')
  const end = jsonStr.lastIndexOf('}')
  if (start !== -1 && end !== -1 && end > start) {
    jsonStr = jsonStr.slice(start, end + 1)
  }

  return JSON.parse(jsonStr)
}

function uniqueMatches(text: string, pattern: RegExp) {
  return Array.from(new Set(text.match(pattern) ?? [])).map(item => item.trim())
}

function parseOcrFallback(content: string) {
  const cleanContent = content.replace(/<[^>\n]+>/g, ' ')
  const emails = uniqueMatches(content, /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)
  const phones = uniqueMatches(cleanContent, /(?:\+?\d[\d\s().-]{6,}\d)/g)
    .filter(phone => phone.replace(/\D/g, '').length >= 7)
  const urls = uniqueMatches(cleanContent, /\b(?:https?:\/\/[^\s,;]+|www\.[^\s,;]+|[a-z0-9-]+\.[a-z]{2,}(?:\/[^\s,;]*)?)\b/gi)
    .filter(url => !emails.some(email => email.toLowerCase().includes(url.toLowerCase())))

  const rawLines = cleanContent
    .replace(/```[\s\S]*?```/g, '')
    .split(/\r?\n/)
    .map(line => line.replace(/^[\s\-*|#>]+|[\s|]+$/g, '').trim())
    .filter(Boolean)

  const labeled = new Map<string, string>()
  for (const line of rawLines) {
    const match = line.match(/^(name|full name|organization|company|company name|title|job title|position|url|website|address|姓名|名字|公司|组织|职位|头衔|网站|网址|地址)\s*[:：]\s*(.+)$/i)
    if (match?.[1] && match?.[2]) {
      labeled.set(match[1].toLowerCase(), match[2].trim())
    }
  }

  const lines = rawLines
    .filter(line => !emails.some(email => line.includes(email)))
    .filter(line => !phones.some(phone => line.includes(phone)))
    .filter(line => !urls.some(url => line.includes(url)))
    .map(line => line.replace(/^[^:：]{1,24}[:：]\s*/, '').trim())
    .filter(line => !/^(ocr|json|name|organization|title|emails?|phones?|url|address|信息|看起来像)$/i.test(line))

  const name = labeled.get('name') || labeled.get('full name') || labeled.get('姓名') || labeled.get('名字') || lines.find(line => line.length <= 80) || null
  const organization = labeled.get('organization') || labeled.get('company') || labeled.get('company name') || labeled.get('公司') || labeled.get('组织') || lines.find(line => line !== name && line.length <= 120) || null
  const title = labeled.get('title') || labeled.get('job title') || labeled.get('position') || labeled.get('职位') || labeled.get('头衔') || lines.find(line => line !== name && line !== organization && line.length <= 120) || null

  return {
    name,
    organization,
    title,
    emails,
    phones,
    url: labeled.get('url') || labeled.get('website') || labeled.get('网站') || labeled.get('网址') || urls[0] || null,
    address: labeled.get('address') || labeled.get('地址') || lines.find(line =>
      line !== name &&
      line !== organization &&
      line !== title &&
      /(street|road|avenue|suite|floor|building|city|china|usa|地址|路|街|楼|层|区|市|省)/i.test(line)
    ) ?? null,
  }
}

export default async function handler(req: any, res: any) {
  // CORS 支持 — 必须在 method 检查之前，否则 OPTIONS 预检请求会被 405 拦截
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // 仅允许 POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.SILICONFLOW_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'AI 服务未配置，请设置 SILICONFLOW_API_KEY 环境变量' })
  }

  const startTime = Date.now()
  const reqId = Math.random().toString(36).slice(2, 8)

  try {
    const { image, mediaType, model: modelKey } = req.body as RequestBody

    if (!image) {
      return res.status(400).json({ error: '缺少图片数据' })
    }

    // 解析模型选择，白名单校验
    const resolvedModelKey = (modelKey && ALLOWED_MODELS[modelKey]) ? modelKey : DEFAULT_MODEL
    const modelName = ALLOWED_MODELS[resolvedModelKey]

    const imageSizeKB = Math.round((image.length * 3) / 4 / 1024)
    console.log(`[${reqId}] 识别开始 | model=${modelName} | image=${imageSizeKB}KB`)

    // 构造 data URI 格式供 OpenAI 兼容接口使用
    const imageDataUri = `data:${mediaType || 'image/jpeg'};base64,${image}`

    // 调用 SiliconFlow OpenAI 兼容 API
    const apiStart = Date.now()
    const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: imageDataUri,
                },
              },
              {
                type: 'text',
                text: RECOGNITION_PROMPT,
              },
            ],
          },
        ],
      }),
      signal: AbortSignal.timeout(50000), // 50s 超时，留余量给 Vercel 返回错误
    })
    const apiDuration = Date.now() - apiStart

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[${reqId}] SiliconFlow API 错误 | status=${response.status} | api耗时=${apiDuration}ms | error=${errorText.slice(0, 300)}`)

      if (response.status === 429) {
        return res.status(429).json({ error: 'API 调用频率过高，请稍后重试' })
      }
      if (response.status === 401) {
        return res.status(500).json({ error: 'API Key 无效' })
      }

      return res.status(500).json({ error: `AI 识别服务错误 (${response.status}): ${errorText.slice(0, 200)}` })
    }

    console.log(`[${reqId}] SiliconFlow 响应成功 | api耗时=${apiDuration}ms`)

    const data = await response.json()

    // 从 OpenAI 兼容格式响应中提取文本内容
    const messageContent = data.choices?.[0]?.message?.content
    if (!messageContent) {
      console.error(`[${reqId}] 空响应 | usage=${JSON.stringify(data.usage)}`)
      return res.status(500).json({ error: '无法从 AI 响应中提取结果' })
    }

    let result
    try {
      result = extractJsonObject(messageContent)
    } catch {
      result = parseOcrFallback(messageContent)
    }

    // 公司为空时，用邮箱域名补全
    let organization = result.organization ?? null
    if (!organization && Array.isArray(result.emails) && result.emails.length > 0) {
      const domain = result.emails[0].split('@')[1]
      if (domain) {
        organization = domain
      }
    }

    const totalDuration = Date.now() - startTime
    console.log(`[${reqId}] 识别完成 | 总耗时=${totalDuration}ms | api耗时=${apiDuration}ms | name=${result.name} | org=${organization}`)

    return res.status(200).json({
      name: result.name ?? null,
      organization,
      title: result.title ?? null,
      emails: Array.isArray(result.emails) ? result.emails : [],
      phones: Array.isArray(result.phones) ? result.phones : [],
      url: typeof result.url === 'string' ? result.url : null,
      address: typeof result.address === 'string' ? result.address : null,
    })
  } catch (error) {
    const totalDuration = Date.now() - startTime
    const isTimeout = error instanceof DOMException && error.name === 'TimeoutError'
    const isAbort = error instanceof DOMException && error.name === 'AbortError'

    console.error(`[${reqId}] 识别失败 | 总耗时=${totalDuration}ms | timeout=${isTimeout} | abort=${isAbort} | error=`, error)

    if (isTimeout || isAbort) {
      return res.status(504).json({ error: 'AI 识别超时，模型响应过慢，请稍后重试' })
    }

    return res.status(500).json({
      error: error instanceof SyntaxError
        ? '识别结果解析失败，请重试'
        : '名片识别失败，请重试'
    })
  }
}
