import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const client = new OpenAI({
  apiKey: process.env.MOONSHOT_API_KEY, 
  baseURL: "https://api.moonshot.cn/v1",
})

export async function POST(req: Request) {
  try {
    const { disease } = await req.json()
    if (!disease) return NextResponse.json({ error: 'No disease' }, { status: 400 })

    console.log(`🔍 [Server] Searching for: ${disease}`)

    const searchResponse = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: `2024年 ${disease} 核保宽松的保险产品 推荐`,
        search_depth: "basic",
        include_answer: true,
        max_results: 3
      })
    })
    
    if (!searchResponse.ok) throw new Error('Tavily Search Failed')

    const searchData = await searchResponse.json()
    const searchContext = searchData.results.map((r: any) => r.content).join('\n')

    const completion = await client.chat.completions.create({
      model: "moonshot-v1-8k",
      messages: [
        {
          role: "system",
          content: `你是一个资深保险核保专家。请根据以下搜索到的网络信息，总结出针对"${disease}"核保最宽松的 1-2 款产品。
          
          搜索信息：
          ${searchContext}

          请严格返回 JSON 格式，不要包含 markdown 符号：
          {
            "products": [
              {
                "product_name": "产品名",
                "company": "保司名",
                "verdict": "pass" (标体) 或 "exclude" (除外) 或 "reject" (拒保),
                "summary": "一句话点评",
                "content": "详细核保结论"
              }
            ]
          }`
        }
      ],
      response_format: { type: "json_object" }
    })

    const aiText = completion.choices[0].message.content || '{}'
    const cleanJson = aiText.replace(/```json/g, '').replace(/```/g, '')
    const aiResult = JSON.parse(cleanJson)
    const products = aiResult.products || []

    if (products.length > 0) {
      for (const p of products) {
        await supabase.from('cases').insert({
          disease_type: disease,
          product_name: p.product_name,
          company: p.company,
          verdict: p.verdict,
          summary: p.summary,
          content: p.content,
          created_at: new Date().toISOString()
        })
      }
    }

    return NextResponse.json({ success: true, data: products })

  } catch (error) {
    console.error('❌ AI Search Error:', error)
    return NextResponse.json({ success: false, error: 'Search failed' }, { status: 500 })
  }
}