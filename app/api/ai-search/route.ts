import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: Request) {
  if (!process.env.MOONSHOT_API_KEY || !process.env.TAVILY_API_KEY) {
    return NextResponse.json({ error: 'Config Error' }, { status: 500 });
  }

  const client = new OpenAI({
    apiKey: process.env.MOONSHOT_API_KEY, 
    baseURL: "https://api.moonshot.cn/v1",
  })

  try {
    const { disease } = await req.json()
    console.log(`🔍 正在搜索: ${disease}`)

    // 1. Tavily 搜索 (搜多一点，max_results=5)
    const searchResponse = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: `2024年 ${disease} 核保宽松的保险产品 推荐 评测`, 
        search_depth: "basic",
        include_answer: false,
        max_results: 5 
      })
    })
    
    const searchData = await searchResponse.json()
    const context = searchData.results?.map((r: any) => r.content).join('\n').slice(0, 3000) || ""

    // 2. Kimi AI 总结 (要求生成 4-6 个产品，内容更丰富)
    const completion = await client.chat.completions.create({
      model: "moonshot-v1-8k",
      messages: [
        {
          role: "system",
          content: `你是一个资深核保专家。根据搜索结果，推荐 4-6 款针对该疾病核保宽松的产品。
          
          必须严格返回纯 JSON 格式，严禁 markdown：
          {
            "products": [
              {
                "product_name": "产品全称",
                "company": "保险公司名",
                "verdict": "pass"(标体) / "exclude"(除外) / "manual"(人核),
                "summary": "核心卖点(如: 肺结节宽松之王)",
                "content": "详细核保结论(如: 3年内CT无变化可标体...)"
              }
            ]
          }`
        },
        { role: "user", content: `搜索结果：${context}` }
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
    })

    const aiResult = JSON.parse(completion.choices[0].message.content || '{}')
    const products = aiResult.products || []
    
    // 3. 异步回写 (不阻塞)
    if (products.length > 0) {
        supabase.from('cases').insert(products.map((p: any) => ({
          disease_type: disease,
          ...p,
          created_at: new Date().toISOString()
        }))).then(() => console.log("✅ 异步存入成功"))
    }

    return NextResponse.json({ success: true, data: products })

  } catch (error: any) {
    console.error('❌ Error:', error)
    return NextResponse.json({ 
        success: true, 
        data: [{ 
            product_name: '人工核保服务', 
            company: 'HealthGuardian', 
            verdict: 'manual', 
            summary: 'AI 网络波动',
            content: '暂时无法连接知识库，建议直接咨询专家。' 
        }] 
    })
  }
}