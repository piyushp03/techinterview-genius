
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ChartContainer } from '@/components/ui/chart';
import { Bar, BarChart, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { AnalysisMetrics, InterviewAnalysis } from '@/utils/interviewAnalysisService';
import { Star, ChartBar } from 'lucide-react';

interface InterviewAnalysisResultsProps {
  analysis: InterviewAnalysis;
  questions: string[];
  answers: string[];
}

const InterviewAnalysisResults: React.FC<InterviewAnalysisResultsProps> = ({
  analysis,
  questions,
  answers
}) => {
  // Prepare data for charts
  const metricsData = [
    { name: 'Clarity', value: analysis.metrics.clarity },
    { name: 'Conciseness', value: analysis.metrics.conciseness },
    { name: 'Depth', value: analysis.metrics.depth },
    { name: 'Fluency', value: analysis.metrics.fluency },
    { name: 'Confidence', value: analysis.metrics.confidence }
  ];

  const radarData = metricsData.map(item => ({
    subject: item.name,
    A: item.value,
    fullMark: 10
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Score indication functions
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-500';
    if (score >= 6) return 'text-amber-500';
    return 'text-red-500';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 8) return 'bg-green-100 text-green-800';
    if (score >= 6) return 'bg-amber-100 text-amber-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Interview Performance Analysis</CardTitle>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500" />
              <span className={`text-xl font-bold ${getScoreColor(analysis.metrics.overall)}`}>
                {analysis.metrics.overall}/10
              </span>
            </div>
          </div>
          <CardDescription>
            Analysis of your interview performance based on clarity, conciseness, depth, fluency, and confidence.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium mb-4">Performance Metrics</h3>
              <ChartContainer className="h-72" config={{ 
                metrics: { color: '#8884d8' }
              }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={metricsData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 10]} />
                    <Tooltip />
                    <Bar dataKey="value" name="Score" fill="#8884d8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-4">Skills Radar</h3>
              <ChartContainer className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <Radar
                      name="Performance"
                      dataKey="A"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.6}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </div>
          
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            {metricsData.map((metric, index) => (
              <div key={metric.name} className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{metric.name}</span>
                  <span className={`text-sm font-bold ${getScoreColor(metric.value)}`}>
                    {metric.value}/10
                  </span>
                </div>
                <Progress value={metric.value * 10} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Strengths</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.strengths.map((strength, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Badge variant="outline" className="bg-green-100 text-green-800 shrink-0 mt-0.5">
                    +
                  </Badge>
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
              {analysis.weaknesses.map((weakness, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Badge variant="outline" className="bg-amber-100 text-amber-800 shrink-0 mt-0.5">
                    !
                  </Badge>
                  <span>{weakness}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Recommendations</CardTitle>
          <CardDescription>
            Actionable advice to improve your interview skills
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {analysis.recommendations.map((recommendation, index) => (
              <li key={index} className="pl-5 border-l-2 border-primary">
                <p>{recommendation}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Interview Questions & Answers</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="qa" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="qa">Q&A Review</TabsTrigger>
              <TabsTrigger value="summary">Summary</TabsTrigger>
            </TabsList>
            <TabsContent value="qa" className="p-4">
              <ScrollArea className="h-[400px] pr-4">
                {questions.map((question, index) => (
                  <div key={index} className="mb-6 pb-6 border-b border-border last:border-0">
                    <div className="mb-3">
                      <div className="flex gap-2 items-center mb-2">
                        <Badge variant="secondary">Q{index + 1}</Badge>
                        <h4 className="font-medium">Question</h4>
                      </div>
                      <p className="text-muted-foreground">{question}</p>
                    </div>
                    
                    <div>
                      <div className="flex gap-2 items-center mb-2">
                        <Badge variant="outline">A{index + 1}</Badge>
                        <h4 className="font-medium">Your Answer</h4>
                      </div>
                      <p>{answers[index] || "No answer provided"}</p>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </TabsContent>
            <TabsContent value="summary" className="p-4">
              <div className="prose dark:prose-invert max-w-none">
                <h3>Interview Summary</h3>
                <p>{analysis.summaryText}</p>
                
                <h4 className="mt-6">Overall Assessment</h4>
                <div className="flex gap-2 items-center mb-4">
                  <Badge className={getScoreBadge(analysis.metrics.overall)}>
                    Score: {analysis.metrics.overall}/10
                  </Badge>
                </div>
                <p>
                  This assessment represents your overall performance in the interview. Continue to practice and
                  implement the recommendations to improve your skills.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default InterviewAnalysisResults;
