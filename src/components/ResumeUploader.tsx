
import { useState } from 'react';
import { Upload, File, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export interface ResumeUploaderProps {
  onResumeData?: (resumeText: string) => Promise<void>;
  onResumeProcessed?: (resumeText: string) => Promise<void>;
}

const ResumeUploader = ({ onResumeData, onResumeProcessed }: ResumeUploaderProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [resumeText, setResumeText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      readFile(e.target.files[0]);
    }
  };
  
  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      if (e.target?.result) {
        const text = e.target.result as string;
        setResumeText(text);
      }
    };
    reader.readAsText(file);
  };
  
  const handleRemoveFile = () => {
    setFile(null);
    setResumeText('');
  };
  
  const handleProcess = async () => {
    if (!resumeText.trim()) {
      toast.error('Please upload or paste your resume content');
      return;
    }
    
    setIsUploading(true);
    try {
      // Call the appropriate callback based on which one is provided
      if (onResumeData) {
        await onResumeData(resumeText);
      } 
      
      if (onResumeProcessed) {
        await onResumeProcessed(resumeText);
      }
      
      toast.success('Resume processed successfully');
    } catch (error) {
      console.error('Error processing resume:', error);
      toast.error('Error processing your resume');
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Your Resume</CardTitle>
        <CardDescription>
          Upload a text resume or paste your resume content directly
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Input
            type="file"
            id="resume"
            accept=".txt,.pdf,.doc,.docx"
            onChange={handleFileChange}
            className="cursor-pointer"
          />
        </div>
        
        {file && (
          <div className="flex items-center justify-between rounded-md border p-4">
            <div className="flex items-center space-x-2">
              <File className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleRemoveFile}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Resume Content</p>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? 'Done' : 'Edit'}
            </Button>
          </div>
          
          {isEditing ? (
            <textarea
              className="w-full min-h-[200px] p-3 border rounded-md font-mono text-sm"
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your resume content here..."
            />
          ) : (
            <div className="w-full min-h-[200px] max-h-[400px] overflow-y-auto p-3 border rounded-md font-mono text-sm">
              {resumeText ? (
                <pre className="whitespace-pre-wrap">{resumeText}</pre>
              ) : (
                <p className="text-muted-foreground">
                  Upload a file or paste your resume content here...
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter>
        <Button 
          onClick={handleProcess} 
          disabled={isUploading || !resumeText.trim()}
          className="w-full"
        >
          {isUploading ? (
            <>
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Processing...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Process Resume
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ResumeUploader;
