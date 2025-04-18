
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Award, BarChart } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import InterviewAnalysisResults from '@/components/InterviewAnalysisResults';
import { generateInterviewAnalysis, InterviewAnalysis } from '@/utils/interviewAnalysisService';

const InterviewResultsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [sessionData, setSessionData] = useState<any>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<InterviewAnalysis | null>(null);
  
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
      
      messagesData.forEach((message: any, index: number) => {
        if (message.is_bot && index < messagesData.length - 1 && !messagesData[index + 1].is_bot) {
          // This is a bot message followed by a user message, likely a question
          questions.push(message.content);
          answers.push(messagesData[index + 1].content);
        }
      });
      
      setQuestions(questions);
      setAnswers(answers);

      // Try to load existing analysis or generate new one
      try {
        const { data: analysisData, error: analysisError } = await supabase
          .from('interview_analysis')
          .select('*')
          .eq('session_id', id)
          .maybeSingle();

        if (analysisError || !analysisData) {
          // If no analysis exists, generate one
          const analysisResult = await generateInterviewAnalysis(id as string);
          setAnalysis(analysisResult);
          
          // Save the analysis to the database
          const { error: saveError } = await supabase
            .from('interview_analysis')
            .insert({
              session_id: id,
              summary: analysisResult
            });
            
          if (saveError) {
            console.error('Error saving analysis:', saveError);
          }
        } else {
          setAnalysis(analysisData.summary as InterviewAnalysis);
        }
      } catch (error) {
        console.error('Error with interview analysis:', error);
        // Generate analysis locally if DB operations fail
        const analysisResult = await generateInterviewAnalysis(id as string);
        setAnalysis(analysisResult);
      }

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
    );
  }

  return (
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

      {analysis ? (
        <InterviewAnalysisResults 
          analysis={analysis}
          questions={questions}
          answers={answers}
        />
      ) : (
        <Card>
          <CardContent className="py-10 flex flex-col items-center">
            <BarChart className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium mb-2">Analysis not available</h3>
            <p className="text-muted-foreground text-center max-w-md">
              We couldn't generate an analysis for this interview. This might happen if the interview
              was too short or if there was an error processing the data.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InterviewResultsPage;
