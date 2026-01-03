'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { analyzeCaseWithAI } from './ai-service'

// 1. 🤖 触发 AI 分析
export async function runAiAnalysis(id: number, rawContent: string) {
  // 如果内容太短，没必要分析
  if (!rawContent || rawContent.length < 5) return

  // 调用 DeepSeek
  const aiResult = await analyzeCaseWithAI(rawContent)

  if (aiResult) {
    const supabase = await createClient()
    // 将结果存回 submissions 表的 ai_analysis 字段
    // 这样下次刷新页面就不需要重新分析了
    await supabase
      .from('submissions')
      .update({ ai_analysis: aiResult })
      .eq('id', id)

    revalidatePath('/admin')
  }
}

// 2. ❌ 驳回投稿
export async function rejectSubmission(id: number) {
  const supabase = await createClient()
  await supabase.from('submissions').update({ status: 'rejected' }).eq('id', id)
  revalidatePath('/admin')
}

// 3. ✅ 通过投稿 (智能版)
export async function approveSubmission(id: number) {
  const supabase = await createClient()

  // 获取该条数据的最新状态（可能已经包含 AI 分析结果）
  const { data: submission } = await supabase
    .from('submissions')
    .select('*')
    .eq('id', id)
    .single()

  if (!submission) return

  // 🤖 核心逻辑：优先使用 AI 清洗后的数据，如果没有则回退到用户原始数据
  const aiData = submission.ai_analysis || {}
  
  const finalData = {
    disease_type: aiData.disease_type || submission.disease_type,
    condition_detail: aiData.condition_detail || submission.content || '未详述',
    product_name: aiData.product_name || submission.product_name,
    verdict: aiData.verdict || (submission.verdict === 'pass' ? '标体承保' : '拒保'),
    notes: aiData.ai_suggestion || submission.content, // 优先用 AI 的避坑指南
    source: '用户分享',
    company: '未知'
  }

  // 插入主表
  const { error } = await supabase.from('cases').insert(finalData)

  if (error) {
    console.error('入库失败', error)
    return
  }

  // 标记为已完成
  await supabase.from('submissions').update({ status: 'approved' }).eq('id', id)
  revalidatePath('/admin')
}