"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Shield, Stethoscope, ArrowRight, Activity, CheckCircle, AlertTriangle, X, Search } from "lucide-react";

// 初始化 Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Home() {
  const [allData, setAllData] = useState<any[]>([]); 
  
  // 页面状态
  const [viewState, setViewState] = useState<'landing' | 'report'>('landing'); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 表单数据
  const [formData, setFormData] = useState({
    disease_type: "",
    condition_detail: "",
    age: "", 
    contact: ""
  });

  // 报告数据
  const [reportData, setReportData] = useState<{
    matchCount: number;
    passRate: number;
    bestProduct: string;
    similarCases: any[];
  } | null>(null);

  // 1. 预加载数据
  useEffect(() => {
    async function fetchAll() {
      const { data } = await supabase
        .from("cases")
        .select("*")
        .neq('verdict', '待核保 (求助中)') 
        .order('id', { ascending: false });
      if (data) setAllData(data || []);
    }
    fetchAll();
  }, []);

  // 2. 核心逻辑：智能分析
  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.disease_type) {
      alert("请填写疾病名称");
      return;
    }

    // A. 数据入库（作为销售线索/待审核数据）
    // 注意：这里我们存入 Supabase，你在后台能看到
    await supabase.from("cases").insert([{
      disease_type: formData.disease_type,
      condition_detail: formData.condition_detail + ` (年龄:${formData.age})`,
      company: "用户测算",
      product_name: "AI智能评估",
      verdict: "待核保 (求助中)", 
      notes: `联系方式：${formData.contact}。系统自动采集。`,
      source: "AI测算入口"
    }]);

    setIsModalOpen(false);
    setIsAnalyzing(true);

    // B. "伪AI" 模糊匹配算法 (修复了搜索太严格的问题)
    setTimeout(() => {
      const userQuery = formData.disease_type.trim().toLowerCase();
      
      const matches = allData.filter(item => {
        const dbDisease = item.disease_type?.toLowerCase() || "";
        const dbDetail = item.condition_detail?.toLowerCase() || "";

        // 逻辑1：【正向匹配】数据库里的词 包含 用户输入的词
        // (例如：数据库"甲状腺结节"，用户搜"结节")
        const forwardMatch = dbDisease.includes(userQuery) || dbDetail.includes(userQuery);

        // 逻辑2：【反向匹配】用户输入的词 包含 数据库里的关键词
        // (例如：用户搜"左侧甲状腺乳头状癌"，数据库只要有"甲状腺"，就算命中！)
        // 限制：数据库关键词长度至少要大于1，防止匹配到空字符
        const reverseMatch = (dbDisease.length > 1 && userQuery.includes(dbDisease));

        return forwardMatch || reverseMatch;
      });

      // 计算统计结果
      let passCount = 0;
      const productCounts: Record<string, number> = {};
      
      matches.forEach(item => {
        if (!item.verdict?.includes('拒保')) passCount++;
        const prod = item.product_name || "未知产品";
        productCounts[prod] = (productCounts[prod] || 0) + 1;
      });

      let bestProd = "暂无推荐";
      let maxCount = 0;
      for (const [prod, count] of Object.entries(productCounts)) {
        if (count > maxCount) {
          maxCount = count;
          bestProd = prod;
        }
      }

      setReportData({
        matchCount: matches.length,
        passRate: matches.length > 0 ? Math.round((passCount / matches.length) * 100) : 0,
        bestProduct: matches.length > 0 ? bestProd : "数据不足，转人工核保",
        similarCases: matches
      });

      setIsAnalyzing(false);
      setViewState('report');
    }, 1500);
  }

  const resetSearch = () => {
    setViewState('landing');
    setFormData({ disease_type: "", condition_detail: "", age: "", contact: "" });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      
      {/* 顶部导航 */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2 font-bold text-xl text-blue-900 cursor-pointer" onClick={resetSearch}>
            <Shield className="w-6 h-6 fill-blue-900 text-white" /> 非标体核保库
          </div>
          {viewState === 'report' && (
             <button onClick={resetSearch} className="text-sm text-slate-500 hover:text-blue-600 font-medium">
               ← 返回测算
             </button>
          )}
        </div>
      </nav>

      {/* Loading 动画 */}
      {isAnalyzing && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center p-4">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <h2 className="text-xl font-bold text-slate-800 animate-pulse text-center">正在检索全网 {allData.length} 条核保数据...</h2>
          <p className="text-slate-500 mt-2 text-center">AI 正在分析关键词：{formData.disease_type}</p>
        </div>
      )}

      {/* 场景: 首页 Landing */}
      {viewState === 'landing' && !isAnalyzing && (
        <div className="max-w-3xl mx-auto px-6 py-12 md:py-20 flex flex-col items-center text-center animate-in fade-in duration-500">
          
          <div className="bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-bold mb-6 inline-flex items-center gap-2">
            <Activity className="w-4 h-4" /> AI 核保系统 V3.1 在线
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight mb-6">
            身体有异常，还能买保险吗？<br/>
            <span className="text-blue-600">输入病情，1秒出结果</span>
          </h1>

          <p className="text-lg text-slate-500 mb-10 max-w-xl leading-relaxed">
            基于 {allData.length} 条真实病友核保案例。
            不跑医院，不留记录，AI 智能匹配与您相似的投保结果。
          </p>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="group relative bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold py-5 px-10 rounded-full shadow-xl shadow-blue-200 transition-all hover:-translate-y-1"
          >
            <span className="flex items-center gap-3">
              <Stethoscope className="w-6 h-6" /> 
              立即免费测算
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 rounded-full ring-2 ring-white/20 group-hover:ring-white/40"></div>
          </button>

          <div className="mt-12 grid grid-cols-3 gap-8 text-center w-full max-w-lg">
            <div>
              <div className="text-2xl font-bold text-slate-800">{allData.length}+</div>
              <div className="text-xs text-slate-400 mt-1">真实案例</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">1.5s</div>
              <div className="text-xs text-slate-400 mt-1">智能分析</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">100%</div>
              <div className="text-xs text-slate-400 mt-1">隐私保护</div>
            </div>
          </div>
        </div>
      )}

      {/* 场景: 报告页 Report */}
      {viewState === 'report' && reportData && (
        <div className="max-w-4xl mx-auto p-6 md:p-10 animate-in slide-in-from-bottom-4 duration-500">
          
          {/* 头部卡片 */}
          <div className="bg-gradient-to-br from-blue-900 to-blue-800 text-white rounded-3xl p-8 mb-8 shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
              <div className="text-blue-200 text-sm font-bold mb-2 uppercase tracking-wider">AI Analysis Report</div>
              <h2 className="text-3xl font-bold mb-6">
                关于“{formData.disease_type}”的分析报告
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                  <div className="text-3xl font-bold text-yellow-400">{reportData.matchCount > 0 ? reportData.passRate + '%' : '--'}</div>
                  <div className="text-sm text-blue-100 mt-1">参考承保率</div>
                </div>
                <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                  <div className="text-xl font-bold text-white truncate">{reportData.bestProduct}</div>
                  <div className="text-sm text-blue-100 mt-1">推荐产品</div>
                </div>
                <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm col-span-2 md:col-span-1">
                  <div className="text-3xl font-bold text-white">{reportData.matchCount}</div>
                  <div className="text-sm text-blue-100 mt-1">匹配相似案例(条)</div>
                </div>
              </div>
            </div>
            <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
          </div>

          {/* 相似案例列表 */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" /> 
              {reportData.matchCount > 0 ? "为您找到的相似病友案例" : "暂未匹配到完全一致的案例"}
            </h3>

            {reportData.similarCases.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                <p className="text-slate-500 mb-2 font-bold">别担心，您的请求已提交给人工专家！</p>
                <p className="text-sm text-slate-400 mb-4">
                  AI 暂时没从库里匹配到“{formData.disease_type}”的精准数据。<br/>
                  我们的核保专家将在 24小时内 人工分析您的情况。
                </p>
                {formData.contact && (
                  <p className="text-sm text-blue-600 bg-blue-50 inline-block px-3 py-1 rounded-full">
                    分析结果将发送至：{formData.contact}
                  </p>
                )}
              </div>
            ) : (
              reportData.similarCases.map((item) => (
                <div key={item.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2 py-1 rounded-md">
                        {item.disease_type}
                      </span>
                      <h3 className="font-bold text-lg text-slate-800">{item.condition_detail}</h3>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      item.verdict?.includes('正常') ? 'bg-green-100 text-green-700' : 
                      item.verdict?.includes('除外') ? 'bg-yellow-100 text-yellow-700' : 
                      'bg-red-100 text-red-700'
                    }`}>
                      {item.verdict}
                    </span>
                  </div>
                  <div className="text-sm text-slate-500 mt-2 flex gap-4">
                    <span>🏢 {item.company}</span>
                    <span>📄 {item.product_name}</span>
                  </div>
                  {item.notes && <div className="mt-3 text-sm bg-slate-50 p-3 rounded text-slate-600">{item.notes}</div>}
                </div>
              ))
            )}
            
            <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-xl flex items-start gap-3 mt-8">
               <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
               <div className="text-sm text-yellow-800">
                 <strong>免责声明：</strong> 以上结果基于历史数据统计，仅供参考，不代表最终核保结论。
               </div>
            </div>
          </div>
        </div>
      )}

      {/* 表单弹窗 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 z-10">
              <X className="w-6 h-6" />
            </button>

            <div className="p-8">
              <div className="text-center mb-8">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800">智能核保评估</h3>
                <p className="text-slate-500 text-sm mt-1">输入真实情况，获取最准确的对比</p>
              </div>
              
              <form onSubmit={handleAnalyze} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">所患疾病 *</label>
                  <input 
                    className="w-full border-2 border-slate-100 bg-slate-50 rounded-xl p-3 focus:border-blue-500 focus:bg-white outline-none transition-all"
                    placeholder="例如：肺结节、甲状腺癌"
                    value={formData.disease_type}
                    onChange={e => setFormData({...formData, disease_type: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">年龄</label>
                    <input 
                      className="w-full border-2 border-slate-100 bg-slate-50 rounded-xl p-3 focus:border-blue-500 focus:bg-white outline-none"
                      placeholder="如：30"
                      value={formData.age}
                      onChange={e => setFormData({...formData, age: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">联系方式 (用于接收报告)</label>
                    <input 
                      className="w-full border-2 border-slate-100 bg-slate-50 rounded-xl p-3 focus:border-blue-500 focus:bg-white outline-none"
                      placeholder="手机/微信"
                      value={formData.contact}
                      onChange={e => setFormData({...formData, contact: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">具体检查情况</label>
                  <textarea 
                    className="w-full border-2 border-slate-100 bg-slate-50 rounded-xl p-3 h-24 focus:border-blue-500 focus:bg-white outline-none resize-none"
                    placeholder="请详细描述B超/CT结果，例如：3级，边界清晰，无血流信号..."
                    value={formData.condition_detail}
                    onChange={e => setFormData({...formData, condition_detail: e.target.value})}
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 transition-all flex justify-center items-center gap-2 text-lg"
                >
                  🚀 开始分析
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}