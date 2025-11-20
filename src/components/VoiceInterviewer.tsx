
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mic, MicOff, Send, Volume2, VolumeX } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import useSpeechRecognition from '@/hooks/useSpeechRecognition';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface VoiceInterviewerProps {
  role?: string;
  category?: string;
  onComplete?: (messages: Message[]) => void;
  duration?: number;
  onClose?: () => void;
}

const VoiceInterviewer: React.FC<VoiceInterviewerProps> = ({
  role = 'Software Engineer',
  category = 'JavaScript',
  onComplete,
  duration = 300, // 5 minutes by default
  onClose
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Use our custom speech recognition hook
  const { 
    transcript, 
    listening, 
    startListening, 
    stopListening, 
    resetTranscript, 
    browserSupportsSpeechRecognition 
  } = useSpeechRecognition({
    onResult: (transcript) => {
      setInput(transcript);
    },
  });

  // Initialize speech synthesis
  useEffect(() => {
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    } else {
      toast.error('Speech synthesis is not supported in this browser');
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Show welcome message on first load
  useEffect(() => {
    showWelcomeMessage();
  }, []);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining <= 0) {
      endInterview();
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const showWelcomeMessage = () => {
    const welcomeMessage = `Hello! I'm your AI interviewer for the ${role} position. I'll be asking you questions about ${category}. Please speak clearly or type your responses. Let's begin with the first question.`;
    
    setMessages([{ 
      role: 'assistant', 
      content: welcomeMessage, 
      timestamp: new Date() 
    }]);
    
    if (!isMuted) {
      speakText(welcomeMessage);
    }
    
    // Generate first question after welcome message
    setTimeout(() => {
      generateQuestion();
    }, 1000);
  };

  const toggleListening = () => {
    if (listening) {
      stopListening();
      if (transcript) {
        handleUserInput(transcript);
        resetTranscript();
      }
    } else {
      startListening();
      toast.success('Listening...');
    }
  };

  const toggleSpeaking = () => {
    if (!synthRef.current) {
      toast.error('Speech synthesis is not supported');
      return;
    }

    if (isSpeaking) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      if (!isMuted) {
        // Speak the last assistant message
        const lastAssistantMessage = [...messages]
          .reverse()
          .find(msg => msg.role === 'assistant');
        
        if (lastAssistantMessage) {
          speakText(lastAssistantMessage.content);
        }
      }
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (!isMuted) {
      // Cancel any ongoing speech when muting
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    }
    toast.success(isMuted ? 'Audio unmuted' : 'Audio muted');
  };

  const speakText = (text: string) => {
    if (!synthRef.current || isMuted) return;

    // Cancel any ongoing speech
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Use a more natural voice if available
    const voices = synthRef.current.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Google') || 
      voice.name.includes('Natural') || 
      voice.name.includes('Female')
    );
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error', event);
      setIsSpeaking(false);
    };

    synthRef.current.speak(utterance);
  };

  const handleUserInput = (userInput: string) => {
    if (!userInput.trim()) return;

    // Add user message to chat
    setMessages(prevMessages => [
      ...prevMessages,
      { 
        role: 'user', 
        content: userInput, 
        timestamp: new Date() 
      }
    ]);

    setInput('');
    processUserResponse(userInput);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleUserInput(input);
  };

  const processUserResponse = async (userResponse: string) => {
    setIsProcessing(true);
    
    try {
      // Get all previous messages for context
      const messageHistory = messages.map(msg => ({
        role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      }));

      // Add the new user response
      messageHistory.push({
        role: 'user' as const,
        content: userResponse
      });

      // Generate AI response using edge function
      const { data: functionData, error: functionError } = await supabase.functions.invoke('chat', {
        body: {
          messages: [
            {
              role: 'system',
              content: `You are an AI interviewer for a ${role} position, focusing on ${category}. 
              Evaluate the candidate's responses and ask follow-up questions. 
              Be professional but conversational. 
              Ask one question at a time. 
              Your goal is to assess the candidate's knowledge and experience.`
            },
            ...messageHistory
          ]
        }
      });

      if (functionError) {
        throw functionError;
      }

      const response = functionData.content;

      // Add AI response to chat
      setMessages(prevMessages => [
        ...prevMessages,
        { 
          role: 'assistant', 
          content: response, 
          timestamp: new Date() 
        }
      ]);

      // Speak the response if speaking is enabled and not muted
      if (isSpeaking && !isMuted) {
        speakText(response);
      }

      // Increment question count
      setQuestionCount(prev => prev + 1);

      // Check if we should end the interview (e.g., after 5 questions)
      if (questionCount >= 4) {
        setTimeout(() => {
          endInterview();
        }, 5000);
      }
    } catch (error) {
      console.error('Error processing response:', error);
      toast.error('Failed to process your response');
    } finally {
      setIsProcessing(false);
    }
  };

  const generateQuestion = async () => {
    setIsProcessing(true);
    
    try {
      // Get previous messages for context
      const messageHistory = messages.map(msg => ({
        role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      }));

      // Generate a new question using edge function
      const { data: functionData, error: functionError } = await supabase.functions.invoke('chat', {
        body: {
          messages: [
            {
              role: 'system',
              content: `You are an AI interviewer for a ${role} position, focusing on ${category}. 
              Generate a challenging technical question that would be appropriate for this interview.
              The question should be specific and test the candidate's knowledge.
              Do not include any preamble or explanation, just ask the question directly.`
            },
            ...messageHistory,
            {
              role: 'user',
              content: 'Please ask me the next interview question.'
            }
          ]
        }
      });

      if (functionError) {
        throw functionError;
      }

      const question = functionData.content;

      // Add the question to the chat
      setMessages(prevMessages => [
        ...prevMessages,
        { 
          role: 'assistant', 
          content: question, 
          timestamp: new Date() 
        }
      ]);

      // Speak the question if speaking is enabled and not muted
      if (isSpeaking && !isMuted) {
        speakText(question);
      }

      setQuestionCount(prev => prev + 1);
    } catch (error) {
      console.error('Error generating question:', error);
      toast.error('Failed to generate interview question');
    } finally {
      setIsProcessing(false);
    }
  };

  const endInterview = () => {
    // Add final message
    setMessages(prevMessages => [
      ...prevMessages,
      { 
        role: 'assistant', 
        content: "Thank you for completing the interview. I hope it was helpful. You can now return to the dashboard to see your results.", 
        timestamp: new Date() 
      }
    ]);

    // Speak the final message if not muted
    if (!isMuted) {
      speakText("Thank you for completing the interview. I hope it was helpful. You can now return to the dashboard to see your results.");
    }

    // Call the onComplete callback with the messages
    if (onComplete) {
      onComplete(messages);
    }

    // Call the onClose callback if provided
    if (onClose) {
      onClose();
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full">
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardContent className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <Avatar>
                <AvatarImage src="/ai-avatar.png" alt="AI Interviewer" />
                <AvatarFallback>AI</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium">AI Interviewer</h3>
                <p className="text-sm text-muted-foreground">{role} - {category}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm px-2 py-1 bg-amber-100 text-amber-800 rounded-full">
                {formatTime(timeRemaining)}
              </span>
              <Badge variant="outline" className="bg-primary/10">
                Question {questionCount}/5
              </Badge>
            </div>
          </div>

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="mb-1">{message.content}</div>
                    <div className="text-xs opacity-70 text-right">
                      {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <div className="relative">
              <Textarea
                value={listening ? transcript : input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your response or use voice input..."
                className="min-h-[80px] pr-20"
                disabled={listening || isProcessing}
              />
              <div className="absolute right-2 bottom-2 flex gap-1">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={toggleMute}
                  disabled={isProcessing}
                >
                  {isMuted ? (
                    <VolumeX className="h-4 w-4 text-red-500" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={toggleSpeaking}
                  disabled={isProcessing}
                >
                  {isSpeaking ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
                {browserSupportsSpeechRecognition && (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={toggleListening}
                    disabled={isProcessing}
                  >
                    {listening ? (
                      <MicOff className="h-4 w-4 text-red-500" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={endInterview}
                disabled={isProcessing}
              >
                End Interview
              </Button>
              <Button
                type="submit"
                disabled={(!input && !transcript) || isProcessing || listening}
              >
                {isProcessing ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <>
                    Send <Send className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default VoiceInterviewer;
