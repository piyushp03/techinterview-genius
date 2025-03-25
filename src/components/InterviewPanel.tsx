
import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, User, PauseCircle, FileText, RotateCcw, Maximize, Minimize } from 'lucide-react';
import { useInterview, InterviewMessage } from '@/context/InterviewContext';
import { Button } from '@/components/ui/button';
import useSpeechRecognition from '@/hooks/useSpeechRecognition';

interface InterviewPanelProps {
  isFullScreen: boolean;
  toggleFullScreen: () => void;
}

const InterviewPanel = ({ isFullScreen, toggleFullScreen }: InterviewPanelProps) => {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const { 
    session, 
    isActive, 
    isSpeaking, 
    isProcessing, 
    sendMessage,
    toggleSpeaking 
  } = useInterview();
  
  const { 
    transcript, 
    listening, 
    startListening, 
    stopListening, 
    resetTranscript, 
    browserSupportsSpeechRecognition 
  } = useSpeechRecognition({
    onResult: (transcript) => {
      setMessage(transcript);
    },
  });

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [session.messages]);

  const handleSendMessage = async () => {
    if (!message.trim() || isProcessing) return;
    
    if (listening) {
      stopListening();
    }
    
    await sendMessage(message);
    setMessage('');
    resetTranscript();
    
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

  const renderChatBubble = (msg: InterviewMessage, index: number) => {
    const isUser = msg.role === 'user';
    const isLastMessage = index === session.messages.length - 1;
    
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

  if (!isActive) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center p-8">
          <h3 className="text-xl font-medium mb-2">Start an Interview Session</h3>
          <p className="text-muted-foreground mb-4">
            Configure your interview settings and click "Start Interview" to begin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full glass-card overflow-hidden">
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
              <RotateCcw className="h-5 w-5" />
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
        {session.messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center text-muted-foreground">
            <p>Your interview will begin momentarily...</p>
          </div>
        ) : (
          session.messages.map((msg, index) => renderChatBubble(msg, index))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 border-t relative">
        <div className="relative">
          <textarea
            ref={messageInputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your answer..."
            className="w-full px-4 py-3 pr-24 resize-none border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[80px] max-h-40"
            rows={2}
            disabled={isProcessing}
          />
          <div className="absolute right-2 bottom-2 flex">
            {browserSupportsSpeechRecognition && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={toggleListening}
                className={`mr-1 ${listening ? 'text-primary' : ''}`}
                disabled={isProcessing}
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
              disabled={!message.trim() || isProcessing}
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
