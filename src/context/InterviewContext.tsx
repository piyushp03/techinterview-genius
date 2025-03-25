
import React, { createContext, useContext, useState, useReducer } from 'react';
import { toast } from 'sonner';

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

  const startSession = (options: Partial<InterviewSession>) => {
    dispatch({
      type: 'START_SESSION',
      payload: {
        role: selectedRole,
        language: selectedLanguage,
        category: selectedCategory,
        ...options,
      },
    });
    
    // Add the initial assistant message
    setTimeout(() => {
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          role: 'assistant',
          content: `Hello! I'll be your technical interviewer today. We'll focus on ${selectedCategory} questions for a ${selectedRole} role using ${selectedLanguage}. Let's start with a simple question. ${getInitialQuestion(selectedRole, selectedCategory)}`,
        },
      });
    }, 500);
    
    setIsActive(true);
    toast.success('Interview session started');
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
      // Simulate API call to get AI response
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Add mock AI response
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          role: 'assistant',
          content: getAIResponse(state.messages.length, state.role, state.category),
        },
      });
    } catch (error) {
      console.error('Error getting AI response:', error);
      toast.error('Failed to get response from AI interviewer');
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

// Helper function to get an initial question based on role and category
function getInitialQuestion(role: InterviewRole, category: InterviewCategory): string {
  const questions = {
    frontend: {
      algorithms: "Can you explain how you would implement a debounce function in JavaScript?",
      'system-design': "How would you design a component system for a design library?",
      behavioral: "Tell me about a challenging frontend bug you encountered and how you solved it.",
      'language-specific': "What are the key differences between controlled and uncontrolled components in React?",
    },
    backend: {
      algorithms: "How would you implement a rate limiting algorithm?",
      'system-design': "Design a scalable API for a social media platform.",
      behavioral: "Describe a time when you had to optimize database performance.",
      'language-specific': "Explain how you would handle database migrations in a production environment.",
    },
    fullstack: {
      algorithms: "Implement a function that detects a cycle in a linked list.",
      'system-design': "How would you design a real-time chat application?",
      behavioral: "Tell me about a time when you had to balance frontend and backend priorities.",
      'language-specific': "Compare different state management approaches across frontend and backend.",
    },
    devops: {
      algorithms: "How would you implement a deployment strategy to minimize downtime?",
      'system-design': "Design a CI/CD pipeline for a microservices architecture.",
      behavioral: "Tell me about a time when you improved a deployment process.",
      'language-specific': "Explain how you would set up infrastructure as code using Terraform.",
    },
    data: {
      algorithms: "How would you implement a streaming algorithm for large datasets?",
      'system-design': "Design a data pipeline for processing user events at scale.",
      behavioral: "Describe a data project where you had to make tradeoffs between accuracy and performance.",
      'language-specific': "Explain different techniques for handling missing data in a machine learning pipeline.",
    },
    mobile: {
      algorithms: "How would you implement an efficient image caching system on mobile?",
      'system-design': "Design a mobile app architecture that works well offline.",
      behavioral: "Tell me about a challenging mobile UI implementation you worked on.",
      'language-specific': "Compare different state management approaches in mobile development.",
    },
  };
  
  return questions[role][category] || "Let's start with a simple question about your experience.";
}

// Helper function to get a mock AI response
function getAIResponse(messageCount: number, role: InterviewRole, category: InterviewCategory): string {
  // For simplicity, we'll rotate through a few responses
  const responses = [
    "That's a good approach. Now, let's go deeper: How would you handle error cases in this scenario?",
    "Interesting solution. Can you think of any optimizations to improve performance?",
    "Great explanation. Let's change direction slightly. How would you test this implementation?",
    "I see your point. What about scalability concerns? How would this solution perform with a large dataset?",
    "That makes sense. Let's move on to a related question: Can you explain the tradeoffs in your design choice?",
    "Nice job. Let's challenge you with a follow-up: How would you refactor this to be more maintainable?",
  ];
  
  // For the last message, provide a concluding message
  if (messageCount > 10) {
    return "That concludes our interview session. You've done well in explaining your thought process. Any questions for me?";
  }
  
  return responses[messageCount % responses.length];
}

// Custom hook to use the context
export const useInterview = () => {
  const context = useContext(InterviewContext);
  if (context === undefined) {
    throw new Error('useInterview must be used within an InterviewProvider');
  }
  return context;
};
