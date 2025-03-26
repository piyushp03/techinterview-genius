
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { evaluateAnswer } from '@/utils/openaiService';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const InterviewResults = ({ sessionId }: { sessionId: string }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [sessionData, setSessionData] = useState<any>(null);
  const [analysisSummary, setAnalysisSummary] = useState<any>(null);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  useEffect(() => {
    fetchSessionData();
  }, [sessionId, user]);

  const fetchSessionData = async () => {
    if (!sessionId || !user) return;
    
    try {
      setLoading(true);
      
      // Fetch session data
      const { data: sessionData, error: sessionError } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .single();
      
      if (sessionError) throw sessionError;
      setSessionData(sessionData);
      
      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('interview_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
      
      if (messagesError) throw messagesError;
      setMessages(messagesData);
      
      // Check if analysis exists
      const { data: existingAnalysis, error: analysisError } = await supabase
        .from('interview_analysis')
        .select('*')
        .eq('session_id', sessionId)
        .single();
      
      if (!analysisError && existingAnalysis) {
        setAnalysisSummary(existingAnalysis);
        setAnalysisComplete(true);
      } else if (sessionData.end_time) {
        // Only analyze completed interviews
        analyzeInterview(sessionData, messagesData);
      }
    } catch (error: any) {
      console.error('Error fetching interview data:', error);
      toast.error('Failed to load interview results');
    } finally {
      setLoading(false);
    }
  };

  const analyzeInterview = async (session: any, messages: any[]) => {
    if (analyzing) return;
    
    setAnalyzing(true);
    
    try {
      // Group Q&A pairs
      const pairs: { question: string; answer: string }[] = [];
      
      for (let i = 0; i < messages.length; i += 2) {
        if (messages[i].is_bot && i + 1 < messages.length && !messages[i + 1].is_bot) {
          pairs.push({
            question: messages[i].content,
            answer: messages[i + 1].content
          });
        }
      }
      
      // Analyze each answer (limited to avoid rate limiting)
      const analysisResults = [];
      let totalScore = 0;
      
      for (let i = 0; i < Math.min(pairs.length, 5); i++) {
        const pair = pairs[i];
        
        const analysis = await evaluateAnswer(
          pair.question,
          pair.answer,
          session.role_type,
          session.category
        );
        
        analysisResults.push({
          question: pair.question,
          answer: pair.answer,
          feedback: analysis.feedback,
          score: analysis.score,
          strengths: analysis.strengths,
          areas_for_improvement: analysis.areas_for_improvement
        });
        
        totalScore += analysis.score;
      }
      
      // Calculate average score
      const averageScore = pairs.length > 0 ? totalScore / Math.min(pairs.length, 5) : 0;
      
      // Prepare summary data
      const summary = {
        session_id: sessionId,
        average_score: averageScore,
        answered_questions: pairs.length,
        total_questions: session.questions_limit,
        time_spent: session.end_time ? 
          Math.floor((new Date(session.end_time).getTime() - new Date(session.start_time || session.created_at).getTime()) / 60000) : 
          session.time_limit,
        question_analysis: analysisResults,
        strengths_summary: extractCommonThemes(analysisResults.flatMap(r => r.strengths)),
        improvement_summary: extractCommonThemes(analysisResults.flatMap(r => r.areas_for_improvement)),
      };
      
      // Save analysis to database
      const { data, error } = await supabase
        .from('interview_analysis')
        .upsert({
          session_id: sessionId,
          summary: summary,
          created_at: new Date().toISOString()
        })
        .select();
      
      if (error) throw error;
      
      setAnalysisSummary(summary);
      setAnalysisComplete(true);
      toast.success('Interview analysis complete');
    } catch (error: any) {
      console.error('Error analyzing interview:', error);
      toast.error('Failed to analyze interview');
    } finally {
      setAnalyzing(false);
    }
  };

  // Extract common themes from feedback
  const extractCommonThemes = (items: string[]) => {
    const themes = items.reduce((acc: Record<string, number>, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(themes)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }))
      .slice(0, 5);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!sessionData || !sessionData.end_time) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Interview Not Completed</CardTitle>
          <CardDescription>
            This interview session has not been completed yet. Finish the interview to see results.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (analyzing) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Analyzing Interview...</CardTitle>
            <CardDescription>
              We're analyzing your interview responses. This may take a moment.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analysisSummary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analysis Not Available</CardTitle>
          <CardDescription>
            We couldn't generate an analysis for this interview session.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Prepare chart data
  const progressData = [
    { name: 'Completed', value: analysisSummary.answered_questions },
    { name: 'Remaining', value: Math.max(0, analysisSummary.total_questions - analysisSummary.answered_questions) }
  ];

  const scoreData = [
    { name: 'Score', value: analysisSummary.average_score }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Score Overview</CardTitle>
            <CardDescription>
              Your average score across all questions
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ChartContainer config={{ score: { color: '#4f46e5' } }}>
              <BarChart data={scoreData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis dataKey="name" />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Bar dataKey="value" fill="var(--color-score, #4f46e5)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Question Progress</CardTitle>
            <CardDescription>
              Questions completed vs. total questions
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ChartContainer config={{ 
              Completed: { color: '#10b981' },
              Remaining: { color: '#e5e7eb' }
            }}>
              <PieChart>
                <Pie
                  data={progressData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {progressData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? 'var(--color-Completed, #10b981)' : 'var(--color-Remaining, #e5e7eb)'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Strengths & Areas for Improvement</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-3 text-green-600">Strengths</h4>
            <ul className="space-y-2">
              {analysisSummary.strengths_summary?.map((item: any, index: number) => (
                <li key={index} className="flex gap-2 items-start">
                  <span className="bg-green-100 text-green-800 rounded-full h-5 w-5 flex items-center justify-center text-xs mt-0.5">
                    {index + 1}
                  </span>
                  <span>{item.name} <span className="text-sm text-muted-foreground">({item.value} mentions)</span></span>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-3 text-amber-600">Areas to Improve</h4>
            <ul className="space-y-2">
              {analysisSummary.improvement_summary?.map((item: any, index: number) => (
                <li key={index} className="flex gap-2 items-start">
                  <span className="bg-amber-100 text-amber-800 rounded-full h-5 w-5 flex items-center justify-center text-xs mt-0.5">
                    {index + 1}
                  </span>
                  <span>{item.name} <span className="text-sm text-muted-foreground">({item.value} mentions)</span></span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Question Analysis</CardTitle>
          <CardDescription>
            Detailed feedback on your responses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {analysisSummary.question_analysis?.map((analysis: any, index: number) => (
            <div key={index} className="border rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Question {index + 1}</h4>
                <span className="text-sm px-2 py-1 bg-gray-100 rounded-full">
                  Score: {analysis.score}/10
                </span>
              </div>
              
              <div>
                <h5 className="text-sm font-medium text-muted-foreground mb-1">Question:</h5>
                <p className="text-sm">{analysis.question}</p>
              </div>
              
              <div>
                <h5 className="text-sm font-medium text-muted-foreground mb-1">Your Answer:</h5>
                <p className="text-sm">{analysis.answer}</p>
              </div>
              
              <div>
                <h5 className="text-sm font-medium text-muted-foreground mb-1">Feedback:</h5>
                <p className="text-sm">{analysis.feedback}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default InterviewResults;
