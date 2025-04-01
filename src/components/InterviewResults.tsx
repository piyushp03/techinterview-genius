
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { ChartContainer } from '@/components/ui/chart';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

// Hardcoded OpenAI API key - in a real app, this would be stored securely
const OPENAI_API_KEY = "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";

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
    if (sessionId && user) {
      fetchSessionData();
    }
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
        setAnalysisSummary(existingAnalysis.summary);
        setAnalysisComplete(true);
      } else {
        // Always perform analysis if we get here
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
    toast.info('Analyzing your interview responses...');
    
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
      
      // Voice interviews might not have a strict Q&A pair structure
      // So handle them separately
      if (session.category === 'voice-interview' && pairs.length === 0) {
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
      
      // If no pairs found, try another approach for voice interviews
      if (pairs.length === 0 && session.category === 'voice-interview') {
        let currentQuestion = '';
        for (let i = 0; i < messages.length; i++) {
          if (messages[i].is_bot) {
            currentQuestion = messages[i].content;
          } else if (currentQuestion && !messages[i].is_bot) {
            pairs.push({
              question: currentQuestion,
              answer: messages[i].content
            });
            currentQuestion = '';
          }
        }
      }
      
      if (pairs.length === 0) {
        throw new Error('No question-answer pairs found to analyze');
      }
      
      console.log("Analyzing interview with these Q&A pairs:", pairs);
      
      const summary = await analyzeWithOpenAI(pairs, session);
      
      // Save analysis to database
      const { error } = await supabase
        .from('interview_analysis')
        .upsert({
          session_id: sessionId,
          summary: summary,
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      setAnalysisSummary(summary);
      setAnalysisComplete(true);
      toast.success('Interview analysis complete');
    } catch (error: any) {
      console.error('Error analyzing interview:', error);
      toast.error('Failed to analyze interview. Creating default analysis.');
      
      // Create a default analysis if the real analysis fails
      const defaultSummary = createDefaultAnalysis(session, messages);
      setAnalysisSummary(defaultSummary);
      setAnalysisComplete(true);
      
      // Try to save the default analysis
      try {
        await supabase
          .from('interview_analysis')
          .upsert({
            session_id: sessionId,
            summary: defaultSummary,
            created_at: new Date().toISOString()
          });
      } catch (saveError) {
        console.error('Error saving default analysis:', saveError);
      }
    } finally {
      setAnalyzing(false);
    }
  };
  
  const analyzeWithOpenAI = async (pairs: { question: string; answer: string }[], session: any) => {
    try {
      // Format Q&A pairs for the prompt
      const pairsText = pairs.map((pair, idx) => 
        `Question ${idx + 1}: ${pair.question}\nAnswer ${idx + 1}: ${pair.answer}`
      ).join('\n\n');
      
      // Use GPT-4o-mini to analyze the entire conversation
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are an expert interviewer evaluating a candidate for a ${session.role_type} role focusing on ${session.category}. 
              Analyze the following interview questions and answers. 
              
              Provide a detailed assessment including:
              1. An overall score out of 10
              2. Strengths (list at least 3)
              3. Areas for improvement (list at least 3)
              4. Specific feedback for each question-answer pair
              5. A summary of the candidate's performance
              
              Format your response as a valid JSON object with these keys:
              {
                "average_score": number,
                "strengths_summary": [{"name": string, "value": number}],
                "improvement_summary": [{"name": string, "value": number}],
                "question_analysis": [
                  {
                    "question": string,
                    "answer": string,
                    "feedback": string,
                    "score": number,
                    "strengths": [string],
                    "areas_for_improvement": [string]
                  }
                ],
                "metrics": {
                  "clarity": number,
                  "conciseness": number,
                  "depth": number,
                  "fluency": number,
                  "confidence": number,
                  "overall": number
                },
                "summaryText": string
              }`
            },
            {
              role: 'user',
              content: `Interview for ${session.role_type} position focusing on ${session.category}:\n\n${pairsText}`
            }
          ],
          temperature: 0.7,
          response_format: { type: "json_object" }
        })
      });
      
      if (!response.ok) {
        console.error('OpenAI API error status:', response.status);
        const errorBody = await response.text();
        console.error('OpenAI API error:', errorBody);
        throw new Error('Failed to analyze interview with OpenAI API');
      }
      
      const data = await response.json();
      console.log("OpenAI analysis response:", data);
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
        throw new Error('Invalid response from OpenAI API');
      }
      
      const analysisResult = JSON.parse(data.choices[0].message.content);
      
      // Ensure all required fields are present
      const sanitizedResult = {
        average_score: analysisResult.average_score || 5,
        answered_questions: pairs.length,
        total_questions: session.questions_limit || pairs.length,
        time_spent: session.end_time ? 
          Math.floor((new Date(session.end_time).getTime() - new Date(session.start_time || session.created_at).getTime()) / 60000) : 
          session.time_limit || 30,
        strengths_summary: analysisResult.strengths_summary || [
          { name: "Attempted all questions", value: 5 }
        ],
        improvement_summary: analysisResult.improvement_summary || [
          { name: "Work on providing more detailed answers", value: 5 }
        ],
        question_analysis: analysisResult.question_analysis || pairs.map(pair => ({
          question: pair.question,
          answer: pair.answer,
          feedback: "No detailed feedback available.",
          score: 5,
          strengths: ["Provided an answer"],
          areas_for_improvement: ["Could provide more details"]
        })),
        metrics: analysisResult.metrics || {
          clarity: 5,
          conciseness: 5,
          depth: 5,
          fluency: 5,
          confidence: 5,
          overall: 5
        },
        summaryText: analysisResult.summaryText || "The interview was completed, but detailed analysis could not be generated."
      };
      
      return sanitizedResult;
    } catch (error) {
      console.error('Error analyzing with OpenAI:', error);
      throw error;
    }
  };
  
  const createDefaultAnalysis = (session: any, messages: any[]) => {
    // Extract questions and answers
    const pairs: { question: string; answer: string }[] = [];
    for (let i = 0; i < messages.length; i++) {
      if (messages[i].is_bot && i + 1 < messages.length && !messages[i + 1].is_bot) {
        pairs.push({
          question: messages[i].content,
          answer: messages[i + 1].content
        });
      }
    }
    
    return {
      average_score: 5,
      answered_questions: pairs.length,
      total_questions: session.questions_limit || 5,
      time_spent: session.time_limit || 30,
      strengths_summary: [
        { name: "Completed the interview", value: 5 },
        { name: "Attempted all questions", value: 4 },
        { name: "Showed technical knowledge", value: 3 }
      ],
      improvement_summary: [
        { name: "Provide more detailed answers", value: 5 },
        { name: "Include specific examples", value: 4 },
        { name: "Work on technical precision", value: 3 }
      ],
      question_analysis: pairs.map((pair, index) => ({
        question: pair.question,
        answer: pair.answer,
        feedback: "This answer shows understanding of the topic but could use more specific examples.",
        score: 5,
        strengths: ["Addressed the question", "Used relevant terminology"],
        areas_for_improvement: ["Include more specific examples", "Elaborate on technical details"]
      })),
      metrics: {
        clarity: 5,
        conciseness: 5,
        depth: 5,
        fluency: 5,
        confidence: 5,
        overall: 5
      },
      summaryText: `This interview for the ${session.role_type} position focused on ${session.category} showed a candidate with basic knowledge in the field. The answers were generally on-topic but lacked depth in some areas. With more practice and specific examples, the candidate can significantly improve their interview performance.`
    };
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

  if (!sessionData) {
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

  if (!sessionData.end_time && !analysisSummary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Interview Not Completed</CardTitle>
          <CardDescription>
            This interview session has not been completed yet. Finish the interview to see results.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            However, you can still analyze the questions you've answered so far.
          </p>
          <button
            onClick={() => analyzeInterview(sessionData, messages)}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
            disabled={analyzing}
          >
            {analyzing ? 'Analyzing...' : 'Analyze Current Progress'}
          </button>
        </CardContent>
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
        <CardContent>
          <button
            onClick={() => analyzeInterview(sessionData, messages)}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </CardContent>
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
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 10]} />
                  <Tooltip />
                  <Bar dataKey="value" name="Score" fill="var(--color-score, #4f46e5)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
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
              <ResponsiveContainer width="100%" height="100%">
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
              </ResponsiveContainer>
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
                <li key={index} className="flex items-start gap-2">
                  <span className="bg-green-100 text-green-800 rounded-full h-5 w-5 flex items-center justify-center text-xs mt-0.5">
                    {index + 1}
                  </span>
                  <span>{item.name} {item.value && <span className="text-sm text-muted-foreground">({item.value} points)</span>}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-3 text-amber-600">Areas to Improve</h4>
            <ul className="space-y-2">
              {analysisSummary.improvement_summary?.map((item: any, index: number) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="bg-amber-100 text-amber-800 rounded-full h-5 w-5 flex items-center justify-center text-xs mt-0.5">
                    {index + 1}
                  </span>
                  <span>{item.name} {item.value && <span className="text-sm text-muted-foreground">({item.value} points)</span>}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
          <CardDescription>Scores in different aspects of your interview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {analysisSummary.metrics && Object.entries(analysisSummary.metrics).map(([key, value]: [string, any]) => (
              <div key={key} className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium capitalize">{key}</span>
                  <span className="text-sm font-bold">
                    {value}/10
                  </span>
                </div>
                <div className="h-2 w-full bg-gray-200 rounded overflow-hidden">
                  <div 
                    className="h-full bg-primary" 
                    style={{ width: `${(value / 10) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Interview Summary</CardTitle>
          <CardDescription>Overall assessment of your performance</CardDescription>
        </CardHeader>
        <CardContent>
          <p>{analysisSummary.summaryText}</p>
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <h5 className="text-sm font-medium text-green-600 mb-1">Strengths:</h5>
                  <ul className="text-sm list-disc list-inside">
                    {analysis.strengths?.map((strength: string, i: number) => (
                      <li key={i}>{strength}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-amber-600 mb-1">Areas to Improve:</h5>
                  <ul className="text-sm list-disc list-inside">
                    {analysis.areas_for_improvement?.map((area: string, i: number) => (
                      <li key={i}>{area}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default InterviewResults;
