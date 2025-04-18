
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History as HistoryIcon, Calendar, ChevronRight, Trash2, Clock, CheckCircle, BarChart } from 'lucide-react';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const History = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [sessionMessages, setSessionMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSessions();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchSessions = async () => {
    if (!user) {
      toast.error("Please log in to view your interview history");
      navigate("/auth");
      return;
    }
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setSessions(data || []);
    } catch (error: any) {
      console.error('Error fetching interview sessions:', error);
      setError(error.message || 'Failed to load interview history');
      setIsErrorDialogOpen(true);
      
      // Create some fallback data for testing
      const fallbackSessions = [
        {
          id: "fallback-1",
          role_type: "Frontend Developer",
          category: "algorithms",
          language: "JavaScript",
          current_question_count: 4,
          questions_limit: 5,
          created_at: new Date().toISOString(),
          start_time: new Date(Date.now() - 3600000).toISOString(),
          end_time: new Date().toISOString(),
        },
        {
          id: "fallback-2",
          role_type: "Fullstack Developer",
          category: "system-design",
          language: "TypeScript",
          current_question_count: 2,
          questions_limit: 5,
          created_at: new Date(Date.now() - 86400000).toISOString(),
          start_time: new Date(Date.now() - 86400000).toISOString(),
          end_time: null,
        }
      ];
      
      setSessions(fallbackSessions);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionMessages = async (sessionId: string) => {
    if (!sessionId) return;
    
    try {
      setLoadingMessages(true);
      
      const { data, error } = await supabase
        .from('interview_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      setSessionMessages(data || []);
    } catch (error: any) {
      console.error('Error fetching session messages:', error);
      toast.error('Failed to load interview messages');
      setSessionMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleViewSession = async (session: any) => {
    setSelectedSession(session);
    await fetchSessionMessages(session.id);
    setIsViewDialogOpen(true);
  };

  const handleDeleteSession = async (id: string) => {
    try {
      // First, delete related messages
      const { error: messagesError } = await supabase
        .from('interview_messages')
        .delete()
        .eq('session_id', id);
        
      if (messagesError) throw messagesError;
      
      // Delete any analysis
      const { error: analysisError } = await supabase
        .from('interview_analysis')
        .delete()
        .eq('session_id', id);
        
      if (analysisError) throw analysisError;
      
      // Finally, delete the session
      const { error } = await supabase
        .from('interview_sessions')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);
        
      if (error) throw error;
      
      toast.success('Interview session deleted');
      fetchSessions();
    } catch (error: any) {
      console.error('Error deleting session:', error);
      toast.error(error.message || 'Failed to delete session');
    }
  };

  const getCategoryColor = (category: string) => {
    const categories: Record<string, string> = {
      'algorithms': 'bg-purple-100 text-purple-800',
      'system-design': 'bg-red-100 text-red-800',
      'behavioral': 'bg-teal-100 text-teal-800',
      'language-specific': 'bg-indigo-100 text-indigo-800',
      'frontend': 'bg-blue-100 text-blue-800',
      'backend': 'bg-green-100 text-green-800',
      'fullstack': 'bg-amber-100 text-amber-800',
      'voice-interview': 'bg-pink-100 text-pink-800',
      'general': 'bg-slate-100 text-slate-800',
      'Technical': 'bg-cyan-100 text-cyan-800',
    };
    
    return categories[category] || 'bg-gray-100 text-gray-800';
  };

  const getSessionStatusInfo = (session: any) => {
    if (session.end_time) {
      return {
        status: 'Completed',
        icon: <CheckCircle className="h-4 w-4 text-green-500" />,
        buttonText: 'View Results',
        action: () => handleViewSession(session),
      };
    } else if (session.start_time) {
      return {
        status: 'In Progress',
        icon: <Clock className="h-4 w-4 text-amber-500" />,
        buttonText: 'Continue Session',
        action: () => navigate(`/interview/${session.id}`),
      };
    } else {
      return {
        status: 'Not Started',
        icon: <Calendar className="h-4 w-4 text-blue-500" />,
        buttonText: 'Start Session',
        action: () => navigate(`/interview/${session.id}`),
      };
    }
  };

  const calculateProgress = (session: any) => {
    if (!session.current_question_count || !session.questions_limit) {
      return 0;
    }
    return Math.min(100, (session.current_question_count / session.questions_limit) * 100);
  };

  // Check if user is logged in
  if (!user && !loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container py-8 px-4 md:px-6 flex flex-col items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Authentication Required</CardTitle>
              <CardDescription>
                Please log in to view your interview history
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => navigate('/auth')} className="w-full">
                Go to Login
              </Button>
            </CardFooter>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container py-8 px-4 md:px-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Interview History</h1>
          <Button onClick={() => navigate('/interview/new')}>Start New Interview</Button>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-16">
            <HistoryIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No interview history yet</h3>
            <p className="text-muted-foreground mb-6">
              Start a new interview to begin tracking your practice sessions
            </p>
            <Button onClick={() => navigate('/interview/new')}>
              Start New Interview
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sessions.map((session) => {
              const { status, icon, buttonText, action } = getSessionStatusInfo(session);
              const category = session.category || 'general';
              
              return (
                <Card key={session.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle>{session.role_type}</CardTitle>
                      <Badge variant="outline" className={getCategoryColor(category)}>
                        {category}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {session.created_at ? format(new Date(session.created_at), 'PPP') : 'Unknown date'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Language:</span>
                        <span className="text-sm">{session.language || 'N/A'}</span>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>Progress:</span>
                          <span>{session.current_question_count || 0}/{session.questions_limit || 5}</span>
                        </div>
                        <Progress value={calculateProgress(session)} className="h-2" />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Status:</span>
                        <span className="text-sm flex items-center gap-1">
                          {icon} {status}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Interview Session</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this interview session? This action cannot be undone and all messages and analysis will be permanently deleted.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSession(session.id);
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    
                    <Button 
                      variant={session.end_time ? "default" : "outline"}
                      className="gap-1"
                      onClick={action}
                    >
                      {buttonText}
                      {session.end_time ? (
                        <BarChart className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <Dialog open={isErrorDialogOpen} onOpenChange={setIsErrorDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
            <DialogDescription>
              {error || 'An error occurred while loading the interview history.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={() => setIsErrorDialogOpen(false)}>
              Dismiss
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {selectedSession?.role_type} Interview
              {selectedSession?.created_at && (
                <span className="block text-sm font-normal text-muted-foreground mt-1">
                  {format(new Date(selectedSession.created_at), 'PPP')}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto mt-4 py-2">
            {loadingMessages ? (
              <div className="flex justify-center py-10">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : sessionMessages.length === 0 ? (
              <p className="text-muted-foreground text-center py-10">
                No messages found for this interview session.
              </p>
            ) : (
              <div className="space-y-4 px-2">
                {sessionMessages.map((message) => (
                  <div 
                    key={message.id}
                    className={`flex ${message.is_bot ? 'justify-start' : 'justify-end'}`}
                  >
                    <div 
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.is_bot ? 'bg-muted' : 'bg-primary text-primary-foreground'
                      }`}
                    >
                      <div className="mb-1">
                        {message.content}
                      </div>
                      <div className="text-xs opacity-70 text-right">
                        {message.created_at && formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="pt-4 flex justify-end">
            <Button onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default History;
