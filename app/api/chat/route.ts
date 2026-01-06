// app/api/chat/route.ts
import { OpenAI } from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';

// 这里建议用 DeepSeek，兼容 OpenAI 协议，性价比极高
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '你的API_KEY', // 去 DeepSeek 或 OpenAI 申请一个 Key
  baseURL: 'https://api.deepseek.com/v1', // 如果用 DeepSeek 就填这个
});

export const runtime = 'edge';

export async function POST(req: Request) {
  const { messages } = await req.json();

  // 核心 Prompt：让 AI 扮演核保专家
  const systemPrompt = `你是一位资深的保险核保专家。
  用户的输入可能是一个具体的疾病名称，也可能是一段描述。
  你的任务是：
  1. 分析用户的疾病风险等级（低/中/高）。
  2. 给出简短的投保建议（100字以内）。
  3. 如果是高风险，推荐"惠民保"或"防癌险"。
  4. 提取出最核心的疾病关键词（例如用户说"我有甲状腺结节4a"，你提取"甲状腺"）。
  
  请以JSON格式返回（不要Markdown）：
  {
    "risk": "高",
    "advice": "建议优先考虑...",
    "keyword": "甲状腺"
  }
  `;

  const response = await openai.chat.completions.create({
    model: 'deepseek-chat', // 或者 gpt-3.5-turbo
    stream: true,
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
  });

  return new StreamingTextResponse(OpenAIStream(response));
}