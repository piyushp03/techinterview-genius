
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import ResumeUploader from '@/components/ResumeUploader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Check, AlertTriangle, RefreshCw } from 'lucide-react';

const Resume = () => {
  const { user } = useAuth();
  const [resumeText, setResumeText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const handleResumeUpload = (text: string) => {
    setResumeText(text);
    setAnalysisResult(null);
  };

  const analyzeResume = async () => {
    if (!resumeText) return;
    
    setIsAnalyzing(true);
    
    try {
      // Simulate AI analysis with a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock response - in production, this would be a call to an API
      setAnalysisResult({
        strengths: [
          'Clear presentation of technical skills',
          'Quantified achievements',
          'Good job history progression'
        ],
        weaknesses: [
          'Too verbose in some sections',
          'Some technical jargon may be unclear to non-technical recruiters',
          'Project descriptions could be more concise'
        ],
        suggestions: [
          'Tailor your resume more specifically to each job application',
          'Add more metrics and quantifiable results',
          'Consider a skills-based format to highlight technical expertise'
        ],
        jobFit: 'medium',
        score: 78
      });
    } catch (error) {
      console.error('Resume analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setResumeText('');
    setAnalysisResult(null);
  };

  const renderAnalysisScore = () => {
    const score = analysisResult?.score || 0;
    let color = 'text-red-500';
    let icon = <AlertTriangle className="h-5 w-5" />;
    
    if (score >= 70) {
      color = 'text-green-500';
      icon = <Check className="h-5 w-5" />;
    } else if (score >= 50) {
      color = 'text-amber-500';
      icon = <AlertTriangle className="h-5 w-5" />;
    }
    
    return (
      <div className={`flex items-center gap-2 ${color} text-2xl font-bold`}>
        {icon}
        {score}/100
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container py-8 px-4 md:px-6">
        <h1 className="text-3xl font-bold mb-6">Resume Analysis</h1>
        
        {!resumeText ? (
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Upload Your Resume</CardTitle>
                <CardDescription>
                  Our AI will analyze your resume and provide feedback to help you improve it
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResumeUploader onTextExtracted={handleResumeUpload} />
              </CardContent>
            </Card>
          </div>
        ) : !analysisResult ? (
          <div className="max-w-3xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between">
                  <span>Resume Uploaded Successfully</span>
                  <FileText className="h-6 w-6 text-green-500" />
                </CardTitle>
                <CardDescription>
                  Your resume has been uploaded and is ready for analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-md p-4 mb-6 max-h-64 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm">{resumeText}</pre>
                </div>
                
                <div className="flex justify-between">
                  <Button variant="outline" onClick={resetAnalysis}>
                    Upload a Different Resume
                  </Button>
                  <Button 
                    onClick={analyzeResume} 
                    disabled={isAnalyzing}
                    className="gap-2"
                  >
                    {isAnalyzing ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      'Analyze Resume'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Resume Content</CardTitle>
                <CardDescription>
                  The text extracted from your resume
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-md p-4 max-h-[500px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm">{resumeText}</pre>
                </div>
                
                <div className="mt-6">
                  <Button variant="outline" onClick={resetAnalysis}>
                    Upload a Different Resume
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>Resume Score</span>
                    {renderAnalysisScore()}
                  </CardTitle>
                  <CardDescription>
                    Overall assessment of your resume
                  </CardDescription>
                </CardHeader>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Strengths</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysisResult.strengths.map((strength: string, i: number) => (
                      <li key={i} className="flex gap-2">
                        <Check className="h-5 w-5 text-green-500 shrink-0" />
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Areas for Improvement</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysisResult.weaknesses.map((weakness: string, i: number) => (
                      <li key={i} className="flex gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                        <span>{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Suggestions</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-5 space-y-1">
                    {analysisResult.suggestions.map((suggestion: string, i: number) => (
                      <li key={i}>{suggestion}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Resume;
