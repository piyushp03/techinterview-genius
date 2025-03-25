
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History as HistoryIcon, Calendar, ChevronRight, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

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
    if (!confirm('Are you sure you want to delete this interview session?')) {
      return;
    }
    
    try {
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
      'General Programming': 'bg-blue-100 text-blue-800',
      'Algorithms & Data Structures': 'bg-purple-100 text-purple-800',
      'System Design': 'bg-red-100 text-red-800',
      'Object-Oriented Design': 'bg-amber-100 text-amber-800',
      'Database': 'bg-green-100 text-green-800',
      'Web Development': 'bg-indigo-100 text-indigo-800',
      'Cloud & DevOps': 'bg-sky-100 text-sky-800',
      'Behavioral': 'bg-teal-100 text-teal-800',
    };
    
    return categories[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container py-8 px-4 md:px-6">
        <h1 className="text-3xl font-bold mb-6">Interview History</h1>
        
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
            {sessions.map((session) => (
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
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Language:</span>
                      <span className="text-sm">{session.language}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleDeleteSession(session.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                  <Button 
                    variant="outline" 
                    className="gap-1"
                    onClick={() => navigate(`/interview/${session.id}`)}
                  >
                    Continue Session
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default History;
