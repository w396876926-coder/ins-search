'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function submitCase(formData: FormData) {
  console.log("🚀 开始提交..."); // 探头1：确认后端收到了请求

  try {
    const supabase = await createClient()
    
    const rawData = {
      disease_type: formData.get('disease_type') as string,
      product_name: formData.get('product_name') as string,
      verdict: formData.get('verdict') as string,
      content: formData.get('content') as string,
    }

    // 打印一下数据，确保没收到空值
    console.log("📦 接收数据:", rawData); 

    const { error } = await supabase
      .from('submissions')
      .insert(rawData)

    if (error) {
      console.error('❌ Supabase 写入失败:', error) // 探头2：数据库拒绝
      return { error: '提交失败' }
    }

  } catch (e) {
    console.error('💥 系统严重错误:', e) // 探头3：代码崩了（这步最关键！）
    return { error: '系统错误' }
  }

  console.log("✅ 提交成功，准备跳转");
  redirect('/submit/success')
}