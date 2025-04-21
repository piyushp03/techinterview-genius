
import React, { useState, useCallback } from 'react';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import ResumeUploader from '@/components/ResumeUploader';
import { analyzeResume, ResumeAnalysisResult } from '@/utils/openaiService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Check, AlertTriangle, ArrowRight } from 'lucide-react';

interface ResumeAnalysis {
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  jobFit: 'low' | 'medium' | 'high';
  score: number;
}

export const Resume = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [resumeAnalysis, setResumeAnalysis] = useState<ResumeAnalysis | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // This function will be called when a resume is uploaded and processed
  const handleAnalyzeResume = useCallback(async (resumeText: string) => {
    setIsAnalyzing(true);
    try {
      const analysis = await analyzeResume(resumeText);
      setAnalysisResult(analysis.analysisText);
      setResumeAnalysis({
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        suggestions: analysis.suggestions,
        jobFit: analysis.jobFit,
        score: analysis.score
      });
      toast.success('Resume analyzed successfully');
    } catch (error) {
      console.error('Error analyzing resume:', error);
      toast.error('Failed to analyze resume');
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto p-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Resume Analyzer</h1>
        
        {/* Resume Uploader Component */}
        <div className="mb-8">
          <ResumeUploader onResumeProcessed={handleAnalyzeResume} />
        </div>
        
        {/* Analysis Results */}
        {isAnalyzing && (
          <div className="flex flex-col items-center justify-center my-8 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Analyzing your resume with AI...</p>
          </div>
        )}
        
        {resumeAnalysis && (
          <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="details">Detailed Analysis</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview">
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle>Resume Score</CardTitle>
                        <Badge variant="outline" className="text-lg font-medium">
                          {resumeAnalysis.score}/100
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium">Overall Score</span>
                            <span className="text-sm font-medium">{resumeAnalysis.score}/100</span>
                          </div>
                          <Progress value={resumeAnalysis.score} className="h-2" />
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium">Job Fit</span>
                            <span className="text-sm font-medium capitalize">{resumeAnalysis.jobFit}</span>
                          </div>
                          <Progress 
                            value={resumeAnalysis.jobFit === 'high' ? 100 : resumeAnalysis.jobFit === 'medium' ? 60 : 30} 
                            className={`h-2 ${
                              resumeAnalysis.jobFit === 'high' 
                                ? 'bg-green-600' 
                                : resumeAnalysis.jobFit === 'medium' 
                                  ? 'bg-yellow-500' 
                                  : 'bg-red-500'
                            }`}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Key Strengths</CardTitle>
                      <CardDescription>
                        Positive aspects of your resume that stand out
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {resumeAnalysis.strengths.map((strength, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Areas for Improvement</CardTitle>
                      <CardDescription>
                        Aspects of your resume that could be improved
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {resumeAnalysis.weaknesses.map((weakness, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                            <span>{weakness}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Recommendations</CardTitle>
                      <CardDescription>
                        Actionable suggestions to improve your resume
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {resumeAnalysis.suggestions.map((suggestion, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <ArrowRight className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="details">
                <Card>
                  <CardHeader>
                    <CardTitle>Detailed Analysis</CardTitle>
                    <CardDescription>
                      In-depth review of your resume
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="prose dark:prose-invert max-w-none">
                      <div dangerouslySetInnerHTML={{ __html: analysisResult?.replace(/\n/g, '<br />') || '' }} />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
    </div>
  );
};

export default Resume;
