
import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, User, PauseCircle, PlayCircle, RotateCcw, Maximize, Minimize, Star, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useSpeechRecognition from '@/hooks/useSpeechRecognition';
import { AudioRecorder, transcribeAudio, synthesizeSpeech, playAudio, setMuted } from '@/utils/speechRecognitionService';
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
  const [isMuted, setIsMutedState] = useState(false);
  const [isListeningWithWhisper, setIsListeningWithWhisper] = useState(false);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  
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

  // Update global mute state when component mute state changes
  useEffect(() => {
    // Use the imported setMuted function directly
    setMuted(isMutedState);
  }, [isMutedState]);

  // Auto-play the latest assistant message if speaking is enabled
  useEffect(() => {
    const playLatestMessage = async () => {
      if (isSpeaking && !isMutedState && messages.length > 0) {
        const latestMessage = messages[messages.length - 1];
        if (latestMessage.is_bot) {
          speakText(latestMessage.content);
        }
      }
    };
    
    playLatestMessage();
  }, [messages, isSpeaking, isMutedState]);

  const handleSendMessage = async () => {
    if (!input.trim() || isProcessing) return;
    
    if (listening) {
      stopListening();
    }
    
    await onSendMessage(input);
    setInput('');
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

  const toggleSpeaking = () => {
    setIsSpeaking(!isSpeaking);
    toast.success(isSpeaking ? 'Voice output disabled' : 'Voice output enabled');
  };

  const toggleMute = () => {
    setIsMutedState(!isMutedState);
    toast.success(isMutedState ? 'Audio unmuted' : 'Audio muted');
  };

  const startListeningWithWhisper = async () => {
    if (isListeningWithWhisper) return;
    
    setIsListeningWithWhisper(true);
    toast.success('Whisper AI speech recognition activated');
    
    // Create a new audio recorder
    audioRecorderRef.current = new AudioRecorder(async (audioBlob) => {
      setIsListeningWithWhisper(false);
      const text = await transcribeAudio(audioBlob);
      if (text) {
        setInput(text);
        // Auto-send if we got text
        setTimeout(() => {
          onSendMessage(text);
        }, 500);
      }
    });
    
    await audioRecorderRef.current.start();
  };

  const stopListeningWithWhisper = () => {
    if (audioRecorderRef.current) {
      audioRecorderRef.current.stop();
      setIsListeningWithWhisper(false);
    }
  };

  const speakText = async (text: string) => {
    if (isMutedState) return;
    
    try {
      const audioData = await synthesizeSpeech(text);
      if (audioData) {
        await playAudio(audioData);
      }
    } catch (error) {
      console.error('Error speaking text:', error);
      toast.error('Failed to play audio');
    }
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
              <User className="h-4 w-4 text-foreground" />
            )}
          </div>
          
          <div 
            className={`px-4 py-3 rounded-2xl ${
              isUser 
                ? 'bg-primary text-primary-foreground rounded-tr-none' 
                : 'bg-muted rounded-tl-none'
            } ${isLastMessage && isProcessing && !isUser ? 'animate-pulse' : ''}`}
          >
            <div className="flex justify-between items-start">
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              {!isUser && isSpeaking && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="ml-2 -mt-1 -mr-1 h-6 w-6"
                  onClick={() => speakText(msg.content)}
                  title="Play message"
                >
                  <PlayCircle className="h-4 w-4" />
                </Button>
              )}
            </div>
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
            onClick={toggleMute}
            title={isMutedState ? "Unmute audio" : "Mute audio"}
          >
            {isMutedState ? (
              <VolumeX className="h-5 w-5 text-red-500" />
            ) : (
              <Volume2 className="h-5 w-5" />
            )}
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={toggleSpeaking}
            title={isSpeaking ? "Disable AI voice" : "Enable AI voice"}
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
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isCompleted ? "This interview is completed" : "Type your answer..."}
            className="w-full px-4 py-3 pr-24 resize-none border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[80px] max-h-40 bg-background text-foreground"
            rows={2}
            disabled={isProcessing || isCompleted || isListeningWithWhisper}
          />
          <div className="absolute right-2 bottom-2 flex">
            {!isCompleted && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-amber-500 mr-1"
                onClick={isListeningWithWhisper ? stopListeningWithWhisper : startListeningWithWhisper}
                disabled={isProcessing || isCompleted}
                title="Whisper AI Speech Recognition"
              >
                <Star className={`h-5 w-5 ${isListeningWithWhisper ? 'animate-pulse' : ''}`} />
              </Button>
            )}
            
            {browserSupportsSpeechRecognition && !isCompleted && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={toggleListening}
                className={`mr-1 ${listening ? 'text-primary' : ''}`}
                disabled={isProcessing || isCompleted || isListeningWithWhisper}
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
              disabled={!input.trim() || isProcessing || isCompleted || isListeningWithWhisper}
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
        {isListeningWithWhisper && (
          <div className="mt-2 text-xs text-amber-500 flex items-center">
            <div className="mr-2 h-2 w-2 rounded-full bg-amber-500 animate-pulse"></div>
            Whisper AI is listening... Click the star icon again to stop recording
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewPanel;
