
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';

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

// Components
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from './context/AuthContext';
import { InterviewProvider } from './context/InterviewContext';

// Create a client for React Query
const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <InterviewProvider>
            <Router>
              <Routes>
                <Route path="/" element={<App />}>
                  <Route index element={<Index />} />
                  <Route path="auth" element={<Auth />} />
                  <Route path="dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="ai-interviewer" element={<ProtectedRoute><AIInterviewer /></ProtectedRoute>} />
                  <Route path="voice-interview" element={<ProtectedRoute><VoiceInterviewPage /></ProtectedRoute>} />
                  <Route path="questions" element={<ProtectedRoute><Questions /></ProtectedRoute>} />
                  <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                  <Route path="history" element={<ProtectedRoute><History /></ProtectedRoute>} />
                  <Route path="resume" element={<ProtectedRoute><Resume /></ProtectedRoute>} />
                  <Route path="new-interview" element={<ProtectedRoute><NewInterview /></ProtectedRoute>} />
                  <Route path="interview/:id" element={<ProtectedRoute><InterviewSession /></ProtectedRoute>} />
                  <Route path="results/:id" element={<ProtectedRoute><InterviewResultsPage /></ProtectedRoute>} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </Router>
            <Toaster />
          </InterviewProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
