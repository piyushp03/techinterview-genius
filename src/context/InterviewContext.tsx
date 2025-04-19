
import React, { createContext, useContext, useState, useReducer, useEffect } from 'react';
import { toast } from 'sonner';
import { generateInterviewQuestion, evaluateAnswer } from '@/utils/openaiService';
import { supabase } from '@/integrations/supabase/client';

// Type definitions
export type InterviewRole = 'frontend' | 'backend' | 'fullstack' | 'devops' | 'data' | 'mobile';
export type ProgrammingLanguage = 'javascript' | 'typescript' | 'python' | 'java' | 'csharp' | 'cpp' | 'go' | 'ruby' | 'rust' | 'php';
export type InterviewCategory = 'algorithms' | 'system-design' | 'behavioral' | 'language-specific';

export type InterviewMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

export type InterviewSession = {
  id: string;
  role: InterviewRole;
  language: ProgrammingLanguage;
  category: InterviewCategory;
  startTime: Date;
  endTime?: Date;
  messages: InterviewMessage[];
  resumeText?: string;
  customTopics?: string[];
};

// Initial state
const initialState: InterviewSession = {
  id: '',
  role: 'frontend',
  language: 'javascript',
  category: 'algorithms',
  startTime: new Date(),
  messages: [],
};

// Action types
type Action =
  | { type: 'START_SESSION'; payload: Partial<InterviewSession> }
  | { type: 'END_SESSION' }
  | { type: 'ADD_MESSAGE'; payload: Omit<InterviewMessage, 'id' | 'timestamp'> }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<InterviewSession> }
  | { type: 'SET_RESUME'; payload: string }
  | { type: 'SET_CUSTOM_TOPICS'; payload: string[] }
  | { type: 'RESET' };

// Reducer function
function interviewReducer(state: InterviewSession, action: Action): InterviewSession {
  switch (action.type) {
    case 'START_SESSION':
      return {
        ...state,
        id: `session-${Date.now()}`,
        startTime: new Date(),
        messages: [],
        ...action.payload,
      };
    
    case 'END_SESSION':
      return {
        ...state,
        endTime: new Date(),
      };
    
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [
          ...state.messages,
          {
            id: `msg-${Date.now()}`,
            timestamp: new Date(),
            ...action.payload,
          },
        ],
      };
    
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        ...action.payload,
      };
    
    case 'SET_RESUME':
      return {
        ...state,
        resumeText: action.payload,
      };
    
    case 'SET_CUSTOM_TOPICS':
      return {
        ...state,
        customTopics: action.payload,
      };
    
    case 'RESET':
      return {
        ...initialState,
        id: '',
        startTime: new Date(),
      };
    
    default:
      return state;
  }
}

// Context type
type InterviewContextType = {
  session: InterviewSession;
  isActive: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  selectedRole: InterviewRole;
  selectedLanguage: ProgrammingLanguage;
  selectedCategory: InterviewCategory;
  startSession: (options: Partial<InterviewSession>) => void;
  endSession: () => void;
  sendMessage: (content: string) => Promise<void>;
  setRole: (role: InterviewRole) => void;
  setLanguage: (language: ProgrammingLanguage) => void;
  setCategory: (category: InterviewCategory) => void;
  processResume: (text: string) => void;
  setCustomTopics: (topics: string[]) => void;
  toggleSpeaking: () => void;
};

// Create context
const InterviewContext = createContext<InterviewContextType | undefined>(undefined);

// Context provider
export const InterviewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(interviewReducer, initialState);
  const [isActive, setIsActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedRole, setSelectedRole] = useState<InterviewRole>('frontend');
  const [selectedLanguage, setSelectedLanguage] = useState<ProgrammingLanguage>('javascript');
  const [selectedCategory, setSelectedCategory] = useState<InterviewCategory>('algorithms');

  const startSession = async (options: Partial<InterviewSession>) => {
    // Generate a unique ID for the session
    const sessionId = `session-${Date.now()}`;
    
    const sessionData = {
      role: selectedRole,
      language: selectedLanguage,
      category: selectedCategory,
      ...options,
      id: sessionId
    };
    
    dispatch({
      type: 'START_SESSION',
      payload: sessionData
    });
    
    setIsActive(true);
    toast.success('Interview session started');
    
    // Save session to Supabase
    await saveSessionToSupabase(sessionId, sessionData);
    
    // Add initial assistant message
    setIsProcessing(true);
    try {
      // Generate the initial question using OpenAI
      const initialQuestion = await generateInterviewQuestion(
        selectedRole,
        selectedCategory,
        []
      );
      
      const welcomeMessage = `Hello! I'll be your technical interviewer today. We'll focus on ${selectedCategory} questions for a ${selectedRole} role using ${selectedLanguage}.\n\n${initialQuestion}`;
      
      const messageId = `msg-${Date.now()}`;
      
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          role: 'assistant',
          content: welcomeMessage,
        },
      });
      
      // Save message to Supabase
      await saveMessageToSupabase(sessionId, messageId, {
        role: 'assistant',
        content: welcomeMessage
      });
    } catch (error) {
      console.error('Error starting interview:', error);
      
      // Fallback question if OpenAI fails
      const fallbackMessage = `Hello! I'll be your technical interviewer today. We'll focus on ${selectedCategory} questions for a ${selectedRole} role using ${selectedLanguage}.\n\nLet's start with a common question: Can you explain how you approach problem-solving in your development work? Please walk me through your typical process from understanding requirements to implementation.`;
      
      const messageId = `msg-${Date.now()}`;
      
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          role: 'assistant',
          content: fallbackMessage,
        },
      });
      
      // Save fallback message to Supabase
      await saveMessageToSupabase(sessionId, messageId, {
        role: 'assistant',
        content: fallbackMessage
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const saveSessionToSupabase = async (sessionId: string, sessionData: any) => {
    try {
      // For guest users, create a special user ID
      const currentUser = (await supabase.auth.getUser()).data.user;
      let userId = currentUser?.id;
      
      // If it's a guest user (no Supabase auth), use a local ID
      if (!userId && sessionData.user?.id) {
        userId = sessionData.user.id;
      } else if (!userId) {
        userId = `guest-${Date.now()}`;
      }
      
      const { error } = await supabase.from('interview_sessions').insert({
        id: sessionId,
        user_id: userId,
        role_type: sessionData.role,
        language: sessionData.language,
        category: sessionData.category,
        questions_limit: 5,
        time_limit: 30,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        start_time: new Date().toISOString()
      });
      
      if (error) {
        console.error('Error saving session to Supabase:', error);
        toast.error('Failed to save interview session. Continuing in offline mode.');
      }
    } catch (error) {
      console.error('Failed to save session to Supabase:', error);
      toast.error('Failed to save interview session. Continuing in offline mode.');
    }
  };

  const saveMessageToSupabase = async (sessionId: string, messageId: string, message: any) => {
    try {
      const { error } = await supabase.from('interview_messages').insert({
        id: messageId,
        session_id: sessionId,
        is_bot: message.role === 'assistant',
        content: message.content,
        created_at: new Date().toISOString()
      });
      
      if (error) {
        console.error('Error saving message to Supabase:', error);
      }
    } catch (error) {
      console.error('Failed to save message to Supabase:', error);
    }
  };

  const endSession = async () => {
    dispatch({ type: 'END_SESSION' });
    setIsActive(false);
    toast.success('Interview session ended');
    
    try {
      // Update session in Supabase to mark it as ended
      const { error } = await supabase
        .from('interview_sessions')
        .update({
          end_time: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          current_question_count: state.messages.filter(m => m.role === 'user').length
        })
        .eq('id', state.id);
      
      if (error) {
        console.error('Error updating session in Supabase:', error);
      }
      
      // Redirect to results page
      window.location.href = `/interview/results/${state.id}`;
    } catch (error) {
      console.error('Failed to update session in Supabase:', error);
    }
  };

  const sendMessage = async (content: string) => {
    // Add user message
    const userMessageId = `msg-${Date.now()}`;
    
    dispatch({
      type: 'ADD_MESSAGE',
      payload: {
        role: 'user',
        content,
      },
    });
    
    // Save user message to Supabase
    await saveMessageToSupabase(state.id, userMessageId, {
      role: 'user',
      content
    });

    setIsProcessing(true);

    try {
      // Get user's previous answer
      const previousUserMessage = state.messages
        .filter(msg => msg.role === 'user')
        .pop()?.content;
      
      // Extract previous questions to avoid repetition
      const previousQuestions = state.messages
        .filter(msg => msg.role === 'assistant')
        .map(msg => msg.content);
      
      // Get the question count
      const questionCount = state.messages.filter(m => m.role === 'user').length;
      
      // Check if we've reached the question limit
      if (questionCount >= 5) {
        // Add completion message
        const aiMessageId = `msg-${Date.now()}`;
        
        const completionMessage = "Thank you for completing the interview! I've collected enough responses to provide you with feedback. Let me summarize our discussion and give you some insights on your performance.";
        
        dispatch({
          type: 'ADD_MESSAGE',
          payload: {
            role: 'assistant',
            content: completionMessage,
          },
        });
        
        // Save AI message to Supabase
        await saveMessageToSupabase(state.id, aiMessageId, {
          role: 'assistant',
          content: completionMessage
        });
        
        // End the interview session and redirect to results
        await endSession();
        return;
      }
      
      // Generate AI response using OpenAI with feedback on previous answer
      let aiResponse;
      if (previousUserMessage) {
        // First provide feedback on the previous answer, then ask next question
        aiResponse = await generateInterviewQuestion(
          state.role,
          state.category,
          previousQuestions,
          previousUserMessage // Pass the previous answer for feedback
        );
      } else {
        // If there's no previous answer, just ask a question
        aiResponse = await generateInterviewQuestion(
          state.role,
          state.category,
          previousQuestions
        );
      }
      
      // Add AI response
      const aiMessageId = `msg-${Date.now()}`;
      
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          role: 'assistant',
          content: aiResponse,
        },
      });
      
      // Save AI message to Supabase
      await saveMessageToSupabase(state.id, aiMessageId, {
        role: 'assistant',
        content: aiResponse
      });
      
      // Update question count in Supabase
      const newQuestionCount = questionCount + 1;
      await supabase
        .from('interview_sessions')
        .update({
          current_question_count: newQuestionCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', state.id);
      
    } catch (error) {
      console.error('Error getting AI response:', error);
      toast.error('Failed to get response from AI interviewer');
      
      // Add a fallback response with feedback
      const fallbackResponses = [
        "That's an interesting approach. Let's move on to another aspect of this topic. Can you explain how you would handle error cases in a similar scenario?",
        "Thank you for that explanation. I can see you have a good grasp of the concepts. Now, I'd like to understand how you approach debugging complex issues in your codebase. Could you walk me through your process?",
        "Good points. I appreciate the thoroughness of your answer. Let's shift gears a bit. Could you describe a challenging technical problem you've solved recently and how you approached it?",
        "I appreciate your response. It shows you have experience with this topic. How would you ensure that your solution is scalable for larger datasets or user bases?",
        "Interesting perspective. You've covered some important aspects there. Now, could you explain how you would test this implementation to ensure it works correctly?"
      ];
      
      const randomFallback = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
      const fallbackMessageId = `msg-${Date.now()}`;
      
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          role: 'assistant',
          content: randomFallback,
        },
      });
      
      // Save fallback message to Supabase
      await saveMessageToSupabase(state.id, fallbackMessageId, {
        role: 'assistant',
        content: randomFallback
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const processResume = (text: string) => {
    dispatch({ type: 'SET_RESUME', payload: text });
    toast.success('Resume processed successfully');
  };

  const setCustomTopics = (topics: string[]) => {
    dispatch({ type: 'SET_CUSTOM_TOPICS', payload: topics });
    toast.success('Custom topics updated');
  };

  const toggleSpeaking = () => {
    setIsSpeaking(!isSpeaking);
  };

  return (
    <InterviewContext.Provider
      value={{
        session: state,
        isActive,
        isSpeaking,
        isProcessing,
        selectedRole,
        selectedLanguage,
        selectedCategory,
        startSession,
        endSession,
        sendMessage,
        setRole: setSelectedRole,
        setLanguage: setSelectedLanguage,
        setCategory: setSelectedCategory,
        processResume,
        setCustomTopics,
        toggleSpeaking,
      }}
    >
      {children}
    </InterviewContext.Provider>
  );
};

// Custom hook to use the context
export const useInterview = () => {
  const context = useContext(InterviewContext);
  if (context === undefined) {
    throw new Error('useInterview must be used within an InterviewProvider');
  }
  return context;
};
