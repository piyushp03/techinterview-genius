
import React, { useState } from 'react';
import { toast } from 'sonner';
import ResumeUploader from '@/components/ResumeUploader';
import { analyzeResume, ResumeAnalysisResult } from '@/utils/openaiService';

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
  
  // This function will be called when a resume is uploaded and processed
  const handleAnalyzeResume = async (resumeText: string) => {
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
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Resume Analyzer</h1>
      
      {/* Resume Uploader Component */}
      <div className="mb-8">
        <ResumeUploader onResumeProcessed={handleAnalyzeResume} />
      </div>
      
      {/* Analysis Results */}
      {isAnalyzing && (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}
      
      {resumeAnalysis && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Resume Analysis</h2>
              <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                Score: {resumeAnalysis.score}/100
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Strengths */}
              <div>
                <h3 className="text-lg font-medium text-green-600 mb-2">Strengths</h3>
                <ul className="space-y-2">
                  {resumeAnalysis.strengths.map((strength, index) => (
                    <li key={index} className="flex gap-2">
                      <span className="text-green-500">✓</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Weaknesses */}
              <div>
                <h3 className="text-lg font-medium text-amber-600 mb-2">Areas for Improvement</h3>
                <ul className="space-y-2">
                  {resumeAnalysis.weaknesses.map((weakness, index) => (
                    <li key={index} className="flex gap-2">
                      <span className="text-amber-500">!</span>
                      <span>{weakness}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            {/* Suggestions */}
            <div className="mt-6">
              <h3 className="text-lg font-medium text-blue-600 mb-2">Suggestions</h3>
              <ul className="space-y-2">
                {resumeAnalysis.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex gap-2">
                    <span className="text-blue-500">→</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Job Fit */}
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">Job Fit Assessment</h3>
              <div className="flex items-center">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full ${
                      resumeAnalysis.jobFit === 'high' 
                        ? 'w-full bg-green-500' 
                        : resumeAnalysis.jobFit === 'medium' 
                          ? 'w-2/3 bg-yellow-500' 
                          : 'w-1/3 bg-red-500'
                    }`}
                  ></div>
                </div>
                <span className="ml-2 text-sm font-medium">
                  {resumeAnalysis.jobFit.charAt(0).toUpperCase() + resumeAnalysis.jobFit.slice(1)}
                </span>
              </div>
            </div>
          </div>
          
          {/* Full Analysis Text */}
          {analysisResult && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Detailed Analysis</h2>
              <div className="whitespace-pre-line text-sm">{analysisResult}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Resume;
