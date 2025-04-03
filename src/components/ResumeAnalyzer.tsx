
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Upload, FileText, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ResumeAnalyzerProps {
  onResumeAnalyzed: (resumeText: string) => void;
}

const ResumeAnalyzer: React.FC<ResumeAnalyzerProps> = ({ onResumeAnalyzed }) => {
  const [resumeText, setResumeText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalyzed, setIsAnalyzed] = useState(false);

  const handleAnalyzeResume = () => {
    if (!resumeText.trim()) {
      toast.error('Please enter your resume text first');
      return;
    }

    setIsAnalyzing(true);
    
    // Simulate analysis
    setTimeout(() => {
      setIsAnalyzing(false);
      setIsAnalyzed(true);
      onResumeAnalyzed(resumeText);
      toast.success('Resume analyzed successfully');
    }, 1500);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Resume Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="resume">Paste your resume text below</Label>
            <Textarea
              id="resume"
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your resume text here..."
              className="h-40"
              disabled={isAnalyzing || isAnalyzed}
            />
          </div>
          
          {isAnalyzed ? (
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Check className="h-5 w-5 text-green-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">Resume analyzed successfully</h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>Your resume has been analyzed and will be used to tailor the interview questions.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <Button 
              onClick={handleAnalyzeResume} 
              disabled={isAnalyzing || !resumeText.trim()}
              className="w-full"
            >
              {isAnalyzing ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Analyzing Resume...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" /> Analyze Resume
                </>
              )}
            </Button>
          )}
          
          <div className="text-sm text-muted-foreground">
            <p className="flex items-start gap-1">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              Your resume data is only used to personalize your interview experience.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResumeAnalyzer;
