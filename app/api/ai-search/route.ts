import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: Request) {
  // 检查 Key
  if (!process.env.MOONSHOT_API_KEY || !process.env.TAVILY_API_KEY) {
    return NextResponse.json({ error: 'Config Error' }, { status: 500 });
  }

  const client = new OpenAI({
    apiKey: process.env.MOONSHOT_API_KEY, 
    baseURL: "https://api.moonshot.cn/v1",
  })

  try {
    const { disease } = await req.json()
    console.log(`🔍 [V9.1] 正在全网深度搜索: ${disease}`)

    // 1. Tavily 搜索 (量级翻倍：max_results 改为 8，获取更多全网精华)
    const searchResponse = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: `2024年 ${disease} 保险核保 宽松产品 测评 价格 列表`, 
        search_depth: "basic",
        include_answer: false,
        max_results: 8 // ✅ 翻倍搜索量，确保结果丰富
      })
    })
    
    const searchData = await searchResponse.json()
    // 增加上下文长度，容纳更多产品信息
    const context = searchData.results?.map((r: any) => r.content).join('\n').slice(0, 6000) || ""

    // 2. Kimi AI 总结 (核心修改：要求生成更多产品，并提取数值用于排序)
    const completion = await client.chat.completions.create({
      model: "moonshot-v1-8k",
      messages: [
        {
          role: "system",
          content: `你是一个精算师。请根据搜索结果，尽可能多地列出适合"${disease}"的产品（目标 6-8 款）。
          
          为了方便排序，请估算每个产品的：
          - "price_val": 预估年保费（纯数字，如 500）
          - "coverage_val": 最高保额（纯数字，单位万，如 600）
          - "is_big_company": 是否为知名大公司（true/false，如平安、人保、国寿为true）
          
          返回纯 JSON：
          {
            "analysis": {
                "pass_rate": "估算通过率",
                "risk_level": "风险等级",
                "price_estimate": "起步保费文案",
                "coverage_estimate": "最高保额文案",
                "strategy_main": "主险策略",
                "strategy_fix": "补丁策略",
                "strategy_bottom": "兜底策略"
            },
            "products": [
              {
                "product_name": "产品名",
                "company": "保司",
                "verdict": "pass"(标体)/"exclude"(除外)/"manual"(人核),
                "summary": "核心卖点",
                "content": "详细结论",
                "price_val": 300, 
                "coverage_val": 600,
                "is_big_company": true
              }
            ]
          }`
        },
        { role: "user", content: `搜索资料库：${context}` }
      ],
      response_format: { type: "json_object" },
      temperature: 0.45, // 稍微提高创造性，让它多找点产品
    })

    const aiResult = JSON.parse(completion.choices[0].message.content || '{}')
    const products = aiResult.products || []
    
    // 3. 异步回写
    if (products.length > 0) {
        supabase.from('cases').insert(products.map((p: any) => ({
          disease_type: disease,
          ...p,
          created_at: new Date().toISOString()
        }))).then(() => console.log("✅ 数据入库成功"))
    }

    return NextResponse.json({ success: true, data: products, analysis: aiResult.analysis })

  } catch (error: any) {
    console.error('❌ Error:', error)
    // 兜底数据
    return NextResponse.json({ 
        success: true, 
        data: [{ product_name: '人工核保服务', company: 'HealthGuardian', verdict: 'manual', summary: 'AI连接超时', content: '请直接咨询专家。', price_val: 0, coverage_val: 0 }],
        analysis: null
    })
  }
}