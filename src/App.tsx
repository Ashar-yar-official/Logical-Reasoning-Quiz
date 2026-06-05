import React, { useState, useEffect } from 'react';
import { Brain, ChevronRight, CheckCircle2, AlertCircle, Play, BarChart3, Download, ArrowLeft, Mail } from 'lucide-react';
import { QUESTIONS, Question } from './questions';

type Screen = 'welcome' | 'quiz' | 'result' | 'admin';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  
  // Quiz state
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [quizScore, setQuizScore] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Admin state
  const [adminStats, setAdminStats] = useState<any>(null);
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(false);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoginError, setAdminLoginError] = useState('');

  const startQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setCurrentScreen('quiz');
    setCurrentQuestionIdx(0);
    setAnswers([]);
    setQuizScore(0);
  };

  const handleAnswer = (optionIdx: number) => {
    const newAnswers = [...answers, optionIdx];
    setAnswers(newAnswers);

    if (currentQuestionIdx < QUESTIONS.length - 1) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
    } else {
      submitQuiz(newAnswers);
    }
  };

  const submitQuiz = async (finalAnswers: number[]) => {
    setIsSubmitting(true);
    let score = 0;
    finalAnswers.forEach((ans, idx) => {
      if (ans === QUESTIONS[idx].correctAnswerIndex) score++;
    });
    setQuizScore(score);

    try {
      await fetch('/api/submit-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, score, totalQuestions: QUESTIONS.length }),
      });
    } catch (err) {
      console.error("Failed to submit score", err);
    } finally {
      setIsSubmitting(false);
      setCurrentScreen('result');
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginError('');
    setIsLoadingAdmin(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: adminUsername, password: adminPassword })
      });
      const data = await res.json();
      if (res.ok && data.token) {
        setAdminToken(data.token);
        fetchAdminStats(data.token);
      } else {
        setAdminLoginError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      setAdminLoginError('Failed to connect to server');
    } finally {
      setIsLoadingAdmin(false);
    }
  };

  const fetchAdminStats = async (token: string) => {
    setIsLoadingAdmin(true);
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        if (res.status === 401) setAdminToken(null);
        throw new Error('Unauthorized');
      }
      const data = await res.json();
      setAdminStats(data);
    } catch (err) {
      console.error("Failed to load admin stats", err);
    } finally {
      setIsLoadingAdmin(false);
    }
  };

  const loadAdmin = () => {
    setCurrentScreen('admin');
    if (adminToken) {
      fetchAdminStats(adminToken);
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setCurrentScreen('welcome');
  };

  // -------------------------
  // Screens
  // -------------------------

  if (currentScreen === 'welcome') {
    return (
      <div className="min-h-screen bg-[#FAFAFA] text-gray-900 flex flex-col font-sans">
        <header className="px-6 py-4 flex justify-between items-center border-b border-gray-200 bg-white">
          <div className="flex items-center gap-2 font-medium">
            <Brain className="w-5 h-5 text-indigo-600" />
            <span>Logic & Pattern Assessment</span>
          </div>
          <button 
            onClick={loadAdmin}
            className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1"
          >
            <BarChart3 className="w-4 h-4" /> Admin
          </button>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-semibold tracking-tight mb-2">Registration</h1>
              <p className="text-gray-500 text-sm">
                Enter your details to begin the cognitive assessment. Results will be emailed to you securely.
              </p>
            </div>

            <form onSubmit={startQuiz} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  autoFocus
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  placeholder="e.g. Jane Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  placeholder="jane@example.com"
                />
              </div>
              <button 
                type="submit"
                className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                Start Assessment <Play className="w-4 h-4" />
              </button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  if (currentScreen === 'quiz') {
    const q = QUESTIONS[currentQuestionIdx];
    return (
      <div className="min-h-screen bg-[#FAFAFA] text-gray-900 flex flex-col font-sans">
        <header className="px-6 py-4 flex items-center justify-between border-b border-gray-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 font-medium">
            <Brain className="w-5 h-5 text-indigo-600" />
            <span>Assessment in Progress</span>
          </div>
          <div className="text-sm font-medium text-gray-500">
            Question {currentQuestionIdx + 1} of {QUESTIONS.length}
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center p-6 mt-12">
          <div className="max-w-2xl w-full">
            <div className="mb-8">
              <span className="inline-block px-3 py-1 mb-4 text-xs font-medium uppercase tracking-wider text-indigo-600 bg-indigo-50 rounded-full">
                {q.type === 'logic' ? 'Logical Reasoning' : 'Pattern Identification'}
              </span>
              <h2 className="text-2xl md:text-3xl font-medium leading-tight">{q.text}</h2>
            </div>

            <div className="space-y-3">
              {q.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  disabled={isSubmitting}
                  className="w-full bg-white border border-gray-200 hover:border-indigo-600 hover:ring-1 hover:ring-indigo-600 text-left px-6 py-4 rounded-xl shadow-sm transition-all flex items-center justify-between group disabled:opacity-50"
                >
                  <span className="font-medium text-gray-800">{opt}</span>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                </button>
              ))}
            </div>
            
            {isSubmitting && (
              <div className="mt-8 text-center text-sm text-gray-500 animate-pulse">
                Saving results and generating report...
              </div>
            )}
            
            {/* Progress bar */}
            <div className="w-full bg-gray-200 h-1.5 mt-12 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-600 h-full transition-all duration-300"
                style={{ width: `${((currentQuestionIdx) / QUESTIONS.length) * 100}%` }}
              />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (currentScreen === 'result') {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center p-6 font-sans text-gray-900">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">Assessment Complete</h2>
          <p className="text-gray-600 mb-8">
            Thank you, {name}. Your score has been securely saved to our database.
          </p>

          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-8 flex items-start gap-3 text-left">
            <Mail className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <p className="text-sm text-indigo-900">
              We've dispatched an email to <span className="font-medium">{email}</span> with your full performance summary and final marks.
            </p>
          </div>

          {answers.length > 0 && quizScore < QUESTIONS.length && (
            <div className="mb-8 text-left w-full h-full">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500" /> Areas for Improvement
              </h3>
              <div className="max-h-64 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {QUESTIONS.slice(0, answers.length).map((q, idx) => {
                  const userAns = answers[idx];
                  if (userAns === q.correctAnswerIndex) return null;
                  return (
                    <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-100 text-sm">
                      <p className="font-medium text-gray-900 mb-2">{q.text}</p>
                      <p className="text-red-600 mb-1">
                        <span className="font-medium">Your Answer:</span> {userAns !== undefined ? q.options[userAns] : 'Skipped'}
                      </p>
                      <p className="text-green-600">
                        <span className="font-medium">Correct Answer:</span> {q.options[q.correctAnswerIndex]}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <button 
            onClick={resetForm}
            className="w-full bg-gray-900 hover:bg-black text-white font-medium py-2.5 rounded-lg transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  // Admin Screen
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-gray-900 font-sans">
      <header className="px-6 py-4 flex justify-between items-center bg-white border-b border-gray-200">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setCurrentScreen('welcome')}
            className="p-2 -ml-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="font-medium flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            <span>Admin Dashboard</span>
          </div>
        </div>
        <div className="flex items-center">
          <p className="text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            Mock Database Mode (Cloud SQL unavailable)
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 md:p-8">
        {!adminToken ? (
          <div className="max-w-md mx-auto mt-12 bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-semibold mb-2">Admin Login</h2>
              <p className="text-sm text-gray-500">Sign in to view participant statistics</p>
            </div>
            
            <form onSubmit={handleAdminLogin} className="space-y-4">
              {adminLoginError && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                  {adminLoginError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input 
                  type="text" 
                  value={adminUsername}
                  onChange={e => setAdminUsername(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input 
                  type="password" 
                  value={adminPassword}
                  onChange={e => setAdminPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  required
                />
              </div>
              <button 
                type="submit"
                disabled={isLoadingAdmin}
                className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2.5 rounded-lg transition-colors"
              >
                {isLoadingAdmin ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>
          </div>
        ) : isLoadingAdmin || !adminStats ? (
          <div className="flex justify-center py-20 text-gray-500">Loading metrics...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <p className="text-sm font-medium text-gray-500 mb-1">Total Participants</p>
                <p className="text-3xl font-semibold text-gray-900">{adminStats.totalUsers}</p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <p className="text-sm font-medium text-gray-500 mb-1">Average Score</p>
                <p className="text-3xl font-semibold text-gray-900">
                  {adminStats.averageScore.toFixed(1)} <span className="text-base text-gray-400 font-normal">/ {QUESTIONS.length}</span>
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h3 className="font-semibold text-gray-900">Recent Registrations</h3>
                <a 
                  href={`/api/admin/export-csv?token=${adminToken}`} 
                  download="quiz_results.csv"
                  className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-md transition-colors"
                >
                  <Download className="w-4 h-4" /> Export CSV
                </a>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-white text-gray-500 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 font-medium">Candidate Name</th>
                      <th className="px-6 py-3 font-medium">Email</th>
                      <th className="px-6 py-3 font-medium">Score</th>
                      <th className="px-6 py-3 font-medium text-right">Date Completed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {adminStats.users.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                          No results recorded yet.
                        </td>
                      </tr>
                    ) : (
                      adminStats.users.map((user: any) => (
                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-3 font-medium text-gray-900">{user.name}</td>
                          <td className="px-6 py-3 text-gray-500">{user.email}</td>
                          <td className="px-6 py-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {user.score} / {user.totalQuestions}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-right text-gray-500">
                            {new Date(user.timestamp).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
