import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Mic, MicOff, Star, Clock, ArrowLeft, Volume2, VolumeX, 
  PlayCircle, PauseCircle, MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AudioRecorder, transcribeAudio, synthesizeSpeech, playAudio } from '@/utils/speechRecognitionService';
import { analyzeAnswer } from '@/utils/interviewAnalysisService';
import { getChatCompletion } from '@/utils/openaiService';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

type InterviewState = {
  isActive: boolean;
  isCompleted: boolean;
  messages: Message[];
  timeRemaining: number;
  questionCount: number;
  currentAnswer: string;
  role: string;
  category: string;
  sessionId: string;
};

const VoiceInterviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [state, setState] = useState<InterviewState>({
    isActive: false,
    isCompleted: false,
    messages: [],
    timeRemaining: 10 * 60, // 10 minutes in seconds
    questionCount: 0,
    currentAnswer: '',
    role: 'Software Engineer',
    category: 'JavaScript',
    sessionId: `session-${Date.now()}`
  });
  
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('interview');
  
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const timerRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (state.isActive && !state.isCompleted && state.timeRemaining > 0) {
      timerRef.current = window.setInterval(() => {
        setState(prev => ({
          ...prev,
          timeRemaining: prev.timeRemaining - 1
        }));
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, [state.isActive, state.isCompleted, state.timeRemaining]);
  
  useEffect(() => {
    if (state.timeRemaining <= 0 && state.isActive) {
      endInterview();
    }
  }, [state.timeRemaining, state.isActive]);
  
  useEffect(() => {
    scrollToBottom();
  }, [state.messages]);
  
  useEffect(() => {
    if (state.isActive && state.messages.length === 0) {
      startNewInterview();
    }
  }, [state.isActive]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const startNewInterview = async () => {
    setIsProcessing(true);
    
    try {
      // Generate the first question
      const initialQuestion = await getChatCompletion([
        {
          role: 'system',
          content: `You are an AI interviewer conducting a technical interview for a ${state.role} position, focusing on ${state.category}. Start with a brief introduction and ask your first interview question.`
        }
      ]);
      
      const welcomeMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: initialQuestion,
        timestamp: new Date()
      };
      
      setState(prev => ({
        ...prev,
        messages: [welcomeMessage],
        questionCount: 1
      }));
      
      // Speak the welcome message
      if (isSpeaking) {
        speakText(initialQuestion);
      }
      
      // Save to database
      await saveMessageToDatabase(welcomeMessage);
    } catch (error) {
      console.error('Error starting interview:', error);
      toast.error('Failed to start interview. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const startRecording = async () => {
    if (isRecording || isProcessing || state.isCompleted) return;
    
    setIsRecording(true);
    toast.success('Whisper AI speech recognition activated');
    
    // Create a new audio recorder
    audioRecorderRef.current = new AudioRecorder(async (audioBlob) => {
      setIsRecording(false);
      
      setIsProcessing(true);
      const text = await transcribeAudio(audioBlob);
      
      if (text) {
        // Add user message
        const userMessage: Message = {
          id: `msg-${Date.now()}`,
          role: 'user',
          content: text,
          timestamp: new Date()
        };
        
        setState(prev => ({
          ...prev,
          messages: [...prev.messages, userMessage],
          currentAnswer: ''
        }));
        
        // Save to database
        await saveMessageToDatabase(userMessage);
        
        // Generate AI response
        await generateAIResponse(text);
      } else {
        setIsProcessing(false);
        toast.error('No speech detected. Please try again.');
      }
    });
    
    await audioRecorderRef.current.start();
  };
  
  const stopRecording = () => {
    if (audioRecorderRef.current) {
      audioRecorderRef.current.stop();
      setIsRecording(false);
    }
  };
  
  const generateAIResponse = async (userInput: string) => {
    try {
      // Extract previous messages for context
      const contextMessages = state.messages.map(msg => ({
        role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      }));
      
      // Add the new user message
      contextMessages.push({
        role: 'user' as const,
        content: userInput
      });
      
      // Generate AI response
      const aiResponseText = await getChatCompletion([
        {
          role: 'system',
          content: `You are an AI interviewer conducting a technical interview for a ${state.role} position, focusing on ${state.category}. 
          Ask challenging technical questions related to the role. 
          Evaluate the candidate's responses and ask meaningful follow-up questions. 
          Keep your responses concise and focused on one question at a time.`
        },
        ...contextMessages
      ]);
      
      // Create the AI response message
      const aiMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: aiResponseText,
        timestamp: new Date()
      };
      
      // Update state with new message
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, aiMessage],
        questionCount: prev.questionCount + 1
      }));
      
      // Save to database
      await saveMessageToDatabase(aiMessage);
      
      // Speak the response if voice is enabled
      if (isSpeaking) {
        speakText(aiResponseText);
      }
      
      // Check if we should end the interview
      if (state.questionCount >= 5) {
        setTimeout(() => {
          endInterview();
        }, 5000);
      }
    } catch (error) {
      console.error('Error generating AI response:', error);
      toast.error('Failed to generate AI response. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const saveMessageToDatabase = async (message: Message) => {
    if (!user) return;
    
    try {
      await supabase
        .from('interview_messages')
        .insert({
          session_id: state.sessionId,
          is_bot: message.role === 'assistant',
          content: message.content,
          created_at: message.timestamp.toISOString(),
          user_id: user.id
        });
    } catch (error) {
      console.error('Error saving message to database:', error);
    }
  };
  
  const toggleVoice = () => {
    setIsSpeaking(!isSpeaking);
    toast.success(isSpeaking ? 'Voice disabled' : 'Voice enabled');
  };
  
  const speakText = async (text: string) => {
    try {
      const audioData = await synthesizeSpeech(text);
      if (audioData) {
        await playAudio(audioData);
      }
    } catch (error) {
      console.error('Error speaking text:', error);
    }
  };
  
  const startInterview = () => {
    setState(prev => ({
      ...prev,
      isActive: true,
      isCompleted: false,
      messages: [],
      timeRemaining: 10 * 60,
      questionCount: 0
    }));
  };
  
  const endInterview = async () => {
    // Clear timer
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
    }
    
    // Stop recording if active
    if (isRecording) {
      stopRecording();
    }
    
    // Mark interview as completed
    setState(prev => ({
      ...prev,
      isActive: false,
      isCompleted: true
    }));
    
    // Add completion message
    const completionMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: "Thank you for completing the interview. You can now review your performance in the Results tab.",
      timestamp: new Date()
    };
    
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, completionMessage]
    }));
    
    // Save completion message
    await saveMessageToDatabase(completionMessage);
    
    // Save session completion status
    if (user) {
      try {
        await supabase
          .from('interview_sessions')
          .insert({
            id: state.sessionId,
            user_id: user.id,
            role_type: state.role,
            category: state.category,
            start_time: new Date(Date.now() - state.timeRemaining * 1000).toISOString(),
            end_time: new Date().toISOString(),
            current_question_count: state.questionCount,
            questions_limit: 5,
            time_limit: 10
          })
          .select();
        
        toast.success('Interview completed and saved');
        
        // Switch to results tab
        setActiveTab('results');
      } catch (error) {
        console.error('Error saving interview session:', error);
        toast.error('Failed to save interview session');
      }
    }
  };
  
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  const renderChatBubble = (message: Message, index: number) => {
    const isUser = message.role === 'user';
    
    return (
      <div
        key={message.id}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} max-w-3/4`}>
          <div className={`p-4 rounded-lg ${isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
            <p>{message.content}</p>
            
            {!isUser && isSpeaking && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => speakText(message.content)}
                className="mt-2"
              >
                <PlayCircle className="mr-2 h-4 w-4" />
                Play again
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  if (!state.isActive && !state.isCompleted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container py-8">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Voice-Based AI Interviewer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <p className="text-muted-foreground">
                    Practice your interview skills with our voice-based AI interviewer. The AI will ask you questions and evaluate your responses in real-time.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2">Role</h3>
                      <select
                        className="w-full p-2 border rounded"
                        value={state.role}
                        onChange={(e) => setState(prev => ({ ...prev, role: e.target.value }))}
                      >
                        <option value="Software Engineer">Software Engineer</option>
                        <option value="Frontend Developer">Frontend Developer</option>
                        <option value="Backend Developer">Backend Developer</option>
                        <option value="Full Stack Developer">Full Stack Developer</option>
                        <option value="Data Scientist">Data Scientist</option>
                        <option value="DevOps Engineer">DevOps Engineer</option>
                      </select>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium mb-2">Category</h3>
                      <select
                        className="w-full p-2 border rounded"
                        value={state.category}
                        onChange={(e) => setState(prev => ({ ...prev, category: e.target.value }))}
                      >
                        <option value="JavaScript">JavaScript</option>
                        <option value="React">React</option>
                        <option value="Python">Python</option>
                        <option value="System Design">System Design</option>
                        <option value="Data Structures">Data Structures</option>
                        <option value="Algorithms">Algorithms</option>
                        <option value="Behavioral">Behavioral</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <Button onClick={startInterview} className="w-full">
                      Start Voice Interview
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          
          <div>
            <h1 className="text-xl font-bold">{state.role} Interview - {state.category}</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleVoice}
              title={isSpeaking ? "Mute AI voice" : "Enable AI voice"}
            >
              {isSpeaking ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </Button>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="interview">Interview</TabsTrigger>
            <TabsTrigger value="results" disabled={!state.isCompleted}>Results</TabsTrigger>
          </TabsList>
          
          <TabsContent value="interview">
            <Card className="h-[70vh] flex flex-col">
              <div className="flex justify-between items-center p-4 border-b">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{formatTime(state.timeRemaining)}</span>
                </div>
                
                <Badge variant="outline">
                  Question {state.questionCount}/5
                </Badge>
                
                {state.isActive && !state.isCompleted && (
                  <Button variant="ghost" size="sm" onClick={endInterview}>
                    End Interview
                  </Button>
                )}
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                {state.messages.map((message, index) => renderChatBubble(message, index))}
                <div ref={messagesEndRef} />
              </div>
              
              <div className="p-4 border-t">
                {state.isActive && !state.isCompleted ? (
                  <div className="flex flex-col items-center">
                    <Button
                      size="lg"
                      className={isRecording ? "bg-red-500 hover:bg-red-600" : "bg-primary"}
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={isProcessing}
                    >
                      {isRecording ? (
                        <>
                          <MicOff className="mr-2 h-5 w-5" />
                          Stop Recording
                        </>
                      ) : (
                        <>
                          <Star className="mr-2 h-5 w-5" />
                          {isProcessing ? "Processing..." : "Speak Your Answer"}
                        </>
                      )}
                    </Button>
                    
                    <p className="mt-2 text-sm text-muted-foreground">
                      {isRecording 
                        ? "Recording... Click to stop when you're done speaking" 
                        : "Click the button and speak your answer clearly"}
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-lg font-medium mb-4">Interview Completed</p>
                    <Button onClick={() => setActiveTab('results')}>
                      View Results
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>
          
          <TabsContent value="results">
            <Card>
              <CardHeader>
                <CardTitle>Interview Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center p-8">
                  <h3 className="text-xl font-medium mb-4">Analyzing your interview responses...</h3>
                  <p className="text-muted-foreground mb-6">
                    Our AI is reviewing your responses and preparing detailed feedback.
                  </p>
                  <div className="w-full max-w-md mx-auto">
                    <Progress value={45} className="h-2 mb-2" />
                  </div>
                  <p className="text-sm text-muted-foreground">This may take a few moments</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default VoiceInterviewPage;
