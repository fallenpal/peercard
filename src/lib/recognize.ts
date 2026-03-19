import type { RecognizeResult } from '../types/contact'

/** SiliconFlow API 配置 */
const SILICONFLOW_API_URL = 'https://api.siliconflow.cn/v1/chat/completions'
const SILICONFLOW_API_KEY = 'sk-tnnvlxisgtmznpzqwwphginpqgagdkqmzbmivtpkrshwawfy'
const SILICONFLOW_MODEL = 'Qwen/Qwen2.5-VL-72B-Instruct'

const RECOGNITION_PROMPT = `请分析这张名片图片，提取以下信息并以 JSON 格式返回：

{
  "name": "全名",
  "organization": "公司/组织名称",
  "title": "职位",
  "emails": ["邮箱1", "邮箱2"],
  "phones": ["电话1", "电话2"],
  "url": "网站URL",
  "address": "地址"
}

规则：
- 如果某个字段无法识别，设为 null（emails 和 phones 设为空数组）
- 电话号码保留原始格式（含国家代码和分隔符）
- 如果有多个邮箱或电话，全部提取
- url 字段提取名片上的网站地址
- address 字段提取名片上的公司地址或联系地址
- 只返回 JSON，不要任何其他文字`

/**
 * 将图片文件转为 base64 data URI
 */
function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result) // 完整的 data:image/xxx;base64,... 格式
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsDataURL(file)
  })
}

/**
 * 直接调用 SiliconFlow Vision API 识别名片
 */
export async function recognizeCard(imageFile: File): Promise<RecognizeResult> {
  const imageDataUri = await fileToDataUri(imageFile)

  const response = await fetch(SILICONFLOW_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SILICONFLOW_API_KEY}`,
    },
    body: JSON.stringify({
      model: SILICONFLOW_MODEL,
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
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('SiliconFlow API error:', response.status, errorText)

    if (response.status === 429) {
      throw new Error('API 调用频率过高，请稍后重试')
    }
    if (response.status === 401) {
      throw new Error('API Key 无效')
    }
    throw new Error(`AI 识别服务错误 (${response.status})`)
  }

  const data = await response.json()

  // 从 OpenAI 兼容格式响应中提取文本内容
  const messageContent = data.choices?.[0]?.message?.content
  if (!messageContent) {
    throw new Error('无法从 AI 响应中提取结果')
  }

  // 解析 JSON（模型可能会包含 markdown 代码块标记）
  let jsonStr = messageContent.trim()
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
  }

  try {
    const result = JSON.parse(jsonStr)

    return {
      name: result.name ?? null,
      organization: result.organization ?? null,
      title: result.title ?? null,
      emails: Array.isArray(result.emails) ? result.emails.filter((e: unknown) => typeof e === 'string' && e.length > 0) : [],
      phones: Array.isArray(result.phones) ? result.phones.filter((p: unknown) => typeof p === 'string' && p.length > 0) : [],
      url: typeof result.url === 'string' ? result.url : null,
      address: typeof result.address === 'string' ? result.address : null,
    }
  } catch {
    console.error('JSON 解析失败，原始内容:', messageContent)
    throw new Error('识别结果解析失败，请重试')
  }
}
