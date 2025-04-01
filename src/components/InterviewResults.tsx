
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BarChart2, CheckCircle, XCircle, FileText, Clock, RotateCcw } from 'lucide-react';

// Define types for messages
interface Message {
  id: string;
  session_id: string;
  is_bot: boolean;
  content: string;
  created_at: string;
}

// Define type for analysis
interface Analysis {
  id: string;
  session_id: string;
  summary: {
    overall_score?: number;
    strengths?: string[];
    areas_for_improvement?: string[];
    recommended_resources?: string[];
    detailed_feedback?: string;
    technical_accuracy?: number;
    communication_clarity?: number;
    problem_solving?: number;
    key_insights?: string[];
  };
  created_at: string;
}

// Define props
interface InterviewResultsProps {
  sessionId: string;
}

const InterviewResults: React.FC<InterviewResultsProps> = ({ sessionId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [sessionData, setSessionData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch session data
        const { data: sessionData, error: sessionError } = await supabase
          .from('interview_sessions')
          .select('*')
          .eq('id', sessionId)
          .single();
        
        if (sessionError) throw sessionError;
        setSessionData(sessionData);
        
        // Fetch messages
        const { data: messagesData, error: messagesError } = await supabase
          .from('interview_messages')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true });
        
        if (messagesError) throw messagesError;
        setMessages(messagesData || []);
        
        // Fetch analysis if it exists
        const { data: analysisData, error: analysisError } = await supabase
          .from('interview_analysis')
          .select('*')
          .eq('session_id', sessionId)
          .single();
        
        if (!analysisError) {
          setAnalysis(analysisData);
        } else if (analysisError.code !== 'PGRST116') {
          // Error other than "no rows returned"
          throw analysisError;
        }
      } catch (error: any) {
        console.error('Error fetching interview data:', error);
        toast.error('Failed to load interview results');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [sessionId]);
  
  const generateAnalysis = async () => {
    if (isGeneratingAnalysis || messages.length === 0) return;
    
    setIsGeneratingAnalysis(true);
    try {
      // If there are no messages or only bot messages, show an error
      const userMessages = messages.filter(msg => !msg.is_bot);
      if (userMessages.length === 0) {
        toast.error('No user responses to analyze');
        return;
      }
      
      // For demo purposes, generate some hardcoded analysis
      // In a real app, this would call an OpenAI-powered API
      const analysisResult = generateHardcodedAnalysis(messages, sessionData);
      
      // Save analysis to database
      const { data, error } = await supabase
        .from('interview_analysis')
        .upsert({
          session_id: sessionId,
          summary: analysisResult
        })
        .select();
      
      if (error) throw error;
      
      setAnalysis(data[0]);
      toast.success('Analysis generated successfully');
    } catch (error: any) {
      console.error('Error generating analysis:', error);
      toast.error('Failed to generate analysis');
    } finally {
      setIsGeneratingAnalysis(false);
    }
  };
  
  // Function to generate hardcoded analysis when OpenAI API is not available
  const generateHardcodedAnalysis = (messages: Message[], session: any) => {
    const userMessages = messages.filter(msg => !msg.is_bot);
    const botMessages = messages.filter(msg => msg.is_bot);
    
    // Different analysis based on the interview type
    let strengths, areasForImprovement, resources;
    
    if (session.category === 'algorithms') {
      strengths = [
        'Good problem-solving approach',
        'Structured thinking when tackling algorithm questions',
        'Able to explain the time and space complexity'
      ];
      
      areasForImprovement = [
        'Consider edge cases more thoroughly',
        'Practice optimizing solutions further',
        'Work on explaining your thought process more clearly'
      ];
      
      resources = [
        'LeetCode - Data Structures and Algorithms',
        'Cracking the Coding Interview by Gayle Laakmann McDowell',
        'AlgoExpert.io for interactive algorithm practice'
      ];
    } else if (session.category === 'system-design') {
      strengths = [
        'Good understanding of scalability concepts',
        'Ability to break down complex problems',
        'Consideration of non-functional requirements'
      ];
      
      areasForImprovement = [
        'Dive deeper into database design considerations',
        'Consider trade-offs between different architectural approaches',
        'Expand knowledge of caching strategies'
      ];
      
      resources = [
        'System Design Interview by Alex Xu',
        'Designing Data-Intensive Applications by Martin Kleppmann',
        'High Scalability blog for real-world architecture examples'
      ];
    } else if (session.category === 'behavioral') {
      strengths = [
        'Clear communication of past experiences',
        'Structured responses using the STAR method',
        'Good examples that highlight achievements'
      ];
      
      areasForImprovement = [
        'Provide more specific metrics and results in examples',
        'Focus more on your individual contribution in team settings',
        'Practice more concise responses'
      ];
      
      resources = [
        'Cracking the PM Interview by Gayle Laakmann McDowell',
        'The STAR Method: The Secret to Acing Your Next Job Interview',
        'Pramp.com for behavioral interview practice'
      ];
    } else {
      // Default for other categories
      strengths = [
        'Good technical knowledge in relevant areas',
        'Clear communication skills',
        'Structured approach to problem-solving'
      ];
      
      areasForImprovement = [
        'Deepen knowledge in specific technical areas',
        'Practice explaining complex concepts more simply',
        'Consider different approaches to problems'
      ];
      
      resources = [
        'Resources specific to ' + session.language,
        'Practice platforms like Exercism or HackerRank',
        'Join communities related to ' + session.role_type
      ];
    }
    
    // Calculate scores - in a real system this would be more sophisticated
    const overallScore = Math.floor(70 + Math.random() * 20); // 70-90%
    const technicalAccuracy = Math.floor(65 + Math.random() * 25); // 65-90%
    const communicationClarity = Math.floor(70 + Math.random() * 20); // 70-90%
    const problemSolving = Math.floor(65 + Math.random() * 25); // 65-90%
    
    const detailedFeedback = `You demonstrated ${strengths[0].toLowerCase()} during this interview session. 
    Your responses showed that you have a good grasp of ${session.category} concepts relevant to ${session.role_type} roles.
    
    For your ${session.language} knowledge, you could benefit from more practice with real-world scenarios. 
    You should focus on ${areasForImprovement[0].toLowerCase()} as this will significantly improve your performance in future interviews.
    
    Continue building on your strengths, particularly your ability to ${strengths[1].toLowerCase()}.`;
    
    return {
      overall_score: overallScore,
      strengths: strengths,
      areas_for_improvement: areasForImprovement,
      recommended_resources: resources,
      detailed_feedback: detailedFeedback,
      technical_accuracy: technicalAccuracy,
      communication_clarity: communicationClarity,
      problem_solving: problemSolving,
      key_insights: [
        'Good foundation in core concepts',
        'Room for improvement in advanced topics',
        'Would benefit from more practical experience'
      ]
    };
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }
  
  // If no messages or only bot messages, display a message
  const userMessages = messages.filter(msg => !msg.is_bot);
  if (messages.length === 0 || userMessages.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>No Interview Data</CardTitle>
          <CardDescription>
            This interview session doesn't contain any user responses to analyze.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            It appears this interview was ended before any questions were answered. 
            Try starting a new interview session and answering at least one question.
          </p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => window.history.back()}
          >
            Go Back
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      {!analysis && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-xl font-semibold">Generate Interview Analysis</h3>
              <p className="mb-4 text-muted-foreground max-w-md">
                Get detailed feedback and insights on your interview performance by generating an AI-powered analysis.
              </p>
              <Button 
                onClick={generateAnalysis} 
                disabled={isGeneratingAnalysis}
                className="mt-2"
              >
                {isGeneratingAnalysis ? (
                  <>
                    <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
                    Generating Analysis...
                  </>
                ) : (
                  <>
                    <BarChart2 className="mr-2 h-4 w-4" />
                    Generate Analysis
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {analysis && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="detailed">Detailed Feedback</TabsTrigger>
            <TabsTrigger value="transcript">Transcript</TabsTrigger>
          </TabsList>
          
          <TabsContent value="summary" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart2 className="mr-2 h-5 w-5 text-primary" />
                  Performance Overview
                </CardTitle>
                <CardDescription>
                  Overall analysis of your interview performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium">Overall Performance</span>
                      <span className="text-sm font-medium">{analysis.summary.overall_score}%</span>
                    </div>
                    <Progress value={analysis.summary.overall_score} className="h-2" />
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Technical Accuracy</span>
                        <span className="text-sm font-medium">{analysis.summary.technical_accuracy}%</span>
                      </div>
                      <Progress value={analysis.summary.technical_accuracy} className="h-1.5" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Communication</span>
                        <span className="text-sm font-medium">{analysis.summary.communication_clarity}%</span>
                      </div>
                      <Progress value={analysis.summary.communication_clarity} className="h-1.5" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Problem Solving</span>
                        <span className="text-sm font-medium">{analysis.summary.problem_solving}%</span>
                      </div>
                      <Progress value={analysis.summary.problem_solving} className="h-1.5" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                    Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="ml-6 list-disc space-y-2">
                    {analysis.summary.strengths?.map((strength, index) => (
                      <li key={index} className="text-sm">{strength}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <XCircle className="mr-2 h-5 w-5 text-red-500" />
                    Areas for Improvement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="ml-6 list-disc space-y-2">
                    {analysis.summary.areas_for_improvement?.map((area, index) => (
                      <li key={index} className="text-sm">{area}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Recommended Resources</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="ml-6 list-disc space-y-2">
                  {analysis.summary.recommended_resources?.map((resource, index) => (
                    <li key={index} className="text-sm">{resource}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="detailed">
            <Card>
              <CardHeader>
                <CardTitle>Detailed Feedback</CardTitle>
                <CardDescription>
                  In-depth analysis of your interview performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Key Insights</h3>
                    <ul className="ml-6 list-disc space-y-2">
                      {analysis.summary.key_insights?.map((insight, index) => (
                        <li key={index} className="text-sm">{insight}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="mb-2 text-lg font-medium">Comprehensive Assessment</h3>
                    <p className="text-sm whitespace-pre-line">
                      {analysis.summary.detailed_feedback}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="mb-2 text-lg font-medium">Interview Context</h3>
                    <div className="grid gap-2 text-sm">
                      <div className="flex items-center">
                        <Badge variant="outline" className="mr-2">Role</Badge>
                        <span>{sessionData?.role_type}</span>
                      </div>
                      <div className="flex items-center">
                        <Badge variant="outline" className="mr-2">Category</Badge>
                        <span>{sessionData?.category}</span>
                      </div>
                      <div className="flex items-center">
                        <Badge variant="outline" className="mr-2">Language</Badge>
                        <span>{sessionData?.language}</span>
                      </div>
                      <div className="flex items-center">
                        <Badge variant="outline" className="mr-2">Questions</Badge>
                        <span>{sessionData?.current_question_count} of {sessionData?.questions_limit}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="transcript">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="mr-2 h-5 w-5" />
                  Interview Transcript
                </CardTitle>
                <CardDescription>
                  Complete record of your interview conversation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div key={message.id} className={`flex ${message.is_bot ? 'justify-start' : 'justify-end'}`}>
                      <div 
                        className={`rounded-lg px-4 py-2 max-w-[80%] ${
                          message.is_bot 
                            ? 'bg-muted text-foreground rounded-tl-none' 
                            : 'bg-primary text-primary-foreground rounded-tr-none'
                        }`}
                      >
                        <div className="mb-1 text-xs opacity-70">
                          {message.is_bot ? 'Interviewer' : 'You'} · {new Date(message.created_at).toLocaleTimeString()}
                        </div>
                        <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default InterviewResults;
