
// Note: This is a mock implementation for demonstration
// In a real app, this would connect to actual speech recognition services

import { toast } from 'sonner';

// API key for OpenAI Whisper API (hardcoded for testing)
const API_KEY = "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";

// AudioRecorder class for recording audio
export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private onStopCallback: (audioBlob: Blob) => void;

  constructor(onStopCallback: (audioBlob: Blob) => void) {
    this.onStopCallback = onStopCallback;
  }

  async start(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];

      this.mediaRecorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      });

      this.mediaRecorder.addEventListener('stop', () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.onStopCallback(audioBlob);
        
        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
      });

      this.mediaRecorder.start();
    } catch (error) {
      console.error('Error starting audio recording:', error);
      toast.error('Failed to access microphone. Please check your permissions.');
    }
  }

  stop(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
  }
}

// Transcribe audio using OpenAI's Whisper API
export const transcribeAudio = async (audioBlob: Blob): Promise<string | null> => {
  try {
    console.log('Transcribing audio with Whisper API using hardcoded API key');
    
    // Convert the audio blob to a base64 string
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.webm');
    formData.append('model', 'whisper-1');
    
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      },
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Whisper API error:', errorData);
      throw new Error(`Whisper API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    toast.error('Failed to transcribe audio. Please try again.');
    return null;
  }
};

// Synthesize speech using a text-to-speech API
export const synthesizeSpeech = async (text: string): Promise<ArrayBuffer | null> => {
  try {
    console.log('Synthesizing speech with TTS API using hardcoded API key');
    
    // Use OpenAI's TTS API
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: 'alloy'
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('TTS API error:', errorData);
      throw new Error(`TTS API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.arrayBuffer();
  } catch (error) {
    console.error('Error synthesizing speech:', error);
    toast.error('Failed to generate speech. Please try again.');
    return null;
  }
};

// Play audio from ArrayBuffer
export const playAudio = async (audioData: ArrayBuffer): Promise<void> => {
  const audioContext = new AudioContext();
  const audioBuffer = await audioContext.decodeAudioData(audioData);
  
  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioContext.destination);
  source.start();
  
  return new Promise((resolve) => {
    source.onended = () => {
      resolve();
    };
  });
};
