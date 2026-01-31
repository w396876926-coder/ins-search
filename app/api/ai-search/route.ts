import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

// 1. 初始化 Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: Request) {
  // 检查 Key 是否存在
  if (!process.env.MOONSHOT_API_KEY || !process.env.TAVILY_API_KEY) {
    console.error("❌ 缺少 API Key");
    return NextResponse.json({ error: 'Server Config Error' }, { status: 500 });
  }

  const client = new OpenAI({
    apiKey: process.env.MOONSHOT_API_KEY, 
    baseURL: "https://api.moonshot.cn/v1",
  })

  try {
    const { disease } = await req.json()
    console.log(`🔍 [Server] 开始联网搜索: ${disease}`)

    // 2. Tavily 搜索 (速度优化：只搜 2 条，不问答，求快)
    // 您的余额充足，这里会正常工作
    const searchResponse = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: `2024年 ${disease} 保险核保 宽松产品 推荐`, 
        search_depth: "basic", // 基础搜索比深度搜索快很多
        include_answer: false, // 不要生成答案，只给素材，省时间
        max_results: 2 
      })
    })
    
    if (!searchResponse.ok) throw new Error('搜索 API 调用失败')

    const searchData = await searchResponse.json()
    // 截取前 2000 个字符，防止喂给 AI 太多字导致它读太久超时
    const context = searchData.results?.map((r: any) => r.content).join('\n').slice(0, 2000) || "暂无网络结果"

    console.log("✅ 搜索完成，正在请求 Kimi 总结...")

    // 3. Kimi AI 总结 (提示词优化：要求极简 JSON，防止废话多)
    const completion = await client.chat.completions.create({
      model: "moonshot-v1-8k",
      messages: [
        {
          role: "system",
          content: `你是一个资深核保专家。根据提供的搜索结果，推荐 1-2 款针对该疾病核保宽松的产品。
          
          必须严格返回纯 JSON 格式，严禁包含 markdown 符号（如 \`\`\`json）：
          {
            "products": [
              {
                "product_name": "产品名",
                "company": "保司",
                "verdict": "pass" (或 exclude/reject),
                "summary": "10字以内简评",
                "content": "核心核保结论（30字以内）"
              }
            ]
          }`
        },
        { role: "user", content: `搜索结果：${context}` }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3, // 低温度，反应更快更准确
    })

    const aiText = completion.choices[0].message.content || '{}'
    // 清理一下可能的格式杂质
    const cleanJson = aiText.replace(/```json/g, '').replace(/```/g, '')
    const aiResult = JSON.parse(cleanJson)
    const products = aiResult.products || []
    
    // 4. 异步存入数据库 (不等待它完成，直接给用户返回结果，再次提速！)
    if (products.length > 0) {
        supabase.from('cases').insert(products.map((p: any) => ({
          disease_type: disease,
          ...p,
          created_at: new Date().toISOString()
        }))).then(() => console.log("✅ 已异步存入数据库"))
    }

    console.log(`🎉 成功！返回 ${products.length} 个产品`)
    return NextResponse.json({ success: true, data: products })

  } catch (error: any) {
    console.error('❌ 发生错误:', error)
    // 就算报错也不要崩，返回一个友好的兜底
    return NextResponse.json({ 
        success: true, 
        data: [{ 
            product_name: '人工核保通道', 
            company: 'HealthGuardian', 
            verdict: 'manual', 
            summary: 'AI 网络请求超时',
            content: '刚才网络有点拥堵，建议您稍后再试，或直接点击下方咨询人工顾问。' 
        }] 
    })
  }
}