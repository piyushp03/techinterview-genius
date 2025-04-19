
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
import { generateInterviewQuestion, evaluateAnswer } from '@/utils/openaiService';

const InterviewSession = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [sessionData, setSessionData] = useState<any>(null);
  const [input, setInput] = useState('');
  const [codeValue, setCodeValue] = useState('// Write your code here\n\n');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const timerRef = useRef<number | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    const fetchSessionData = async () => {
      if (!id) return;
      
      try {
        let userData = user;
        
        // Handle guest user case
        if (!userData && localStorage.getItem('guestUser')) {
          userData = JSON.parse(localStorage.getItem('guestUser')!);
        }
        
        // Fetch session data
        const { data, error } = await supabase
          .from('interview_sessions')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) {
          console.error("Error fetching session:", error);
          // For guest users, create session data locally
          if (userData && userData.email === 'guest@example.com') {
            const params = new URLSearchParams(window.location.search);
            const role = params.get('role') || 'frontend';
            const language = params.get('language') || 'javascript';
            const category = params.get('category') || 'algorithms';
            
            // Create mock session data for guest
            setSessionData({
              id: id,
              user_id: userData.id,
              role_type: role,
              language: language,
              category: category,
              questions_limit: 5,
              time_limit: 30,
              is_coding_enabled: true,
              current_question_count: 0,
              start_time: new Date().toISOString()
            });
            
            setTimeRemaining(30 * 60);
            setQuestionCount(0);
            
            // Generate first question for guest
            await generateFirstQuestion({
              role_type: role,
              language: language,
              category: category
            });
            
            setLoading(false);
            return;
          } else {
            throw error;
          }
        }
        
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
        
        const { data: messagesData, error: messagesError } = await supabase
          .from('interview_messages')
          .select('*')
          .eq('session_id', id)
          .order('created_at', { ascending: true });
        
        if (messagesError) throw messagesError;
        
        if (messagesData.length > 0) {
          setMessages(messagesData);
        } else {
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
      const initialQuestion = await generateInterviewQuestion(
        sessionData.role_type,
        sessionData.category,
        []
      );
      
      const welcomeMessage = `Hello! I'll be your technical interviewer today. We'll focus on ${sessionData.category} questions for a ${sessionData.role_type} role using ${sessionData.language}.\n\n${initialQuestion}`;
      
      // For guest users, store messages locally
      if (user?.email === 'guest@example.com') {
        const newMessage = {
          id: `guest-msg-${Date.now()}`,
          session_id: id,
          is_bot: true,
          content: welcomeMessage,
          created_at: new Date().toISOString()
        };
        
        setMessages([newMessage]);
        setQuestionCount(1);
        return;
      }
      
      // For regular users, save to Supabase
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
    } catch (error: any) {
      console.error('Error generating first question:', error);
      toast.error('Failed to generate interview question');
      
      // Fallback for errors
      const fallbackMessage = `Hello! I'll be your technical interviewer today. We'll focus on technical questions relevant to your experience.\n\nLet's start with a common question: Can you explain how you approach problem-solving in your development work? Please walk me through your typical process from understanding requirements to implementation.`;
      
      const newMessage = {
        id: `fallback-msg-${Date.now()}`,
        session_id: id,
        is_bot: true,
        content: fallbackMessage,
        created_at: new Date().toISOString()
      };
      
      setMessages([newMessage]);
      setQuestionCount(1);
    } finally {
      setIsProcessing(false);
    }
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || isProcessing) return;
    
    setIsProcessing(true);
    try {
      // Add user message
      const userMessageId = `msg-${Date.now()}`;
      const userMessage = {
        id: userMessageId,
        session_id: id,
        is_bot: false,
        content,
        created_at: new Date().toISOString()
      };
      
      // For guest users, handle locally
      if (user?.email === 'guest@example.com') {
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        
        // Check question limit for guest users
        if (questionCount >= (sessionData?.questions_limit || 5)) {
          const finalMessage = {
            id: `final-msg-${Date.now()}`,
            session_id: id,
            is_bot: true,
            content: "You've completed this interview! Thank you for your responses. You can now end the session to see your results.",
            created_at: new Date().toISOString()
          };
          
          setMessages(prev => [...prev, finalMessage]);
          await endInterview();
          return;
        }
        
        // Generate AI response for guest
        const previousQuestions = messages
          .filter(msg => msg.is_bot)
          .map(msg => msg.content);
        
        const previousAnswer = content;
        
        const aiResponse = await generateInterviewQuestion(
          sessionData.role_type,
          sessionData.category,
          previousQuestions,
          previousAnswer
        );
        
        const botMessage = {
          id: `ai-msg-${Date.now()}`,
          session_id: id,
          is_bot: true,
          content: aiResponse,
          created_at: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, botMessage]);
        setQuestionCount(prev => prev + 1);
        
        return;
      }
      
      // For regular users, save to Supabase
      const { data: userMessageData, error: userError } = await supabase
        .from('interview_messages')
        .insert(userMessage)
        .select();
      
      if (userError) throw userError;
      
      setMessages(prev => [...prev, userMessageData[0]]);
      setInput('');
      
      const previousQuestions = messages
        .filter(msg => msg.is_bot)
        .map(msg => msg.content);
      
      if (questionCount >= sessionData.questions_limit) {
        const { data: finalMessage, error: finalError } = await supabase
          .from('interview_messages')
          .insert({
            session_id: id,
            is_bot: true,
            content: "You've reached the end of this interview session. Thank you for your participation. Let me analyze your responses and provide you with feedback.",
          })
          .select();
        
        if (finalError) throw finalError;
        
        setMessages(prev => [...prev, finalMessage[0]]);
        await endInterview();
        return;
      }
      
      // Get feedback on previous answer
      const previousAnswer = content;
      
      const aiResponse = await generateInterviewQuestion(
        sessionData.role_type,
        sessionData.category,
        previousQuestions,
        previousAnswer
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
    } catch (error: any) {
      console.error('Error processing message:', error);
      toast.error('Failed to get AI response');
    } finally {
      setIsProcessing(false);
    }
  };

  const updateQuestionCount = async (count: number) => {
    try {
      // Skip for guest users
      if (user?.email === 'guest@example.com') return;
      
      await supabase
        .from('interview_sessions')
        .update({ current_question_count: count })
        .eq('id', id);
    } catch (error) {
      console.error('Error updating question count:', error);
    }
  };

  const endInterview = async () => {
    try {
      // For guest users, redirect to results with local data
      if (user?.email === 'guest@example.com') {
        setIsCompleted(true);
        
        // Store interview data in localStorage for results page
        localStorage.setItem(`interview_${id}`, JSON.stringify({
          sessionData: sessionData,
          messages: messages
        }));
        
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
        }
        
        toast.success('Interview session completed');
        
        // Redirect to results page
        setTimeout(() => {
          navigate(`/interview/results/${id}`);
        }, 2000);
        
        return;
      }
      
      // For regular users
      await supabase
        .from('interview_sessions')
        .update({ end_time: new Date().toISOString() })
        .eq('id', id);
      
      // Also save the code for coding interviews
      if (sessionData?.is_coding_enabled && codeValue) {
        try {
          await supabase
            .from('interview_messages')
            .insert({
              session_id: id,
              is_bot: false,
              content: `CODE_SUBMISSION: ${codeValue}`,
              created_at: new Date().toISOString()
            });
        } catch (error) {
          console.error('Error saving code submission:', error);
        }
      }
      
      setIsCompleted(true);
      
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
      
      toast.success('Interview session completed');
      
      // Generate analysis and redirect
      toast.success('Generating interview analysis...');
      
      try {
        // Analyze the interview
        const userMessages = messages.filter(m => !m.is_bot).map(m => m.content);
        const botMessages = messages.filter(m => m.is_bot).map(m => m.content);
        
        if (userMessages.length > 0) {
          const analysis = await evaluateAnswer(
            userMessages.join('\n\n'),
            botMessages.join('\n\n'),
            sessionData.role_type,
            sessionData.category
          );
          
          // Save analysis
          await supabase
            .from('interview_analysis')
            .insert({
              session_id: id,
              summary: {
                strengths: analysis.strengths || [],
                weaknesses: analysis.weaknesses || [],
                score: analysis.score || 0,
                feedback: analysis.feedback || '',
                recommendations: analysis.recommendations || []
              }
            });
        }
      } catch (error) {
        console.error('Error generating analysis:', error);
      }
      
      // Redirect to results page
      setTimeout(() => {
        navigate(`/interview/results/${id}`);
      }, 2000);
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
                  <span className="text-sm font-medium mr-2">Questions: {questionCount}/{sessionData?.questions_limit || 5}</span>
                  <Progress value={progressPercentage()} className="w-40 h-2" />
                </div>
              </div>
              <div>
                {isCompleted ? (
                  <Button 
                    variant="outline" 
                    onClick={() => navigate(`/interview/results/${id}`)}
                  >
                    View Interview Results
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    onClick={endInterview}
                  >
                    End Interview
                  </Button>
                )}
              </div>
            </div>
            
            {(sessionData?.is_coding_enabled || true) ? (
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
                    sessionId={id}
                  />
                </TabsContent>
                <TabsContent value="code" className="flex-1 p-4">
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
                sessionId={id}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default InterviewSession;
