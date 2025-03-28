
import React, { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, Send, Star, Volume2, VolumeX, MessageSquare } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import VoiceInterviewer from '@/components/VoiceInterviewer';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AudioRecorder, transcribeAudio, synthesizeSpeech, playAudio } from '@/utils/speechRecognitionService';
import { getChatCompletion } from '@/utils/openaiService';
import { analyzeInterviewSession } from '@/utils/interviewAnalysisService';
import { Progress } from '@/components/ui/progress';

type InterviewResult = {
  questions: string[];
  answers: string[];
  analysis: any;
};

const AIInterviewer: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<string>('Software Engineer');
  const [category, setCategory] = useState<string>('JavaScript');
  const [page, setPage] = useState<'start' | 'interview' | 'results'>('start');
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(true);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [result, setResult] = useState<InterviewResult | null>(null);
  
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const startInterview = async () => {
    setPage('interview');
    setMessages([]);
    setIsProcessing(true);
    
    try {
      // Generate the first question
      const systemPrompt = `You are an experienced technical interviewer conducting an interview for a ${role} position. 
      Focus on ${category} questions that are challenging but fair. 
      Start the interview with a brief introduction and ask your first question. Be conversational but professional.`;
      
      const initialQuestion = await getChatCompletion([
        { role: 'system', content: systemPrompt },
      ]);
      
      const botMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: initialQuestion,
        timestamp: new Date()
      };
      
      setMessages([botMessage]);
      
      // Speak the opening message
      if (isSpeaking) {
        speakText(initialQuestion);
      }
      
      // Save to database if user is logged in
      if (user) {
        try {
          // Create a new interview session
          const { data: session } = await supabase
            .from('interview_sessions')
            .insert({
              user_id: user.id,
              role_type: role,
              category: category,
              start_time: new Date().toISOString(),
              questions_limit: 5,
              time_limit: 15,
              is_coding_enabled: false
            })
            .select()
            .single();
          
          // Save the first message
          if (session) {
            await supabase
              .from('interview_messages')
              .insert({
                session_id: session.id,
                is_bot: true,
                content: initialQuestion,
                user_id: user.id
              });
          }
        } catch (error) {
          console.error('Error saving interview session:', error);
        }
      }
    } catch (error) {
      console.error('Error starting interview:', error);
      toast.error('Failed to start interview. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleSendMessage = async () => {
    if (!input.trim() || isProcessing) return;
    
    const userMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);
    
    try {
      // Save to database if user is logged in
      if (user) {
        try {
          await supabase
            .from('interview_messages')
            .insert({
              session_id: messages[0]?.session_id,
              is_bot: false,
              content: input,
              user_id: user.id
            });
        } catch (error) {
          console.error('Error saving message:', error);
        }
      }
      
      // Generate AI response
      const previousMessages = messages.map(msg => ({
        role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      }));
      
      const systemPrompt = `You are an experienced technical interviewer conducting an interview for a ${role} position. 
      Focus on ${category} questions that are challenging but fair. 
      Evaluate the candidate's answers and ask relevant follow-up questions.
      If appropriate, ask a new technical question after they've fully answered the previous one.
      Keep your responses concise (1-3 paragraphs) and focused.`;
      
      const aiResponse = await getChatCompletion([
        { role: 'system', content: systemPrompt },
        ...previousMessages,
        { role: 'user', content: input }
      ]);
      
      const botMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
      
      // Speak the response
      if (isSpeaking) {
        speakText(aiResponse);
      }
      
      // Save to database if user is logged in
      if (user) {
        try {
          await supabase
            .from('interview_messages')
            .insert({
              session_id: messages[0]?.session_id,
              is_bot: true,
              content: aiResponse,
              user_id: user.id
            });
        } catch (error) {
          console.error('Error saving message:', error);
        }
      }
      
      // Check if we should end the interview (5 user responses)
      const userMessageCount = messages.filter(msg => msg.role === 'user').length + 1;
      if (userMessageCount >= 5) {
        // Add a conclusion message
        const conclusionMessage = {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: "Thank you for participating in this interview. I have enough information to provide you with feedback. Let's analyze your responses.",
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, conclusionMessage]);
        
        // Speak the conclusion
        if (isSpeaking) {
          speakText(conclusionMessage.content);
        }
        
        // Save conclusion message
        if (user) {
          try {
            await supabase
              .from('interview_messages')
              .insert({
                session_id: messages[0]?.session_id,
                is_bot: true,
                content: conclusionMessage.content,
                user_id: user.id
              });
            
            // Update session end time
            await supabase
              .from('interview_sessions')
              .update({
                end_time: new Date().toISOString(),
                is_completed: true
              })
              .eq('id', messages[0]?.session_id);
          } catch (error) {
            console.error('Error saving conclusion:', error);
          }
        }
        
        // Wait a moment, then show results
        setTimeout(() => {
          analyzeResults();
        }, 2000);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      toast.error('Failed to process message. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const startRecording = async () => {
    if (isRecording || isProcessing) return;
    
    setIsRecording(true);
    toast.success('Whisper AI speech recognition activated');
    
    // Create a new audio recorder
    audioRecorderRef.current = new AudioRecorder(async (audioBlob) => {
      setIsRecording(false);
      
      setIsProcessing(true);
      const text = await transcribeAudio(audioBlob);
      
      if (text) {
        setInput(text);
        // Auto-send if we got text
        setTimeout(() => {
          handleSendMessage();
        }, 500);
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
  
  const toggleSpeaking = () => {
    setIsSpeaking(!isSpeaking);
    toast.success(isSpeaking ? 'Voice output disabled' : 'Voice output enabled');
  };
  
  const speakText = async (text: string) => {
    if (!isSpeaking) return;
    
    try {
      const audioData = await synthesizeSpeech(text);
      if (audioData) {
        await playAudio(audioData);
      }
    } catch (error) {
      console.error('Error speaking text:', error);
    }
  };
  
  const analyzeResults = async () => {
    setIsProcessing(true);
    
    try {
      // Extract questions and answers
      const questions: string[] = [];
      const answers: string[] = [];
      
      let currentQuestion = '';
      
      messages.forEach(msg => {
        if (msg.role === 'assistant') {
          // This is a bot message, likely a question
          currentQuestion = msg.content;
          if (currentQuestion && !questions.includes(currentQuestion)) {
            questions.push(currentQuestion);
          }
        } else if (msg.role === 'user' && currentQuestion) {
          // This is a user message, answering the last question
          answers.push(msg.content);
          currentQuestion = ''; // Reset for next question
        }
      });
      
      // Analyze the interview
      const analysis = await analyzeInterviewSession(
        questions,
        answers,
        role,
        category
      );
      
      // Set results and change to results page
      setResult({
        questions,
        answers,
        analysis
      });
      
      setPage('results');
    } catch (error) {
      console.error('Error analyzing results:', error);
      toast.error('Failed to analyze interview results. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const renderMessage = (msg: any) => {
    const isUser = msg.role === 'user';
    
    return (
      <div
        key={msg.id}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div
          className={`max-w-[80%] rounded-lg p-3 ${
            isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
          }`}
        >
          <div className="mb-1">{msg.content}</div>
          <div className="text-xs opacity-70 text-right">
            {new Date(msg.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </div>
    );
  };
  
  const renderResults = () => {
    if (!result) return null;
    
    const { analysis } = result;
    
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Interview Performance Analysis</CardTitle>
              <div className="text-2xl font-bold">
                {analysis.metrics.overall}/10
              </div>
            </div>
            <CardDescription>
              Analysis of your interview performance based on key metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(analysis.metrics).map(([key, value]: [string, any]) => {
                if (key === 'overall') return null;
                
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="capitalize">{key}</span>
                      <span>{value}/10</span>
                    </div>
                    <Progress value={value * 10} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Strengths</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.strengths.map((strength: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <Badge variant="outline" className="bg-green-100 text-green-800 shrink-0 mt-0.5">
                      +
                    </Badge>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Areas for Improvement</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.weaknesses.map((weakness: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <Badge variant="outline" className="bg-amber-100 text-amber-800 shrink-0 mt-0.5">
                      !
                    </Badge>
                    <span>{weakness}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {analysis.recommendations.map((recommendation: string, index: number) => (
                <li key={index} className="pl-5 border-l-2 border-primary">
                  <p>{recommendation}</p>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => {
                setPage('start');
                setResult(null);
                setMessages([]);
              }}
              className="w-full"
            >
              Start New Interview
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  };
  
  if (page === 'start') {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">AI Interviewer</h1>
            
            <Tabs defaultValue="voice" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="voice">Voice Interview</TabsTrigger>
                <TabsTrigger value="text">Text Interview</TabsTrigger>
              </TabsList>
              
              <TabsContent value="voice" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Voice-Based AI Interview</CardTitle>
                    <CardDescription>
                      Practice your interview skills using voice recognition powered by Whisper AI
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className="block text-sm font-medium mb-2">Role Type</label>
                        <Select value={role} onValueChange={setRole}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Software Engineer">Software Engineer</SelectItem>
                            <SelectItem value="Frontend Developer">Frontend Developer</SelectItem>
                            <SelectItem value="Backend Developer">Backend Developer</SelectItem>
                            <SelectItem value="Full Stack Developer">Full Stack Developer</SelectItem>
                            <SelectItem value="DevOps Engineer">DevOps Engineer</SelectItem>
                            <SelectItem value="Data Scientist">Data Scientist</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Category</label>
                        <Select value={category} onValueChange={setCategory}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="JavaScript">JavaScript</SelectItem>
                            <SelectItem value="React">React</SelectItem>
                            <SelectItem value="System Design">System Design</SelectItem>
                            <SelectItem value="Algorithms">Algorithms</SelectItem>
                            <SelectItem value="Data Structures">Data Structures</SelectItem>
                            <SelectItem value="Behavioral">Behavioral</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-muted rounded-lg mb-6">
                      <h3 className="text-sm font-medium mb-2">Voice Features</h3>
                      <ul className="list-disc ml-5 space-y-1 text-sm">
                        <li>Speak your answers naturally, they'll be transcribed in real-time using Whisper AI</li>
                        <li>AI interviewer will speak questions using TTS-1 for a realistic experience</li>
                        <li>Receive detailed analysis of your performance at the end of the interview</li>
                      </ul>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button onClick={startInterview} className="w-full">
                      Start Voice Interview
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Try our Voice Interviewer Component</CardTitle>
                    <CardDescription>
                      Alternate implementation with enhanced features
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={() => navigate('/voice-interview')} 
                      variant="outline" 
                      className="w-full"
                    >
                      Open Voice Interviewer
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="text" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Text-Based AI Interview</CardTitle>
                    <CardDescription>
                      Practice your interview skills using text chat
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className="block text-sm font-medium mb-2">Role Type</label>
                        <Select value={role} onValueChange={setRole}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Software Engineer">Software Engineer</SelectItem>
                            <SelectItem value="Frontend Developer">Frontend Developer</SelectItem>
                            <SelectItem value="Backend Developer">Backend Developer</SelectItem>
                            <SelectItem value="Full Stack Developer">Full Stack Developer</SelectItem>
                            <SelectItem value="DevOps Engineer">DevOps Engineer</SelectItem>
                            <SelectItem value="Data Scientist">Data Scientist</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Category</label>
                        <Select value={category} onValueChange={setCategory}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="JavaScript">JavaScript</SelectItem>
                            <SelectItem value="React">React</SelectItem>
                            <SelectItem value="System Design">System Design</SelectItem>
                            <SelectItem value="Algorithms">Algorithms</SelectItem>
                            <SelectItem value="Data Structures">Data Structures</SelectItem>
                            <SelectItem value="Behavioral">Behavioral</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button onClick={startInterview} className="w-full">
                      Start Text Interview
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    );
  }
  
  if (page === 'interview') {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <Button variant="ghost" onClick={() => setPage('start')}>
                Back
              </Button>
              <h2 className="text-xl font-bold">{role} Interview - {category}</h2>
              <Button variant="ghost" size="icon" onClick={toggleSpeaking}>
                {isSpeaking ? <Volume2 /> : <VolumeX />}
              </Button>
            </div>
            
            <Card className="h-[70vh] flex flex-col">
              <CardContent className="flex-1 flex flex-col p-4 overflow-hidden">
                <ScrollArea className="flex-1 pr-4">
                  <div className="space-y-4">
                    {messages.map(renderMessage)}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
                
                <div className="pt-4 mt-auto">
                  <div className="relative">
                    <Textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Type your answer..."
                      className="min-h-[80px] pr-20"
                      disabled={isProcessing || isRecording}
                    />
                    <div className="absolute right-2 bottom-2 flex gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={isProcessing}
                        className={isRecording ? "text-red-500" : ""}
                        title="Whisper AI Speech Recognition"
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        onClick={handleSendMessage}
                        disabled={!input.trim() || isProcessing || isRecording}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {isRecording && (
                    <div className="mt-2 text-xs flex items-center text-amber-500">
                      <div className="mr-2 h-2 w-2 rounded-full bg-amber-500 animate-pulse"></div>
                      Whisper AI is listening... Click the star icon again to stop recording
                    </div>
                  )}
                  
                  {isProcessing && (
                    <div className="mt-2 text-xs text-muted-foreground flex items-center">
                      <div className="mr-2 h-2 w-2 rounded-full bg-primary animate-pulse"></div>
                      Processing...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }
  
  if (page === 'results') {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <Button variant="ghost" onClick={() => setPage('start')}>
                Back to Start
              </Button>
              <h2 className="text-xl font-bold">Interview Results</h2>
              <div></div>
            </div>
            
            {renderResults()}
          </div>
        </div>
      </div>
    );
  }
  
  return null;
};

export default AIInterviewer;
