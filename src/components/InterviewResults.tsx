import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Award, BookOpen, CheckCircle, XCircle, AlertTriangle, Lightbulb, BarChart, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { InterviewAnalysis } from '@/utils/interviewAnalysisService';
import { generateInterviewResults } from '@/utils/interviewResultsService';
import { supabase } from '@/integrations/supabase/client';

interface InterviewAnalysisResultsProps {
  sessionId: string;
  questions?: string[];
  answers?: string[];
  isCompleted?: boolean;
}

const InterviewAnalysisResults = ({ 
  sessionId, 
  questions = [], 
  answers = [],
  isCompleted = true 
}: InterviewAnalysisResultsProps) => {
  const [analysis, setAnalysis] = useState<InterviewAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  useEffect(() => {
    // Only load/generate analysis if the interview is completed
    if (isCompleted) {
      loadAnalysis();
    }
  }, [sessionId, isCompleted]);

  const loadAnalysis = async () => {
    setIsLoading(true);
    try {
      // First try to get the existing analysis from the database
      const { data, error } = await supabase
        .from('interview_analysis')
        .select('*')
        .eq('session_id', sessionId)
        .maybeSingle();
      
      if (!error && data && data.summary) {
        // If we have an existing analysis, use it
        setAnalysis(data.summary as unknown as InterviewAnalysis);
      } else {
        // Otherwise, generate a new analysis
        const newAnalysis = await generateInterviewResults(sessionId);
        setAnalysis(newAnalysis);
        
        // Save the new analysis to the database
        await supabase
          .from('interview_analysis')
          .upsert({
            session_id: sessionId,
            summary: JSON.stringify(newAnalysis)
          });
      }
    } catch (error) {
      console.error('Error loading/generating analysis:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExpandSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };

  if (isLoading || !analysis) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const { metrics, strengths, weaknesses, recommendations, summaryText } = analysis;

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-500";
    if (score >= 6) return "text-amber-500";
    return "text-red-500";
  };

  const renderMetricBar = (label: string, value: number) => (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className={getScoreColor(value)}>{value}/10</span>
      </div>
      <Progress 
        value={value * 10} 
        className={`h-2 ${
          value >= 8 ? 'bg-green-100' : value >= 6 ? 'bg-amber-100' : 'bg-red-100'
        }`} 
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Interview Analysis</CardTitle>
            <Badge 
              variant={metrics.overall >= 8 ? "default" : metrics.overall >= 6 ? "secondary" : "destructive"} 
              className="text-lg py-1 px-3"
            >
              {metrics.overall}/10
            </Badge>
          </div>
          <CardDescription>
            Overall assessment of your interview performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">{summaryText}</p>
          
          <div className="space-y-3">
            {renderMetricBar("Clarity", metrics.clarity)}
            {renderMetricBar("Conciseness", metrics.conciseness)}
            {renderMetricBar("Depth", metrics.depth)}
            {renderMetricBar("Fluency", metrics.fluency)}
            {renderMetricBar("Confidence", metrics.confidence)}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader 
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => handleExpandSection('strengths')}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Award className="h-5 w-5 text-green-500 mr-2" />
                <CardTitle>Strengths</CardTitle>
              </div>
              <ChevronRight className={`h-5 w-5 transition-transform ${expandedSection === 'strengths' ? 'transform rotate-90' : ''}`} />
            </div>
          </CardHeader>
          <CardContent className={expandedSection === 'strengths' ? '' : 'hidden md:block'}>
            <ul className="space-y-2">
              {strengths.map((strength, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader 
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => handleExpandSection('weaknesses')}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
                <CardTitle>Areas for Improvement</CardTitle>
              </div>
              <ChevronRight className={`h-5 w-5 transition-transform ${expandedSection === 'weaknesses' ? 'transform rotate-90' : ''}`} />
            </div>
          </CardHeader>
          <CardContent className={expandedSection === 'weaknesses' ? '' : 'hidden md:block'}>
            <ul className="space-y-2">
              {weaknesses.map((weakness, index) => (
                <li key={index} className="flex items-start">
                  <XCircle className="h-5 w-5 text-amber-500 mr-2 shrink-0 mt-0.5" />
                  <span>{weakness}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader 
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => handleExpandSection('recommendations')}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Lightbulb className="h-5 w-5 text-blue-500 mr-2" />
              <CardTitle>Recommendations</CardTitle>
            </div>
            <ChevronRight className={`h-5 w-5 transition-transform ${expandedSection === 'recommendations' ? 'transform rotate-90' : ''}`} />
          </div>
          <CardDescription>
            Suggested actions to improve your interview performance
          </CardDescription>
        </CardHeader>
        <CardContent className={expandedSection === 'recommendations' ? '' : 'hidden md:block'}>
          <div className="space-y-4">
            {recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start p-3 bg-muted rounded-lg">
                <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary mr-3">
                  <BookOpen className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm">{recommendation}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {questions.length > 0 && (
        <Card>
          <CardHeader 
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => handleExpandSection('qa')}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <BarChart className="h-5 w-5 text-violet-500 mr-2" />
                <CardTitle>Question & Answer Review</CardTitle>
              </div>
              <ChevronRight className={`h-5 w-5 transition-transform ${expandedSection === 'qa' ? 'transform rotate-90' : ''}`} />
            </div>
          </CardHeader>
          <CardContent className={expandedSection === 'qa' ? '' : 'hidden'}>
            <div className="space-y-4">
              {questions.map((question, index) => (
                <div key={index} className="border rounded-lg overflow-hidden">
                  <div className="bg-muted p-3">
                    <p className="font-medium">Q: {question}</p>
                  </div>
                  <div className="p-3">
                    <p>A: {answers[index] || "No answer provided"}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-center">
        <Button onClick={loadAnalysis} variant="outline" disabled={isLoading}>
          {isLoading ? 'Refreshing...' : 'Refresh Analysis'}
        </Button>
      </div>
    </div>
  );
};

export default InterviewAnalysisResults;
