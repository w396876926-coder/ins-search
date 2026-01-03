// app/admin/ai-service.ts

export async function analyzeCaseWithAI(content: string) {
  // 1. 🔍 检查 Key (只打印前4位，防止泄露)
  const apiKey = process.env.DEEPSEEK_API_KEY
  console.log("🔑 DeepSeek Key:", apiKey ? `已读取 (sk-${apiKey.slice(3, 7)}...)` : "❌ 未读取到！")

  if (!apiKey) return null

  console.log("🤖 正在呼叫 DeepSeek (原生 Fetch 版)...")

  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { 
            role: "system", 
            content: `你是一个专业的保险核保分析师。请提取用户描述中的关键信息，并严格以 JSON 格式返回，不要包含 markdown 标记。
            
            返回格式要求：
            {
              "disease_type": "标准疾病名称 (如：甲状腺、乳腺、乙肝)",
              "verdict": "核保结论 (只能是 pass, exclude, reject 其中之一)",
              "summary": "病情摘要 (简练概括关键指标，如分级、尺寸、边界等)"
            }`
          },
          { role: "user", content: content }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ DeepSeek 服务端报错 (${response.status}):`, errorText)
      return null
    }

    const data = await response.json()
    const resultRaw = data.choices[0].message.content
    console.log("✅ AI 返回成功:", resultRaw)

    return JSON.parse(resultRaw)

  } catch (error) {
    console.error('💥 调用出错:', error)
    return null
  }
}