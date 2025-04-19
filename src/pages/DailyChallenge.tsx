
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Clock, Award, Trophy, CheckCircle, AlertCircle, ArrowLeft, RefreshCw, Code } from 'lucide-react';
import Navbar from '@/components/Navbar';
import CodeEditor from '@/components/CodeEditor';
import { useAuth } from '@/context/AuthContext';
import { getTodaysChallenge, getUserChallengeAttempt, submitChallengeSolution, getUserStats } from '@/utils/dailyChallengeService';
import type { DailyChallenge as DailyChallengeType, UserChallenge, UserStats } from '@/utils/dailyChallengeService';

const DailyChallengePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('challenge');
  const [challenge, setChallenge] = useState<DailyChallengeType | null>(null);
  const [userAttempt, setUserAttempt] = useState<UserChallenge | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const loadChallenge = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        // Load today's challenge
        const dailyChallenge = await getTodaysChallenge();
        setChallenge(dailyChallenge);
        
        if (dailyChallenge) {
          // Load user's attempt if any
          const attempt = await getUserChallengeAttempt(user.id, dailyChallenge.id);
          setUserAttempt(attempt);
          
          // Set initial code
          if (attempt) {
            setCode(attempt.user_solution);
            setLanguage(attempt.language);
          } else {
            setCode(dailyChallenge.starter_code);
          }
          
          // Load user stats
          const stats = await getUserStats(user.id);
          setUserStats(stats);
        }
      } catch (error) {
        console.error('Error loading challenge:', error);
        toast.error('Failed to load today\'s challenge. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadChallenge();
  }, [user]);
  
  const handleSubmit = async () => {
    if (!user || !challenge) return;
    
    setIsSubmitting(true);
    setFeedback(null);
    
    try {
      const result = await submitChallengeSolution(
        user.id,
        challenge.id,
        code,
        language
      );
      
      if (result.success) {
        // Refresh user attempt
        const attempt = await getUserChallengeAttempt(user.id, challenge.id);
        setUserAttempt(attempt);
        
        // Refresh user stats
        const stats = await getUserStats(user.id);
        setUserStats(stats);
        
        // Show feedback
        setFeedback({
          text: result.feedback || result.message,
          type: result.is_solved ? 'success' : 'error'
        });
        
        if (result.is_solved) {
          toast.success('Congratulations! Your solution is correct!');
        } else {
          toast.warning('Your solution needs some work. Check the feedback for details.');
        }
      } else {
        setFeedback({
          text: result.feedback || result.message,
          type: 'error'
        });
        
        toast.error('There was a problem evaluating your solution.');
      }
    } catch (error) {
      console.error('Error submitting solution:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value);
  };
  
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-amber-100 text-amber-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container py-8 px-4 md:px-6">
          <div className="flex justify-center items-center h-[50vh]">
            <div className="flex flex-col items-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <p className="mt-4 text-muted-foreground">Loading today's challenge...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }
  
  if (!challenge) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container py-8 px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4">No Challenge Available</h1>
            <p className="text-muted-foreground mb-6">
              There is no challenge available for today. Please check back later.
            </p>
            <Button onClick={() => navigate('/dashboard')}>
              Return to Dashboard
            </Button>
          </div>
        </main>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-8 px-4 md:px-6">
        <div className="flex justify-between items-center mb-6">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">Daily Coding Challenge</h1>
            <Badge className={getDifficultyColor(challenge.difficulty)}>
              {challenge.difficulty.charAt(0).toUpperCase() + challenge.difficulty.slice(1)}
            </Badge>
          </div>
          
          {userStats && (
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <Trophy className="text-amber-500 h-5 w-5 mr-1" />
                <span className="text-sm font-medium">{userStats.total_solved} solved</span>
              </div>
              <div className="flex items-center">
                <Award className="text-primary h-5 w-5 mr-1" />
                <span className="text-sm font-medium">{userStats.current_streak} day streak</span>
              </div>
            </div>
          )}
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="challenge">Challenge</TabsTrigger>
            <TabsTrigger value="solution" disabled={!userAttempt?.is_solved}>Solution</TabsTrigger>
          </TabsList>
          
          <TabsContent value="challenge">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>{challenge.title}</CardTitle>
                  <CardDescription>
                    Posted {new Date(challenge.date).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose dark:prose-invert max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: challenge.description.replace(/\n/g, '<br />') }} />
                    
                    <div className="mt-4">
                      <h3 className="text-lg font-medium">Test Cases</h3>
                      <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                        <code>{challenge.test_cases}</code>
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="lg:col-span-1 space-y-6">
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">Your Solution</CardTitle>
                      <div className="flex items-center space-x-2">
                        <select
                          value={language}
                          onChange={handleLanguageChange}
                          className="p-1 text-sm rounded border bg-background"
                        >
                          <option value="javascript">JavaScript</option>
                          <option value="python">Python</option>
                          <option value="java">Java</option>
                          <option value="cpp">C++</option>
                        </select>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="h-[400px]">
                    <CodeEditor
                      language={language}
                      initialCode={code}
                      onChange={setCode}
                    />
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <div>
                      {userAttempt && (
                        <Badge variant="outline" className="text-xs">
                          Attempts: {userAttempt.attempts}
                        </Badge>
                      )}
                    </div>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Code className="mr-2 h-4 w-4" />
                          Submit Solution
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
                
                {feedback && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center">
                        {feedback.type === 'success' ? (
                          <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                        ) : feedback.type === 'error' ? (
                          <AlertCircle className="mr-2 h-5 w-5 text-red-500" />
                        ) : (
                          <Clock className="mr-2 h-5 w-5 text-blue-500" />
                        )}
                        Feedback
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose dark:prose-invert max-w-none text-sm">
                        <div dangerouslySetInnerHTML={{ __html: feedback.text.replace(/\n/g, '<br />') }} />
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="solution">
            {challenge.solution_explanation && (
              <Card>
                <CardHeader>
                  <CardTitle>Solution Explanation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose dark:prose-invert max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: challenge.solution_explanation.replace(/\n/g, '<br />') }} />
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default DailyChallengePage;
