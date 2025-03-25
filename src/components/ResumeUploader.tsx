
import { useState, useRef } from 'react';
import { FilePlus, FileText, X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ResumeUploaderProps {
  onResumeProcessed: (text: string) => void;
}

const ResumeUploader = ({ onResumeProcessed }: ResumeUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (isValidFile(droppedFile)) {
      setFile(droppedFile);
      processFile(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && isValidFile(selectedFile)) {
      setFile(selectedFile);
      processFile(selectedFile);
    }
  };

  const isValidFile = (file: File): boolean => {
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a PDF, DOCX, or TXT file');
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size should be less than 5MB');
      return false;
    }
    return true;
  };

  const processFile = async (file: File) => {
    setIsUploading(true);
    
    try {
      // For now, we'll just simulate text extraction
      // In a real app, we would send this to a backend for processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock extracted text
      const mockResumeText = `
        John Doe
        Software Engineer

        EXPERIENCE
        Senior Frontend Developer at TechCorp (2020-Present)
        - Developed and maintained React applications
        - Implemented responsive designs using Tailwind CSS
        - Collaborated with backend teams on API integration

        Software Engineer at WebSolutions (2018-2020)
        - Built RESTful APIs using Node.js and Express
        - Worked on database design and optimization

        EDUCATION
        B.S. Computer Science, University of Technology (2014-2018)

        SKILLS
        JavaScript, TypeScript, React, Node.js, HTML/CSS, Git, CI/CD, AWS
      `;
      
      onResumeProcessed(mockResumeText);
      toast.success('Resume processed successfully');
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Failed to process file');
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFileSelector = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="glass-card p-6 transition-all duration-300">
      <h3 className="text-lg font-medium mb-4">Upload Resume</h3>
      
      {!file ? (
        <>
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              isDragging 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/20 hover:border-primary/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <FilePlus className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
            <p className="mb-2 font-medium">Drag and drop your resume</p>
            <p className="text-sm text-muted-foreground mb-4">
              Supports PDF, DOCX, and TXT files (max 5MB)
            </p>
            <Button type="button" onClick={openFileSelector} variant="outline" className="mx-auto">
              <Upload className="mr-2 h-4 w-4" />
              Browse Files
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.docx,.doc,.txt"
              className="hidden"
            />
          </div>
          <p className="text-xs text-center mt-3 text-muted-foreground">
            Your resume will be used to personalize interview questions based on your skills and experience.
          </p>
        </>
      ) : (
        <div className="bg-muted/50 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center">
            <FileText className="w-8 h-8 mr-3 text-primary" />
            <div>
              <p className="font-medium truncate max-w-[180px] md:max-w-xs">
                {file.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024).toFixed(1)} KB • {isUploading ? 'Processing...' : 'Processed'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={removeFile}
            disabled={isUploading}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default ResumeUploader;
