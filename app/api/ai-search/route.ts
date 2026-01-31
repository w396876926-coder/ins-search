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

    // 1. Tavily 搜索
    const searchResponse = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: `2024年 ${disease} 核保宽松保险产品 价格 承保概率 评测`, 
        search_depth: "basic",
        include_answer: false,
        max_results: 4
      })
    })
    
    const searchData = await searchResponse.json()
    const context = searchData.results?.map((r: any) => r.content).join('\n').slice(0, 3000) || ""

    // 2. Kimi AI 总结 (核心修改：要求 AI 估算具体的钱，而不是比例)
    const completion = await client.chat.completions.create({
      model: "moonshot-v1-8k",
      messages: [
        {
          role: "system",
          content: `你是一个站在用户立场的保险专家。请根据搜索结果，针对"${disease}"生成投保分析。
          
          重点：请根据疾病严重程度，预估市面上可行产品的"起步保费"和"最高保额"。
          例如：甲状腺结节可买百万医疗险，保费低保额高；癌症术后只能买复发险，保费高保额低。
          
          必须严格返回纯 JSON 格式：
          {
            "analysis": {
                "pass_rate": "估算通过率(如 85%)",
                "risk_level": "风险等级(低风险/中风险/高风险)",
                "price_estimate": "预估保费(如: ¥300起/年)",
                "coverage_estimate": "最高保额(如: 600万)",
                "best_product": "推荐产品名",
                "strategy_main": "主险策略(如: 百万医疗险-除外)",
                "strategy_fix": "补充策略(如: 癌症特药险)",
                "strategy_bottom": "兜底策略(如: 当地惠民保)"
            },
            "products": [
              {
                "product_name": "产品全称",
                "company": "保司名",
                "verdict": "pass"(标体)/"exclude"(除外)/"manual"(人核),
                "summary": "一句话推荐理由",
                "content": "具体的核保结论与建议"
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
    const analysis = aiResult.analysis || {}
    
    // 3. 异步回写
    if (products.length > 0) {
        supabase.from('cases').insert(products.map((p: any) => ({
          disease_type: disease,
          ...p,
          created_at: new Date().toISOString()
        }))).then(() => console.log("✅ 异步存入成功"))
    }

    return NextResponse.json({ success: true, data: products, analysis: analysis })

  } catch (error: any) {
    console.error('❌ Error:', error)
    return NextResponse.json({ 
        success: true, 
        data: [{ product_name: '人工核保服务', company: 'HealthGuardian', verdict: 'manual', summary: '需人工介入', content: '情况较复杂，建议直接咨询专家。' }],
        analysis: { pass_rate: '--%', risk_level: '未知', price_estimate: '咨询后报价', coverage_estimate: '具体分析', best_product: '人工咨询', strategy_main: '人工核保', strategy_fix: '多保司尝试', strategy_bottom: '惠民保' }
    })
  }
}