
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import InterviewPanel from '@/components/InterviewPanel';
import { analyzeAnswer } from '@/utils/interviewAnalysisService';
import { getChatCompletion } from '@/utils/openaiService';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const InterviewSession = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [session, setSession] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [input, setInput] = useState('');
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    if (id) {
      loadSession();
      loadMessages();
    }
  }, [id]);

  const loadSession = async () => {
    try {
      const { data, error } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setSession(data);

    } catch (error) {
      console.error('Error loading session:', error);
      toast.error('Failed to load interview session');
    }
  };

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('interview_messages')
        .select('*')
        .eq('session_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      if (data.length === 0) {
        // If no messages, create initial greeting
        const welcomeMessage = {
          id: `msg-${Date.now()}`,
          is_bot: true,
          content: `Hello! I'll be your interviewer today. Let's focus on ${session?.role_type} questions.`,
          created_at: new Date().toISOString()
        };
        
        await saveMessage(welcomeMessage);
        setMessages([welcomeMessage]);
        
        // Generate first question
        generateQuestion();
      } else {
        setMessages(data);
      }

    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load interview messages');
    }
  };

  const generateQuestion = async () => {
    try {
      const question = await getChatCompletion([
        {
          role: 'system',
          content: `You are an AI interviewer for a ${session?.role_type} position. 
          Generate a challenging technical question related to ${session?.category}.
          Keep the question focused and direct.`
        }
      ]);

      const questionMessage = {
        id: `msg-${Date.now()}`,
        is_bot: true,
        content: question,
        created_at: new Date().toISOString()
      };

      await saveMessage(questionMessage);
      setMessages(prev => [...prev, questionMessage]);

    } catch (error) {
      console.error('Error generating question:', error);
      toast.error('Failed to generate question');
    }
  };

  const saveMessage = async (message: any) => {
    try {
      const { error } = await supabase
        .from('interview_messages')
        .insert({
          ...message,
          session_id: id
        });

      if (error) throw error;

    } catch (error) {
      console.error('Error saving message:', error);
      toast.error('Failed to save message');
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isProcessing) return;

    setIsProcessing(true);
    try {
      // Save user message
      const userMessage = {
        id: `msg-${Date.now()}`,
        is_bot: false,
        content,
        created_at: new Date().toISOString()
      };
      
      await saveMessage(userMessage);
      setMessages(prev => [...prev, userMessage]);
      setInput('');

      // Analyze user's answer
      const analysis = await analyzeAnswer(
        messages[messages.length - 1].content, 
        content,
        session?.role_type,
        session?.category
      );

      // Generate AI response with feedback
      const aiResponseText = await getChatCompletion([
        {
          role: 'system',
          content: `You are an AI interviewer for a ${session?.role_type} position.
          The candidate just answered a question. Here's the analysis of their answer:
          ${JSON.stringify(analysis)}
          
          Provide constructive feedback and ask a follow-up question.`
        },
        {
          role: 'user',
          content: content
        }
      ]);

      const aiMessage = {
        id: `msg-${Date.now()}`,
        is_bot: true,
        content: aiResponseText,
        created_at: new Date().toISOString()
      };

      await saveMessage(aiMessage);
      setMessages(prev => [...prev, aiMessage]);

      // Update session progress
      const newQuestionCount = (session?.current_question_count || 0) + 1;
      await supabase
        .from('interview_sessions')
        .update({ 
          current_question_count: newQuestionCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      // Check if we should end the interview
      if (newQuestionCount >= (session?.questions_limit || 5)) {
        await endInterview();
      }

    } catch (error) {
      console.error('Error processing message:', error);
      toast.error('Failed to process message');
    } finally {
      setIsProcessing(false);
    }
  };

  const endInterview = async () => {
    try {
      await supabase
        .from('interview_sessions')
        .update({ 
          end_time: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      // Add completion message
      const completionMessage = {
        id: `msg-${Date.now()}`,
        is_bot: true,
        content: "Thank you for completing the interview! I'll analyze your responses and provide detailed feedback.",
        created_at: new Date().toISOString()
      };
      
      await saveMessage(completionMessage);
      setMessages(prev => [...prev, completionMessage]);
      
      // Navigate to results
      setTimeout(() => {
        navigate(`/interview/results/${id}`);
      }, 3000);

    } catch (error) {
      console.error('Error ending interview:', error);
      toast.error('Failed to end interview');
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          {session && (
            <div className="text-right">
              <h2 className="text-xl font-bold">{session.role_type} Interview</h2>
              <p className="text-sm text-muted-foreground">{session.category}</p>
            </div>
          )}
        </div>

        <InterviewPanel
          messages={messages}
          onSendMessage={handleSendMessage}
          isProcessing={isProcessing}
          input={input}
          setInput={setInput}
          isFullScreen={isFullScreen}
          toggleFullScreen={() => setIsFullScreen(!isFullScreen)}
          sessionId={id}
        />
      </div>
    </div>
  );
};

export default InterviewSession;
