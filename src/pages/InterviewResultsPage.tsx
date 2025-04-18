
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Award } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import InterviewAnalysisResults from '@/components/InterviewResults';
import Navbar from '@/components/Navbar';

const InterviewResultsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [sessionData, setSessionData] = useState<any>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  
  useEffect(() => {
    if (id) {
      loadInterviewData();
    }
  }, [id]);

  const loadInterviewData = async () => {
    setIsLoading(true);
    try {
      // Fetch the session data
      const { data: sessionData, error: sessionError } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('id', id)
        .single();

      if (sessionError) throw sessionError;
      setSessionData(sessionData);

      // Fetch messages to extract questions and answers
      const { data: messagesData, error: messagesError } = await supabase
        .from('interview_messages')
        .select('*')
        .eq('session_id', id)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      // Extract questions (from bot messages) and answers (from user messages)
      const questions: string[] = [];
      const answers: string[] = [];
      
      for (let i = 0; i < messagesData.length - 1; i++) {
        if (messagesData[i].is_bot && !messagesData[i + 1].is_bot) {
          questions.push(messagesData[i].content);
          answers.push(messagesData[i + 1].content);
        }
      }
      
      setQuestions(questions);
      setAnswers(answers);
    } catch (error) {
      console.error('Error loading interview data:', error);
      toast.error('Failed to load interview results');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartNewInterview = () => {
    navigate('/new-interview');
  };

  if (isLoading) {
    return (
      <div>
        <Navbar />
        <div className="container mx-auto py-8 px-4">
          <Skeleton className="h-10 w-64 mb-4" />
          <div className="grid gap-6">
            <Skeleton className="h-[400px] w-full" />
            <div className="grid gap-6 md:grid-cols-2">
              <Skeleton className="h-[200px] w-full" />
              <Skeleton className="h-[200px] w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8">
          <div>
            <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-4 md:mb-0">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold">{sessionData?.role_type} Interview Results</h1>
            <p className="text-muted-foreground">Interview in {sessionData?.category}</p>
          </div>
          
          <Button onClick={handleStartNewInterview} className="mt-4 md:mt-0">
            Start New Interview
          </Button>
        </div>

        <InterviewAnalysisResults 
          sessionId={id || ''}
          questions={questions}
          answers={answers}
          isCompleted={sessionData?.end_time !== null}
        />
      </div>
    </div>
  );
};

export default InterviewResultsPage;
