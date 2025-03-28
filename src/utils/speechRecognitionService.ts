
import { toast } from 'sonner';

// Hardcoded OpenAI API key (should be secured in production)
const OPENAI_API_KEY = "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";

/**
 * Transcribe audio using OpenAI's Whisper API
 */
export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  try {
    // Create a FormData object to send the audio file
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');
    
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`
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
    toast.error('Failed to transcribe speech. Please try again.');
    return '';
  }
}

/**
 * Record audio from microphone
 */
export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  
  constructor(private onComplete: (audioBlob: Blob) => void) {}
  
  async start(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };
      
      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.onComplete(audioBlob);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };
      
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

/**
 * Synthesize speech using OpenAI's TTS-1 API
 */
export async function synthesizeSpeech(text: string, voice: string = 'alloy'): Promise<ArrayBuffer | null> {
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
        voice: voice,
        response_format: 'mp3'
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
}

/**
 * Play audio from ArrayBuffer
 */
export function playAudio(audioData: ArrayBuffer): Promise<void> {
  return new Promise((resolve) => {
    const audioContext = new AudioContext();
    audioContext.decodeAudioData(audioData, (buffer) => {
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.onended = () => {
        resolve();
      };
      source.start(0);
    });
  });
}
