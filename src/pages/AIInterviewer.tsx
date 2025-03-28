
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useInterview } from '@/context/InterviewContext';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import VoiceInterviewer from '@/components/VoiceInterviewer';
import InterviewAnalysisResults from '@/components/InterviewAnalysisResults';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Clock, FileText, User, ChartBar, Mic, PlayCircle, ArrowRight } from 'lucide-react';
import { analyzeInterviewSession } from '@/utils/interviewAnalysisService';

const AIInterviewer = () => {
  const { user } = useAuth();
  const { startSession, endSession, session, isActive } = useInterview();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('interview');
  const [selectedRole, setSelectedRole] = useState('Software Engineer');
  const [selectedCategory, setSelectedCategory] = useState('JavaScript');
  const [interviewMessages, setInterviewMessages] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);
  const [showInterview, setShowInterview] = useState(false);
  const [previousSessions, setPreviousSessions] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchPreviousSessions();
    }
  }, [user]);

  const fetchPreviousSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('user_id', user?.id)
        .eq('category', 'voice-interview')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      
      setPreviousSessions(data || []);
    } catch (error) {
      console.error('Error fetching previous sessions:', error);
    }
  };

  const startInterview = () => {
    setShowInterview(true);
    setActiveTab('interview');
  };

  const handleInterviewComplete = async (messages: any[]) => {
    setLoading(true);
    setInterviewMessages(messages);
    
    try {
      // Extract questions and answers
      const questions: string[] = [];
      const answers: string[] = [];
      
      // Skip the first welcome message
      for (let i = 1; i < messages.length; i++) {
        const message = messages[i];
        if (message.role === 'assistant') {
          questions.push(message.content);
        } else if (message.role === 'user') {
          answers.push(message.content);
        }
      }
      
      // Make sure we have matching pairs
      while (questions.length > answers.length) {
        questions.pop();
      }
      
      // Analyze the interview
      const analysisResult = await analyzeInterviewSession(
        questions,
        answers,
        selectedRole,
        selectedCategory
      );
      
      setAnalysis(analysisResult);
      
      // Save the session to the database
      if (user) {
        const { data, error } = await supabase
          .from('interview_sessions')
          .insert({
            user_id: user.id,
            role_type: selectedRole,
            category: 'voice-interview',
            language: 'english',
            start_time: new Date().toISOString(),
            end_time: new Date().toISOString(),
            questions_limit: questions.length,
            time_limit: 15,
            current_question_count: questions.length,
            is_completed: true
          })
          .select();
        
        if (error) throw error;
        
        const sessionId = data[0].id;
        
        // Save messages
        const messagePromises = messages.map(msg => 
          supabase
            .from('interview_messages')
            .insert({
              session_id: sessionId,
              is_bot: msg.role === 'assistant',
              content: msg.content,
              created_at: new Date(msg.timestamp).toISOString()
            })
        );
        
        await Promise.all(messagePromises);
        
        // Save analysis
        await supabase
          .from('interview_analysis')
          .insert({
            session_id: sessionId,
            summary: analysisResult,
            created_at: new Date().toISOString()
          });
        
        toast.success('Interview session saved successfully');
        fetchPreviousSessions();
      }
      
      setActiveTab('results');
    } catch (error) {
      console.error('Error analyzing interview:', error);
      toast.error('Failed to analyze interview');
    } finally {
      setLoading(false);
    }
  };

  const closeInterview = () => {
    setShowInterview(false);
  };

  const viewPreviousSession = async (sessionId: string) => {
    setLoading(true);
    try {
      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('interview_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
      
      if (messagesError) throw messagesError;
      
      // Fetch analysis
      const { data: analysisData, error: analysisError } = await supabase
        .from('interview_analysis')
        .select('*')
        .eq('session_id', sessionId)
        .single();
      
      if (analysisError && analysisError.code !== 'PGRST116') throw analysisError;
      
      // Format messages
      const formattedMessages = messagesData.map(msg => ({
        role: msg.is_bot ? 'assistant' : 'user',
        content: msg.content,
        timestamp: new Date(msg.created_at)
      }));
      
      setInterviewMessages(formattedMessages);
      
      if (analysisData) {
        setAnalysis(analysisData.summary);
      } else {
        // If no analysis exists, create one
        const questions = formattedMessages
          .filter(msg => msg.role === 'assistant')
          .map(msg => msg.content);
        
        const answers = formattedMessages
          .filter(msg => msg.role === 'user')
          .map(msg => msg.content);
        
        while (questions.length > answers.length) {
          questions.pop();
        }
        
        const session = previousSessions.find(s => s.id === sessionId);
        const newAnalysis = await analyzeInterviewSession(
          questions,
          answers,
          session?.role_type || 'Software Engineer',
          session?.category || 'JavaScript'
        );
        
        setAnalysis(newAnalysis);
        
        // Save the analysis
        await supabase
          .from('interview_analysis')
          .insert({
            session_id: sessionId,
            summary: newAnalysis,
            created_at: new Date().toISOString()
          });
      }
      
      setActiveTab('results');
    } catch (error) {
      console.error('Error fetching session data:', error);
      toast.error('Failed to load interview session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-6 px-4 md:px-6">
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">AI Interview Practice</h1>
              <p className="text-muted-foreground">
                Practice your interview skills with our AI interviewer and get feedback on your performance.
              </p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList>
              <TabsTrigger value="start">Start</TabsTrigger>
              <TabsTrigger value="interview" disabled={!showInterview}>Interview</TabsTrigger>
              <TabsTrigger value="results" disabled={!analysis}>Results</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="start" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Interview Practice Setup</CardTitle>
                  <CardDescription>
                    Configure your practice interview settings and start a session.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select value={selectedRole} onValueChange={setSelectedRole}>
                        <SelectTrigger id="role">
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Software Engineer">Software Engineer</SelectItem>
                          <SelectItem value="Frontend Developer">Frontend Developer</SelectItem>
                          <SelectItem value="Backend Developer">Backend Developer</SelectItem>
                          <SelectItem value="Full Stack Developer">Full Stack Developer</SelectItem>
                          <SelectItem value="DevOps Engineer">DevOps Engineer</SelectItem>
                          <SelectItem value="Data Scientist">Data Scientist</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="category">Topic</Label>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger id="category">
                          <SelectValue placeholder="Select a topic" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="JavaScript">JavaScript</SelectItem>
                          <SelectItem value="Python">Python</SelectItem>
                          <SelectItem value="React">React</SelectItem>
                          <SelectItem value="Node.js">Node.js</SelectItem>
                          <SelectItem value="System Design">System Design</SelectItem>
                          <SelectItem value="Data Structures">Data Structures</SelectItem>
                          <SelectItem value="Algorithms">Algorithms</SelectItem>
                          <SelectItem value="Behavioral">Behavioral</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <Card className="bg-muted/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-amber-500" />
                          <span>Duration</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">Approx. 10-15 minutes</p>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-muted/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center">
                          <FileText className="h-4 w-4 mr-2 text-blue-500" />
                          <span>Questions</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">4-5 technical questions</p>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-muted/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center">
                          <ChartBar className="h-4 w-4 mr-2 text-green-500" />
                          <span>Analysis</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">Performance feedback & tips</p>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={startInterview} className="w-full md:w-auto">
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Start Interview Practice
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>How It Works</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                        <Mic className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-medium">Speak or Type</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Interact with our AI interviewer via voice or text input
                      </p>
                    </div>
                    
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-medium">Answer Questions</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Respond to technical questions from the AI interviewer
                      </p>
                    </div>
                    
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                        <ChartBar className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-medium">Get Analysis</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Receive detailed feedback and performance metrics
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="interview" className="mt-6">
              <Card className="h-[calc(100vh-220px)]">
                <CardContent className="p-0 h-full">
                  {showInterview && (
                    <VoiceInterviewer
                      role={selectedRole}
                      category={selectedCategory}
                      onComplete={handleInterviewComplete}
                      onClose={closeInterview}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="results" className="mt-6">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
              ) : analysis ? (
                <InterviewAnalysisResults
                  analysis={analysis}
                  questions={interviewMessages
                    .filter(msg => msg.role === 'assistant')
                    .slice(1) // Skip welcome message
                    .map(msg => msg.content)}
                  answers={interviewMessages
                    .filter(msg => msg.role === 'user')
                    .map(msg => msg.content)}
                />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>No Results Available</CardTitle>
                    <CardDescription>
                      Complete an interview to see your performance analysis.
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="history" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Previous Interview Sessions</CardTitle>
                  <CardDescription>
                    View and analyze your past interview practice sessions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {previousSessions.length > 0 ? (
                    <div className="space-y-4">
                      {previousSessions.map((session) => (
                        <Card key={session.id} className="bg-muted/50">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-base">
                                {session.role_type} Interview
                              </CardTitle>
                              <Badge variant="outline">
                                {new Date(session.created_at).toLocaleDateString()}
                              </Badge>
                            </div>
                            <CardDescription>
                              Topic: {session.category}
                            </CardDescription>
                          </CardHeader>
                          <CardFooter className="pt-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => viewPreviousSession(session.id)}
                              className="ml-auto"
                            >
                              View Results
                              <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">
                        You haven't completed any interview practice sessions yet.
                      </p>
                      <Button 
                        variant="outline" 
                        onClick={() => setActiveTab('start')}
                        className="mt-4"
                      >
                        Start Your First Interview
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default AIInterviewer;
