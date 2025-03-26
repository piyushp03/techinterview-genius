
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, X, Volume2, VolumeX, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface VoiceInterviewerProps {
  onClose: () => void;
  duration?: number;
}

const VoiceInterviewer: React.FC<VoiceInterviewerProps> = ({ 
  onClose,
  duration = 30 // default 30 minutes
}) => {
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(duration * 60);
  const [messages, setMessages] = useState<Array<{role: string, content: string}>>([]);
  const [volume, setVolume] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);

  // HARDCODED OPENAI API KEY (from your existing files)
  const OPENAI_API_KEY = "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";

  useEffect(() => {
    // Initialize audio element
    audioRef.current = new Audio();
    audioRef.current.volume = volume;

    // Create a session ID when component mounts
    const newSessionId = `voice-interview-${Date.now()}`;
    setSessionId(newSessionId);
    
    // Start the session timer
    startTimer();

    // Add welcome message
    handleBotResponse("Hello, I'm your AI interviewer. I'll ask you technical questions and evaluate your answers. When you're ready to begin, press the microphone button and start speaking. You can end the interview at any time.");

    // Cleanup
    return () => {
      cleanupRecording();
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  // Update audio volume when volume state changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const startTimer = () => {
    timerIntervalRef.current = window.setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          endInterview();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorder.onstop = async () => {
        if (audioChunksRef.current.length === 0) return;
        
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
      };
      
      mediaRecorder.start();
      setIsListening(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('Failed to access microphone. Please check your permissions.');
    }
  };

  const stopListening = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsListening(false);
    }
  };

  const cleanupRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (mediaRecorderRef.current?.stream) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    
    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = reader.result?.toString().split(',')[1];
        
        if (!base64Audio) {
          throw new Error('Failed to convert audio to base64');
        }
        
        // Call Whisper API for speech-to-text
        const transcriptResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'whisper-1',
            file: base64Audio,
            response_format: 'text'
          })
        });
        
        if (!transcriptResponse.ok) {
          throw new Error('Failed to transcribe audio');
        }
        
        const transcriptText = await transcriptResponse.text();
        setTranscript(transcriptText);
        
        // Save user message to context
        const updatedMessages = [...messages, { role: 'user', content: transcriptText }];
        setMessages(updatedMessages);
        
        // Save to Supabase for history
        if (sessionId) {
          await supabase.from('interview_messages').insert({
            session_id: sessionId,
            is_bot: false,
            content: transcriptText
          });
        }
        
        // Generate response using chat completion
        await generateResponse(updatedMessages);
      };
    } catch (error) {
      console.error('Error processing audio:', error);
      toast.error('Failed to process audio');
      setIsProcessing(false);
    }
  };

  const generateResponse = async (messageHistory: Array<{role: string, content: string}>) => {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an expert technical interviewer conducting a programming interview. Ask relevant technical questions, provide feedback on answers, and guide the conversation professionally as if in a real interview. Evaluate responses and provide constructive criticism where appropriate. Keep responses concise and conversational.'
            },
            ...messageHistory
          ],
          temperature: 0.7
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate response');
      }
      
      const data = await response.json();
      const responseText = data.choices[0].message.content;
      
      // Save response to messages
      setMessages([...messageHistory, { role: 'assistant', content: responseText }]);
      
      // Save to Supabase for history
      if (sessionId) {
        await supabase.from('interview_messages').insert({
          session_id: sessionId,
          is_bot: true,
          content: responseText
        });
      }
      
      // Convert to speech if not muted
      if (!isMuted) {
        await textToSpeech(responseText);
      } else {
        setResponse(responseText);
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Error generating response:', error);
      toast.error('Failed to generate response');
      setIsProcessing(false);
    }
  };

  const textToSpeech = async (text: string) => {
    try {
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: text,
          voice: 'alloy',
          response_format: 'mp3'
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate speech');
      }
      
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.onended = () => {
          setIsProcessing(false);
          setResponse(text);
        };
        audioRef.current.onerror = () => {
          setIsProcessing(false);
          setResponse(text);
        };
        audioRef.current.play().catch(err => {
          console.error('Error playing audio:', err);
          setIsProcessing(false);
          setResponse(text);
        });
      } else {
        setIsProcessing(false);
        setResponse(text);
      }
    } catch (error) {
      console.error('Error converting text to speech:', error);
      toast.error('Failed to convert text to speech');
      setResponse(text);
      setIsProcessing(false);
    }
  };

  const handleBotResponse = async (text: string) => {
    setIsProcessing(true);
    
    // Add to message history
    const updatedMessages = [...messages, { role: 'assistant', content: text }];
    setMessages(updatedMessages);
    
    // Save to Supabase
    if (sessionId) {
      await supabase.from('interview_messages').insert({
        session_id: sessionId,
        is_bot: true,
        content: text
      });
    }
    
    // Convert to speech if not muted
    if (!isMuted) {
      await textToSpeech(text);
    } else {
      setResponse(text);
      setIsProcessing(false);
    }
  };

  const endInterview = async () => {
    // Clean up recording
    cleanupRecording();
    
    // Stop timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    
    // Save session to Supabase
    if (sessionId) {
      await supabase.from('interview_sessions').insert({
        id: sessionId,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        role_type: 'technical',
        category: 'voice-interview',
        language: 'english',
        time_limit: duration,
        start_time: new Date(Date.now() - (duration * 60 * 1000) + timeRemaining * 1000).toISOString(),
        end_time: new Date().toISOString(),
        questions_limit: 15,
        current_question_count: messages.filter(m => m.role === 'assistant').length - 1, // Subtract welcome message
        is_coding_enabled: false,
      });
      
      // Redirect to results
      navigate(`/interview/results/${sessionId}`);
    } else {
      // Just close if no session
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center">
      {/* Circular gradient background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-blue-100 via-white to-white animate-pulse-slow"></div>
      </div>
      
      {/* Close button */}
      <Button 
        variant="outline" 
        size="icon" 
        className="absolute top-4 right-4 z-10"
        onClick={onClose}>
        <X className="h-4 w-4" />
      </Button>
      
      {/* Timer display */}
      <div className="absolute top-4 left-4 z-10 bg-white/80 rounded-lg px-3 py-1 font-mono">
        {formatTime(timeRemaining)}
      </div>
      
      {/* Main content */}
      <div className="relative z-10 w-full max-w-xl mx-auto flex flex-col items-center">
        <h2 className="text-2xl font-bold mb-6">AI Voice Interviewer</h2>
        
        {/* Voice transcript */}
        <div className="w-full bg-white/80 rounded-lg p-4 mb-6 min-h-32 max-h-64 overflow-y-auto">
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-2 text-sm text-gray-500">Processing...</p>
            </div>
          ) : (
            <div>
              {transcript && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-500">You said:</p>
                  <p className="text-gray-800">{transcript}</p>
                </div>
              )}
              {response && (
                <div>
                  <p className="text-sm font-medium text-gray-500">AI Interviewer:</p>
                  <p className="text-gray-800">{response}</p>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Controls */}
        <div className="w-full flex flex-col items-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Button
              size="lg"
              disabled={isProcessing}
              variant={isListening ? "destructive" : "default"}
              className="rounded-full h-16 w-16 flex items-center justify-center"
              onClick={isListening ? stopListening : startListening}
            >
              {isListening ? (
                <MicOff className="h-6 w-6" />
              ) : (
                <Mic className="h-6 w-6" />
              )}
            </Button>
            
            <Button
              variant="outline"
              className="rounded-full h-12 w-12 flex items-center justify-center"
              onClick={toggleMute}
            >
              {isMuted ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </Button>
          </div>
          
          {/* Volume slider */}
          {!isMuted && (
            <div className="w-48 mb-6">
              <Slider
                value={[volume * 100]}
                min={0}
                max={100}
                step={1}
                onValueChange={(value) => setVolume(value[0] / 100)}
              />
            </div>
          )}
          
          <div className="flex justify-center">
            <Button 
              variant="outline" 
              className="px-6"
              onClick={endInterview}
            >
              End Interview
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceInterviewer;
