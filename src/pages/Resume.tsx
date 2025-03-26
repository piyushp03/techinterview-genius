
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import ResumeUploader from '@/components/ResumeUploader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Check, AlertTriangle, RefreshCw, PieChart } from 'lucide-react';
import { analyzeResume } from '@/utils/openaiService';
import { supabase } from '@/integrations/supabase/client';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ChartContainer } from '@/components/ui/chart';
import { toast } from 'sonner';

const Resume = () => {
  const { user } = useAuth();
  const [resumeText, setResumeText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const handleResumeUpload = (text: string) => {
    setResumeText(text);
    setAnalysisResult(null);
  };

  const analyzeResumeText = async () => {
    if (!resumeText) return;
    
    setIsAnalyzing(true);
    
    try {
      // Use the OpenAI API to analyze the resume
      const result = await analyzeResume(resumeText);
      setAnalysisResult(result);
      
      // Save the analysis to Supabase if user is logged in
      if (user) {
        await supabase.from('resume_analysis').upsert({
          user_id: user.id,
          resume_text: resumeText,
          analysis_result: result,
          created_at: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Resume analysis error:', error);
      toast.error('Failed to analyze resume');
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

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444'];
  
  const getSkillsChartData = () => {
    if (!analysisResult) return [];
    
    // Hypothetical skill scores based on the analysis
    return [
      { name: 'Technical', value: calculateSkillScore('technical') },
      { name: 'Communication', value: calculateSkillScore('communication') },
      { name: 'Leadership', value: calculateSkillScore('leadership') },
      { name: 'Problem Solving', value: calculateSkillScore('problem-solving') }
    ];
  };
  
  const calculateSkillScore = (skillType: string) => {
    // This is a simplistic way to extract skill scores from the analysis
    // In a real implementation, the AI would provide these scores directly
    const strengths = analysisResult.strengths.join(' ').toLowerCase();
    const weaknesses = analysisResult.weaknesses.join(' ').toLowerCase();
    
    let baseScore = 70; // Start with a neutral score
    
    const keywords: Record<string, string[]> = {
      'technical': ['technical', 'skills', 'programming', 'development', 'coding', 'software', 'engineering'],
      'communication': ['communication', 'writing', 'presenting', 'detail', 'clarity', 'articulate'],
      'leadership': ['leadership', 'management', 'team', 'initiative', 'leading', 'directing'],
      'problem-solving': ['problem', 'solving', 'analytical', 'solution', 'approach', 'critical']
    };
    
    // Increase score for strengths that match this skill
    keywords[skillType].forEach(keyword => {
      if (strengths.includes(keyword)) baseScore += 5;
    });
    
    // Decrease score for weaknesses that match this skill
    keywords[skillType].forEach(keyword => {
      if (weaknesses.includes(keyword)) baseScore -= 5;
    });
    
    // Ensure the score stays within 0-100
    return Math.min(100, Math.max(0, baseScore));
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
                <ResumeUploader onResumeProcessed={handleResumeUpload} />
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
                    onClick={analyzeResumeText} 
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
                <CardContent className="h-52">
                  <ChartContainer config={{
                    Technical: { color: '#4f46e5' },
                    Communication: { color: '#10b981' },
                    Leadership: { color: '#f59e0b' },
                    'Problem Solving': { color: '#ef4444' }
                  }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={getSkillsChartData()}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          fill="#8884d8"
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {getSkillsChartData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
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
