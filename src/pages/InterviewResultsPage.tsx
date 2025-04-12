
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import InterviewResults from '@/components/InterviewResults';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const InterviewResultsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showResults, setShowResults] = useState(true);

  useEffect(() => {
    const fetchSessionData = async () => {
      if (!id || !user) return;
      
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('interview_sessions')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (error) {
          console.error('Error fetching interview session:', error);
          setError('Failed to load interview session');
          setIsDialogOpen(true);
        } else if (!data) {
          setError('Interview session not found');
          setIsDialogOpen(true);
        } else {
          setSessionData(data);
          
          // Check if the interview has been completed
          if (!data.end_time) {
            navigate(`/interview/${id}`);
            toast.info('This interview session is still in progress');
          }
        }
      } catch (error: any) {
        console.error('Error fetching interview session:', error);
        setError('Failed to load interview session');
        setIsDialogOpen(true);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSessionData();
  }, [id, user, navigate]);

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    navigate('/history');
  };

  const toggleResultsView = () => {
    setShowResults(!showResults);
  };

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
          {sessionData && (
            <div>
              <h2 className="text-xl font-semibold">{sessionData?.role_type} Interview Results</h2>
              <p className="text-sm text-muted-foreground">Category: {sessionData?.category}, Language: {sessionData?.language}</p>
            </div>
          )}
          <Button variant="outline" onClick={toggleResultsView}>
            {showResults ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Hide Results
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Show Results
              </>
            )}
          </Button>
        </div>
        
        {id && showResults && <InterviewResults sessionId={id} />}
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
            <DialogDescription>
              {error || 'An error occurred while loading the interview results.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={handleCloseDialog}>
              Return to History
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InterviewResultsPage;
