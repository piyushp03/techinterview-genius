
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { InterviewProvider } from "@/context/InterviewContext";
import ProtectedRoute from "@/components/ProtectedRoute";

// Pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NewInterview from "./pages/NewInterview";
import InterviewSession from "./pages/InterviewSession";
import InterviewResultsPage from "./pages/InterviewResultsPage";
import Questions from "./pages/Questions";
import Resume from "./pages/Resume";
import History from "./pages/History";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import AIInterviewer from "./pages/AIInterviewer";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <InterviewProvider>
            <Toaster />
            <Sonner />
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              
              {/* Protected routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/interview/new" element={
                <ProtectedRoute>
                  <NewInterview />
                </ProtectedRoute>
              } />
              <Route path="/interview/:id" element={
                <ProtectedRoute>
                  <InterviewSession />
                </ProtectedRoute>
              } />
              <Route path="/interview/results/:id" element={
                <ProtectedRoute>
                  <InterviewResultsPage />
                </ProtectedRoute>
              } />
              <Route path="/questions" element={
                <ProtectedRoute>
                  <Questions />
                </ProtectedRoute>
              } />
              <Route path="/ai-interviewer" element={
                <ProtectedRoute>
                  <AIInterviewer />
                </ProtectedRoute>
              } />
              <Route path="/resume" element={
                <ProtectedRoute>
                  <Resume />
                </ProtectedRoute>
              } />
              <Route path="/history" element={
                <ProtectedRoute>
                  <History />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </InterviewProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
