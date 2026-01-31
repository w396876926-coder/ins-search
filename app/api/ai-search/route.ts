// app/api/ai-search/route.ts
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

// ⚠️ 注意：这里需要配置您的 API Key
// 建议申请 Tavily (搜索) 和 Moonshot/OpenAI (总结)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, 
  baseURL: process.env.OPENAI_BASE_URL // 如果用 Kimi/DeepSeek 等国产模型需配置
})

export async function POST(req: Request) {
  const { disease } = await req.json()

  if (!disease) return NextResponse.json({ error: 'No disease provided' }, { status: 400 })

  try {
    // 第一步：模拟联网搜索 (这里为了演示，如果您有 Tavily Key 可以替换成真搜索)
    // 真实场景：调用 fetch('https://api.tavily.com/search', ...)
    console.log(`正在全网搜索关于 ${disease} 的核保政策...`)
    
    // 这里我们用 prompt 让 AI 假装它联网了 (或者基于它庞大的训练数据)
    // 如果接了 Tavily，把搜索到的 context 喂给下面 content 即可
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview", // 或者 gpt-3.5-turbo
      messages: [
        {
          role: "system",
          content: `你是一个资深保险核保专家。用户会输入一个疾病，请你根据你的知识库（模拟全网搜索），
          推荐 3-4 款当前市面上针对该疾病核保最宽松的产品。
          
          必须严格按照以下 JSON 格式返回，不要包含 markdown 代码块：
          [
            {
              "name": "产品名称",
              "company": "保险公司",
              "verdict": "pass" | "exclude" | "reject", (pass=标体, exclude=除外, reject=拒保)
              "passCount": 50, (模拟一个通过人数)
              "totalCount": 60, (模拟总案例数)
              "content": "具体的核保结论，比如：近半年复查无变化可尝试标体...",
              "summary": "专家一句话点评"
            }
          ]`
        },
        {
          role: "user",
          content: `请帮我搜索关于 "${disease}" 的最新核保宽松产品。`
        }
      ],
      response_format: { type: "json_object" } // 强制返回 JSON
    })

    const result = completion.choices[0].message.content
    
    // 这里可以加一步：将 result 存入 Supabase (实现数据库自动生长)
    
    return NextResponse.json(JSON.parse(result || '[]'))

  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'AI Search failed' }, { status: 500 })
  }
}