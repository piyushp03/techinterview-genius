
import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { setupDatabase } from './utils/databaseSetup';

// Pages
import Index from './pages/Index';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import AIInterviewer from './pages/AIInterviewer';
import Questions from './pages/Questions';
import NotFound from './pages/NotFound';
import Profile from './pages/Profile';
import History from './pages/History';
import Resume from './pages/Resume';
import NewInterview from './pages/NewInterview';
import InterviewSession from './pages/InterviewSession';
import InterviewResultsPage from './pages/InterviewResultsPage';
import VoiceInterviewPage from './pages/VoiceInterviewPage';
import DailyChallenge from './pages/DailyChallenge';

// Components
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const location = useLocation();
  
  useEffect(() => {
    // Set up database tables if needed
    setupDatabase().catch(console.error);
  }, []);
  
  return (
    <div className="min-h-screen bg-background">
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/ai-interviewer" element={<ProtectedRoute><AIInterviewer /></ProtectedRoute>} />
        <Route path="/voice-interview" element={<ProtectedRoute><VoiceInterviewPage /></ProtectedRoute>} />
        <Route path="/questions" element={<ProtectedRoute><Questions /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="/resume" element={<ProtectedRoute><Resume /></ProtectedRoute>} />
        <Route path="/new-interview" element={<ProtectedRoute><NewInterview /></ProtectedRoute>} />
        <Route path="/interview/:id" element={<ProtectedRoute><InterviewSession /></ProtectedRoute>} />
        <Route path="/interview/results/:id" element={<ProtectedRoute><InterviewResultsPage /></ProtectedRoute>} />
        <Route path="/daily-challenge" element={<ProtectedRoute><DailyChallenge /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;
