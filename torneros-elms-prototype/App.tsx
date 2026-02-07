
import React, { useState, useEffect } from 'react';
import { User, ViewState, Student, Grade, AccessToken } from './types';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import MasterlistManager from './components/MasterlistManager';
import GradeManager from './components/GradeManager';
import TokenManager from './components/TokenManager';
import Analytics from './components/Analytics';
import StudentPortal from './components/StudentPortal';
import { mockStudents, mockGrades } from './mockData';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewState>('dashboard');
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [tokens, setTokens] = useState<AccessToken[]>([]);

  // Initialize data from localStorage or fallback to mock data
  useEffect(() => {
    const savedStudents = localStorage.getItem('elms_students');
    const savedGrades = localStorage.getItem('elms_grades');
    const savedTokens = localStorage.getItem('elms_tokens');
    
    if (savedStudents && JSON.parse(savedStudents).length > 0) {
      setStudents(JSON.parse(savedStudents));
    } else {
      setStudents(mockStudents);
    }

    if (savedGrades && JSON.parse(savedGrades).length > 0) {
      setGrades(JSON.parse(savedGrades));
    } else {
      setGrades(mockGrades);
    }

    if (savedTokens) {
      setTokens(JSON.parse(savedTokens));
    }
  }, []);

  // Persistence
  useEffect(() => {
    if (students.length > 0) localStorage.setItem('elms_students', JSON.stringify(students));
    if (grades.length > 0) localStorage.setItem('elms_grades', JSON.stringify(grades));
    localStorage.setItem('elms_tokens', JSON.stringify(tokens));
  }, [students, grades, tokens]);

  const handleLogin = (user: User) => {
    setUser(user);
    if (user.role === 'teacher') {
      setView('dashboard');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setView('dashboard');
  };

  if (!user) {
    return <Login onLogin={handleLogin} tokens={tokens} />;
  }

  if (user.role === 'guest') {
    return (
      <StudentPortal 
        studentToken={user.token!} 
        students={students} 
        grades={grades} 
        tokens={tokens}
        onExit={handleLogout} 
      />
    );
  }

  const renderContent = () => {
    switch (view) {
      case 'dashboard':
        return <Dashboard students={students} grades={grades} tokens={tokens} setView={setView} />;
      case 'masterlist':
        return <MasterlistManager students={students} setStudents={setStudents} grades={grades} tokens={tokens} />;
      case 'grading':
        return <GradeManager grades={grades} setGrades={setGrades} students={students} />;
      case 'tokens':
        return <TokenManager tokens={tokens} setTokens={setTokens} students={students} />;
      case 'analytics':
        return <Analytics students={students} grades={grades} />;
      default:
        return <Dashboard students={students} grades={grades} tokens={tokens} setView={setView} />;
    }
  };

  return (
    <Layout currentView={view} setView={setView} onLogout={handleLogout}>
      {renderContent()}
    </Layout>
  );
};

export default App;
