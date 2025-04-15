
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ResumeUploaderProps {
  onResumeData: (text: string) => void;
}

const ResumeUploader: React.FC<ResumeUploaderProps> = ({ onResumeData }) => {
  const [resumeText, setResumeText] = useState<string>('');
  const [isUploaded, setIsUploaded] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    setIsLoading(true);
    
    try {
      // Simple text reading - in a real app, you would have proper file parsing
      const text = await readFileAsText(file);
      setResumeText(text);
      onResumeData(text);
      setIsUploaded(true);
      toast.success('Resume uploaded successfully');
    } catch (error) {
      console.error('Error reading file:', error);
      toast.error('Failed to read resume file');
    } finally {
      setIsLoading(false);
    }
  }, [onResumeData]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1
  });

  const handleManualInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setResumeText(text);
    onResumeData(text);
    if (text.trim()) {
      setIsUploaded(true);
    } else {
      setIsUploaded(false);
    }
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      reader.readAsText(file);
    });
  };

  return (
    <div className="space-y-4">
      <div 
        {...getRootProps()} 
        className={`p-4 border-2 border-dashed rounded-md text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-primary bg-primary/10' : 'border-muted-foreground/20 hover:border-primary/50'}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-2">
          <Upload className="h-8 w-8 text-muted-foreground" />
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <p>Processing...</p>
            </div>
          ) : isDragActive ? (
            <p>Drop your resume file here...</p>
          ) : (
            <div>
              <p className="text-sm text-muted-foreground">
                Drag & drop your resume file here, or click to select
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Supports: TXT, PDF, DOC, DOCX
              </p>
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium">Resume Content</h4>
          {isUploaded && (
            <span className="flex items-center text-xs text-green-600">
              <Check className="w-3 h-3 mr-1" />
              Resume ready for analysis
            </span>
          )}
        </div>
        <Textarea
          placeholder="Or paste your resume content here..."
          className="min-h-[150px] font-mono text-sm"
          value={resumeText}
          onChange={handleManualInput}
        />
      </div>
    </div>
  );
};

export default ResumeUploader;
