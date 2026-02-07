
import React, { useMemo, useState } from 'react';
import { Student, Grade, AccessToken, Semester } from '../types';
import { 
  GraduationCap, 
  LogOut, 
  FileText, 
  Fingerprint, 
  Award, 
  Info, 
  Mail, 
  Phone, 
  Calendar,
  ChevronDown,
  ChevronRight,
  BookOpen,
  CalendarDays,
  CheckCircle,
  Hash
} from 'lucide-react';

interface StudentPortalProps {
  studentToken: string;
  students: Student[];
  grades: Grade[];
  tokens: AccessToken[];
  onExit: () => void;
}

const StudentPortal: React.FC<StudentPortalProps> = ({ studentToken, students, grades, tokens, onExit }) => {
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set(['3rd Year']));

  const activeToken = useMemo(() => tokens.find(t => t.token === studentToken), [tokens, studentToken]);

  const student = useMemo(() => {
    if (!activeToken) return null;
    return students.find(s => s.idCode === activeToken.studentIdCode);
  }, [students, activeToken]);

  const studentGrades = useMemo(() => {
    if (!student) return [];
    return grades.filter(g => g.studentIdCode === student.idCode);
  }, [grades, student]);

  // Comprehensive Categorization Logic for all 4 Years
  const categorizedGrades = useMemo(() => {
    const years = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
    const sems = [Semester.FIRST, Semester.SECOND];
    
    const result: Record<string, Record<string, Grade[]>> = {};
    
    years.forEach(year => {
      result[year] = {};
      sems.forEach(sem => {
        result[year][sem] = studentGrades.filter(g => g.yearLevel === year && g.semester === sem);
      });
    });
    
    return result;
  }, [studentGrades]);

  if (!student) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full glass-card p-10 rounded-[3rem] border border-red-100 shadow-2xl animate-fade-in">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Info className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Access Error</h2>
          <p className="text-slate-500 mt-4 font-medium leading-relaxed">
            This private key is no longer active. It may have been rerolled or expired. Please use the newest token issued to you.
          </p>
          <button onClick={onExit} className="mt-8 w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs">Return to Login</button>
        </div>
      </div>
    );
  }

  const toggleYear = (year: string) => {
    const next = new Set(expandedYears);
    if (next.has(year)) next.delete(year);
    else next.add(year);
    setExpandedYears(next);
  };

  const overallAvg = studentGrades.length > 0 
    ? (studentGrades.reduce((acc, g) => acc + g.average, 0) / studentGrades.length).toFixed(2)
    : 'N/A';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-20">
      <header className="bg-white border-b border-slate-200 px-6 py-5 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-100">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="font-black text-slate-900 leading-none text-lg">Torneros ELMS</h1>
            <p className="text-[9px] text-slate-400 uppercase tracking-[0.2em] font-black mt-1.5">Private Student Portal</p>
          </div>
        </div>
        <button onClick={onExit} className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-all active:scale-95">
          <LogOut className="w-6 h-6" />
        </button>
      </header>

      <main className="flex-1 p-5 max-w-5xl mx-auto w-full space-y-8 animate-fade-in mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            {/* Identity Card with Token Profile Picture */}
            <div className="glass-card p-8 rounded-[3.5rem] border border-blue-100 bg-white shadow-xl shadow-blue-900/5 text-center overflow-hidden relative">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-50 rounded-full blur-3xl opacity-50" />
              
              <div className="relative z-10">
                {/* Profile Picture replaced by Token Visualization */}
                <div className="w-36 h-36 bg-slate-900 rounded-[2.5rem] flex flex-col items-center justify-center text-white p-6 mx-auto mb-6 shadow-2xl ring-8 ring-slate-50 group">
                   <div className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-10 transition-opacity rounded-[2.5rem]" />
                   <Fingerprint className="w-10 h-10 mb-3 text-blue-500" />
                   <div className="w-full">
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Active Token</p>
                      <span className="text-[11px] font-mono font-black break-all uppercase tracking-tight leading-none text-slate-300">
                        {studentToken}
                      </span>
                   </div>
                </div>
                
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{student.fullName}</h2>
                <div className="flex items-center justify-center gap-2 mt-3">
                  <div className="bg-blue-600 text-white px-3 py-1.5 rounded-xl shadow-lg shadow-blue-100 flex items-center gap-1.5">
                    <Hash className="w-3 h-3" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{student.idCode}</span>
                  </div>
                  <div className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-xl border border-emerald-100 flex items-center gap-1.5">
                    <CheckCircle className="w-3 h-3" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Verified</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-10">
                 <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Section</p>
                    <p className="text-sm font-black text-slate-800">{student.section}</p>
                 </div>
                 <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Status</p>
                    <p className="text-sm font-black text-slate-800 uppercase text-[10px]">{student.yearLevel}</p>
                 </div>
              </div>
            </div>

            <div className="glass-card p-8 rounded-[3rem] border border-slate-100 bg-white shadow-lg space-y-5">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
                 <Info className="w-3 h-3" /> Student Profile
               </h4>
               <div className="flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="text-sm font-bold text-slate-700 truncate">{student.email}</div>
               </div>
               <div className="flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div className="text-sm font-bold text-slate-700">{student.contactNumber}</div>
               </div>
               <div className="flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div className="text-sm font-bold text-slate-700">{student.birthdate} ({student.age} yrs)</div>
               </div>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-8">
            {/* GWA Feature */}
            <div className="relative group overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-indigo-800 rounded-[3.5rem] transition-transform group-hover:scale-[1.01]" />
               <div className="relative p-10 flex flex-col md:flex-row items-center justify-between gap-8 text-white">
                  <div className="flex items-center gap-8">
                     <div className="w-24 h-24 bg-white/20 rounded-[2.5rem] backdrop-blur-xl flex items-center justify-center text-white shadow-inner ring-1 ring-white/30">
                        <Award className="w-12 h-12" />
                     </div>
                     <div>
                        <h3 className="text-5xl font-black tracking-tighter leading-none">{overallAvg}</h3>
                        <p className="text-[10px] font-black text-blue-200 uppercase tracking-[0.4em] mt-4">Current GWA Index</p>
                     </div>
                  </div>
                  <div className="text-center md:text-right">
                     <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em] mb-2">School Year</p>
                     <p className="text-2xl font-black">{student.schoolYear}</p>
                  </div>
               </div>
            </div>

            {/* Comprehensive Grade History by Year/Semester */}
            <div className="space-y-6">
               <div className="flex items-center justify-between px-6">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em]">Comprehensive Records</h3>
               </div>

               <div className="space-y-4">
                  {Object.entries(categorizedGrades).map(([year, semesters]) => {
                    const hasAnyGrades = Object.values(semesters).some(s => s.length > 0);
                    const isExpanded = expandedYears.has(year);

                    return (
                      <div key={year} className={`bg-white rounded-[2.5rem] border transition-all ${isExpanded ? 'border-blue-400 shadow-xl' : 'border-slate-100 shadow-sm'} ${!hasAnyGrades ? 'opacity-50' : ''}`}>
                        <button 
                          onClick={() => toggleYear(year)}
                          className="w-full px-8 py-6 flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl transition-all ${isExpanded ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}>
                              <BookOpen className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                               <h4 className="text-xl font-black text-slate-900 tracking-tight">{year}</h4>
                               <p className="text-[10px] font-bold text-slate-400 uppercase">{hasAnyGrades ? 'Data Available' : 'No Records'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                             {!hasAnyGrades && <span className="text-[8px] font-black text-slate-300 uppercase bg-slate-50 px-2 py-1 rounded-lg">Coming Soon</span>}
                             {isExpanded ? <ChevronDown className="w-6 h-6 text-blue-600" /> : <ChevronRight className="w-6 h-6 text-slate-300" />}
                          </div>
                        </button>

                        {isExpanded && hasAnyGrades && (
                          <div className="px-8 pb-8 animate-fade-in space-y-10">
                             {Object.entries(semesters).map(([sem, semGrades]) => {
                               if (semGrades.length === 0) return null;
                               return (
                                 <div key={sem} className="space-y-6">
                                    <div className="flex items-center gap-4">
                                       <span className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] bg-slate-100 px-4 py-1.5 rounded-full">{sem}</span>
                                       <div className="h-px flex-1 bg-slate-100" />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                       {semGrades.map((grade, gIdx) => (
                                         <div key={gIdx} className="bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100 hover:border-blue-200 hover:bg-white transition-all group/card shadow-sm hover:shadow-lg">
                                            <div className="flex items-center justify-between mb-6">
                                               <div className="flex items-center gap-4">
                                                  <div className="p-3 bg-white text-blue-600 rounded-2xl shadow-sm border border-slate-100 group-hover/card:bg-blue-600 group-hover/card:text-white transition-all">
                                                     <FileText className="w-6 h-6" />
                                                  </div>
                                                  <div className="min-w-0">
                                                     <p className="font-black text-slate-900 text-base truncate leading-tight">{grade.subjectName}</p>
                                                     <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-widest">{grade.schoolYear}</p>
                                                  </div>
                                               </div>
                                               <div className={`text-2xl font-black ${grade.average >= 75 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                  {grade.average}
                                               </div>
                                            </div>

                                            <div className="grid grid-cols-4 gap-2">
                                              {[
                                                { l: 'P', v: grade.prelim },
                                                { l: 'M', v: grade.midterm },
                                                { l: 'PF', v: grade.prefinal },
                                                { l: 'F', v: grade.finals }
                                              ].map(comp => (
                                                <div key={comp.l} className="bg-white p-3 rounded-2xl text-center border border-slate-50 shadow-sm group-hover/card:border-blue-50">
                                                   <p className="text-[8px] font-black text-slate-400 uppercase mb-1">{comp.l}</p>
                                                   <p className="text-xs font-black text-slate-800">{comp.v}</p>
                                                </div>
                                              ))}
                                            </div>
                                         </div>
                                       ))}
                                    </div>
                                 </div>
                               );
                             })}
                             {Object.values(semesters).every(s => s.length === 0) && (
                               <div className="py-10 text-center text-slate-300 font-bold uppercase tracking-widest text-sm">
                                  Empty Transcript for this Year
                               </div>
                             )}
                          </div>
                        )}
                      </div>
                    );
                  })}
               </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="p-10 text-center opacity-30 mt-auto">
        <p className="text-[10px] text-slate-900 font-black uppercase tracking-[0.5em]">&copy; 2025 TORNEROS ELMS SECURE NODE</p>
      </footer>
    </div>
  );
};

export default StudentPortal;
