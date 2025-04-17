
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Editor from '@monaco-editor/react';
import { useAuth } from '@/context/AuthContext';
import { useInterview } from '@/context/InterviewContext';
import { analyzeAnswer } from '@/utils/interviewAnalysisService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Mic, Send, Loader2, ArrowLeft, CheckCircle, AlertTriangle } from "lucide-react";
import useSpeechRecognition from '@/hooks/useSpeechRecognition';
import { supabase } from '@/integrations/supabase/client';
import InterviewPanel from '@/components/InterviewPanel';

// Define types
type Message = {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
  is_bot?: boolean;
};

const InterviewSession = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentInterview } = useInterview();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [sessionData, setSessionData] = useState<any>(null);
  
  useEffect(() => {
    if (id) {
      loadInterviewSession(id);
    }
  }, [id]);
  
  const loadInterviewSession = async (sessionId: string) => {
    setIsProcessing(true);
    try {
      // Fetch the session data
      const { data: session, error: sessionError } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
        
      if (sessionError) {
        throw new Error(`Failed to load session: ${sessionError.message}`);
      }
      
      if (!session) {
        throw new Error('Interview session not found');
      }
      
      setSessionData(session);
      
      // Check if session is completed
      if (session.end_time) {
        setIsCompleted(true);
      }
      
      // Fetch the messages for this session
      const { data: messagesData, error: messagesError } = await supabase
        .from('interview_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
        
      if (messagesError) {
        throw new Error(`Failed to load messages: ${messagesError.message}`);
      }
      
      // Convert to the format expected by InterviewPanel
      const formattedMessages = messagesData?.map(msg => ({
        id: msg.id,
        is_bot: msg.is_bot,
        content: msg.content,
        role: msg.is_bot ? 'assistant' : 'user',
        timestamp: new Date(msg.created_at)
      })) || [];
      
      setMessages(formattedMessages);
      
    } catch (error: any) {
      console.error('Error loading interview session:', error);
      toast.error(error.message || 'Failed to load interview session');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleSendMessage = async (messageContent: string) => {
    if (!messageContent.trim() || isProcessing || isCompleted || !id) return;
    
    setIsProcessing(true);
    
    try {
      // Create user message object
      const userMessage: Message = {
        role: 'user',
        content: messageContent,
        is_bot: false,
        timestamp: new Date()
      };
      
      // Add to local state
      setMessages(prev => [...prev, userMessage]);
      
      // Save message to Supabase
      const { data: savedMessage, error: messageError } = await supabase
        .from('interview_messages')
        .insert({
          session_id: id,
          is_bot: false,
          content: messageContent,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (messageError) {
        console.error('Error saving message:', messageError);
        toast.error('Failed to save your message');
      }
      
      // Generate AI response
      const botResponse = await analyzeAnswer(
        messages[messages.length - 1]?.content || "Tell me about yourself",
        messageContent,
        sessionData?.role_type || "Software Engineer",
        sessionData?.language || "JavaScript"
      );
      
      const botMessage: Message = {
        role: 'assistant',
        content: botResponse.feedback,
        is_bot: true,
        timestamp: new Date()
      };
      
      // Add bot response to local state
      setMessages(prev => [...prev, botMessage]);
      
      // Save bot response to Supabase
      await supabase
        .from('interview_messages')
        .insert({
          session_id: id,
          is_bot: true,
          content: botResponse.feedback,
          created_at: new Date().toISOString()
        });
        
    } catch (error: any) {
      console.error('Error processing message:', error);
      toast.error(error.message || 'Failed to process message');
      
      // Add fallback response if AI analysis fails
      const fallbackMessage: Message = {
        role: 'assistant',
        content: "I'm sorry, I couldn't process your answer right now. Let's continue with the interview. Could you tell me more about your approach to problem-solving?",
        is_bot: true,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, fallbackMessage]);
      
      // Save fallback response
      if (id) {
        await supabase
          .from('interview_messages')
          .insert({
            session_id: id,
            is_bot: true,
            content: fallbackMessage.content,
            created_at: new Date().toISOString()
          });
      }
      
    } finally {
      setIsProcessing(false);
    }
  };
  
  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };
  
  return (
    <div className="min-h-screen bg-background">
      <div className={`container mx-auto py-6 px-4 ${isFullScreen ? 'max-w-full' : 'max-w-4xl'}`}>
        {!isFullScreen && (
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
        )}
        
        <div className={`w-full ${isFullScreen ? 'h-screen' : 'h-[calc(100vh-120px)]'}`}>
          <InterviewPanel
            isFullScreen={isFullScreen}
            toggleFullScreen={toggleFullScreen}
            messages={messages}
            onSendMessage={handleSendMessage}
            isProcessing={isProcessing}
            input={input}
            setInput={setInput}
            isCompleted={isCompleted}
            sessionId={id}
          />
        </div>
      </div>
    </div>
  );
};

export default InterviewSession;
