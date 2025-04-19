
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSessionData = async () => {
      if (!id || !user) return;
      
      try {
        // Validate the session ID to ensure it's a valid UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(id)) {
          setError("Invalid session ID format");
          setLoading(false);
          return;
        }
        
        const { data, error } = await supabase
          .from('interview_sessions')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (error) {
          console.error('Error fetching interview session:', error);
          setError("Failed to load interview session");
        } else if (!data) {
          setError("Interview session not found");
        } else {
          setSessionData(data);
        }
      } catch (error: any) {
        console.error('Error fetching interview session:', error);
        setError("An unexpected error occurred");
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

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container py-8 px-4 md:px-6">
          <div className="flex justify-between items-center mb-6">
            <Button variant="ghost" onClick={() => navigate('/history')} className="mr-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to History
            </Button>
          </div>
          
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 max-w-2xl mx-auto text-center">
            <h2 className="text-xl font-semibold text-destructive mb-2">Error</h2>
            <p className="mb-4">{error}</p>
            <Button onClick={() => navigate('/history')}>
              Return to History
            </Button>
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
