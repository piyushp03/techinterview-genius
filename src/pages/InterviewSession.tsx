import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import InterviewPanel from '@/components/InterviewPanel';
import CodeEditor from '@/components/CodeEditor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Maximize, Minimize, ArrowLeft, Clock, CheckSquare } from 'lucide-react';
import { toast } from 'sonner';
import { generateInterviewQuestion } from '@/utils/openaiService';

const InterviewSession = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [sessionData, setSessionData] = useState<any>(null);
  const [input, setInput] = useState('');
  const [codeValue, setCodeValue] = useState('// Write your code here');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const timerRef = useRef<number | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasAttemptedAtLeastOne, setHasAttemptedAtLeastOne] = useState(false);

  useEffect(() => {
    const fetchSessionData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        console.log("Fetching interview session:", id);
        
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
        
        if (data.start_time) {
          const startTime = new Date(data.start_time).getTime();
          const duration = data.time_limit * 60 * 1000;
          const now = Date.now();
          const endTime = startTime + duration;
          const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
          setTimeRemaining(remaining);
        } else {
          setTimeRemaining(data.time_limit * 60);
        }
        
        setQuestionCount(data.current_question_count || 0);
        
        if (data.end_time) {
          setIsCompleted(true);
        }
        
        console.log("Fetching interview messages for session:", id);
        
        const { data: messagesData, error: messagesError } = await supabase
          .from('interview_messages')
          .select('*')
          .eq('session_id', id)
          .order('created_at', { ascending: true });
        
        if (messagesError) throw messagesError;
        
        if (messagesData.length > 0) {
          console.log("Found", messagesData.length, "messages");
          setMessages(messagesData);
          
          // Check if there's at least one user message
          const hasUserMessage = messagesData.some(msg => !msg.is_bot);
          setHasAttemptedAtLeastOne(hasUserMessage);
        } else {
          console.log("No messages found, generating first question");
          await generateFirstQuestion(data);
        }
      } catch (error: any) {
        console.error('Error fetching interview session:', error);
        toast.error(error.message || 'Failed to load interview session');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSessionData();
    
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, [id, user, navigate]);
  
  useEffect(() => {
    if (timeRemaining > 0 && !isCompleted) {
      timerRef.current = window.setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            endInterview();
            clearInterval(timerRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, [timeRemaining, isCompleted]);

  const generateFirstQuestion = async (sessionData: any) => {
    setIsProcessing(true);
    try {
      console.log("Generating first question for new session");
      
      // Try up to 3 times to generate a question
      let initialQuestion = '';
      let attempts = 0;
      
      while (!initialQuestion && attempts < 3) {
        attempts++;
        console.log(`Attempt ${attempts} to generate question`);
        
        initialQuestion = await generateInterviewQuestion(
          sessionData.role_type,
          sessionData.category,
          [],
          sessionData.resume_data,
        );
        
        if (!initialQuestion || initialQuestion.trim() === '') {
          console.log("Failed to generate question, retrying...");
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
        }
      }
      
      // If still no question, use a default one
      if (!initialQuestion || initialQuestion.trim() === '') {
        console.log("Using fallback question after multiple attempts");
        initialQuestion = `Can you tell me about your experience with ${sessionData.category} in ${sessionData.role_type} roles?`;
      }
      
      const welcomeMessage = `Hello! I'll be your technical interviewer today. We'll focus on ${sessionData.category} questions for a ${sessionData.role_type} role using ${sessionData.language}.\n\n${initialQuestion}`;
      
      console.log("Saving initial message to database");
      
      const { data, error } = await supabase
        .from('interview_messages')
        .insert({
          session_id: id,
          is_bot: true,
          content: welcomeMessage,
        })
        .select();
      
      if (error) throw error;
      
      setMessages([data[0]]);
      
      await updateQuestionCount(1);
      setQuestionCount(1);
      
      console.log("First question generated and saved successfully");
    } catch (error: any) {
      console.error('Error generating first question:', error);
      toast.error('Failed to generate interview question');
    } finally {
      setIsProcessing(false);
    }
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || isProcessing) return;
    
    setIsProcessing(true);
    try {
      console.log("Sending user message");
      
      const { data: userMessage, error: userError } = await supabase
        .from('interview_messages')
        .insert({
          session_id: id,
          is_bot: false,
          content,
        })
        .select();
      
      if (userError) throw userError;
      
      setMessages(prev => [...prev, userMessage[0]]);
      setInput('');
      setHasAttemptedAtLeastOne(true);
      
      const previousQuestions = messages
        .filter(msg => msg.is_bot)
        .map(msg => msg.content);
      
      if (questionCount >= sessionData.questions_limit) {
        console.log("Question limit reached, ending interview");
        
        const { data: finalMessage, error: finalError } = await supabase
          .from('interview_messages')
          .insert({
            session_id: id,
            is_bot: true,
            content: "You've reached the end of this interview session. Thank you for your participation. You can go back to review your answers or end the session now.",
          })
          .select();
        
        if (finalError) throw finalError;
        
        setMessages(prev => [...prev, finalMessage[0]]);
        await endInterview();
        return;
      }
      
      console.log("Generating AI response");
      
      const aiResponse = await generateInterviewQuestion(
        sessionData.role_type,
        sessionData.category,
        previousQuestions,
        sessionData.resume_data,
      );
      
      const { data: botMessage, error: botError } = await supabase
        .from('interview_messages')
        .insert({
          session_id: id,
          is_bot: true,
          content: aiResponse,
        })
        .select();
      
      if (botError) throw botError;
      
      setMessages(prev => [...prev, botMessage[0]]);
      
      await updateQuestionCount(questionCount + 1);
      setQuestionCount(prev => prev + 1);
      
      console.log("AI response generated and saved successfully");
    } catch (error: any) {
      console.error('Error processing message:', error);
      toast.error('Failed to get AI response');
    } finally {
      setIsProcessing(false);
    }
  };

  const updateQuestionCount = async (count: number) => {
    try {
      console.log("Updating question count to:", count);
      
      const { error } = await supabase
        .from('interview_sessions')
        .update({ current_question_count: count })
        .eq('id', id);
        
      if (error) throw error;
    } catch (error) {
      console.error('Error updating question count:', error);
    }
  };

  const endInterview = async () => {
    try {
      console.log("Ending interview session");
      
      await supabase
        .from('interview_sessions')
        .update({ end_time: new Date().toISOString() })
        .eq('id', id);
      
      setIsCompleted(true);
      
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
      
      // Only show results if at least one question was attempted
      if (hasAttemptedAtLeastOne) {
        toast.success('Interview completed! Redirecting to results...');
        setTimeout(() => {
          navigate(`/interview/results/${id}`);
        }, 1500);
      } else {
        toast.success('Interview session ended');
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      }
      
      console.log("Interview ended successfully");
    } catch (error: any) {
      console.error('Error ending interview:', error);
      toast.error('Failed to end interview session');
    }
  };

  const toggleFullScreen = () => {
    setIsFullScreen(prev => !prev);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = () => {
    if (!sessionData) return 0;
    const maxQuestions = sessionData.questions_limit;
    return Math.min(100, (questionCount / maxQuestions) * 100);
  };

  const timeProgressPercentage = () => {
    if (!sessionData) return 0;
    const totalSeconds = sessionData.time_limit * 60;
    return Math.max(0, 100 - (timeRemaining / totalSeconds) * 100);
  };

  const handleCodeChange = (newCode: string) => {
    setCodeValue(newCode);
  };
  
  const forceRedirectToResults = () => {
    if (hasAttemptedAtLeastOne) {
      navigate(`/interview/results/${id}`);
    } else {
      navigate('/dashboard');
    }
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
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-4 px-4">
              <div className="flex items-center">
                <Clock className="text-amber-500 mr-2 h-5 w-5" />
                <div>
                  <span className="text-sm font-medium mr-2">Time: {formatTime(timeRemaining)}</span>
                  <Progress value={timeProgressPercentage()} className="w-40 h-2" />
                </div>
              </div>
              <div className="flex items-center">
                <CheckSquare className="text-green-500 mr-2 h-5 w-5" />
                <div>
                  <span className="text-sm font-medium mr-2">Questions: {questionCount}/{sessionData?.questions_limit}</span>
                  <Progress value={progressPercentage()} className="w-40 h-2" />
                </div>
              </div>
              <div>
                {isCompleted ? (
                  <Button variant="outline" onClick={forceRedirectToResults}>
                    View Interview Results
                  </Button>
                ) : (
                  <Button variant="outline" onClick={endInterview}>
                    End Interview
                  </Button>
                )}
              </div>
            </div>
            
            {sessionData?.is_coding_enabled ? (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <TabsList className="mx-4 mb-2">
                  <TabsTrigger value="chat">Interview Chat</TabsTrigger>
                  <TabsTrigger value="code">Code Editor</TabsTrigger>
                </TabsList>
                <TabsContent value="chat" className="flex-1 flex">
                  <InterviewPanel
                    isFullScreen={isFullScreen}
                    toggleFullScreen={toggleFullScreen}
                    messages={messages}
                    onSendMessage={sendMessage}
                    isProcessing={isProcessing}
                    input={input}
                    setInput={setInput}
                    isCompleted={isCompleted}
                  />
                </TabsContent>
                <TabsContent value="code" className="flex-1 flex">
                  <CodeEditor
                    language={sessionData?.language || 'javascript'}
                    initialCode={codeValue}
                    onChange={handleCodeChange}
                    readOnly={isCompleted}
                  />
                </TabsContent>
              </Tabs>
            ) : (
              <InterviewPanel
                isFullScreen={isFullScreen}
                toggleFullScreen={toggleFullScreen}
                messages={messages}
                onSendMessage={sendMessage}
                isProcessing={isProcessing}
                input={input}
                setInput={setInput}
                isCompleted={isCompleted}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default InterviewSession;
