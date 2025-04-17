
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Check, X, AlertTriangle, Download, Share2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { analyzeAnswer } from '@/utils/openaiService';

interface InterviewResultsProps {
  sessionId: string;
}

interface AnswerFeedback {
  feedback: string;
  score: number;
  strengths: string[];
  weaknesses: string[];
}

const InterviewResults: React.FC<InterviewResultsProps> = ({ sessionId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<AnswerFeedback[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [overallScore, setOverallScore] = useState(0);
  const [analyzeInProgress, setAnalyzeInProgress] = useState(false);
  
  // Define the colors for the pie chart
  const COLORS = ['#4CAF50', '#FFC107', '#F44336'];

  useEffect(() => {
    fetchSessionData();
  }, [sessionId]);
  
  // Function to fetch the interview session data
  const fetchSessionData = async () => {
    try {
      setLoading(true);
      
      // Fetch the session data
      const { data: session, error: sessionError } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
      
      if (sessionError) {
        throw new Error(sessionError.message);
      }
      
      if (!session) {
        throw new Error('Interview session not found');
      }
      
      setSessionData(session);
      
      // Fetch questions for this session
      const { data: questionData, error: questionsError } = await supabase
        .from('interview_questions')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
      
      if (questionsError) {
        throw new Error(questionsError.message);
      }
      
      setQuestions(questionData || []);
      
      // Fetch answers for this session
      const { data: answerData, error: answersError } = await supabase
        .from('interview_answers')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
      
      if (answersError) {
        throw new Error(answersError.message);
      }
      
      setAnswers(answerData || []);
      
      // Calculate overall score based on existing feedback
      if (answerData && answerData.length > 0) {
        const answersWithFeedback = answerData.filter(a => a.feedback && typeof a.feedback === 'object');
        
        if (answersWithFeedback.length > 0) {
          const feedbacks = answersWithFeedback.map(answer => {
            // Handle case where feedback might be a string or object
            if (typeof answer.feedback === 'object') {
              return answer.feedback as AnswerFeedback;
            } else if (typeof answer.feedback === 'string') {
              try {
                return JSON.parse(answer.feedback) as AnswerFeedback;
              } catch (e) {
                return {
                  feedback: answer.feedback || '',
                  score: 0,
                  strengths: [],
                  weaknesses: []
                };
              }
            }
            return null;
          }).filter(Boolean) as AnswerFeedback[];
          
          setFeedbacks(feedbacks);
          
          // Calculate average score
          const totalScore = feedbacks.reduce((sum, fb) => sum + (fb?.score || 0), 0);
          setOverallScore(Math.round(totalScore / feedbacks.length));
        }
      }
    } catch (error: any) {
      console.error('Error fetching interview results:', error);
      setError(error.message || 'Failed to load interview results');
      toast.error('Failed to load interview results');
    } finally {
      setLoading(false);
    }
  };
  
  // Function to analyze answers that don't have feedback yet
  const handleAnalyzeAnswers = async () => {
    if (analyzeInProgress) return;
    
    try {
      setAnalyzeInProgress(true);
      toast.info('Analyzing your answers...');
      
      const feedbackPromises = questions.map(async (question, index) => {
        const answer = answers[index];
        
        // Skip if no answer provided or if feedback already exists
        if (!answer || !answer.answer_text || (answer.feedback && typeof answer.feedback === 'object')) {
          return null;
        }
        
        try {
          // Analyze the answer
          const feedback = await analyzeAnswer(
            question.question_text,
            answer.answer_text,
            sessionData.role_type || 'Software Developer',
            sessionData.language || 'English'
          );
          
          // Update the answer in the database
          const { error: updateError } = await supabase
            .from('interview_answers')
            .update({ feedback: feedback })
            .eq('id', answer.id);
          
          if (updateError) {
            console.error('Error updating answer feedback:', updateError);
          }
          
          return feedback;
        } catch (error) {
          console.error(`Error analyzing answer ${index + 1}:`, error);
          return null;
        }
      });
      
      const newFeedbacks = (await Promise.all(feedbackPromises)).filter(Boolean) as AnswerFeedback[];
      
      // Update feedbacks state
      setFeedbacks([...feedbacks, ...newFeedbacks]);
      
      // Recalculate overall score
      const allFeedbacks = [...feedbacks, ...newFeedbacks];
      if (allFeedbacks.length > 0) {
        const totalScore = allFeedbacks.reduce((sum, fb) => sum + (fb?.score || 0), 0);
        setOverallScore(Math.round(totalScore / allFeedbacks.length));
      }
      
      toast.success('Analysis complete!');
      
      // Refresh data to get updated feedback
      fetchSessionData();
    } catch (error) {
      console.error('Error analyzing answers:', error);
      toast.error('Failed to analyze answers');
    } finally {
      setAnalyzeInProgress(false);
    }
  };
  
  // Function to navigate between questions
  const navigateQuestions = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else if (direction === 'next' && currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };
  
  // Function to create pie chart data
  const createScoreDistributionData = () => {
    // Count answers in different score ranges
    const scoreRanges = {
      high: 0, // 80-100
      medium: 0, // 50-79
      low: 0, // 0-49
    };
    
    feedbacks.forEach(feedback => {
      const score = feedback.score || 0;
      if (score >= 80) {
        scoreRanges.high++;
      } else if (score >= 50) {
        scoreRanges.medium++;
      } else {
        scoreRanges.low++;
      }
    });
    
    return [
      { name: 'High (80-100)', value: scoreRanges.high },
      { name: 'Medium (50-79)', value: scoreRanges.medium },
      { name: 'Low (0-49)', value: scoreRanges.low }
    ];
  };
  
  // Function to export results
  const exportResults = () => {
    // Create a data object with all session info
    const exportData = {
      session: sessionData,
      questions: questions.map((q, i) => ({
        question: q.question_text,
        answer: answers[i]?.answer_text || 'No answer provided',
        feedback: feedbacks[i] || null
      })),
      overallScore: overallScore
    };
    
    // Create and download file
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `interview-results-${sessionId}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    
    toast.success('Results exported successfully');
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 bg-destructive/10 rounded-md">
        <p className="text-destructive font-medium">Error: {error}</p>
      </div>
    );
  }
  
  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers.find(a => a.question_id === currentQuestion?.id);
  const currentFeedback = currentAnswer && currentAnswer.feedback ? 
    (typeof currentAnswer.feedback === 'string' ? 
      JSON.parse(currentAnswer.feedback) : 
      currentAnswer.feedback) : null;
  
  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Interview Results Summary</CardTitle>
              <CardDescription>
                Session completed on {new Date(sessionData.end_time).toLocaleDateString()}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={exportResults}>
                <Download className="h-4 w-4 mr-2" /> Export
              </Button>
              <Button size="sm" variant="outline">
                <Share2 className="h-4 w-4 mr-2" /> Share
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Overall Score */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Overall Performance</h3>
              <div className="flex items-center gap-4">
                <div className="h-24 w-24 rounded-full bg-muted/30 flex items-center justify-center">
                  <span className="text-3xl font-bold">{overallScore}%</span>
                </div>
                <div className="space-y-2">
                  <p className="text-muted-foreground">
                    Based on {feedbacks.length} analyzed responses
                  </p>
                  <Badge variant={
                    overallScore >= 80 ? "default" : 
                    overallScore >= 50 ? "outline" : 
                    "destructive"
                  }>
                    {
                      overallScore >= 80 ? "Excellent" : 
                      overallScore >= 70 ? "Good" : 
                      overallScore >= 60 ? "Satisfactory" : 
                      overallScore >= 50 ? "Needs Improvement" : 
                      "Unsatisfactory"
                    }
                  </Badge>
                </div>
              </div>
              
              {/* Analyze Button */}
              {answers.length > feedbacks.length && (
                <Button 
                  onClick={handleAnalyzeAnswers} 
                  disabled={analyzeInProgress}
                  className="w-full"
                >
                  {analyzeInProgress ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                      Analyzing Answers...
                    </>
                  ) : (
                    'Analyze Unevaluated Answers'
                  )}
                </Button>
              )}
            </div>
            
            {/* Score Distribution Chart */}
            <div>
              <h3 className="text-lg font-medium mb-4">Score Distribution</h3>
              {feedbacks.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={createScoreDistributionData()}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {createScoreDistributionData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center bg-muted/20 rounded-md">
                  <p className="text-muted-foreground">No analyzed answers yet</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Detailed Results Tabs */}
      <Tabs defaultValue="questions">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="questions">Question Analysis</TabsTrigger>
          <TabsTrigger value="strengths">Strengths & Weaknesses</TabsTrigger>
        </TabsList>
        
        <TabsContent value="questions">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Question Details</CardTitle>
                <div className="text-sm text-muted-foreground">
                  {currentQuestionIndex + 1} of {questions.length}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {questions.length > 0 ? (
                <>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Question:</h4>
                      <p className="p-4 bg-muted/30 rounded-md">{currentQuestion?.question_text}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium">Your Answer:</h4>
                      <p className="p-4 bg-muted/30 rounded-md">{currentAnswer?.answer_text || 'No answer provided'}</p>
                    </div>
                    
                    {currentFeedback ? (
                      <div className="space-y-4">
                        <Separator />
                        
                        <div className="space-y-2">
                          <h4 className="font-medium">Feedback:</h4>
                          <p className="p-4 bg-muted/30 rounded-md">{currentFeedback.feedback}</p>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between mb-1">
                            <span className="font-medium">Score:</span>
                            <span className="font-medium">{currentFeedback.score}/100</span>
                          </div>
                          <Progress value={currentFeedback.score} className="h-2" />
                        </div>
                        
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <h4 className="font-medium">Strengths:</h4>
                            <ul className="space-y-1">
                              {currentFeedback.strengths && currentFeedback.strengths.length > 0 ? (
                                currentFeedback.strengths.map((strength, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                                    <span>{strength}</span>
                                  </li>
                                ))
                              ) : (
                                <li className="text-muted-foreground">No strengths identified</li>
                              )}
                            </ul>
                          </div>
                          
                          <div className="space-y-2">
                            <h4 className="font-medium">Areas for Improvement:</h4>
                            <ul className="space-y-1">
                              {currentFeedback.weaknesses && currentFeedback.weaknesses.length > 0 ? (
                                currentFeedback.weaknesses.map((weakness, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                                    <span>{weakness}</span>
                                  </li>
                                ))
                              ) : (
                                <li className="text-muted-foreground">No weaknesses identified</li>
                              )}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 border border-dashed rounded-md flex flex-col items-center justify-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        <p className="text-muted-foreground">No feedback available yet</p>
                        <Button 
                          size="sm" 
                          onClick={handleAnalyzeAnswers} 
                          disabled={analyzeInProgress}
                        >
                          {analyzeInProgress ? 'Analyzing...' : 'Generate Feedback'}
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {/* Question navigation */}
                  <div className="flex justify-between pt-4">
                    <Button
                      variant="outline"
                      onClick={() => navigateQuestions('prev')}
                      disabled={currentQuestionIndex === 0}
                    >
                      Previous Question
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigateQuestions('next')}
                      disabled={currentQuestionIndex === questions.length - 1}
                    >
                      Next Question
                    </Button>
                  </div>
                </>
              ) : (
                <div className="p-4 text-center">
                  <p className="text-muted-foreground">No questions found for this session</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="strengths">
          <Card>
            <CardHeader>
              <CardTitle>Overall Strengths & Weaknesses</CardTitle>
              <CardDescription>
                Summary of performance across all questions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {feedbacks.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Key Strengths</h3>
                    <ul className="space-y-2">
                      {/* Collect and deduplicate all strengths */}
                      {Array.from(new Set(
                        feedbacks
                          .flatMap(fb => fb.strengths || [])
                          .filter(Boolean)
                      )).map((strength, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4">Areas for Improvement</h3>
                    <ul className="space-y-2">
                      {/* Collect and deduplicate all weaknesses */}
                      {Array.from(new Set(
                        feedbacks
                          .flatMap(fb => fb.weaknesses || [])
                          .filter(Boolean)
                      )).map((weakness, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                          <span>{weakness}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No analyzed answers available</p>
                  <Button 
                    onClick={handleAnalyzeAnswers} 
                    disabled={analyzeInProgress || answers.length === 0}
                  >
                    {analyzeInProgress ? 'Analyzing...' : 'Analyze Answers'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InterviewResults;
