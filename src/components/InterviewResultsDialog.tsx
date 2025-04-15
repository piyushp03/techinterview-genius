
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PieChart, Pie, Cell } from 'recharts';
import { Bar } from 'lucide-react';

interface InterviewResultsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId?: string;
}

const InterviewResultsDialog: React.FC<InterviewResultsDialogProps> = ({ open, onOpenChange, sessionId }) => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('quiz-history');
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  
  useEffect(() => {
    if (open && sessionId) {
      loadSessionData(sessionId);
    }
  }, [open, sessionId]);
  
  const loadSessionData = async (id: string) => {
    setLoading(true);
    try {
      // Fetch session data
      const { data: sessionData, error: sessionError } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('id', id)
        .single();
      
      if (sessionError) throw sessionError;
      setSession(sessionData);
      
      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('interview_messages')
        .select('*')
        .eq('session_id', id)
        .order('created_at', { ascending: true });
      
      if (messagesError) throw messagesError;
      setMessages(messagesData || []);
      
      // Fetch analysis
      const { data: analysisData, error: analysisError } = await supabase
        .from('interview_analysis')
        .select('*')
        .eq('session_id', id)
        .single();
      
      if (!analysisError) {
        setAnalysis(analysisData);
      }
      
      // Generate performance data
      generateMockPerformanceData();
      
    } catch (error) {
      console.error('Error loading interview results:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const generateMockPerformanceData = () => {
    // Mock data for performance over time chart
    const mockData = [
      { date: '3/1/2025', score: 55 },
      { date: '3/5/2025', score: 25 },
      { date: '3/7/2025', score: 42 },
      { date: '3/10/2025', score: 40 },
      { date: '3/15/2025', score: 8 },
      { date: '3/20/2025', score: 35 },
      { date: '3/25/2025', score: 25 },
      { date: '3/30/2025', score: 45 },
      { date: '4/5/2025', score: 25 },
      { date: '4/10/2025', score: 15 },
    ];
    
    setPerformanceData(mockData);
  };
  
  const pieData = [
    { name: 'Medium', value: 36, color: '#818CF8' },
    { name: 'Hard', value: 26, color: '#60A5FA' },
  ];
  
  const difficultyData = [
    { difficulty: 'beginner', score: 8, quizzes: 7 },
    { difficulty: 'intermediate', score: 36, quizzes: 26 },
    { difficulty: 'advanced', score: 26, quizzes: 16 },
    { difficulty: 'expert', score: 15, quizzes: 6 },
    { difficulty: 'hard', score: 5, quizzes: 2 },
  ];
  
  const formatInterviewContent = (content: string) => {
    return content.split('\n').map((line, i) => (
      <p key={i} className="mb-2">{line}</p>
    ));
  };
  
  const viewDetails = () => {
    if (session) {
      navigate(`/interview/results/${session.id}`);
      onOpenChange(false);
    }
  };
  
  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px]">
          <div className="flex justify-center items-center h-64">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-purple-600">Your Quiz History</DialogTitle>
          <DialogDescription>
            Review your past interview sessions and performance
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="quiz-history" value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="quiz-history" className="flex-1">Quiz History</TabsTrigger>
            <TabsTrigger value="performance" className="flex-1">Performance</TabsTrigger>
            <TabsTrigger value="analysis" className="flex-1">Analysis</TabsTrigger>
          </TabsList>
          
          <TabsContent value="quiz-history" className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <p>No questions attempted in this interview session.</p>
                <Button onClick={() => navigate('/new-interview')} className="mt-4">
                  Start a New Interview
                </Button>
              </div>
            ) : (
              messages.filter(msg => !msg.is_bot).map((message, index) => {
                // Find the corresponding question
                const questionIndex = messages.findIndex(m => m.is_bot && m.created_at < message.created_at);
                const question = questionIndex >= 0 ? messages[questionIndex] : null;
                
                return (
                  <Card key={message.id} className="p-4 mb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{question ? `Quiz on ${session.category}` : 'Response'}</h3>
                        <p className="text-sm text-muted-foreground">
                          {message.created_at ? format(new Date(message.created_at), 'PPp') : ''}
                        </p>
                      </div>
                      <div className="px-3 py-1 rounded-full text-sm bg-red-100 text-red-800">
                        {index === 0 ? '15%' : '26%'}
                      </div>
                    </div>
                    
                    <div className="flex items-center mt-2">
                      <div className="flex items-center mr-4">
                        <span className="text-amber-500 mr-1">⭐</span>
                        <span className="text-sm font-medium">{index === 0 ? '3/20' : '5/19'} correct</span>
                      </div>
                      <div className="flex items-center mr-4">
                        <span className="text-blue-500 mr-1">⏱️</span>
                        <span className="text-sm font-medium">{index === 0 ? '0m 4s' : '0m 6s'}</span>
                      </div>
                      <div className="px-2 py-1 rounded-md text-xs bg-blue-100 text-blue-800">
                        Medium
                      </div>
                    </div>
                    
                    <div className="mt-4 flex justify-end">
                      <Button variant="link" className="text-purple-600">Show Details ↓</Button>
                    </div>
                  </Card>
                );
              })
            )}
          </TabsContent>
          
          <TabsContent value="performance">
            <div className="space-y-8">
              <div className="h-[300px]">
                <h3 className="text-lg font-medium mb-2">Performance Over Time</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#8884d8"
                      strokeWidth={2}
                      dot={{ r: 5 }}
                      activeDot={{ r: 8 }}
                      name="Score (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-4">Performance by Difficulty</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={difficultyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="difficulty" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="score" name="Average Score (%)" stroke="#8884d8" />
                        <Line type="monotone" dataKey="quizzes" name="Number of Quizzes" stroke="#82ca9d" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="h-[300px] flex flex-col items-center justify-center">
                    <h4 className="text-center mb-4">Score Distribution</h4>
                    <div className="relative">
                      <ResponsiveContainer width={250} height={250}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                            label
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                        <div className="text-2xl font-bold text-blue-500">36</div>
                        <div className="text-sm text-gray-500">medium</div>
                      </div>
                    </div>
                    <div className="flex justify-center gap-4 mt-2">
                      <div>
                        <span className="inline-block w-3 h-3 rounded-full bg-[#818CF8] mr-1"></span>
                        <span className="text-xs">Medium: 36%</span>
                      </div>
                      <div>
                        <span className="inline-block w-3 h-3 rounded-full bg-[#60A5FA] mr-1"></span>
                        <span className="text-xs">Hard: 26%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="analysis">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Interview Analysis</h3>
              
              {analysis ? (
                <div className="prose max-w-none dark:prose-invert">
                  <div dangerouslySetInnerHTML={{ __html: analysis.summary.analysisText || 'No analysis available.' }} />
                  
                  <h4>Strengths</h4>
                  <ul>
                    {analysis.summary.strengths?.map((strength: string, i: number) => (
                      <li key={i}>{strength}</li>
                    )) || <li>No strengths identified</li>}
                  </ul>
                  
                  <h4>Areas for Improvement</h4>
                  <ul>
                    {analysis.summary.weaknesses?.map((weakness: string, i: number) => (
                      <li key={i}>{weakness}</li>
                    )) || <li>No improvement areas identified</li>}
                  </ul>
                  
                  <h4>Recommendations</h4>
                  <ul>
                    {analysis.summary.recommendations?.map((rec: string, i: number) => (
                      <li key={i}>{rec}</li>
                    )) || <li>No recommendations available</li>}
                  </ul>
                </div>
              ) : (
                <div className="bg-muted p-4 rounded-md">
                  <p>No detailed analysis available for this interview session.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end mt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="mr-2">
            Close
          </Button>
          <Button onClick={viewDetails}>
            View Full Results
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InterviewResultsDialog;
