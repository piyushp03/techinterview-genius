
import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import VoiceInterviewer from '@/components/VoiceInterviewer';
import { useInterview } from '@/context/InterviewContext';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Clipboard, Volume2, Mic, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';

const AIInterviewer = () => {
  const [activeTab, setActiveTab] = useState('about');
  const [isVoiceInterviewOpen, setIsVoiceInterviewOpen] = useState(false);
  const { startSession } = useInterview();
  const navigate = useNavigate();

  const handleStartNewInterview = () => {
    navigate('/new-interview');
  };

  const handleVoiceInterviewComplete = (messages: any[]) => {
    console.log('Voice interview completed with messages:', messages);
    setIsVoiceInterviewOpen(false);
    // TODO: Save the results and redirect to the results page
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container py-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-3/4">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>AI Technical Interviewer</CardTitle>
              </CardHeader>
              
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid grid-cols-3 mb-6">
                    <TabsTrigger value="about">About</TabsTrigger>
                    <TabsTrigger value="features">Features</TabsTrigger>
                    <TabsTrigger value="demo">Try It</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="about" className="space-y-4">
                    <div className="prose max-w-none">
                      <h3>Practice Technical Interviews with AI</h3>
                      <p>
                        Our AI Technical Interviewer helps you prepare for real interviews by simulating
                        realistic interview scenarios. Get immediate feedback on your responses and
                        improve your interview skills.
                      </p>
                      <h4>How It Works</h4>
                      <ol>
                        <li>Choose your desired role and technology area</li>
                        <li>Upload your resume (optional) for tailored questions</li>
                        <li>Complete the interview session with our AI interviewer</li>
                        <li>Receive detailed feedback and analysis</li>
                        <li>Track your progress over time</li>
                      </ol>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="features" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-muted/50 p-4 rounded-lg flex gap-4">
                        <Clipboard className="h-6 w-6 text-primary shrink-0" />
                        <div>
                          <h3 className="font-medium">Structured Interviews</h3>
                          <p className="text-sm text-muted-foreground">
                            Complete interviews with clear structure and fair evaluations
                          </p>
                        </div>
                      </div>
                      
                      <div className="bg-muted/50 p-4 rounded-lg flex gap-4">
                        <Volume2 className="h-6 w-6 text-primary shrink-0" />
                        <div>
                          <h3 className="font-medium">Voice Interviews</h3>
                          <p className="text-sm text-muted-foreground">
                            Practice verbal communication with AI voice interviewer
                          </p>
                        </div>
                      </div>
                      
                      <div className="bg-muted/50 p-4 rounded-lg flex gap-4">
                        <Mic className="h-6 w-6 text-primary shrink-0" />
                        <div>
                          <h3 className="font-medium">Speech Recognition</h3>
                          <p className="text-sm text-muted-foreground">
                            Speak your answers naturally and get real-time transcription
                          </p>
                        </div>
                      </div>
                      
                      <div className="bg-muted/50 p-4 rounded-lg flex gap-4">
                        <PlusCircle className="h-6 w-6 text-primary shrink-0" />
                        <div>
                          <h3 className="font-medium">Custom Questions</h3>
                          <p className="text-sm text-muted-foreground">
                            Add your own practice questions to focus on specific areas
                          </p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="demo" className="space-y-4">
                    <div className="text-center p-8 space-y-4">
                      <h3 className="text-xl font-semibold">Try a Quick Demo</h3>
                      <p className="text-muted-foreground mb-6">
                        Experience a short voice interview with our AI interviewer or start a full interview session.
                      </p>
                      
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Dialog open={isVoiceInterviewOpen} onOpenChange={setIsVoiceInterviewOpen}>
                          <DialogTrigger asChild>
                            <Button>
                              <Mic className="mr-2 h-4 w-4" />
                              Try Voice Interview
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl h-[80vh]">
                            <DialogTitle className="flex justify-between items-center">
                              <span>AI Voice Interview - Quick Demo</span>
                              <DialogClose asChild>
                                <Button variant="ghost" size="icon">
                                  <X className="h-4 w-4" />
                                </Button>
                              </DialogClose>
                            </DialogTitle>
                            <div className="h-[calc(100%-3rem)]">
                              <VoiceInterviewer 
                                role="Software Developer" 
                                category="JavaScript"
                                onComplete={handleVoiceInterviewComplete}
                                onClose={() => setIsVoiceInterviewOpen(false)}
                                duration={300}
                              />
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        <Button variant="outline" onClick={handleStartNewInterview}>
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Start Full Interview
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
          
          <div className="md:w-1/4">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Recent Interviews</CardTitle>
              </CardHeader>
              
              <CardContent>
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-4">
                    <div className="border rounded-lg p-3 hover:bg-muted/50 cursor-pointer transition-colors">
                      <h4 className="font-medium">Frontend Developer</h4>
                      <p className="text-sm text-muted-foreground">React - Yesterday</p>
                      <div className="mt-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full inline-block">
                        Score: 85/100
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-3 hover:bg-muted/50 cursor-pointer transition-colors">
                      <h4 className="font-medium">Full Stack Developer</h4>
                      <p className="text-sm text-muted-foreground">Node.js - 3 days ago</p>
                      <div className="mt-2 text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full inline-block">
                        Score: 72/100
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-3 hover:bg-muted/50 cursor-pointer transition-colors">
                      <h4 className="font-medium">Data Scientist</h4>
                      <p className="text-sm text-muted-foreground">Python - 1 week ago</p>
                      <div className="mt-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full inline-block">
                        Score: 91/100
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
              
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => navigate('/history')}>
                  View All Interviews
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AIInterviewer;
