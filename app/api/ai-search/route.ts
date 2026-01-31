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
        query: `2024年 ${disease} 核保宽松保险产品 承保概率 数据分析`, 
        search_depth: "basic",
        include_answer: false,
        max_results: 4
      })
    })
    
    const searchData = await searchResponse.json()
    const context = searchData.results?.map((r: any) => r.content).join('\n').slice(0, 3000) || ""

    // 2. Kimi AI 总结 (核心修改：增加了 analysis 字段，让AI估算数据)
    const completion = await client.chat.completions.create({
      model: "moonshot-v1-8k",
      messages: [
        {
          role: "system",
          content: `你是一个资深精算师和核保专家。请根据搜索结果，针对"${disease}"生成一份详细的核保分析报告。
          
          必须严格返回纯 JSON 格式，严禁 markdown：
          {
            "analysis": {
                "pass_rate": "估算通过率(如 85%)",
                "reject_rate": "估算拒保率(如 15%)",
                "best_product": "目前最推荐的一款产品名",
                "leverage": "预估杠杆(如 1:200)",
                "strategy_main": "主险策略(如: 重疾险除外)",
                "strategy_fix": "补丁策略(如: 复发险)",
                "strategy_bottom": "兜底策略(如: 惠民保)"
            },
            "products": [
              {
                "product_name": "产品全称",
                "company": "保险公司名",
                "verdict": "pass"(标体) / "exclude"(除外) / "manual"(人核),
                "summary": "核心卖点(10字内)",
                "content": "详细核保结论(30字内)"
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
    const analysis = aiResult.analysis || {} // 获取分析数据
    
    // 3. 异步回写
    if (products.length > 0) {
        supabase.from('cases').insert(products.map((p: any) => ({
          disease_type: disease,
          ...p,
          created_at: new Date().toISOString()
        }))).then(() => console.log("✅ 异步存入成功"))
    }

    // 返回数据带上 analysis
    return NextResponse.json({ success: true, data: products, analysis: analysis })

  } catch (error: any) {
    console.error('❌ Error:', error)
    return NextResponse.json({ 
        success: true, 
        // 兜底数据
        data: [{ product_name: '人工核保服务', company: 'HealthGuardian', verdict: 'manual', summary: 'AI 网络波动', content: '暂时无法连接知识库。' }],
        analysis: { pass_rate: '--%', reject_rate: '--%', best_product: '人工咨询', leverage: '1:--', strategy_main: '人工介入', strategy_fix: '多加保司', strategy_bottom: '惠民保' }
    })
  }
}