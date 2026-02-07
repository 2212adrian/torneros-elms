
import React, { useState, useMemo } from 'react';
import { AccessToken, Student } from '../types';
import { 
  Key, 
  Trash2, 
  Copy, 
  CheckCircle2,
  Users,
  Fingerprint,
  Mail, 
  Zap,
  RefreshCw,
  QrCode,
  X,
  CheckSquare,
  Square,
  Search
} from 'lucide-react';

interface TokenManagerProps {
  tokens: AccessToken[];
  setTokens: React.Dispatch<React.SetStateAction<AccessToken[]>>;
  students: Student[];
}

const TokenManager: React.FC<TokenManagerProps> = ({ tokens, setTokens, students }) => {
  const [selectedSection, setSelectedSection] = useState<string>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewingQr, setViewingQr] = useState<AccessToken | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const sections = useMemo(() => Array.from(new Set(students.map(s => s.section))), [students]);

  // Students in the section who DON'T have a token yet
  const availableStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSection = selectedSection === 'All' || s.section === selectedSection;
      const matchesSearch = s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || s.idCode.includes(searchQuery);
      const noToken = !tokens.some(t => t.studentIdCode === s.idCode);
      return matchesSection && matchesSearch && noToken;
    });
  }, [students, selectedSection, tokens, searchQuery]);

  const generateTokenString = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let token = '';
    // Generate 16 characters in groups of 4: XXXX-XXXX-XXXX-XXXX
    for (let i = 0; i < 16; i++) {
      if (i > 0 && i % 4 === 0) token += '-';
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  };

  const publishTokensForSelected = () => {
    if (selectedStudentIds.size === 0) return;

    const now = new Date();
    // Fix: Explicitly type idCode as string to resolve 'unknown' to 'string' assignment error
    const newTokens: AccessToken[] = Array.from(selectedStudentIds).map((idCode: string) => {
      const s = students.find(std => std.idCode === idCode);
      return {
        id: crypto.randomUUID(),
        token: generateTokenString(),
        studentIdCode: idCode,
        description: `${s?.section} - Student Key`,
        createdAt: now.toISOString()
      };
    });

    setTokens(prev => [...newTokens, ...prev]);
    setSelectedStudentIds(new Set());
    alert(`Successfully published ${newTokens.length} student tokens.`);
  };

  const publishTokensForAllInList = () => {
    if (availableStudents.length === 0) return;
    
    const now = new Date();
    const newTokens: AccessToken[] = availableStudents.map(s => ({
      id: crypto.randomUUID(),
      token: generateTokenString(),
      studentIdCode: s.idCode,
      description: `${s.section} - Student Key`,
      createdAt: now.toISOString()
    }));

    setTokens(prev => [...newTokens, ...prev]);
    alert(`Successfully published ${newTokens.length} tokens for all students in the current view.`);
  };

  const rerollToken = (tokenId: string) => {
    if (confirm('Rerolling will invalidate the current token and issue a new one for this student. Continue?')) {
      const newTokenString = generateTokenString();
      setTokens(prev => prev.map(t => 
        t.id === tokenId 
          ? { ...t, token: newTokenString, createdAt: new Date().toISOString() } 
          : t
      ));
    }
  };

  const deleteToken = (id: string) => {
    if (confirm('Revoke this student\'s private access key?')) {
      setTokens(prev => prev.filter(t => t.id !== id));
    }
  };

  const toggleStudentSelection = (idCode: string) => {
    const next = new Set(selectedStudentIds);
    if (next.has(idCode)) next.delete(idCode);
    else next.add(idCode);
    setSelectedStudentIds(next);
  };

  const copyToClipboard = (token: string, id: string) => {
    navigator.clipboard.writeText(token);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <header>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Access Key Distribution</h2>
        <p className="text-slate-500 font-medium mt-1">Generate individual student keys in the standard XXXX-XXXX-XXXX-XXXX format.</p>
      </header>

      {/* QR Viewer Modal */}
      {viewingQr && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-[3rem] w-full max-w-sm p-10 shadow-2xl text-center relative">
            <button onClick={() => setViewingQr(null)} className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-900 transition-all"><X /></button>
            <div className="mb-8">
              <h3 className="text-xl font-black text-slate-900">Student Access Key</h3>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Scan for direct entry</p>
            </div>
            <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 mb-8 inline-block shadow-inner">
              <img 
                src={`https://chart.googleapis.com/chart?chs=250x250&cht=qr&chl=${viewingQr.token}&choe=UTF-8`}
                alt="Token QR Code"
                className="w-48 h-48 mix-blend-multiply"
              />
            </div>
            <div className="space-y-4">
               <div className="px-4 py-3 bg-blue-50 text-blue-600 rounded-2xl font-mono text-lg font-black tracking-widest border border-blue-100">
                  {viewingQr.token}
               </div>
               <p className="text-[10px] text-slate-400 font-bold uppercase">ID: {viewingQr.studentIdCode}</p>
            </div>
            <button onClick={() => setViewingQr(null)} className="mt-10 w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest">Close</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Token Issuance Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-card p-8 rounded-[2.5rem] border border-slate-200 sticky top-10 shadow-2xl shadow-slate-200/50 flex flex-col max-h-[75vh]">
            <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
              <Zap className="w-5 h-5 text-blue-600" /> Issue Keys
            </h3>
            
            <div className="space-y-4 mb-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Section</label>
                  <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-900 outline-none focus:ring-4 focus:ring-blue-100">
                    <option value="All">All Students</option>
                    {sections.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="flex-[1.5]">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Search Student</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-900 outline-none focus:ring-4 focus:ring-blue-100" placeholder="Name or ID..." />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2 mb-6 scrollbar-thin">
              {availableStudents.map(student => (
                <button 
                  key={student.idCode}
                  onClick={() => toggleStudentSelection(student.idCode)}
                  className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all ${selectedStudentIds.has(student.idCode) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-100 text-slate-700 hover:border-blue-200'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-1 rounded-md ${selectedStudentIds.has(student.idCode) ? 'text-white' : 'text-slate-300'}`}>
                      {selectedStudentIds.has(student.idCode) ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-sm leading-tight">{student.fullName}</p>
                      <p className={`text-[10px] font-mono mt-0.5 ${selectedStudentIds.has(student.idCode) ? 'text-blue-100' : 'text-slate-400'}`}>{student.idCode} • {student.section}</p>
                    </div>
                  </div>
                </button>
              ))}
              {availableStudents.length === 0 && (
                <div className="text-center py-10 text-slate-300 font-bold uppercase text-[10px] tracking-widest border-2 border-dashed border-slate-50 rounded-2xl">
                  No students found without keys
                </div>
              )}
            </div>

            <div className="space-y-3">
              <button 
                onClick={publishTokensForSelected}
                disabled={selectedStudentIds.size === 0}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs disabled:opacity-50 transition-all active:scale-[0.98] shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
              >
                <Mail className="w-4 h-4" /> Publish Selected ({selectedStudentIds.size})
              </button>
              <button 
                onClick={publishTokensForAllInList}
                disabled={availableStudents.length === 0}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs disabled:opacity-50 transition-all active:scale-[0.98] shadow-lg shadow-slate-200"
              >
                Publish All in List ({availableStudents.length})
              </button>
            </div>
          </div>
        </div>

        {/* Managed Keys List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between mb-4 px-2">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Academic Keys</h4>
          </div>

          <div className="space-y-3">
            {tokens.map((token) => {
              const student = students.find(s => s.idCode === token.studentIdCode);
              return (
                <div key={token.id} className="glass-card p-5 rounded-[2rem] border border-slate-100 flex items-center justify-between gap-6 hover:shadow-xl transition-all bg-white group">
                  <div className="flex items-center gap-5 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 font-black text-xl border border-slate-100 group-hover:text-blue-500 group-hover:bg-blue-50 transition-colors">
                      <QrCode className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black bg-slate-900 text-white px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Fingerprint className="w-2.5 h-2.5" /> {token.studentIdCode}
                        </span>
                        <span className="text-sm font-black text-slate-800 truncate">{student?.fullName || 'Unknown Student'}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <code className="text-[10px] font-mono font-black text-blue-600 bg-blue-50/50 px-2 py-0.5 rounded border border-blue-50 truncate">{token.token}</code>
                        <span className="text-[8px] font-black text-slate-300 uppercase">{student?.section}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-1.5">
                    <button onClick={() => setViewingQr(token)} className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="View QR Code">
                      <QrCode className="w-5 h-5" />
                    </button>
                    <button onClick={() => rerollToken(token.id)} className="p-2.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all" title="Reroll Key">
                      <RefreshCw className="w-5 h-5" />
                    </button>
                    <button onClick={() => copyToClipboard(token.token, token.id)} className="p-2.5 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Copy String">
                      {copiedId === token.id ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                    </button>
                    <button onClick={() => deleteToken(token.id)} className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Revoke Access">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {tokens.length === 0 && (
            <div className="text-center py-32 bg-white rounded-[3.5rem] border-4 border-dashed border-slate-100">
              <Key className="w-16 h-16 text-slate-100 mx-auto mb-6" />
              <h3 className="text-xl font-black text-slate-300 uppercase tracking-widest">No Keys Managed</h3>
              <p className="text-slate-400 text-sm mt-2 font-medium">Issue student tokens to enable private portal access.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TokenManager;
