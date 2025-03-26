
import { useState, useEffect, useCallback, useRef } from 'react';

interface UseSpeechRecognitionProps {
  onResult?: (transcript: string) => void;
  onEnd?: () => void;
  continuous?: boolean;
  interimResults?: boolean;
  lang?: string;
}

interface UseSpeechRecognitionReturn {
  transcript: string;
  listening: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  browserSupportsSpeechRecognition: boolean;
}

// Type definition for the Web Speech API
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
  readonly type: string;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

// Fix the SpeechRecognition types
type SpeechRecognitionType = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}

export const useSpeechRecognition = ({
  onResult,
  onEnd,
  continuous = true,
  interimResults = true,
  lang = 'en-US',
}: UseSpeechRecognitionProps = {}): UseSpeechRecognitionReturn => {
  const [transcript, setTranscript] = useState('');
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionType | null>(null);

  // Fix: Use proper window property access with proper types
  const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const browserSupportsSpeechRecognition = !!SpeechRecognitionAPI;

  // Initialize recognition on mount
  useEffect(() => {
    if (!browserSupportsSpeechRecognition) {
      console.error('This browser does not support speech recognition.');
      return;
    }

    recognitionRef.current = new SpeechRecognitionAPI() as SpeechRecognitionType;
    recognitionRef.current.continuous = continuous;
    recognitionRef.current.interimResults = interimResults;
    recognitionRef.current.lang = lang;

    return () => {
      if (recognitionRef.current && listening) {
        recognitionRef.current.abort();
        setListening(false);
      }
    };
  }, [browserSupportsSpeechRecognition, continuous, interimResults, lang, listening]);

  // Set up recognition event handlers
  useEffect(() => {
    if (!recognitionRef.current) return;

    const handleResult = (event: SpeechRecognitionEvent) => {
      let currentTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        currentTranscript += result[0].transcript;
      }
      
      setTranscript(currentTranscript);
      
      if (onResult) {
        onResult(currentTranscript);
      }
    };

    const handleError = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error', event.error, event.message);
    };

    const handleEnd = () => {
      if (listening) {
        // If it was supposed to be listening but ended, restart it
        recognitionRef.current?.start();
      } else {
        setListening(false);
        if (onEnd) {
          onEnd();
        }
      }
    };

    recognitionRef.current.onresult = handleResult;
    recognitionRef.current.onerror = handleError;
    recognitionRef.current.onend = handleEnd;
  }, [onResult, onEnd, listening]);

  const startListening = useCallback(() => {
    if (!browserSupportsSpeechRecognition || !recognitionRef.current) {
      console.error('Speech recognition is not supported');
      return;
    }

    setTranscript('');

    try {
      recognitionRef.current.start();
      setListening(true);
    } catch (error) {
      console.error('Error starting speech recognition:', error);
    }
  }, [browserSupportsSpeechRecognition]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  return {
    transcript,
    listening,
    startListening,
    stopListening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  };
};

export default useSpeechRecognition;
