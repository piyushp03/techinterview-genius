
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileInput } from '@/components/ui/file-input';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';
import { File, Upload, CheckCircle2, AlertTriangle } from 'lucide-react';

interface ResumeAnalysisResult {
  analysisText: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  jobFit: 'low' | 'medium' | 'high';
  score: number;
}

// Hardcoded API key for testing
const API_KEY = "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";

const ResumeAnalyzer: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ResumeAnalysisResult | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Only accept PDF and DOCX files
      if (selectedFile.type !== 'application/pdf' && selectedFile.type !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        toast.error('Please upload a PDF or DOCX file');
        return;
      }
      
      // Size check (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB');
        return;
      }
      
      setFile(selectedFile);
      setAnalysisResult(null);
      setResumeText('');
    }
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const base64String = reader.result.split(',')[1];
          resolve(base64String);
        } else {
          reject(new Error('Failed to read file as base64'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const extractTextFromResume = async (base64File: string): Promise<string> => {
    try {
      console.log('Extracting text from resume using hardcoded API key');
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an expert at extracting text from resume PDFs. Extract all the relevant information from this resume in a well-structured format. Include name, contact details, work experience, education, skills, projects, certifications, and any other relevant sections.'
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Extract the complete text from this resume file. Format it in a well-structured way that preserves sections and important information.'
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:application/pdf;base64,${base64File}`
                  }
                }
              ]
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to extract text from resume');
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error extracting text from resume:', error);
      throw error;
    }
  };

  const analyzeResume = async (resumeText: string): Promise<ResumeAnalysisResult> => {
    try {
      console.log('Analyzing resume with hardcoded API key');
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a professional resume reviewer who provides detailed, constructive feedback on resumes. Your analysis should be thorough, specific, and actionable.'
            },
            {
              role: 'user',
              content: `Please analyze this resume and provide detailed feedback. Include: 
              1. An overall score out of 100 
              2. Key strengths (list at least 3)
              3. Areas for improvement (list at least 3)
              4. Specific suggestions for enhancing the resume (list at least 3)
              5. Job fit assessment (low, medium, or high)
              
              Format your response with clear section headers for:
              - Strengths:
              - Weaknesses:
              - Suggestions:
              - Job Fit:
              - Score:
              
              Resume text:
              ${resumeText}`
            }
          ],
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error('Failed to analyze resume');
      }

      const data = await response.json();
      const analysisText = data.choices[0].message.content;
      
      // Parse the analysis to extract structured data
      const strengths: string[] = [];
      const weaknesses: string[] = [];
      const suggestions: string[] = [];
      let jobFit: 'low' | 'medium' | 'high' = 'medium';
      let score = 70; // Default score
      
      // Extract strengths
      if (analysisText.includes('Strengths:')) {
        const strengthsSection = analysisText.split('Strengths:')[1].split(/Weaknesses:|Areas for Improvement:/)[0];
        const strengthItems = strengthsSection.split(/\n+/).filter(item => item.trim().startsWith('-'));
        strengthItems.forEach(item => {
          const cleaned = item.replace(/^-\s*/, '').trim();
          if (cleaned) strengths.push(cleaned);
        });
      }
      
      // Extract weaknesses
      const weaknessesRegex = /Weaknesses:|Areas for Improvement:|Areas to Improve:/;
      if (analysisText.match(weaknessesRegex)) {
        const weaknessesSection = analysisText.split(weaknessesRegex)[1].split(/Suggestions:|Recommendations:/)[0];
        const weaknessItems = weaknessesSection.split(/\n+/).filter(item => item.trim().startsWith('-'));
        weaknessItems.forEach(item => {
          const cleaned = item.replace(/^-\s*/, '').trim();
          if (cleaned) weaknesses.push(cleaned);
        });
      }
      
      // Extract suggestions
      const suggestionsRegex = /Suggestions:|Recommendations:/;
      if (analysisText.match(suggestionsRegex)) {
        const suggestionsSection = analysisText.split(suggestionsRegex)[1].split(/Overall Assessment:|Score:|Job Fit:/)[0];
        const suggestionItems = suggestionsSection.split(/\n+/).filter(item => item.trim().startsWith('-'));
        suggestionItems.forEach(item => {
          const cleaned = item.replace(/^-\s*/, '').trim();
          if (cleaned) suggestions.push(cleaned);
        });
      }
      
      // Extract score
      if (analysisText.includes('Score:')) {
        const scoreMatch = analysisText.match(/Score:\s*(\d+)/i);
        if (scoreMatch && scoreMatch[1]) {
          score = parseInt(scoreMatch[1], 10);
          if (score < 1) score = 1;
          if (score > 100) score = 100;
        }
      }
      
      // Extract job fit
      if (analysisText.toLowerCase().includes('job fit:')) {
        const jobFitLower = analysisText.toLowerCase();
        if (jobFitLower.includes('high') || jobFitLower.includes('strong') || jobFitLower.includes('excellent')) {
          jobFit = 'high';
        } else if (jobFitLower.includes('low') || jobFitLower.includes('poor') || jobFitLower.includes('weak')) {
          jobFit = 'low';
        } else {
          jobFit = 'medium';
        }
      }
      
      // Default values if parsing failed
      if (strengths.length === 0) strengths.push('Clear presentation of skills');
      if (weaknesses.length === 0) weaknesses.push('Could be more concise');
      if (suggestions.length === 0) suggestions.push('Add more quantifiable achievements');
      
      return {
        analysisText,
        strengths,
        weaknesses,
        suggestions,
        jobFit,
        score
      };
    } catch (error) {
      console.error('Error analyzing resume:', error);
      throw error;
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      toast.error('Please upload a resume file first');
      return;
    }
    
    try {
      setAnalyzing(true);
      setUploadProgress(10);
      
      // Read file as base64
      const base64File = await readFileAsBase64(file);
      setUploadProgress(30);
      
      // Extract text from resume
      const extractedText = await extractTextFromResume(base64File);
      setResumeText(extractedText);
      setUploadProgress(60);
      
      // Analyze resume
      const result = await analyzeResume(extractedText);
      setAnalysisResult(result);
      setUploadProgress(100);
      
      toast.success('Resume analysis completed');
    } catch (error) {
      console.error('Error analyzing resume:', error);
      toast.error('Failed to analyze resume. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const renderScoreGauge = (score: number) => {
    const scoreData = [{ name: 'Score', value: score }];
    
    return (
      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={scoreData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 100]} />
            <YAxis dataKey="name" type="category" />
            <Tooltip />
            <Bar dataKey="value" fill="#4f46e5" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderJobFitIndicator = (jobFit: 'low' | 'medium' | 'high') => {
    const colors = {
      low: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-green-100 text-green-800',
    };
    
    const labels = {
      low: 'Low Job Fit',
      medium: 'Medium Job Fit',
      high: 'High Job Fit',
    };
    
    return (
      <div className={`px-4 py-2 rounded-full text-sm font-medium ${colors[jobFit]}`}>
        {labels[jobFit]}
      </div>
    );
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Resume Analyzer</CardTitle>
        <CardDescription>Upload your resume to get AI-powered feedback and suggestions</CardDescription>
      </CardHeader>
      
      <CardContent>
        {!analysisResult ? (
          <div className="space-y-6">
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <File className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Upload Your Resume</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Supports PDF files up to 5MB
              </p>
              <FileInput onChange={handleFileChange} accept=".pdf,.docx" />
              {file && (
                <div className="mt-4 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-sm">{file.name}</span>
                </div>
              )}
            </div>
            
            {analyzing && (
              <div className="space-y-2">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-sm text-center text-muted-foreground">
                  {uploadProgress < 30 ? 'Uploading resume...' : 
                   uploadProgress < 60 ? 'Extracting content...' : 
                   'Analyzing resume...'}
                </p>
              </div>
            )}
            
            <Button 
              onClick={handleAnalyze} 
              disabled={!file || analyzing} 
              className="w-full"
            >
              {analyzing ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                  Analyzing Resume...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Analyze Resume
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div>
                <h3 className="text-lg font-medium">Overall Score</h3>
                <p className="text-sm text-muted-foreground">Based on content, structure, and relevance</p>
              </div>
              {renderJobFitIndicator(analysisResult.jobFit)}
            </div>
            
            {renderScoreGauge(analysisResult.score)}
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-3 text-green-600">Strengths</h3>
                <ul className="space-y-2">
                  {analysisResult.strengths.map((strength, index) => (
                    <li key={index} className="flex gap-2 items-start">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-3 text-amber-600">Areas to Improve</h3>
                <ul className="space-y-2">
                  {analysisResult.weaknesses.map((weakness, index) => (
                    <li key={index} className="flex gap-2 items-start">
                      <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span>{weakness}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-3">Recommendations</h3>
              <ul className="space-y-2">
                {analysisResult.suggestions.map((suggestion, index) => (
                  <li key={index} className="bg-muted p-3 rounded-md">
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
            
            <Button 
              variant="outline" 
              onClick={() => {
                setAnalysisResult(null);
                setFile(null);
                setResumeText('');
                setUploadProgress(0);
              }}
              className="w-full"
            >
              Analyze Another Resume
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ResumeAnalyzer;
