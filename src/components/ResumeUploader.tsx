
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Upload, File, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ResumeUploaderProps {
  onResumeData: (text: string) => void;
}

const ResumeUploader: React.FC<ResumeUploaderProps> = ({ onResumeData }) => {
  const [resumeText, setResumeText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const extractTextFromFile = async (file: File) => {
    setIsLoading(true);
    try {
      if (file.type === 'text/plain') {
        // Handle text files
        const text = await file.text();
        setResumeText(text);
        onResumeData(text);
      } else if (file.type === 'application/pdf') {
        // For PDF files, we'll just extract the text from the first few pages
        // In a real app, you'd want to use a more robust PDF parser
        const text = `Content extracted from PDF: ${file.name}
        
This is a simplified representation as we don't have a full PDF parser in this demo.
Please enter the resume content manually or upload a text file.`;
        setResumeText(text);
        onResumeData(text);
        toast.info('PDF extraction is limited in this demo. Consider pasting the text manually.');
      } else if (
        file.type === 'application/msword' ||
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        // For Word docs, similar limitation
        const text = `Content extracted from Word document: ${file.name}
        
This is a simplified representation as we don't have a full Word parser in this demo.
Please enter the resume content manually or upload a text file.`;
        setResumeText(text);
        onResumeData(text);
        toast.info('Word document extraction is limited in this demo. Consider pasting the text manually.');
      } else {
        toast.error('Unsupported file format. Please upload a text, PDF, DOC, or DOCX file.');
      }
    } catch (error) {
      console.error('Error extracting text from file:', error);
      toast.error('Failed to extract text from file');
    } finally {
      setIsLoading(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setFile(file);
      extractTextFromFile(file);
    }
  }, []);

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

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setResumeText(e.target.value);
    onResumeData(e.target.value);
  };

  const clearFile = () => {
    setFile(null);
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-primary bg-primary/10' : 'border-muted-foreground/30 hover:border-primary/50'}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-2">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium">
            {isDragActive ? 'Drop the file here' : 'Drag & drop a file or click to browse'}
          </p>
          <p className="text-xs text-muted-foreground">
            Supports TXT, PDF, DOC, DOCX
          </p>
        </div>
      </div>
      
      {file && (
        <div className="flex items-center justify-between bg-muted p-2 rounded-md">
          <div className="flex items-center space-x-2">
            <File className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm truncate max-w-[200px]">{file.name}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={clearFile}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <Textarea
          placeholder="Or paste your resume content here..."
          value={resumeText}
          onChange={handleTextChange}
          className="min-h-[150px]"
        />
      )}
    </div>
  );
};

export default ResumeUploader;
