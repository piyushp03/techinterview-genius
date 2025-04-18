import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, MicOff, Play, Square, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const VoiceInterviewPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestionCount, setCurrentQuestionCount] = useState(0);
  const [questionsLimit] = useState(5);
  const [timeLimit] = useState(30); // 30 minutes
  const [startTime, setStartTime] = useState<string | null>(null);
  const [endTime, setEndTime] = useState<string | null>(null);
  const [role] = useState('Frontend Developer');
  const [category] = useState('Technical');
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [isInterviewEnded, setIsInterviewEnded] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    // Initialize Web Speech API
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        setTranscript(finalTranscript || interimTranscript);
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        toast.error(`Speech recognition error: ${event.error}`);
        setIsRecording(false);
      };
    } else {
      toast.error('Speech recognition is not supported in this browser');
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const startInterview = async () => {
    try {
      setIsProcessing(true);
      
      // Create a new interview session
      const newSessionId = uuidv4();
      const now = new Date().toISOString();
      
      const { error } = await supabase
        .from('interview_sessions')
        .insert({
          id: newSessionId,
          user_id: user?.id,
          role_type: role,
          category,
          language: 'english',
          start_time: now,
          current_question_count: 0,
          questions_limit: questionsLimit,
          time_limit: timeLimit,
        });
      
      if (error) throw error;
      
      setSessionId(newSessionId);
      setStartTime(now);
      setIsInterviewStarted(true);
      
      // Add initial AI message
      const initialPrompt = `You are an AI interviewer conducting a voice interview for a ${role} position. Ask me technical questions one at a time. Wait for my response before asking the next question. Start by introducing yourself briefly and ask your first question.`;
      
      const initialResponse = await fetchAIResponse([{ role: 'user', content: initialPrompt }]);
      
      setMessages([
        { role: 'assistant', content: initialResponse }
      ]);
      
      setCurrentQuestionCount(1);
      
    } catch (error: any) {
      console.error('Error starting interview:', error);
      toast.error('Failed to start interview');
    } finally {
      setIsProcessing(false);
    }
  };

  const endInterview = async () => {
    try {
      setIsProcessing(true);
      
      if (!sessionId) return;
      
      const now = new Date().toISOString();
      setEndTime(now);
      
      // Update the interview session
      await updateInterview();
      
      // Generate final feedback
      const feedbackPrompt = "Please provide comprehensive feedback on my interview performance. Highlight strengths, areas for improvement, and give specific advice on how I can better prepare for future interviews.";
      
      const newMessages = [...messages, { role: 'user', content: feedbackPrompt }];
      const feedbackResponse = await fetchAIResponse(newMessages);
      
      setMessages([...newMessages, { role: 'assistant', content: feedbackResponse }]);
      setIsInterviewEnded(true);
      
    } catch (error: any) {
      console.error('Error ending interview:', error);
      toast.error('Failed to end interview');
    } finally {
      setIsProcessing(false);
    }
  };

  const updateInterview = async () => {
    // Update this section to include the required language field
    const interviewData = {
      id: sessionId,
      user_id: user?.id,
      role_type: role,
      category,
      language: 'english', // Add the required language field
      start_time: startTime,
      end_time: endTime,
      current_question_count: currentQuestionCount,
      questions_limit: questionsLimit,
      time_limit: timeLimit,
    };

    const { error } = await supabase
      .from('interview_sessions')
      .update(interviewData)
      .eq('id', sessionId);

    if (error) {
      console.error('Error updating interview:', error);
      throw error;
    }
  };

  const sendMessage = async () => {
    if (!transcript.trim()) return;
    
    try {
      setIsProcessing(true);
      
      // Add user message
      const userMessage = { role: 'user', content: transcript };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setTranscript('');
      
      // Get AI response
      const aiResponse = await fetchAIResponse(updatedMessages);
      
      // Add AI message
      setMessages([...updatedMessages, { role: 'assistant', content: aiResponse }]);
      
      // Update question count
      const newQuestionCount = currentQuestionCount + 1;
      setCurrentQuestionCount(newQuestionCount);
      
      // Save message to database
      if (sessionId) {
        await supabase
          .from('interview_messages')
          .insert([
            {
              session_id: sessionId,
              content: transcript,
              is_bot: false,
            },
            {
              session_id: sessionId,
              content: aiResponse,
              is_bot: true,
            }
          ]);
      }
      
      // Check if we've reached the question limit
      if (newQuestionCount >= questionsLimit && !isInterviewEnded) {
        toast.info('You have reached the question limit. The interview will end now.');
        await endInterview();
      }
      
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsProcessing(false);
    }
  };

  const fetchAIResponse = async (messageHistory: { role: string; content: string }[]) => {
    try {
      // This would be replaced with your actual AI API call
      // For now, we'll simulate a response
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate AI responses based on the interview stage
      if (messageHistory.length === 1) {
        return "Hello! I'm your AI interviewer today for the Frontend Developer position. Let's start with a question: Can you explain the difference between 'let', 'const', and 'var' in JavaScript?";
      } else if (isInterviewEnded) {
        return "Thank you for participating in this interview. Overall, you demonstrated good technical knowledge. Some areas of strength include your explanations of JavaScript concepts. Areas for improvement might include providing more concrete examples. Keep practicing and good luck with your job search!";
      } else {
        const questions = [
          "How would you optimize the performance of a React application?",
          "Can you explain how CSS specificity works?",
          "What's the difference between controlled and uncontrolled components in React?",
          "How do you handle state management in large React applications?",
          "Explain the concept of event delegation in JavaScript."
        ];
        return questions[currentQuestionCount % questions.length];
      }
    } catch (error) {
      console.error('Error fetching AI response:', error);
      return "I'm sorry, I couldn't process that. Could you try again?";
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container py-8 px-4 md:px-6 flex flex-col">
        <h1 className="text-3xl font-bold mb-6">AI Voice Interviewer</h1>
        
        <Card className="flex-1 flex flex-col">
          <CardHeader>
            <CardTitle>Voice Interview Session</CardTitle>
            <CardDescription>
              {!isInterviewStarted 
                ? "Start a voice-based interview with our AI interviewer" 
                : `${role} Interview - Question ${currentQuestionCount} of ${questionsLimit}`}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col">
            {!isInterviewStarted ? (
              <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <p className="text-center text-muted-foreground">
                  Click the button below to start your voice interview. 
                  The AI will ask you questions and you can respond using your microphone.
                </p>
                <Button 
                  onClick={startInterview} 
                  disabled={isProcessing}
                  className="gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Preparing Interview...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Start Interview
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                  {messages.map((message, index) => (
                    <div 
                      key={index} 
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.role === 'user' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted'
                        }`}
                      >
                        {message.content}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                
                {!isInterviewEnded && (
                  <div className="space-y-2">
                    <div className="relative">
                      <textarea
                        className="w-full h-24 p-3 rounded-md border resize-none bg-background"
                        placeholder="Your response will appear here as you speak..."
                        value={transcript}
                        onChange={(e) => setTranscript(e.target.value)}
                        disabled={isProcessing}
                      />
                      <div className="absolute bottom-2 right-2 flex gap-2">
                        {isRecording ? (
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={stopRecording}
                            disabled={isProcessing}
                          >
                            <MicOff className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            onClick={startRecording}
                            disabled={isProcessing}
                          >
                            <Mic className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex justify-between">
                      <Button 
                        variant="outline" 
                        onClick={endInterview}
                        disabled={isProcessing || isInterviewEnded}
                      >
                        <Square className="h-4 w-4 mr-2" />
                        End Interview
                      </Button>
                      
                      <Button 
                        onClick={sendMessage}
                        disabled={!transcript.trim() || isProcessing || isInterviewEnded}
                      >
                        {isProcessing ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Send className="h-4 w-4 mr-2" />
                        )}
                        Send Response
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
          
          {isInterviewEnded && (
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={() => navigate('/history')}
              >
                View Interview History
              </Button>
            </CardFooter>
          )}
        </Card>
      </main>
    </div>
  );
};

export default VoiceInterviewPage;
