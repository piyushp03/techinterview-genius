
import React, { createContext, useContext, useState, useReducer } from 'react';
import { toast } from 'sonner';
import { generateInterviewQuestion, evaluateAnswer } from '@/utils/openaiService';

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
    dispatch({
      type: 'START_SESSION',
      payload: {
        role: selectedRole,
        language: selectedLanguage,
        category: selectedCategory,
        ...options,
      },
    });
    
    setIsActive(true);
    toast.success('Interview session started');
    
    // Add initial assistant message
    setIsProcessing(true);
    try {
      // Generate the initial question using OpenAI
      const initialQuestion = await generateInterviewQuestion(
        selectedRole,
        selectedCategory,
        [],
        options.resumeText,
        options.customTopics
      );
      
      const welcomeMessage = `Hello! I'll be your technical interviewer today. We'll focus on ${selectedCategory} questions for a ${selectedRole} role using ${selectedLanguage}.\n\n${initialQuestion}`;
      
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          role: 'assistant',
          content: welcomeMessage,
        },
      });
    } catch (error) {
      console.error('Error starting interview:', error);
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          role: 'assistant',
          content: `Hello! I'll be your technical interviewer today. We'll focus on ${selectedCategory} questions for a ${selectedRole} role using ${selectedLanguage}. Let's get started with a question about your experience.`,
        },
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const endSession = () => {
    dispatch({ type: 'END_SESSION' });
    setIsActive(false);
    toast.success('Interview session ended');
  };

  const sendMessage = async (content: string) => {
    // Add user message
    dispatch({
      type: 'ADD_MESSAGE',
      payload: {
        role: 'user',
        content,
      },
    });

    setIsProcessing(true);

    try {
      // Extract previous questions to avoid repetition
      const previousQuestions = state.messages
        .filter(msg => msg.role === 'assistant')
        .map(msg => msg.content);
      
      // Generate AI response using OpenAI
      const aiResponse = await generateInterviewQuestion(
        state.role,
        state.category,
        previousQuestions,
        state.resumeText,
        state.customTopics
      );
      
      // Add AI response
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          role: 'assistant',
          content: aiResponse,
        },
      });
    } catch (error) {
      console.error('Error getting AI response:', error);
      toast.error('Failed to get response from AI interviewer');
      
      // Add a fallback response
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          role: 'assistant',
          content: "That's an interesting approach. Let's move on to another aspect of this topic. Can you explain how you would handle error cases in a similar scenario?",
        },
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
