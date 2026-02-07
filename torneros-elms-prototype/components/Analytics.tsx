
import React, { useMemo, useState } from 'react';
import { Student, Grade } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Brain, Sparkles, TrendingUp, Users, Target } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

interface AnalyticsProps {
  students: Student[];
  grades: Grade[];
}

const Analytics: React.FC<AnalyticsProps> = ({ students, grades }) => {
  const [aiInsight, setAiInsight] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);

  const stats = useMemo(() => {
    const subjects = Array.from(new Set(grades.map(g => g.subjectName)));
    const subjectData = subjects.map(sub => {
      const subGrades = grades.filter(g => g.subjectName === sub);
      const avg = subGrades.reduce((acc, g) => acc + g.average, 0) / subGrades.length;
      return { name: sub, average: parseFloat(avg.toFixed(1)) };
    });

    const passCount = grades.filter(g => g.average >= 75).length;
    const failCount = grades.length - passCount;

    return {
      subjectData,
      passFail: [
        { name: 'Passing', value: passCount },
        { name: 'Failing', value: failCount }
      ]
    };
  }, [grades]);

  const generateAIInsight = async () => {
    if (grades.length === 0) return;
    setLoadingAi(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Analyze this class performance data:
      Total Grades Recorded: ${grades.length}
      Subject Averages: ${JSON.stringify(stats.subjectData)}
      Pass Rate: ${(stats.passFail[0].value / grades.length * 100).toFixed(1)}%
      
      Provide a brief (2-3 sentences) professional pedagogical insight and recommendation for the teacher.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      setAiInsight(response.text || 'Analysis complete.');
    } catch (e) {
      setAiInsight('Error generating AI insights. Check your connection.');
    } finally {
      setLoadingAi(false);
    }
  };

  const COLORS = ['#10b981', '#ef4444'];

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Performance Analytics</h2>
          <p className="text-slate-500">Deep insights into student progress and grading trends.</p>
        </div>
        <button 
          onClick={generateAIInsight}
          disabled={loadingAi || grades.length === 0}
          className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 hover:shadow-xl transition-all disabled:opacity-50"
        >
          {loadingAi ? <Sparkles className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
          {loadingAi ? 'Thinking...' : 'Generate AI Insights'}
        </button>
      </header>

      {aiInsight && (
        <div className="p-6 bg-blue-50 border border-blue-100 rounded-3xl animate-fade-in relative overflow-hidden">
          <Sparkles className="absolute top-4 right-4 text-blue-200 w-12 h-12" />
          <h3 className="text-blue-900 font-bold flex items-center gap-2 mb-2">
            <Brain className="w-5 h-5" />
            Professor AI Recommendation
          </h3>
          <p className="text-blue-800 text-sm leading-relaxed relative z-10">{aiInsight}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card p-8 rounded-3xl border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-500" />
            Subject Comparison (Avg)
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.subjectData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="average" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-8 rounded-3xl border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-500" />
            Overall Pass Rate
          </h3>
          <div className="h-80 w-full flex items-center justify-center">
            {grades.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.passFail}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.passFail.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-400">No data to display.</p>
            )}
          </div>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-xs font-bold text-slate-600">Passing</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-xs font-bold text-slate-600">Failing</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
