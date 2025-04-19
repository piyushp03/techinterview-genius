
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { generateInterviewQuestion, evaluateAnswer } from '@/utils/openaiService';

interface InterviewContextType {
  createInterview: (data: any) => Promise<string>;
  startInterview: (id: string) => Promise<void>;
  endInterview: (id: string) => Promise<void>;
  submitAnswer: (id: string, answer: string, previousQuestions: string[]) => Promise<any>;
  fetchInterview: (id: string) => Promise<any>;
  fetchInterviews: () => Promise<any[]>;
  fetchResults: (id: string) => Promise<any>;
  deleteInterview: (id: string) => Promise<void>;
  isLoading: boolean;
}

const InterviewContext = createContext<InterviewContextType | undefined>(undefined);

export const InterviewProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const createInterview = async (data: any): Promise<string> => {
    setIsLoading(true);
    try {
      // For guest users, save session to localStorage and return a temporary ID
      if (user?.email === 'guest@example.com') {
        const sessionId = `guest-session-${Date.now()}`;
        localStorage.setItem(`interview_session_${sessionId}`, JSON.stringify({
          id: sessionId,
          user_id: user.id,
          ...data,
          start_time: new Date().toISOString(),
          is_completed: false
        }));
        return sessionId;
      }

      // For logged in users, save to Supabase
      const { data: interview, error } = await supabase
        .from('interview_sessions')
        .insert({
          user_id: user?.id,
          ...data,
          start_time: new Date().toISOString(),
        })
        .select();

      if (error) {
        throw error;
      }

      return interview[0].id;
    } catch (error: any) {
      toast.error(error.message || 'Failed to create interview');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const startInterview = async (id: string): Promise<void> => {
    setIsLoading(true);
    try {
      // For guest users
      if (user?.email === 'guest@example.com') {
        const sessionData = localStorage.getItem(`interview_session_${id}`);
        if (!sessionData) throw new Error('Interview session not found');
        return;
      }

      // For logged in users
      const { error } = await supabase
        .from('interview_sessions')
        .update({
          start_time: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        throw error;
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to start interview');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const submitAnswer = async (id: string, answer: string, previousQuestions: string[]): Promise<any> => {
    setIsLoading(true);
    try {
      // For guest users
      if (user?.email === 'guest@example.com') {
        const sessionData = localStorage.getItem(`interview_session_${id}`);
        if (!sessionData) throw new Error('Interview session not found');
        
        const session = JSON.parse(sessionData);
        const nextQuestion = await generateInterviewQuestion(
          session.role_type || 'Software Engineer',
          session.category || 'JavaScript',
          previousQuestions,
          answer,
          session.custom_prompt
        );
        return nextQuestion;
      }

      // For logged in users, first save the answer, then generate the next question
      const { data: interview, error: fetchError } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const { error: answerError } = await supabase
        .from('interview_messages')
        .insert({
          session_id: id,
          is_bot: false,
          content: answer,
        });

      if (answerError) throw answerError;

      // Generate the next question
      const nextQuestion = await generateInterviewQuestion(
        interview.role_type || 'Software Engineer',
        interview.category || 'JavaScript',
        previousQuestions,
        answer,
        interview.custom_prompt
      );

      // Save the question to the database
      const { error: questionError } = await supabase
        .from('interview_messages')
        .insert({
          session_id: id,
          is_bot: true,
          content: nextQuestion,
        });

      if (questionError) throw questionError;

      return nextQuestion;
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit answer');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const endInterview = async (id: string): Promise<void> => {
    setIsLoading(true);
    try {
      // For guest users
      if (user?.email === 'guest@example.com') {
        const sessionData = localStorage.getItem(`interview_session_${id}`);
        if (!sessionData) throw new Error('Interview session not found');
        
        const session = JSON.parse(sessionData);
        session.is_completed = true;
        session.end_time = new Date().toISOString();
        localStorage.setItem(`interview_session_${id}`, JSON.stringify(session));
        return;
      }

      // For logged in users
      const { error } = await supabase
        .from('interview_sessions')
        .update({
          end_time: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        throw error;
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to end interview');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInterview = async (id: string): Promise<any> => {
    setIsLoading(true);
    try {
      // For guest users
      if (user?.email === 'guest@example.com') {
        const sessionData = localStorage.getItem(`interview_session_${id}`);
        if (!sessionData) throw new Error('Interview session not found');
        return JSON.parse(sessionData);
      }

      // For logged in users
      const { data, error } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch interview');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInterviews = async (): Promise<any[]> => {
    setIsLoading(true);
    try {
      // For guest users
      if (user?.email === 'guest@example.com') {
        // Find all interview sessions in localStorage
        const sessions = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('interview_session_')) {
            const sessionData = localStorage.getItem(key);
            if (sessionData) {
              sessions.push(JSON.parse(sessionData));
            }
          }
        }
        return sessions;
      }

      // For logged in users
      const { data, error } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch interviews');
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const fetchResults = async (id: string): Promise<any> => {
    setIsLoading(true);
    try {
      // For guest users
      if (user?.email === 'guest@example.com') {
        const resultData = localStorage.getItem(`interview_result_${id}`);
        if (resultData) {
          return JSON.parse(resultData);
        }
        
        // If no result exists yet, generate one
        const sessionData = localStorage.getItem(`interview_session_${id}`);
        const messagesData = localStorage.getItem(`messages_${id}`);
        
        if (!sessionData || !messagesData) {
          throw new Error('Interview data not found');
        }
        
        const session = JSON.parse(sessionData);
        const messages = JSON.parse(messagesData);
        
        const userMessages = messages.filter((m: any) => !m.is_bot).map((m: any) => m.content);
        const botMessages = messages.filter((m: any) => m.is_bot).map((m: any) => m.content);
        
        let analysis = {
          feedback: "Analysis could not be generated.",
          score: 5,
          strengths: ["Participation in the interview"],
          areas_for_improvement: ["Consider revisiting the key concepts discussed"]
        };
        
        if (userMessages.length > 0) {
          try {
            analysis = await evaluateAnswer(
              botMessages.join('\n\n'),
              userMessages.join('\n\n'),
              session.role_type,
              session.category
            );
          } catch (error) {
            console.error('Error generating analysis:', error);
          }
        }
        
        const result = {
          sessionData: {
            ...session,
            is_completed: true,
            end_time: session.end_time || new Date().toISOString()
          },
          messages: messages,
          analysis: analysis
        };
        
        localStorage.setItem(`interview_result_${id}`, JSON.stringify(result));
        return result;
      }

      // For logged in users, fetch the session, messages, and analysis
      const { data: sessionData, error: sessionError } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('id', id)
        .single();

      if (sessionError) throw sessionError;

      const { data: messagesData, error: messagesError } = await supabase
        .from('interview_messages')
        .select('*')
        .eq('session_id', id)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      const { data: analysisData, error: analysisError } = await supabase
        .from('interview_analysis')
        .select('*')
        .eq('session_id', id)
        .single();

      // If no analysis exists yet, generate one
      if (analysisError || !analysisData) {
        const userMessages = messagesData.filter((m: any) => !m.is_bot).map((m: any) => m.content);
        const botMessages = messagesData.filter((m: any) => m.is_bot).map((m: any) => m.content);
        
        if (userMessages.length > 0) {
          const analysis = await evaluateAnswer(
            botMessages.join('\n\n'),
            userMessages.join('\n\n'),
            sessionData.role_type,
            sessionData.category
          );
          
          const { error: insertError } = await supabase
            .from('interview_analysis')
            .insert({
              session_id: id,
              summary: {
                strengths: analysis.strengths || [],
                weaknesses: analysis.areas_for_improvement || [],
                score: analysis.score || 0,
                feedback: analysis.feedback || '',
                recommendations: analysis.areas_for_improvement || []
              }
            });
            
          if (insertError) console.error('Error saving analysis:', insertError);
          
          return {
            sessionData,
            messages: messagesData,
            analysis: {
              summary: {
                strengths: analysis.strengths,
                weaknesses: analysis.areas_for_improvement,
                score: analysis.score,
                feedback: analysis.feedback,
                recommendations: analysis.areas_for_improvement
              }
            }
          };
        }
      }

      return {
        sessionData,
        messages: messagesData,
        analysis: analysisData
      };
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch results');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteInterview = async (id: string): Promise<void> => {
    setIsLoading(true);
    try {
      // For guest users
      if (user?.email === 'guest@example.com') {
        localStorage.removeItem(`interview_session_${id}`);
        localStorage.removeItem(`messages_${id}`);
        localStorage.removeItem(`interview_result_${id}`);
        return;
      }

      // For logged in users
      const { error } = await supabase
        .from('interview_sessions')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast.success('Interview deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete interview');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <InterviewContext.Provider
      value={{
        createInterview,
        startInterview,
        endInterview,
        submitAnswer,
        fetchInterview,
        fetchInterviews,
        fetchResults,
        deleteInterview,
        isLoading,
      }}
    >
      {children}
    </InterviewContext.Provider>
  );
};

export const useInterviews = () => {
  const context = useContext(InterviewContext);
  if (context === undefined) {
    throw new Error('useInterviews must be used within an InterviewProvider');
  }
  return context;
};
