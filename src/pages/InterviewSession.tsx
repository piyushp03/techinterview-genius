
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import InterviewPanel from '@/components/InterviewPanel';
import { analyzeAnswer } from '@/utils/interviewAnalysisService';

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
      console.log("Loading interview session:", sessionId);
      
      // Fetch the session data
      const { data: session, error: sessionError } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
        
      if (sessionError) {
        console.error("Session error:", sessionError);
        throw new Error(`Failed to load session: ${sessionError.message}`);
      }
      
      if (!session) {
        console.error("No session found");
        throw new Error('Interview session not found');
      }
      
      console.log("Session data loaded:", session);
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
        console.error("Messages error:", messagesError);
        throw new Error(`Failed to load messages: ${messagesError.message}`);
      }
      
      console.log("Messages loaded:", messagesData);
      
      // Convert to the format expected by InterviewPanel
      const formattedMessages = messagesData?.map(msg => ({
        id: msg.id,
        is_bot: msg.is_bot,
        content: msg.content,
        role: msg.is_bot ? 'assistant' : 'user',
        timestamp: new Date(msg.created_at)
      })) || [];
      
      setMessages(formattedMessages);
      
      // If no messages yet, create an initial bot message
      if (formattedMessages.length === 0) {
        console.log("Creating initial message");
        const initialMessage = {
          role: 'assistant' as const,
          content: `Welcome to your ${session.role_type} interview focusing on ${session.language}. Let's start with your first question: Tell me about your background and experience with ${session.language}.`,
          is_bot: true,
          timestamp: new Date()
        };
        
        setMessages([initialMessage]);
        
        // Save initial message to database
        await supabase
          .from('interview_messages')
          .insert({
            session_id: sessionId,
            is_bot: true,
            content: initialMessage.content,
            created_at: new Date().toISOString()
          });
      }
      
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
  
  if (isProcessing && messages.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4" />
          <p className="text-lg">Loading interview session...</p>
        </div>
      </div>
    );
  }
  
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
