
import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, User, PauseCircle, PlayCircle, FileText, RotateCcw, Maximize, Minimize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useSpeechRecognition from '@/hooks/useSpeechRecognition';
import { toast } from 'sonner';

interface InterviewPanelProps {
  isFullScreen: boolean;
  toggleFullScreen: () => void;
  messages: any[];
  onSendMessage: (message: string) => void;
  isProcessing: boolean;
  input: string;
  setInput: (value: string) => void;
  isCompleted?: boolean;
}

const InterviewPanel = ({ 
  isFullScreen, 
  toggleFullScreen, 
  messages, 
  onSendMessage, 
  isProcessing, 
  input, 
  setInput,
  isCompleted = false
}: InterviewPanelProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  
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

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthesisRef.current = window.speechSynthesis;
    }

    return () => {
      if (synthesisRef.current && currentUtteranceRef.current) {
        synthesisRef.current.cancel();
      }
    };
  }, []);

  // Speak last bot message when isSpeaking changes
  useEffect(() => {
    if (isSpeaking && messages.length > 0) {
      const lastBotMessage = [...messages].reverse().find(msg => msg.is_bot);
      if (lastBotMessage) {
        speakText(lastBotMessage.content);
      }
    } else if (!isSpeaking && synthesisRef.current) {
      synthesisRef.current.cancel();
    }
  }, [isSpeaking, messages]);

  const speakText = (text: string) => {
    if (!synthesisRef.current) {
      toast.error("Speech synthesis not supported in your browser");
      return;
    }

    // Cancel any ongoing speech
    synthesisRef.current.cancel();

    // Create a new utterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Try to use a higher quality voice if available
    const voices = synthesisRef.current.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Google') || 
      voice.name.includes('Natural') || 
      voice.name.includes('Female')
    );
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    // Set properties
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Set up event handlers
    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      currentUtteranceRef.current = null;
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsSpeaking(false);
      currentUtteranceRef.current = null;
    };

    // Store reference and speak
    currentUtteranceRef.current = utterance;
    synthesisRef.current.speak(utterance);
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isProcessing) return;
    
    if (listening) {
      stopListening();
    }
    
    await onSendMessage(input);
    resetTranscript();
    setInput("");
    
    if (messageInputRef.current) {
      messageInputRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleListening = () => {
    if (listening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const toggleSpeaking = () => {
    setIsSpeaking(!isSpeaking);
  };

  const renderChatBubble = (msg: any, index: number) => {
    const isUser = !msg.is_bot;
    const isLastMessage = index === messages.length - 1;
    
    return (
      <div
        key={msg.id}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} max-w-3/4`}>
          <div 
            className={`flex items-center justify-center h-8 w-8 rounded-full ${
              isUser ? 'ml-2 bg-primary' : 'mr-2 bg-muted'
            }`}
          >
            {isUser ? (
              <User className="h-4 w-4 text-primary-foreground" />
            ) : (
              <FileText className="h-4 w-4 text-foreground" />
            )}
          </div>
          
          <div 
            className={`px-4 py-3 rounded-2xl ${
              isUser 
                ? 'bg-primary text-primary-foreground rounded-tr-none' 
                : 'bg-muted rounded-tl-none'
            } ${isLastMessage && isProcessing && !isUser ? 'animate-pulse' : ''}`}
          >
            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
          </div>
        </div>
      </div>
    );
  };

  if (messages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center p-8">
          <h3 className="text-xl font-medium mb-2">Loading interview session...</h3>
          <p className="text-muted-foreground mb-4">
            Your interview questions are being prepared.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full glass-card overflow-hidden w-full">
      <div className="flex justify-between items-center p-4 border-b">
        <h3 className="font-medium">AI Interview Session</h3>
        <div className="flex space-x-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={toggleSpeaking}
            title={isSpeaking ? "Mute AI voice" : "Enable AI voice"}
          >
            {isSpeaking ? (
              <PauseCircle className="h-5 w-5" />
            ) : (
              <PlayCircle className="h-5 w-5" />
            )}
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={toggleFullScreen}
            title={isFullScreen ? "Exit fullscreen" : "Fullscreen mode"}
          >
            {isFullScreen ? (
              <Minimize className="h-5 w-5" />
            ) : (
              <Maximize className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg, index) => renderChatBubble(msg, index))}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 border-t relative">
        <div className="relative">
          <textarea
            ref={messageInputRef}
            value={listening ? transcript : input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isCompleted ? "This interview is completed" : "Type your answer..."}
            className="w-full px-4 py-3 pr-24 resize-none border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[80px] max-h-40"
            rows={2}
            disabled={isProcessing || isCompleted || listening}
          />
          <div className="absolute right-2 bottom-2 flex">
            {browserSupportsSpeechRecognition && !isCompleted && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={toggleListening}
                className={`mr-1 ${listening ? 'text-primary' : ''}`}
                disabled={isProcessing || isCompleted}
              >
                {listening ? (
                  <MicOff className="h-5 w-5" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
              </Button>
            )}
            <Button
              type="button"
              onClick={handleSendMessage}
              disabled={!input.trim() || isProcessing || isCompleted}
              size="icon"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {listening && (
          <div className="mt-2 text-xs text-muted-foreground flex items-center">
            <div className="mr-2 h-2 w-2 rounded-full bg-primary animate-pulse"></div>
            Listening... Speak clearly into your microphone
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewPanel;
