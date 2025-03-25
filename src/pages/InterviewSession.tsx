import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import InterviewPanel from '@/components/InterviewPanel';
import { Button } from '@/components/ui/button';
import { Maximize, Minimize, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const InterviewSession = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [sessionData, setSessionData] = useState<any>(null);

  useEffect(() => {
    const fetchSessionData = async () => {
      if (!id) return;
      
      try {
        // Fixed: Use "interview_sessions" as a string without type safety
        const { data, error } = await supabase
          .from('interview_sessions')
          .select('*')
          .eq('id', id)
          .eq('user_id', user?.id)
          .single();
        
        if (error) throw error;
        
        if (!data) {
          toast.error('Interview session not found');
          navigate('/dashboard');
          return;
        }
        
        setSessionData(data);
      } catch (error: any) {
        console.error('Error fetching interview session:', error);
        toast.error(error.message || 'Failed to load interview session');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSessionData();
  }, [id, user, navigate]);

  const toggleFullScreen = () => {
    setIsFullScreen(prev => !prev);
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background flex flex-col ${isFullScreen ? 'h-screen overflow-hidden' : ''}`}>
      {!isFullScreen && <Navbar />}
      
      <main className={`flex-1 container ${isFullScreen ? 'max-w-none container-fluid p-0 h-full' : 'py-6 px-4'}`}>
        {!isFullScreen && (
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mr-2">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
            <div>
              <h2 className="text-xl font-semibold">{sessionData?.role_type} Interview ({sessionData?.category})</h2>
              <p className="text-sm text-muted-foreground">Language: {sessionData?.language}</p>
            </div>
            <div>
              <Button variant="outline" onClick={toggleFullScreen}>
                <Maximize className="h-4 w-4 mr-2" />
                Fullscreen
              </Button>
            </div>
          </div>
        )}
        
        <div className={`${isFullScreen ? 'h-full' : 'h-[calc(100vh-200px)]'}`}>
          <InterviewPanel 
            isFullScreen={isFullScreen} 
            toggleFullScreen={toggleFullScreen} 
          />
        </div>
      </main>
    </div>
  );
};

export default InterviewSession;
