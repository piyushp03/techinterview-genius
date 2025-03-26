
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Navbar from '@/components/Navbar';
import VoiceInterviewer from '@/components/VoiceInterviewer';
import { Mic, Info, Clock } from 'lucide-react';

const AIInterviewer = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showInterviewer, setShowInterviewer] = useState(false);
  const [interviewDuration, setInterviewDuration] = useState(30); // default 30 minutes

  const startInterview = () => {
    setShowInterviewer(true);
  };

  const closeInterview = () => {
    setShowInterviewer(false);
    // Refresh the page to reset state
    window.location.reload();
  };

  if (!user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="mb-4">Please sign in to access this feature.</p>
          <Button onClick={() => navigate('/auth')}>Sign In</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      {showInterviewer ? (
        <VoiceInterviewer onClose={closeInterview} duration={interviewDuration} />
      ) : (
        <main className="flex-1 container py-8 px-4 md:px-6">
          <h1 className="text-3xl font-bold mb-2">AI Voice Interviewer</h1>
          <p className="text-muted-foreground mb-8">
            Practice your interview skills with our AI voice interviewer that gives real-time feedback.
          </p>
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Start Voice Interview</CardTitle>
                <CardDescription>
                  Configure your interview settings before starting
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="duration">Interview Duration</Label>
                    <span className="text-sm font-medium">{interviewDuration} minutes</span>
                  </div>
                  <Slider
                    id="duration"
                    min={5}
                    max={60}
                    step={5}
                    value={[interviewDuration]}
                    onValueChange={(value) => setInterviewDuration(value[0])}
                  />
                </div>
                
                <div className="flex items-start space-x-2 text-sm text-muted-foreground">
                  <Info className="h-4 w-4 mt-0.5" />
                  <p>
                    This AI interviewer uses voice recognition to understand your answers and 
                    provides feedback in real-time. Make sure your microphone is working properly.
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={startInterview}>
                  <Mic className="mr-2 h-4 w-4" />
                  Start Voice Interview
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>How It Works</CardTitle>
                <CardDescription>
                  Features of the AI Voice Interviewer
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  <li className="flex items-start space-x-3">
                    <div className="flex-shrink-0 bg-primary/10 p-1 rounded-full">
                      <Mic className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">Voice Interaction</h4>
                      <p className="text-sm text-muted-foreground">
                        Speak naturally into your microphone to answer questions.
                        Your voice will be transcribed in real-time.
                      </p>
                    </div>
                  </li>
                  
                  <li className="flex items-start space-x-3">
                    <div className="flex-shrink-0 bg-primary/10 p-1 rounded-full">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">Timed Sessions</h4>
                      <p className="text-sm text-muted-foreground">
                        Each interview is timed based on your settings, simulating a real interview environment.
                      </p>
                    </div>
                  </li>
                  
                  <li className="flex items-start space-x-3">
                    <div className="flex-shrink-0 bg-primary/10 p-1 rounded-full">
                      <Info className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">Detailed Analysis</h4>
                      <p className="text-sm text-muted-foreground">
                        After the interview, you'll receive detailed feedback, scores, and areas for improvement.
                      </p>
                    </div>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => navigate('/history')}>
                  View Past Interview Results
                </Button>
              </CardFooter>
            </Card>
          </div>
        </main>
      )}
    </div>
  );
};

export default AIInterviewer;
