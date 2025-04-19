
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ArrowLeft, Clock, MessageCircle, BarChart2, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

const InterviewResultsPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!id) return;
    loadSessionData(id);
  }, [id, user]);
  
  const loadSessionData = async (sessionId: string) => {
    try {
      setLoading(true);
      
      // Fetch session details
      const { data: sessionData, error: sessionError } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', user?.id)
        .single();
      
      if (sessionError) throw sessionError;
      if (!sessionData) throw new Error('Interview session not found');
      
      setSession(sessionData);
      
      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('interview_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
      
      if (messagesError) throw messagesError;
      setMessages(messagesData || []);
      
      // Fetch analysis
      const { data: analysisData, error: analysisError } = await supabase
        .from('interview_analysis')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (!analysisError) {
        setAnalysis(analysisData);
      } else {
        // Generate mock analysis if none exists
        await generateAndSaveAnalysis(sessionId, messagesData || []);
      }
      
    } catch (error: any) {
      console.error('Error loading interview results:', error);
      setError(error.message || 'Failed to load interview results');
      toast.error('Failed to load interview results');
    } finally {
      setLoading(false);
    }
  };
  
  const generateAndSaveAnalysis = async (sessionId: string, messages: any[]) => {
    try {
      // Create analysis structure
      const mockAnalysis = {
        id: `analysis-${Date.now()}`,
        session_id: sessionId,
        summary: {
          analysisText: 'This interview focused on key technical concepts relevant to the position. The candidate demonstrated good understanding of core concepts but could improve on technical depth and provide more concrete examples.',
          strengths: [
            'Clear communication style',
            'Good problem-solving approach',
            'Demonstrated understanding of basic concepts'
          ],
          weaknesses: [
            'Could provide more detailed technical explanations',
            'Limited examples from past experience',
            'Some hesitation when discussing system design'
          ],
          recommendations: [
            'Practice explaining technical concepts in more depth',
            'Prepare more concrete examples from past experience',
            'Review system design fundamentals'
          ],
          score: 72
        },
        created_at: new Date().toISOString()
      };
      
      // Save to database
      const { data, error } = await supabase
        .from('interview_analysis')
        .insert(mockAnalysis)
        .select();
      
      if (error) throw error;
      
      setAnalysis(data[0]);
    } catch (error) {
      console.error('Error generating analysis:', error);
    }
  };
  
  const performanceData = [
    { date: '3/1/2025', score: 55 },
    { date: '3/5/2025', score: 25 },
    { date: '3/7/2025', score: 42 },
    { date: '3/10/2025', score: 40 },
    { date: '3/15/2025', score: 8 },
    { date: '3/20/2025', score: 35 },
    { date: '3/25/2025', score: 25 }
  ];
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex justify-center items-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </div>
    );
  }
  
  if (error || !session) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container py-8 px-4 md:px-6">
          <Button variant="ghost" onClick={() => navigate('/history')} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to History
          </Button>
          
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-destructive mr-2" />
                Error
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>{error || 'Interview session not found'}</p>
              <Button onClick={() => navigate('/history')} className="mt-4">
                Return to History
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }
  
  // Calculate the number of questions and answers
  const questions = messages.filter(m => m.is_bot);
  const answers = messages.filter(m => !m.is_bot);
  const hasNoAnswers = answers.length === 0;
  
  // Format the interview content
  const formatContent = (content: string) => {
    return content.split('\n').map((line, i) => (
      <p key={i} className="mb-2">{line}</p>
    ));
  };
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container py-8 px-4 md:px-6">
        <Button variant="ghost" onClick={() => navigate('/history')} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to History
        </Button>
        
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Interview Results</h1>
            <p className="text-muted-foreground mt-1">
              {session.role_type} Interview ({session.language})
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="px-3 py-1 text-sm">
              {session.category}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {session.created_at && format(new Date(session.created_at), 'PPP')}
            </span>
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <MessageCircle className="h-5 w-5 mr-2 text-blue-500" />
                Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{questions.length}</div>
              <p className="text-sm text-muted-foreground">Total questions asked</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <BarChart2 className="h-5 w-5 mr-2 text-green-500" />
                Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{analysis?.summary?.score || 'N/A'}</div>
              <p className="text-sm text-muted-foreground">Overall performance score</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Clock className="h-5 w-5 mr-2 text-amber-500" />
                Duration
              </CardTitle>
            </CardHeader>
            <CardContent>
              {session.start_time && session.end_time ? (
                <>
                  <div className="text-3xl font-bold">
                    {Math.round((new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / 60000)} min
                  </div>
                  <p className="text-sm text-muted-foreground">Interview duration</p>
                </>
              ) : (
                <>
                  <div className="text-3xl font-bold">--</div>
                  <p className="text-sm text-muted-foreground">Not completed</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="interview" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="interview">Interview</TabsTrigger>
            <TabsTrigger value="analysis" disabled={hasNoAnswers}>Analysis</TabsTrigger>
            <TabsTrigger value="performance" disabled={hasNoAnswers}>Performance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="interview">
            <div className="space-y-6">
              {messages.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-medium mb-2">No Questions Attempted</h3>
                    <p className="text-muted-foreground mb-4">
                      This interview session doesn't have any questions or answers yet.
                    </p>
                    <Button onClick={() => navigate('/new-interview')}>
                      Start New Interview
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                messages.map((message, index) => (
                  <Card key={message.id}>
                    <CardHeader className={!message.is_bot ? 'bg-muted/30' : ''}>
                      <CardTitle className="text-sm flex items-center">
                        {message.is_bot ? (
                          <>AI Interviewer</>
                        ) : (
                          <>Your Response</>
                        )}
                        <span className="ml-auto text-xs text-muted-foreground">
                          {message.created_at && format(new Date(message.created_at), 'h:mm a')}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        {formatContent(message.content)}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="analysis">
            {analysis ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Overall Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose dark:prose-invert max-w-none">
                      <p>{analysis.summary.analysisText}</p>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="grid gap-6 md:grid-cols-3">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-green-600">Strengths</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc list-inside space-y-2">
                        {analysis.summary.strengths?.map((item: string, idx: number) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-amber-600">Areas for Improvement</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc list-inside space-y-2">
                        {analysis.summary.weaknesses?.map((item: string, idx: number) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-blue-600">Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc list-inside space-y-2">
                        {analysis.summary.recommendations?.map((item: string, idx: number) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-medium mb-2">No Analysis Available</h3>
                  <p className="text-muted-foreground mb-4">
                    Analysis is not available for this interview session.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="performance">
            <Card>
              <CardHeader>
                <CardTitle>Performance Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="mt-8 flex justify-between">
          <Button variant="outline" onClick={() => navigate('/history')}>
            Back to History
          </Button>
          <Button onClick={() => navigate('/new-interview')}>
            Start New Interview
          </Button>
        </div>
      </main>
    </div>
  );
};

export default InterviewResultsPage;
