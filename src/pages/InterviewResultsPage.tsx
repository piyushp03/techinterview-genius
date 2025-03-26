
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import InterviewResults from '@/components/InterviewResults';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const InterviewResultsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState<any>(null);

  useEffect(() => {
    const fetchSessionData = async () => {
      if (!id || !user) return;
      
      try {
        const { data, error } = await supabase
          .from('interview_sessions')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();
        
        if (error) throw error;
        
        if (!data) {
          toast.error('Interview session not found');
          navigate('/history');
          return;
        }
        
        setSessionData(data);
      } catch (error: any) {
        console.error('Error fetching interview session:', error);
        toast.error('Failed to load interview session');
        navigate('/history');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSessionData();
  }, [id, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container py-8 px-4 md:px-6">
          <div className="flex justify-center py-10">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container py-8 px-4 md:px-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Button variant="ghost" onClick={() => navigate('/history')} className="mr-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to History
            </Button>
          </div>
          <div>
            <h2 className="text-xl font-semibold">{sessionData?.role_type} Interview Results</h2>
            <p className="text-sm text-muted-foreground">Category: {sessionData?.category}, Language: {sessionData?.language}</p>
          </div>
        </div>
        
        <InterviewResults sessionId={id || ''} />
      </main>
    </div>
  );
};

export default InterviewResultsPage;
