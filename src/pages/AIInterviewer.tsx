
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Mic, Clock } from 'lucide-react';
import VoiceInterviewer from '@/components/VoiceInterviewer';

const AIInterviewer = () => {
  const navigate = useNavigate();
  const [duration, setDuration] = useState(30);
  const [isVoiceInterviewerOpen, setIsVoiceInterviewerOpen] = useState(false);

  const handleStartInterview = () => {
    setIsVoiceInterviewerOpen(true);
  };

  const handleCloseInterviewer = () => {
    setIsVoiceInterviewerOpen(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container py-8 px-4 md:px-6">
        <h1 className="text-3xl font-bold mb-6">AI Voice Interviewer</h1>
        
        <div className="max-w-xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Start Voice Interview</CardTitle>
              <CardDescription>
                Practice your interview skills with our AI voice interviewer. Speak naturally and receive real-time feedback.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="duration">Interview Duration (minutes)</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    id="duration"
                    min={5}
                    max={30}
                    step={5}
                    value={[duration]}
                    onValueChange={(value) => setDuration(value[0])}
                    className="flex-1"
                  />
                  <span className="w-12 text-center font-medium">{duration}</span>
                </div>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="text-sm font-medium mb-2">How it works</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="bg-primary/20 text-primary rounded-full h-5 w-5 flex items-center justify-center text-xs mt-0.5">1</span>
                    <span>Click the start button to begin the interview.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-primary/20 text-primary rounded-full h-5 w-5 flex items-center justify-center text-xs mt-0.5">2</span>
                    <span>Press the microphone button and speak your answer.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-primary/20 text-primary rounded-full h-5 w-5 flex items-center justify-center text-xs mt-0.5">3</span>
                    <span>The AI will analyze your response and provide feedback.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-primary/20 text-primary rounded-full h-5 w-5 flex items-center justify-center text-xs mt-0.5">4</span>
                    <span>End the interview anytime to see your detailed results.</span>
                  </li>
                </ul>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleStartInterview} className="w-full">
                <Mic className="mr-2 h-4 w-4" />
                Start Voice Interview
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
      
      {isVoiceInterviewerOpen && (
        <VoiceInterviewer 
          onClose={handleCloseInterviewer}
          duration={duration}
        />
      )}
    </div>
  );
};

export default AIInterviewer;
