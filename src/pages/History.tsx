
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
import { format } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const History = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, [user]);

  const fetchSessions = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setSessions(data || []);
    } catch (error: any) {
      console.error('Error fetching interview sessions:', error);
      toast.error(error.message || 'Failed to load interview history');
    } finally {
      setLoading(false);
    }
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
    };
    
    return categories[category] || 'bg-gray-100 text-gray-800';
  };

  const getSessionStatusInfo = (session: any) => {
    if (session.end_time) {
      return {
        status: 'Completed',
        icon: <CheckCircle className="h-4 w-4 text-green-500" />,
        buttonText: 'View Results',
        action: () => navigate(`/interview/results/${session.id}`),
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
              
              return (
                <Card key={session.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle>{session.role_type}</CardTitle>
                      <Badge variant="outline" className={getCategoryColor(session.category)}>
                        {session.category}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(session.created_at), 'PPP')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Language:</span>
                        <span className="text-sm">{session.language}</span>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>Progress:</span>
                          <span>{session.current_question_count || 0}/{session.questions_limit}</span>
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
    </div>
  );
};

export default History;
