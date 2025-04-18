import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, File, X, Brain, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import ResumeUploader from '@/components/ResumeUploader';
import { analyzeResume } from '@/utils/resumeAnalysisService';

enum JobFit {
  High = 'high',
  Medium = 'medium',
  Low = 'low',
}

const Resume = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [jobFit, setJobFit] = useState<JobFit>(JobFit.Medium);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const handleResumeData = async (text: string) => {
    setResumeText(text);
  };
  
  const handleAnalyze = async () => {
    if (!resumeText.trim()) {
      toast.error('Please upload or paste your resume content');
      return;
    }
    
    if (!jobDescription.trim()) {
      toast.error('Please provide a job description');
      return;
    }
    
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      const result = await analyzeResume(resumeText, jobDescription);
      setAnalysisResult(result);
      
      // Ensure analysisResult.jobFit is not null or undefined before proceeding
      if (result && result.jobFit) {
        // Convert jobFit to lowercase for case-insensitive comparison
        const jobFitLevel = (result.jobFit && typeof result.jobFit === 'string')
          ? (result.jobFit.toLowerCase() === 'high' ? 'high' 
            : result.jobFit.toLowerCase() === 'medium' ? 'medium' 
            : 'low')
          : 'medium';

        setJobFit(jobFitLevel as JobFit);
      } else {
        // Handle the case where jobFit is null or undefined
        setJobFit(JobFit.Medium); // Set a default value
      }
      
      toast.success('Resume analysis complete');
    } catch (error: any) {
      console.error('Error analyzing resume:', error);
      setErrorMessage(error.message || 'Failed to analyze resume');
      toast.error('Failed to analyze resume');
    } finally {
      setIsLoading(false);
    }
  };
  
  const getJobFitColor = (fit: JobFit) => {
    switch (fit) {
      case JobFit.High:
        return 'bg-green-100 text-green-800';
      case JobFit.Medium:
        return 'bg-amber-100 text-amber-800';
      case JobFit.Low:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-8 px-4 md:px-6">
        <div className="md:grid md:grid-cols-2 md:gap-6">
          <div className="md:col-span-1">
            <div className="space-y-4">
              <h1 className="text-3xl font-bold">Resume Analysis</h1>
              <p className="text-muted-foreground">
                Upload your resume and provide a job description to get AI-powered feedback.
              </p>
              
              <Card>
                <CardHeader>
                  <CardTitle>Resume Upload</CardTitle>
                  <CardDescription>
                    Upload your resume in TXT, PDF, DOC, or DOCX format
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResumeUploader onResumeData={handleResumeData} />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Job Description</CardTitle>
                  <CardDescription>
                    Paste the job description for the role you're applying for
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Paste job description here..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="min-h-[120px]"
                  />
                </CardContent>
              </Card>
              
              <Button 
                onClick={handleAnalyze} 
                disabled={isLoading || !resumeText.trim() || !jobDescription.trim()}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-4 w-4" />
                    Analyze Resume
                  </>
                )}
              </Button>
              
              {errorMessage && (
                <div className="rounded-md border p-4 bg-red-100 text-red-800">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    <p className="text-sm font-medium">Error</p>
                  </div>
                  <p className="text-sm">{errorMessage}</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="md:col-span-1">
            {analysisResult ? (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Analysis Results</CardTitle>
                    <Badge className={getJobFitColor(jobFit)}>
                      Job Fit: {jobFit}
                    </Badge>
                  </div>
                  <CardDescription>
                    Here's how well your resume matches the job description
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Overall Score</h3>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Match Percentage</p>
                      <p className="text-sm">{analysisResult.matchPercentage}%</p>
                    </div>
                    <Progress value={analysisResult.matchPercentage} />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Key Skills</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {analysisResult.keySkills.map((skill: string) => (
                        <Badge key={skill} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Missing Skills</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {analysisResult.missingSkills.map((skill: string) => (
                        <Badge key={skill} variant="destructive">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Summary</h3>
                    <p className="text-sm text-muted-foreground">
                      {analysisResult.summary}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Analysis Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Upload your resume and provide a job description to see the analysis results.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Resume;
