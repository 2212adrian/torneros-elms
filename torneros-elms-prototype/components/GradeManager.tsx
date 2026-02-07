
import React, { useState } from 'react';
import { Grade, Student, Semester } from '../types';
import { 
  FileSpreadsheet, 
  Upload, 
  Search, 
  Trash2,
  Save,
  Fingerprint,
  Edit2,
  X
} from 'lucide-react';

interface GradeManagerProps {
  grades: Grade[];
  setGrades: React.Dispatch<React.SetStateAction<Grade[]>>;
  students: Student[];
}

const GradeManager: React.FC<GradeManagerProps> = ({ grades, setGrades, students }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importData, setImportData] = useState<string>('');
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);

  const handleImport = () => {
    try {
      const rows = importData.trim().split('\n');
      const newGrades: Grade[] = rows.map(row => {
        const [studentIdCode, subject, prelim, midterm, prefinal, finals, sem, yearLvl, sy] = row.split('\t');
        const p = parseFloat(prelim) || 0;
        const m = parseFloat(midterm) || 0;
        const pf = parseFloat(prefinal) || 0;
        const f = parseFloat(finals) || 0;
        const avg = (p + m + pf + f) / 4;

        return {
          id: crypto.randomUUID(),
          studentIdCode,
          subjectName: subject,
          prelim: p,
          midterm: m,
          prefinal: pf,
          finals: f,
          average: parseFloat(avg.toFixed(2)),
          semester: (sem as Semester) || Semester.FIRST,
          yearLevel: yearLvl || '1st Year',
          schoolYear: sy || '2025-2026'
        };
      }).filter(g => g.studentIdCode);

      setGrades(prev => [...prev, ...newGrades]);
      setIsImporting(false);
      setImportData('');
    } catch (e) {
      alert('Failed to parse grades. Please check formatting.');
    }
  };

  const updateGrade = (grade: Grade) => {
    const avg = (grade.prelim + grade.midterm + grade.prefinal + grade.finals) / 4;
    const updated = { ...grade, average: parseFloat(avg.toFixed(2)) };
    setGrades(prev => prev.map(g => g.id === updated.id ? updated : g));
    setEditingGrade(null);
  };

  const getStudentName = (idCode: string) => {
    return students.find(s => s.idCode === idCode)?.fullName || 'Unregistered ID';
  };

  const filteredGrades = grades.filter(g => 
    g.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    g.studentIdCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getStudentName(g.studentIdCode).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Grading Records</h2>
          <p className="text-slate-500">Manage and edit academic scores linked by ID Code.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsImporting(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg">
            <Upload className="w-4 h-4" /> Import Excel
          </button>
          <button onClick={() => setGrades([])} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-all">
            <Trash2 className="w-4 h-4" /> Reset
          </button>
        </div>
      </div>

      {isImporting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-fade-in">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Import Grades</h3>
              <button onClick={() => setIsImporting(false)} className="text-slate-400 p-2 hover:text-slate-600"><X /></button>
            </div>
            <div className="p-8">
              <p className="text-xs text-slate-500 mb-4 font-bold uppercase tracking-widest">
                Columns (Tab Separated): ID, Subject, P, M, PF, F, Sem, Year, SchoolYear
              </p>
              <textarea
                className="w-full h-64 p-4 rounded-2xl border border-slate-200 font-mono text-sm focus:ring-4 outline-none text-slate-900"
                placeholder="Paste tab-separated data..."
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
              />
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setIsImporting(false)} className="px-6 py-2.5 rounded-xl font-bold text-slate-500">Cancel</button>
                <button onClick={handleImport} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold">Process</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingGrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-fade-in p-10">
             <h3 className="text-xl font-black mb-6 text-slate-900">Edit {editingGrade.subjectName}</h3>
             <div className="space-y-4">
               {['prelim', 'midterm', 'prefinal', 'finals'].map(comp => (
                 <div key={comp}>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{comp}</label>
                   <input 
                    type="number" 
                    value={editingGrade[comp as keyof Grade] as number}
                    onChange={(e) => setEditingGrade({...editingGrade, [comp]: parseFloat(e.target.value) || 0})}
                    className="w-full p-3.5 rounded-xl border border-slate-200 font-bold text-slate-900 focus:ring-4 focus:ring-blue-100 outline-none"
                   />
                 </div>
               ))}
               <div className="pt-6 flex justify-end gap-3">
                 <button onClick={() => setEditingGrade(null)} className="px-5 py-2 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all">Cancel</button>
                 <button onClick={() => updateGrade(editingGrade)} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-lg shadow-indigo-100 transition-all active:scale-95 flex items-center gap-2">
                   <Save className="w-4 h-4" /> Save Record
                 </button>
               </div>
             </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-4">
           <Search className="w-5 h-5 text-slate-400" />
           <input 
            type="text" 
            placeholder="Search by ID, Name or Subject..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 p-1 bg-transparent outline-none font-medium text-slate-900"
           />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student / ID</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Subject & Year</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">P</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">M</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">PF</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">F</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Avg</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredGrades.map((g) => (
                <tr key={g.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900 leading-tight">{getStudentName(g.studentIdCode)}</div>
                    <div className="text-[10px] font-mono font-black text-slate-400 uppercase flex items-center gap-1 mt-1">
                      <Fingerprint className="w-3 h-3" /> {g.studentIdCode}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-slate-700">{g.subjectName}</div>
                    <div className="text-[9px] font-black text-slate-400 uppercase mt-0.5">{g.yearLevel} • {g.semester}</div>
                  </td>
                  <td className="px-4 py-4 text-center text-slate-500 font-medium">{g.prelim}</td>
                  <td className="px-4 py-4 text-center text-slate-500 font-medium">{g.midterm}</td>
                  <td className="px-4 py-4 text-center text-slate-500 font-medium">{g.prefinal}</td>
                  <td className="px-4 py-4 text-center text-slate-500 font-medium">{g.finals}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded-lg text-xs font-black ${g.average >= 75 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                      {g.average}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => setEditingGrade(g)} className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-100">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredGrades.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-20 text-center text-slate-300 font-bold uppercase tracking-widest">No matching records.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GradeManager;
