'use client'

import { useState } from 'react'
import { submitCase } from './actions'

export default function SubmitPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
      
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
          📝 提交核保案例
        </h1>
        <p className="text-gray-500 text-sm mb-8 text-center">
          您的分享将帮助更多病友买到合适的保险
        </p>

        <form action={submitCase} className="space-y-6">
          
          {/* 1. 疾病大类 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">疾病大类</label>
            <select name="disease_type" className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
              <option value="">请选择...</option>
              <option value="甲状腺">甲状腺 (结节/甲亢/甲减)</option>
              <option value="乳腺">乳腺 (结节/增生)</option>
              <option value="肺部">肺部 (结节/磨玻璃)</option>
              <option value="乙肝">乙肝 (大三阳/小三阳)</option>
              <option value="高血压">高血压</option>
              <option value="糖尿病">糖尿病</option>
              <option value="其他">其他</option>
            </select>
          </div>

          {/* 2. 投保产品 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">投保产品 (选填)</label>
            <input 
              name="product_name" 
              type="text" 
              placeholder="例如：平安e生保、国寿福..."
              // 修复点：placeholder-gray-400 让提示文字更清晰
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none placeholder-gray-400"
            />
          </div>

          {/* 3. 核保结论 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">最终结论是？</label>
            <div className="grid grid-cols-3 gap-3">
              <label className="cursor-pointer">
                <input type="radio" name="verdict" value="pass" className="peer sr-only" />
                <div className="p-3 rounded-lg border-2 border-gray-100 text-center peer-checked:border-green-500 peer-checked:bg-green-50 transition-all">
                  <div className="text-xl mb-1">✅</div>
                  <div className="text-xs font-bold text-gray-600 peer-checked:text-green-700">正常承保</div>
                </div>
              </label>

              <label className="cursor-pointer">
                <input type="radio" name="verdict" value="exclude" className="peer sr-only" />
                <div className="p-3 rounded-lg border-2 border-gray-100 text-center peer-checked:border-yellow-500 peer-checked:bg-yellow-50 transition-all">
                  <div className="text-xl mb-1">⚠️</div>
                  <div className="text-xs font-bold text-gray-600 peer-checked:text-yellow-700">除外/加费</div>
                </div>
              </label>

              <label className="cursor-pointer">
                <input type="radio" name="verdict" value="reject" className="peer sr-only" />
                <div className="p-3 rounded-lg border-2 border-gray-100 text-center peer-checked:border-red-500 peer-checked:bg-red-50 transition-all">
                  <div className="text-xl mb-1">🚫</div>
                  <div className="text-xs font-bold text-gray-600 peer-checked:text-red-700">拒保</div>
                </div>
              </label>
            </div>
          </div>

          {/* 4. 详细情况 (修复了这里的颜色) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">详细情况 / 避坑指南</label>
            <textarea 
              name="content" 
              rows={5}
              // 修复点：placeholder-gray-500 颜色更深，text-gray-900 输入文字纯黑
              placeholder="请详细描述下具体病情（比如：结节大小、分级）、核保过程中的波折，给后人一些参考..."
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none placeholder-gray-500 text-gray-900 resize-none"
              required
            ></textarea>
          </div>

          {/* 5. 提交按钮 */}
          <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95">
            提交 AI 分析 🚀
          </button>

        </form>
      </div>
    </div>
  )
}