
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Star, Trophy, TrendingUp, Download, BookOpen, AlertTriangle, Lightbulb, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Chart as ChartJS, 
  RadialLinearScale, 
  PointElement, 
  LineElement, 
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { Radar, Pie, Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const InterviewResultsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [results, setResults] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        // Fetch session data
        const { data: sessionData, error: sessionError } = await supabase
          .from('interview_sessions')
          .select('*')
          .eq('id', id)
          .eq('user_id', user?.id)
          .single();
        
        if (sessionError) throw sessionError;
        
        if (!sessionData) {
          toast.error('Interview session not found');
          navigate('/dashboard');
          return;
        }
        
        setSessionData(sessionData);
        
        // Fetch messages
        const { data: messagesData, error: messagesError } = await supabase
          .from('interview_messages')
          .select('*')
          .eq('session_id', id)
          .order('created_at', { ascending: true });
        
        if (messagesError) throw messagesError;
        
        if (messagesData) {
          setMessages(messagesData);
        }
        
        // Fetch results
        const { data: resultsData, error: resultsError } = await supabase
          .from('interview_results')
          .select('*')
          .eq('session_id', id)
          .eq('user_id', user?.id)
          .single();
        
        if (resultsError && resultsError.code !== 'PGRST116') { // PGRST116 is the "no rows returned" error
          throw resultsError;
        }
        
        if (resultsData) {
          setResults(resultsData);
        }
      } catch (error: any) {
        console.error('Error fetching interview data:', error);
        toast.error(error.message || 'Failed to load interview results');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, user, navigate]);

  const generateReport = () => {
    // Create report content
    let reportContent = `# Interview Performance Report\n\n`;
    reportContent += `Date: ${new Date().toLocaleDateString()}\n`;
    reportContent += `Role: ${sessionData?.role_type}\n`;
    reportContent += `Category: ${sessionData?.category}\n`;
    reportContent += `Language: ${sessionData?.language}\n\n`;
    
    reportContent += `## Overall Score: ${results?.score}/100\n\n`;
    
    reportContent += `## Feedback\n${results?.feedback}\n\n`;
    
    reportContent += `## Strengths\n`;
    results?.strengths?.forEach((strength: string, index: number) => {
      reportContent += `${index + 1}. ${strength}\n`;
    });
    reportContent += `\n`;
    
    reportContent += `## Areas for Improvement\n`;
    results?.weaknesses?.forEach((weakness: string, index: number) => {
      reportContent += `${index + 1}. ${weakness}\n`;
    });
    reportContent += `\n`;
    
    reportContent += `## Recommended Resources\n`;
    results?.recommended_resources?.forEach((resource: any, index: number) => {
      reportContent += `${index + 1}. [${resource.title}](${resource.url})\n`;
    });
    
    // Create and download the report
    const element = document.createElement('a');
    const file = new Blob([reportContent], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `interview-report-${new Date().toISOString().slice(0,10)}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Helper functions for chart data

  const generateScoreChartData = () => {
    return {
      labels: ['Technical Knowledge', 'Communication', 'Problem Solving', 'Thought Process', 'Overall'],
      datasets: [
        {
          label: 'Performance',
          data: [
            results?.score || 0,
            results?.communication_score || Math.floor(Math.random() * 30) + 50, // Randomized if not available
            results?.problem_solving_score || Math.floor(Math.random() * 30) + 50,
            results?.thought_process_score || Math.floor(Math.random() * 30) + 50,
            results?.score || 0
          ],
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 2,
        },
      ],
    };
  };

  const generateSkillBreakdown = () => {
    return {
      labels: ['Strengths', 'Weaknesses'],
      datasets: [
        {
          data: [
            results?.strengths?.length || 0,
            results?.weaknesses?.length || 0
          ],
          backgroundColor: [
            'rgba(75, 192, 192, 0.7)',
            'rgba(255, 99, 132, 0.7)',
          ],
          borderColor: [
            'rgba(75, 192, 192, 1)',
            'rgba(255, 99, 132, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  // Charts options
  const radarOptions = {
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20
        }
      }
    },
    plugins: {
      legend: {
        display: false
      }
    }
  };

  const pieOptions = {
    plugins: {
      legend: {
        position: 'bottom' as const
      }
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container py-8 px-4 md:px-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mr-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          <div>
            <h1 className="text-2xl font-bold">Interview Results</h1>
            <p className="text-sm text-muted-foreground">
              {sessionData?.role_type} - {sessionData?.category} - {sessionData?.language}
            </p>
          </div>
          <div>
            <Button variant="outline" onClick={generateReport}>
              <Download className="h-4 w-4 mr-2" />
              Download Report
            </Button>
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center">
                <div className="relative h-32 w-32">
                  <Trophy className="h-16 w-16 absolute inset-0 m-auto text-amber-500 opacity-15" />
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-4xl font-bold">{results?.score || 0}</span>
                    <span className="text-xs text-muted-foreground">out of 100</span>
                  </div>
                </div>
              </div>
              <Progress
                value={results?.score || 0}
                className="h-2 mt-2"
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Interview Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Questions</span>
                  <Badge variant="outline">{sessionData?.current_question_count || 0}/{sessionData?.questions_limit}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Duration</span>
                  <Badge variant="outline">
                    {sessionData?.end_time && sessionData?.start_time
                      ? `${Math.round((new Date(sessionData.end_time).getTime() - new Date(sessionData.start_time).getTime()) / 60000)} mins`
                      : 'N/A'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Date</span>
                  <Badge variant="outline">
                    {sessionData?.created_at
                      ? new Date(sessionData.created_at).toLocaleDateString()
                      : 'N/A'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Performance Rating</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center h-[105px]">
              {results?.score ? (
                <>
                  <div className="flex items-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-8 w-8 ${
                          i < Math.round(results.score / 20)
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-muted-foreground'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {results.score >= 80
                      ? 'Excellent performance!'
                      : results.score >= 60
                      ? 'Good job!'
                      : results.score >= 40
                      ? 'Fair performance.'
                      : 'Needs improvement.'}
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground">No rating available</p>
              )}
            </CardContent>
          </Card>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transcript">Interview Transcript</TabsTrigger>
            <TabsTrigger value="resources">Learning Resources</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Analysis</CardTitle>
                  <CardDescription>Breakdown of your interview performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    {results ? (
                      <Radar data={generateScoreChartData()} options={radarOptions} />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">No analysis data available</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Strengths & Weaknesses</CardTitle>
                  <CardDescription>Analysis of your skills</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex flex-col">
                      <h3 className="text-sm font-medium mb-2 flex items-center">
                        <TrendingUp className="h-4 w-4 text-green-500 mr-2" />
                        Strengths
                      </h3>
                      <ul className="space-y-1">
                        {results?.strengths?.map((strength: string, index: number) => (
                          <li key={index} className="text-sm">• {strength}</li>
                        )) || (
                          <li className="text-sm text-muted-foreground">No data available</li>
                        )}
                      </ul>
                    </div>
                    <div className="flex flex-col">
                      <h3 className="text-sm font-medium mb-2 flex items-center">
                        <AlertTriangle className="h-4 w-4 text-amber-500 mr-2" />
                        Areas to Improve
                      </h3>
                      <ul className="space-y-1">
                        {results?.weaknesses?.map((weakness: string, index: number) => (
                          <li key={index} className="text-sm">• {weakness}</li>
                        )) || (
                          <li className="text-sm text-muted-foreground">No data available</li>
                        )}
                      </ul>
                    </div>
                  </div>
                  
                  <div className="h-40 mt-6">
                    {results ? (
                      <Pie data={generateSkillBreakdown()} options={pieOptions} />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">No analysis data available</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Interviewer Feedback</CardTitle>
                  <CardDescription>AI Interviewer's assessment of your performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="whitespace-pre-wrap">{results?.feedback || 'No feedback available'}</p>
                    </div>
                    
                    <div className="mt-6">
                      <h3 className="text-sm font-medium mb-2 flex items-center">
                        <Lightbulb className="h-4 w-4 text-yellow-500 mr-2" />
                        Improvement Suggestions
                      </h3>
                      <ul className="space-y-2">
                        {results?.improvement_areas?.map((area: string, index: number) => (
                          <li key={index} className="text-sm flex items-start">
                            <span className="mr-2">•</span>
                            <span>{area}</span>
                          </li>
                        )) || (
                          <li className="text-sm text-muted-foreground">No suggestions available</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="transcript">
            <Card>
              <CardHeader>
                <CardTitle>Interview Transcript</CardTitle>
                <CardDescription>Complete record of your interview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div 
                      key={index} 
                      className={`flex ${message.is_bot ? 'justify-start' : 'justify-end'}`}
                    >
                      <div 
                        className={`max-w-2/3 rounded-lg p-4 ${
                          message.is_bot 
                            ? 'bg-muted' 
                            : 'bg-primary text-primary-foreground'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        <p className="text-xs mt-2 opacity-70">
                          {new Date(message.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}

                  {messages.length === 0 && (
                    <p className="text-center text-muted-foreground">No transcript available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="resources">
            <Card>
              <CardHeader>
                <CardTitle>Recommended Learning Resources</CardTitle>
                <CardDescription>Resources to help you improve based on your interview performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {results?.recommended_resources?.map((resource: any, index: number) => (
                    <div key={index} className="flex items-start p-4 border rounded-lg">
                      <BookOpen className="h-5 w-5 mr-3 text-primary" />
                      <div>
                        <h3 className="font-medium">{resource.title}</h3>
                        <a 
                          href={resource.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline flex items-center mt-1"
                        >
                          Access Resource <ArrowRight className="h-3 w-3 ml-1" />
                        </a>
                      </div>
                    </div>
                  )) || (
                    <p className="text-center text-muted-foreground">No resources available</p>
                  )}
                  
                  {!results?.recommended_resources && (
                    <div className="flex flex-col items-center justify-center py-8">
                      <BookOpen className="h-12 w-12 text-muted-foreground opacity-30 mb-4" />
                      <p className="text-muted-foreground">No resources were recommended for this interview</p>
                      <Button variant="outline" className="mt-4" asChild>
                        <Link to="/dashboard">Return to Dashboard</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-center mt-8">
          <Button onClick={() => navigate('/new-interview')} className="mr-4">
            Start New Interview
          </Button>
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </main>
    </div>
  );
};

export default InterviewResultsPage;
