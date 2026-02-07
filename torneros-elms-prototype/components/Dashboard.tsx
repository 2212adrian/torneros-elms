
import React from 'react';
import { Student, Grade, AccessToken, ViewState } from '../types';
import { 
  Users, 
  BookOpen, 
  Key, 
  TrendingUp, 
  Plus, 
  ArrowRight,
  UserPlus,
  FileSpreadsheet,
  Zap
} from 'lucide-react';

interface DashboardProps {
  students: Student[];
  grades: Grade[];
  tokens: AccessToken[];
  setView: (view: ViewState) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ students, grades, tokens, setView }) => {
  const stats = [
    { label: 'Total Students', value: students.length, icon: Users, color: 'blue' },
    { label: 'Courses/Subjects', value: new Set(grades.map(g => g.subjectName)).size, icon: BookOpen, color: 'indigo' },
    { label: 'Active Tokens', value: tokens.length, icon: Key, color: 'purple' },
    { label: 'Overall Average', value: grades.length > 0 ? (grades.reduce((acc, g) => acc + g.average, 0) / grades.length).toFixed(1) : 'N/A', icon: TrendingUp, color: 'emerald' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">Welcome back, Professor</h1>
        <p className="text-slate-500 mt-1">Here's what's happening in your system today.</p>
      </header>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="glass-card p-6 rounded-3xl shadow-sm border border-slate-200">
            <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-50 flex items-center justify-center mb-4`}>
              <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
            </div>
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-8 rounded-3xl border border-slate-200">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button 
                onClick={() => setView('masterlist')}
                className="group p-6 bg-white border border-slate-200 hover:border-blue-500 rounded-2xl transition-all hover:shadow-lg flex flex-col items-start gap-4"
              >
                <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-600 transition-colors">
                  <UserPlus className="w-6 h-6 text-blue-600 group-hover:text-white" />
                </div>
                <div className="text-left">
                  <span className="block font-bold text-slate-900">Import Masterlist</span>
                  <span className="text-sm text-slate-500">Add students from Excel/CSV</span>
                </div>
              </button>

              <button 
                onClick={() => setView('grading')}
                className="group p-6 bg-white border border-slate-200 hover:border-indigo-500 rounded-2xl transition-all hover:shadow-lg flex flex-col items-start gap-4"
              >
                <div className="p-3 bg-indigo-50 rounded-xl group-hover:bg-indigo-600 transition-colors">
                  <FileSpreadsheet className="w-6 h-6 text-indigo-600 group-hover:text-white" />
                </div>
                <div className="text-left">
                  <span className="block font-bold text-slate-900">Record Grades</span>
                  <span className="text-sm text-slate-500">Upload subject grading sheets</span>
                </div>
              </button>

              <button 
                onClick={() => setView('tokens')}
                className="group p-6 bg-white border border-slate-200 hover:border-purple-500 rounded-2xl transition-all hover:shadow-lg flex flex-col items-start gap-4"
              >
                <div className="p-3 bg-purple-50 rounded-xl group-hover:bg-purple-600 transition-colors">
                  <Key className="w-6 h-6 text-purple-600 group-hover:text-white" />
                </div>
                <div className="text-left">
                  <span className="block font-bold text-slate-900">Generate Access</span>
                  <span className="text-sm text-slate-500">Create viewer tokens</span>
                </div>
              </button>

              <button 
                onClick={() => setView('analytics')}
                className="group p-6 bg-white border border-slate-200 hover:border-emerald-500 rounded-2xl transition-all hover:shadow-lg flex flex-col items-start gap-4"
              >
                <div className="p-3 bg-emerald-50 rounded-xl group-hover:bg-emerald-600 transition-colors">
                  <TrendingUp className="w-6 h-6 text-emerald-600 group-hover:text-white" />
                </div>
                <div className="text-left">
                  <span className="block font-bold text-slate-900">View Insights</span>
                  <span className="text-sm text-slate-500">Analyze class performance</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Recent Tokens */}
        <div className="glass-card p-8 rounded-3xl border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-900">Recent Tokens</h3>
            <button onClick={() => setView('tokens')} className="text-blue-600 hover:text-blue-700 text-sm font-bold flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-4">
            {tokens.length > 0 ? tokens.slice(0, 5).map((token) => (
              <div key={token.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <code className="text-sm font-mono font-bold text-slate-900">{token.token}</code>
                  <p className="text-xs text-slate-400 mt-1">{token.description}</p>
                </div>
                <div className="px-2 py-1 rounded-md text-[10px] font-bold uppercase bg-blue-50 text-blue-600">
                  Active
                </div>
              </div>
            )) : (
              <div className="text-center py-10">
                <p className="text-slate-400 text-sm">No tokens generated yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
