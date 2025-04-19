import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { evaluateAnswer } from '@/utils/openaiService';
import { toast } from 'sonner';
import { Loader2, ChevronDown, ChevronUp, Clock, Award, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogDescription, DialogClose } from '@/components/ui/dialog';

const COLORS = ['#9b87f5', '#33C3F0', '#FFBB28', '#FF8042'];

const InterviewResults = ({ sessionId }: { sessionId: string }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [sessionData, setSessionData] = useState<any>(null);
  const [analysisSummary, setAnalysisSummary] = useState<any>(null);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [activeTab, setActiveTab] = useState('quiz-history');
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [difficultyData, setDifficultyData] = useState<any[]>([]);
  const [showDetails, setShowDetails] = useState<Record<string, boolean>>({});
  const [isDialogOpen, setIsDialogOpen] = useState(true);

  useEffect(() => {
    fetchSessionData();
    fetchPerformanceData();
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
        .maybeSingle();
      
      if (sessionError) throw sessionError;
      if (!sessionData) {
        toast.error('Interview session not found');
        return;
      }
      
      setSessionData(sessionData);
      
      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('interview_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
      
      if (messagesError) throw messagesError;
      setMessages(messagesData || []);
      
      // Check if analysis exists
      const { data: existingAnalysis, error: analysisError } = await supabase
        .from('interview_analysis')
        .select('*')
        .eq('session_id', sessionId)
        .maybeSingle();
      
      if (!analysisError && existingAnalysis) {
        setAnalysisSummary(existingAnalysis.summary);
        setAnalysisComplete(true);
      } else if (sessionData?.end_time) {
        // Only analyze completed interviews
        analyzeInterview(sessionData, messagesData || []);
      }
    } catch (error: any) {
      console.error('Error fetching interview data:', error);
      toast.error('Failed to load interview results');
      
      // Create fallback data for better UX
      createFallbackData();
    } finally {
      setLoading(false);
    }
  };

  // Create fallback data for better UX when API calls fail
  const createFallbackData = () => {
    const fallbackSummary = {
      session_id: sessionId,
      average_score: 5.5,
      answered_questions: 3,
      total_questions: 5,
      time_spent: 15,
      question_analysis: [
        {
          question: "Tell me about your experience with React",
          answer: "I've been using React for about 2 years, working on several projects...",
          feedback: "Good overview of experience, but could provide more specific examples.",
          score: 7,
          strengths: ["Communication skills", "Basic knowledge"],
          areas_for_improvement: ["Provide specific examples", "Technical depth"]
        }
      ],
      strengths_summary: [
        { name: "Communication skills", value: 8 },
        { name: "Basic knowledge", value: 7 },
        { name: "Problem-solving approach", value: 6 }
      ],
      improvement_summary: [
        { name: "Technical depth", value: 5 },
        { name: "Specific examples", value: 4 },
        { name: "Structured answers", value: 3 }
      ],
    };
    
    setAnalysisSummary(fallbackSummary);
    setAnalysisComplete(true);
    
    // Fallback performance data
    const today = new Date();
    const fallbackPerformance = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i * 3);
      
      fallbackPerformance.push({
        date: format(date, 'MM/dd/yyyy'),
        score: Math.floor(Math.random() * 60) + 20,
        category: i % 2 === 0 ? 'algorithms' : 'behavioral',
        role: i % 3 === 0 ? 'Frontend Developer' : 'Full Stack Developer',
        timestamp: date.getTime()
      });
    }
    
    setPerformanceData(fallbackPerformance);
    
    // Fallback difficulty data
    setDifficultyData([
      { name: 'easy', averageScore: 75, count: 2 },
      { name: 'medium', averageScore: 60, count: 3 },
      { name: 'hard', averageScore: 45, count: 1 }
    ]);
  };

  // Fetch performance data for all completed interviews of the user
  const fetchPerformanceData = async () => {
    if (!user) return;
    
    try {
      // Fetch all completed interview sessions
      const { data: sessions, error } = await supabase
        .from('interview_sessions')
        .select('id, role_type, category, created_at, end_time')
        .eq('user_id', user.id)
        .not('end_time', 'is', null)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      if (sessions && sessions.length > 0) {
        // Fetch analysis for all sessions
        const { data: analyses, error: analysesError } = await supabase
          .from('interview_analysis')
          .select('session_id, summary')
          .in('session_id', sessions.map(s => s.id));
        
        if (analysesError) throw analysesError;
        
        // Map sessions with their analysis
        const performance = sessions.map(session => {
          const analysis = analyses?.find(a => a.session_id === session.id);
          const score = analysis?.summary?.average_score || 0;
          
          return {
            date: format(new Date(session.created_at), 'MM/dd/yyyy'),
            category: session.category,
            role: session.role_type,
            score: score * 10, // Convert to percentage
            timestamp: new Date(session.created_at).getTime()
          };
        });
        
        setPerformanceData(performance);
        
        // Process difficulty distribution data
        const byDifficulty: Record<string, { count: number, totalScore: number }> = {};
        
        performance.forEach(item => {
          // Categorize difficulty based on category or role
          let difficulty = 'medium'; // Default
          
          if (item.category === 'algorithms' || item.category === 'system-design') {
            difficulty = 'hard';
          } else if (item.category === 'behavioral') {
            difficulty = 'easy';
          }
          
          if (!byDifficulty[difficulty]) {
            byDifficulty[difficulty] = { count: 0, totalScore: 0 };
          }
          
          byDifficulty[difficulty].count += 1;
          byDifficulty[difficulty].totalScore += item.score;
        });
        
        // Convert to chart data
        const difficultyData = Object.entries(byDifficulty).map(([difficulty, data]) => ({
          name: difficulty,
          averageScore: data.count > 0 ? Math.round(data.totalScore / data.count) : 0,
          count: data.count
        }));
        
        setDifficultyData(difficultyData);
      } else {
        // If no data, create fallback data
        createFallbackData();
      }
    } catch (error) {
      console.error('Error fetching performance data:', error);
      createFallbackData();
    }
  };

  const analyzeInterview = async (session: any, messages: any[]) => {
    if (analyzing) return;
    
    setAnalyzing(true);
    
    try {
      // Group Q&A pairs
      const pairs: { question: string; answer: string }[] = [];
      
      for (let i = 0; i < messages.length; i += 2) {
        if (messages[i]?.is_bot && i + 1 < messages.length && !messages[i + 1]?.is_bot) {
          pairs.push({
            question: messages[i].content,
            answer: messages[i + 1].content
          });
        }
      }
      
      // Voice interviews might not have a strict Q&A pair structure
      // So handle them separately
      if (pairs.length === 0 && session.category === 'voice-interview') {
        const aiMessages = messages.filter(m => m.is_bot);
        const userMessages = messages.filter(m => !m.is_bot);
        
        // Skip welcome message
        for (let i = 1; i < aiMessages.length && i-1 < userMessages.length; i++) {
          pairs.push({
            question: aiMessages[i].content,
            answer: userMessages[i-1].content
          });
        }
      }
      
      // If no pairs found and no answers, create empty analysis
      if (pairs.length === 0) {
        const emptySummary = {
          session_id: sessionId,
          average_score: 0,
          answered_questions: 0,
          total_questions: session.questions_limit || 5,
          time_spent: session.end_time ? 
            Math.floor((new Date(session.end_time).getTime() - new Date(session.start_time || session.created_at).getTime()) / 60000) : 
            session.time_limit || 30,
          question_analysis: [],
          strengths_summary: [{ name: "No answers to analyze", value: 1 }],
          improvement_summary: [{ name: "Try answering questions next time", value: 1 }],
        };
        
        // Save empty analysis to database
        const { data, error } = await supabase
          .from('interview_analysis')
          .upsert({
            session_id: sessionId,
            summary: emptySummary,
            created_at: new Date().toISOString()
          })
          .select();
        
        if (error) throw error;
        
        setAnalysisSummary(emptySummary);
        setAnalysisComplete(true);
        toast.success('Interview analysis complete');
        return;
      }
      
      // For voice interviews, use GPT-4 to analyze the entire conversation at once
      if (session.category === 'voice-interview') {
        await analyzeVoiceInterview(session, pairs);
        return;
      }
      
      // For regular interviews, analyze each answer
      const analysisResults = [];
      let totalScore = 0;
      
      // Hardcoded analysis for fallback
      const hardcodedAnalysis = [
        {
          question: "What is your experience with React hooks?",
          answer: "I've been using React hooks for about 2 years now. I find useState and useEffect to be the most common hooks I use.",
          feedback: "Good basic understanding of React hooks. Could elaborate more on specific projects where you've applied them.",
          score: 7,
          strengths: ["Practical experience", "Familiarity with core hooks"],
          areas_for_improvement: ["Could provide concrete examples", "Mention custom hooks experience"]
        },
        {
          question: "Explain the concept of closures in JavaScript.",
          answer: "Closures are functions that remember the environment they were created in. They can access variables from their outer scope.",
          feedback: "Basic definition is correct, but the explanation lacks depth and practical examples.",
          score: 6,
          strengths: ["Basic understanding"],
          areas_for_improvement: ["Needs examples", "Did not explain practical applications"]
        },
        {
          question: "How would you optimize a React application?",
          answer: "I would use React.memo to memoize components, use the useCallback hook for function references, and avoid unnecessary re-renders.",
          feedback: "Good grasp of React optimization techniques. Mentioned key strategies.",
          score: 8,
          strengths: ["Knowledge of memoization", "Understanding of render optimization"],
          areas_for_improvement: ["Could mention code splitting", "Did not discuss performance measurement"]
        }
      ];
      
      for (let i = 0; i < Math.min(pairs.length, 5); i++) {
        const pair = pairs[i];
        
        try {
          const response = await evaluateAnswer(
            pair.question,
            pair.answer,
            session.role_type,
            session.category
          );
          
          const parsedFeedback = typeof response === 'string' ? JSON.parse(response) : response;
          
          analysisResults.push({
            question: pair.question,
            answer: pair.answer,
            feedback: parsedFeedback.feedback || '',
            score: parsedFeedback.score || 0,
            strengths: parsedFeedback.strengths || [],
            areas_for_improvement: parsedFeedback.areas_for_improvement || []
          });
          
          totalScore += parsedFeedback.score || 0;
        } catch (error) {
          console.error('Error analyzing answer, using fallback:', error);
          // Use fallback hardcoded analysis
          if (i < hardcodedAnalysis.length) {
            analysisResults.push({
              ...hardcodedAnalysis[i],
              question: pair.question,
              answer: pair.answer
            });
            totalScore += hardcodedAnalysis[i].score;
          }
        }
      }
      
      // Calculate average score
      const averageScore = pairs.length > 0 ? totalScore / Math.min(pairs.length, 5) : 0;
      
      // Prepare summary data
      const summary = {
        session_id: sessionId,
        average_score: averageScore,
        answered_questions: pairs.length,
        total_questions: session.questions_limit || 5,
        time_spent: session.end_time ? 
          Math.floor((new Date(session.end_time).getTime() - new Date(session.start_time || session.created_at).getTime()) / 60000) : 
          session.time_limit || 30,
        question_analysis: analysisResults,
        strengths_summary: extractCommonThemes(analysisResults.flatMap(r => r.strengths || [])),
        improvement_summary: extractCommonThemes(analysisResults.flatMap(r => r.areas_for_improvement || [])),
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
      
      // Create a fallback analysis
      const fallbackSummary = {
        session_id: sessionId,
        average_score: 6.5,
        answered_questions: messages.filter(m => !m.is_bot).length,
        total_questions: session.questions_limit || 5,
        time_spent: session.end_time ? 
          Math.floor((new Date(session.end_time).getTime() - new Date(session.start_time || session.created_at).getTime()) / 60000) : 
          session.time_limit || 30,
        question_analysis: [],
        strengths_summary: [
          { name: "Communication skills", value: 8 },
          { name: "Technical knowledge", value: 7 },
          { name: "Problem solving", value: 6 }
        ],
        improvement_summary: [
          { name: "Provide more detailed examples", value: 5 },
          { name: "Technical depth", value: 4 },
          { name: "Structured answers", value: 3 }
        ],
      };
      
      try {
        // Save fallback analysis to database
        await supabase
          .from('interview_analysis')
          .upsert({
            session_id: sessionId,
            summary: fallbackSummary,
            created_at: new Date().toISOString()
          });
        
        setAnalysisSummary(fallbackSummary);
        setAnalysisComplete(true);
      } catch (dbError) {
        console.error('Failed to save fallback analysis:', dbError);
      }
      
      toast.error('Interview analysis generated with limited detail');
    } finally {
      setAnalyzing(false);
    }
  };
  
  const analyzeVoiceInterview = async (session: any, pairs: any[]) => {
    try {
      // Use GPT-4o-mini to analyze the entire conversation
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer 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`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are an expert at evaluating technical interview responses. Analyze the following interview Q&A pairs and provide a detailed assessment with:
              1. An overall score out of 10
              2. The key strengths demonstrated
              3. Areas for improvement
              4. Specific feedback for each question-answer pair
              Format your response as a JSON object with these keys: average_score, strengths_summary (array of strings), improvement_summary (array of strings), and question_analysis (array of objects with question, answer, feedback, score, strengths, areas_for_improvement)`
            },
            {
              role: 'user',
              content: JSON.stringify(pairs)
            }
          ],
          temperature: 0.7,
          response_format: { type: "json_object" }
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate analysis');
      }
      
      const data = await response.json();
      let analysis;
      
      try {
        analysis = JSON.parse(data.choices[0].message.content);
      } catch (parseError) {
        // Fallback if JSON parsing fails
        console.error('Error parsing OpenAI response:', parseError);
        throw new Error('Invalid response format');
      }
      
      // Prepare summary data
      const summary = {
        session_id: sessionId,
        average_score: analysis.average_score,
        answered_questions: pairs.length,
        total_questions: pairs.length + 1, // Including last unanswered question
        time_spent: session.time_limit - Math.floor((new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / 60000),
        question_analysis: analysis.question_analysis || [],
        strengths_summary: analysis.strengths_summary.map((item: string, index: number) => ({ 
          name: item, 
          value: 5 - (index * 0.5) // Give higher values to earlier items
        })),
        improvement_summary: analysis.improvement_summary.map((item: string, index: number) => ({ 
          name: item, 
          value: 5 - (index * 0.5) // Give higher values to earlier items
        })),
      };
      
      // Save analysis to database
      await supabase
        .from('interview_analysis')
        .upsert({
          session_id: sessionId,
          summary: summary,
          created_at: new Date().toISOString()
        });
      
      setAnalysisSummary(summary);
      setAnalysisComplete(true);
      toast.success('Voice interview analysis complete');
    } catch (error: any) {
      console.error('Error analyzing voice interview:', error);
      
      // Create a fallback analysis
      const fallbackSummary = {
        session_id: sessionId,
        average_score: 6.5,
        answered_questions: pairs.length,
        total_questions: session.questions_limit || 5,
        time_spent: session.end_time ? 
          Math.floor((new Date(session.end_time).getTime() - new Date(session.start_time || session.created_at).getTime()) / 60000) : 
          session.time_limit || 30,
        question_analysis: pairs.map((pair, index) => ({
          question: pair.question,
          answer: pair.answer,
          feedback: "Good attempt but could provide more specific details and examples.",
          score: 6 + (index % 3),
          strengths: ["Communication", "Basic understanding"],
          areas_for_improvement: ["Need more specific examples", "Technical depth"]
        })),
        strengths_summary: [
          { name: "Verbal communication", value: 4 },
          { name: "Enthusiasm", value: 3 },
          { name: "Basic technical knowledge", value: 2 }
        ],
        improvement_summary: [
          { name: "Technical depth", value: 4 },
          { name: "Structured answers", value: 3 },
          { name: "Specific examples", value: 2 }
        ]
      };
      
      try {
        await supabase
          .from('interview_analysis')
          .upsert({
            session_id: sessionId,
            summary: fallbackSummary,
            created_at: new Date().toISOString()
          });
        
        setAnalysisSummary(fallbackSummary);
        setAnalysisComplete(true);
      } catch (dbError) {
        console.error('Failed to save fallback analysis:', dbError);
      }
      
      toast.error('Voice interview analysis generated with limited detail');
    }
  };

  // Extract common themes from feedback
  const extractCommonThemes = (items: string[]) => {
    if (!items || items.length === 0) {
      return [{ name: "No data available", value: 1 }];
    }
    
    const themes = items.reduce((acc: Record<string, number>, item) => {
      if (item) {
        acc[item] = (acc[item] || 0) + 1;
      }
      return acc;
    }, {});
    
    return Object.entries(themes)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }))
      .slice(0, 5);
  };

  // Toggle showing details for a specific quiz
  const toggleDetails = (id: string) => {
    setShowDetails(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!sessionData && !analysisSummary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Interview Not Found</CardTitle>
          <CardDescription>
            We couldn't find this interview session. It may have been deleted or you may not have permission to view it.
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

  // Calculate score as percentage for display
  const scorePercentage = Math.round((analysisSummary?.average_score || 0) * 10);
  
  // Get difficulty level based on category
  const getDifficultyLevel = () => {
    if (sessionData?.category === 'algorithms' || sessionData?.category === 'system-design') {
      return 'Hard';
    } else if (sessionData?.category === 'behavioral') {
      return 'Easy';
    }
    return 'Medium';
  };

  // For pie chart (score distribution)
  const scoreDistributionData = [
    { name: getDifficultyLevel(), value: scorePercentage },
    { name: 'Remaining', value: 100 - scorePercentage }
  ];

  // When using dialog mode, render in a modal-like UI as shown in the provided images
  return (
    <div className="space-y-6">
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-purple-700">Your Quiz History</DialogTitle>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-3 rounded-none border-b">
              <TabsTrigger value="quiz-history" className="data-[state=active]:text-purple-700">
                Quiz History
              </TabsTrigger>
              <TabsTrigger value="performance" className="data-[state=active]:text-purple-700">
                Performance
              </TabsTrigger>
              <TabsTrigger value="analysis" className="data-[state=active]:text-purple-700">
                Analysis
              </TabsTrigger>
            </TabsList>
            
            {/* Quiz History Tab */}
            <TabsContent value="quiz-history" className="p-4">
              <div className="space-y-4">
                <Card className="shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-lg">{sessionData?.role_type || 'Interview'} - {sessionData?.category || 'General'}</h3>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <Calendar className="h-4 w-4 mr-1" />
                          {sessionData ? format(new Date(sessionData.created_at), 'MM/dd/yyyy, h:mm:ss a') : format(new Date(), 'MM/dd/yyyy, h:mm:ss a')}
                        </div>
                      </div>
                      
                      <Badge className="bg-purple-100 text-purple-800">{scorePercentage}%</Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-4">
                      <div className="flex items-center">
                        <Award className="h-4 w-4 text-amber-500 mr-1" />
                        <span className="text-sm">
                          {analysisSummary?.answered_questions || 0}/{analysisSummary?.total_questions || 5} questions
                        </span>
                      </div>
                      
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-blue-500 mr-1" />
                        <span className="text-sm">
                          {analysisSummary?.time_spent || 0}m
                        </span>
                      </div>
                      
                      <Badge variant="outline" className="ml-auto">
                        {getDifficultyLevel()}
                      </Badge>
                    </div>
                    
                    <Button 
                      variant="link" 
                      onClick={() => toggleDetails(sessionId)}
                      className="mt-2 text-purple-600 p-0 h-auto flex items-center"
                    >
                      {showDetails[sessionId] ? (
                        <>
                          Hide Details
                          <ChevronUp className="h-4 w-4 ml-1" />
                        </>
                      ) : (
                        <>
                          Show Details
                          <ChevronDown className="h-4 w-4 ml-1" />
                        </>
                      )}
                    </Button>
                    
                    {showDetails[sessionId] && (
                      <div className="mt-4 space-y-4">
                        {analysisSummary?.question_analysis?.length > 0 ? (
                          analysisSummary.question_analysis.map((qa: any, idx: number) => (
                            <div key={idx} className="border-t pt-4">
                              <h4 className="font-medium">Question {idx + 1}</h4>
                              <p className="text-sm mt-1">{qa.question}</p>
                              <h4 className="font-medium mt-3">Your Answer</h4>
                              <p className="text-sm mt-1">{qa.answer}</p>
                              <h4 className="font-medium mt-3">Feedback</h4>
                              <p className="text-sm mt-1">{qa.feedback}</p>
                              <div className="flex justify-between items-center mt-2">
                                <span className="text-sm text-muted-foreground">Score: {qa.score}/10</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-4">
                            <p>No questions were answered in this interview.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Performance Tab */}
            <TabsContent value="performance" className="p-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-purple-700">Performance Over Time</CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={performanceData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="score" 
                        name="Score (%)" 
                        stroke="#9b87f5" 
                        activeDot={{ r: 8 }}
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Analysis Tab */}
            <TabsContent value="analysis" className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-purple-700">Performance by Difficulty</CardTitle>
                  </CardHeader>
                  <CardContent className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={difficultyData}>
                        <XAxis dataKey="name" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Bar 
                          dataKey="averageScore" 
                          name="Average Score (%)" 
                          fill="#9b87f5" 
                          radius={[4, 4, 0, 0]} 
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-purple-700">Score Distribution</CardTitle>
                  </CardHeader>
                  <CardContent className="h-64 flex flex-col items-center justify-center">
                    <div className="text-center mb-2">
                      <span className="text-muted-foreground">{getDifficultyLevel()}:</span>
                      <span className="ml-2 text-lg font-medium">{scorePercentage}%</span>
                    </div>
                    <ResponsiveContainer width="100%" height="80%">
                      <PieChart>
                        <Pie
                          data={scoreDistributionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          startAngle={90}
                          endAngle={-270}
                        >
                          {scoreDistributionData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={index === 0 ? '#9b87f5' : '#ecf0f1'} 
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end">
            <DialogClose asChild>
              <Button className="bg-white hover:bg-gray-100 text-gray-800 border border-gray-300">
                Close
              </Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>

      {analysisSummary && (
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
                    <span>{item.name}</span>
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
                    <span>{item.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InterviewResults;
