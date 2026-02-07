
import React, { useState } from 'react';
import { Student, Gender, Semester, Grade, AccessToken } from '../types';
import { 
  Users, 
  Upload, 
  Search, 
  Trash2, 
  Filter, 
  Edit2,
  X,
  Save,
  UserPlus,
  ChevronDown,
  ChevronUp,
  Award,
  BookOpen,
  Fingerprint,
  CheckCircle2,
  Lock
} from 'lucide-react';

interface MasterlistManagerProps {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  grades: Grade[];
  tokens: AccessToken[];
}

const MasterlistManager: React.FC<MasterlistManagerProps> = ({ students, setStudents, grades, tokens }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importData, setImportData] = useState<string>('');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [expandedStudentIds, setExpandedStudentIds] = useState<Set<string>>(new Set());

  const handleImport = () => {
    try {
      const rows = importData.trim().split('\n');
      const newStudents: Student[] = rows.map(row => {
        const parts = row.split('\t');
        const [idCode, name, contact, email, gender, dob, age, year, section, sem, sy] = parts;
        return {
          uuid: crypto.randomUUID(),
          idCode: idCode || Math.floor(100000 + Math.random() * 900000).toString(),
          fullName: name,
          contactNumber: contact,
          email: email,
          gender: (gender as Gender) || Gender.MALE,
          birthdate: dob,
          age: parseInt(age) || 0,
          yearLevel: year,
          section: section,
          semester: (sem as Semester) || Semester.FIRST,
          schoolYear: sy
        };
      }).filter(s => s.fullName);

      setStudents(prev => [...prev, ...newStudents]);
      setIsImporting(false);
      setImportData('');
    } catch (e) {
      alert('Failed to parse import data. Please check formatting (Tab separated).');
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setStudents(prev => prev.map(s => s.idCode === editingStudent.idCode ? editingStudent : s));
    setEditingStudent(null);
  };

  const toggleExpand = (idCode: string) => {
    const newExpanded = new Set(expandedStudentIds);
    if (newExpanded.has(idCode)) {
      newExpanded.delete(idCode);
    } else {
      newExpanded.add(idCode);
    }
    setExpandedStudentIds(newExpanded);
  };

  const deleteStudent = (idCode: string) => {
    if (confirm('Are you sure you want to delete this student?')) {
      setStudents(prev => prev.filter(s => s.idCode !== idCode));
    }
  };

  const filteredStudents = students.filter(s => 
    s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.section.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.idCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getGradesForStudent = (idCode: string) => {
    return grades.filter(g => g.studentIdCode === idCode);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Student Masterlist</h2>
          <p className="text-slate-500">Comprehensive student data and record management.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsImporting(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
          >
            <Upload className="w-4 h-4" /> Import Excel
          </button>
          <button 
            onClick={() => setStudents([])}
            className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-all"
          >
            <Trash2 className="w-4 h-4" /> Clear All
          </button>
        </div>
      </div>

      {/* Import Modal */}
      {isImporting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-fade-in">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Import Masterlist</h3>
              <button onClick={() => setIsImporting(false)} className="text-slate-400 hover:text-slate-600 p-2"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-8 text-slate-900">
              <p className="text-sm text-slate-500 mb-4 font-medium">
                Paste your Excel data here (Tab separated). Required columns: <br/>
                <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-600 text-xs">ID Code (6 chars), Name, Contact, Email, Gender, Birthdate, Age, Year, Section, Sem, SY</code>
              </p>
              <textarea
                className="w-full h-64 p-4 rounded-2xl border border-slate-200 font-mono text-sm focus:ring-4 focus:ring-blue-100 outline-none"
                placeholder="Paste data from Excel..."
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
              />
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setIsImporting(false)} className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-all">Cancel</button>
                <button 
                  onClick={handleImport}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
                >
                  Process Import
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-fade-in flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-xl font-bold text-slate-900">Edit Student Record</h3>
              <button onClick={() => setEditingStudent(null)} className="text-slate-400 hover:text-slate-600 p-2"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-8 space-y-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">ID Code (Read-only)</label>
                  <input type="text" value={editingStudent.idCode} disabled className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 text-slate-400 font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                  <input 
                    type="text" 
                    value={editingStudent.fullName}
                    onChange={(e) => setEditingStudent({...editingStudent, fullName: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-100 outline-none text-slate-900 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                  <input 
                    type="email" 
                    value={editingStudent.email}
                    onChange={(e) => setEditingStudent({...editingStudent, email: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-100 outline-none text-slate-900 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Section</label>
                  <input 
                    type="text" 
                    value={editingStudent.section}
                    onChange={(e) => setEditingStudent({...editingStudent, section: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-100 outline-none text-slate-900 font-bold"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 bg-white sticky bottom-0">
                <button type="button" onClick={() => setEditingStudent(null)} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-all">Cancel</button>
                <button 
                  type="submit"
                  className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center gap-2"
                >
                  <Save className="w-4 h-4" /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by ID Code, Name or Section..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-50 outline-none transition-all text-slate-900 font-medium"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID & Student Name</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:table-cell">Key Status</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Year / Section</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((student) => {
                const isExpanded = expandedStudentIds.has(student.idCode);
                const studentGrades = getGradesForStudent(student.idCode);
                const hasToken = tokens.some(t => t.studentIdCode === student.idCode);
                const overallAvg = studentGrades.length > 0 
                  ? (studentGrades.reduce((acc, g) => acc + g.average, 0) / studentGrades.length).toFixed(2)
                  : 'N/A';

                return (
                  <React.Fragment key={student.idCode}>
                    <tr className={`transition-colors group ${isExpanded ? 'bg-blue-50/30' : 'hover:bg-slate-50/80'}`}>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => toggleExpand(student.idCode)}
                            className={`p-1 rounded-md transition-colors ${isExpanded ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400 hover:text-slate-600'}`}
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-blue-600 font-bold text-sm shadow-sm">
                            {student.fullName.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                               <span className="text-[10px] font-black bg-slate-900 text-white px-2 py-0.5 rounded-md flex items-center gap-1">
                                 <Fingerprint className="w-2 h-2" /> {student.idCode}
                               </span>
                               <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${parseFloat(overallAvg) >= 75 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                Avg: {overallAvg}
                              </span>
                            </div>
                            <div className="font-bold text-slate-900 leading-tight mt-1">{student.fullName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 hidden sm:table-cell">
                        {hasToken ? (
                           <div className="flex items-center gap-1.5 text-emerald-600 font-black text-[10px] uppercase">
                             <CheckCircle2 className="w-4 h-4" /> Published
                           </div>
                        ) : (
                           <div className="flex items-center gap-1.5 text-slate-300 font-bold text-[10px] uppercase">
                             <Lock className="w-3.5 h-3.5" /> Private
                           </div>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <div className="px-2 py-1 inline-flex rounded-lg bg-white border border-slate-200 text-slate-700 text-[10px] font-bold shadow-sm">
                          {student.section}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1.5 font-bold uppercase tracking-widest">{student.yearLevel}</div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setEditingStudent(student)}
                            className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-100"
                            title="Edit Student"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => deleteStudent(student.idCode)}
                            className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-100"
                            title="Delete Student"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Expanded Grades Area */}
                    {isExpanded && (
                      <tr className="bg-blue-50/20 border-x-4 border-blue-500/10">
                        <td colSpan={5} className="p-0">
                          <div className="px-10 py-8 animate-fade-in overflow-hidden">
                            <div className="flex items-center justify-between mb-6">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100">
                                  <Award className="w-5 h-5" />
                                </div>
                                <h4 className="text-lg font-bold text-slate-900">Academic Progress Record</h4>
                              </div>
                            </div>
                            
                            <div className="bg-white rounded-[2rem] border border-blue-50 shadow-xl overflow-hidden">
                              <table className="w-full text-left text-sm">
                                <thead>
                                  <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="px-6 py-4 font-bold text-slate-600"><BookOpen className="w-4 h-4 inline mr-2" /> Subject</th>
                                    <th className="px-4 py-4 font-bold text-slate-600 text-center">P</th>
                                    <th className="px-4 py-4 font-bold text-slate-600 text-center">M</th>
                                    <th className="px-4 py-4 font-bold text-slate-600 text-center">PF</th>
                                    <th className="px-4 py-4 font-bold text-slate-600 text-center">F</th>
                                    <th className="px-6 py-4 font-bold text-slate-600 text-center">Average</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                  {studentGrades.map((g, gIdx) => (
                                    <tr key={gIdx} className="hover:bg-slate-50/50 transition-colors">
                                      <td className="px-6 py-4 font-bold text-slate-800">{g.subjectName}</td>
                                      <td className="px-4 py-4 text-center text-slate-500">{g.prelim}</td>
                                      <td className="px-4 py-4 text-center text-slate-500">{g.midterm}</td>
                                      <td className="px-4 py-4 text-center text-slate-500">{g.prefinal}</td>
                                      <td className="px-4 py-4 text-center text-slate-500">{g.finals}</td>
                                      <td className="px-6 py-4 text-center font-bold text-blue-600 bg-slate-50/30">
                                        {g.average}
                                      </td>
                                    </tr>
                                  ))}
                                  {studentGrades.length === 0 && (
                                    <tr>
                                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-bold">No academic data available.</td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MasterlistManager;
