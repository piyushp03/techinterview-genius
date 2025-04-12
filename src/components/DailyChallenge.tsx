
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CodeEditor from '@/components/CodeEditor';
import { getTodaysChallenge, submitChallengeSolution, getUserChallengeAttempt } from '@/utils/dailyChallengeService';
import { toast } from 'sonner';
import { AlertTriangle, CheckCircle2, RotateCcw } from 'lucide-react';

interface DailyChallengeProps {
  standalone?: boolean;
}

const DailyChallenge: React.FC<DailyChallengeProps> = ({ standalone = false }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [challenge, setChallenge] = useState<any>(null);
  const [userAttempt, setUserAttempt] = useState<any>(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [activeTab, setActiveTab] = useState('challenge');

  useEffect(() => {
    loadChallenge();
  }, [user]);

  const loadChallenge = async () => {
    try {
      setLoading(true);
      const todaysChallenge = await getTodaysChallenge();
      
      if (!todaysChallenge) {
        toast.error('Failed to load today\'s challenge');
        return;
      }
      
      setChallenge(todaysChallenge);
      setCode(todaysChallenge.starter_code);
      
      if (user) {
        const attempt = await getUserChallengeAttempt(user.id, todaysChallenge.id);
        if (attempt) {
          setUserAttempt(attempt);
          setCode(attempt.user_solution);
          setLanguage(attempt.language);
        }
      }
    } catch (error) {
      console.error('Error loading daily challenge:', error);
      toast.error('Failed to load daily challenge');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please sign in to submit your solution');
      return;
    }
    
    if (!code.trim()) {
      toast.error('Please write your solution before submitting');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const result = await submitChallengeSolution(
        user.id,
        challenge.id,
        code,
        language
      );
      
      if (result.success) {
        const newAttempt = await getUserChallengeAttempt(user.id, challenge.id);
        setUserAttempt(newAttempt);
        
        if (result.isSolved) {
          toast.success('Congratulations! Your solution is correct.');
          setActiveTab('solution');
        } else {
          toast.warning('Your solution needs more work. Check the feedback for details.');
        }
      } else {
        toast.error(result.feedback || 'Failed to evaluate your solution');
      }
    } catch (error) {
      console.error('Error submitting solution:', error);
      toast.error('Failed to submit your solution');
    } finally {
      setSubmitting(false);
    }
  };

  const resetCode = () => {
    if (challenge) {
      setCode(challenge.starter_code);
      toast.info('Code reset to starter code');
    }
  };

  const renderDifficultyBadge = (difficulty: string) => {
    const colors = {
      easy: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      hard: 'bg-red-100 text-red-800',
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[difficulty as keyof typeof colors]}`}>
        {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className={`flex justify-center items-center ${standalone ? 'h-screen' : 'h-64'}`}>
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <Card className={standalone ? 'max-w-4xl mx-auto mt-8' : ''}>
        <CardHeader>
          <CardTitle>Daily Coding Challenge</CardTitle>
          <CardDescription>No challenge available today. Check back tomorrow!</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={standalone ? 'max-w-5xl mx-auto mt-8' : ''}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{challenge.title}</CardTitle>
            <CardDescription className="mt-1">Today's coding challenge</CardDescription>
          </div>
          {renderDifficultyBadge(challenge.difficulty)}
        </div>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="px-6">
          <TabsTrigger value="challenge">Challenge</TabsTrigger>
          <TabsTrigger value="solution" disabled={!userAttempt?.is_solved}>
            Solution
          </TabsTrigger>
          {userAttempt && (
            <TabsTrigger value="feedback">
              Feedback {userAttempt.is_solved ? <CheckCircle2 className="ml-1 h-4 w-4 text-green-500" /> : <AlertTriangle className="ml-1 h-4 w-4 text-yellow-500" />}
            </TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="challenge" className="space-y-4">
          <CardContent>
            <div className="space-y-4">
              <div className="prose max-w-none dark:prose-invert">
                <div dangerouslySetInnerHTML={{ __html: challenge.description }} />
              </div>
              
              <div className="bg-muted p-4 rounded-md">
                <h4 className="font-medium mb-2">Test Cases</h4>
                <pre className="whitespace-pre-wrap text-sm font-mono">{challenge.test_cases}</pre>
              </div>
            </div>
          </CardContent>
          
          <CardContent className={standalone ? 'h-[400px]' : 'h-[300px]'}>
            <CodeEditor
              language={language}
              initialCode={code}
              onChange={handleCodeChange}
              readOnly={false}
            />
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={resetCode} disabled={submitting}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset Code
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                  Evaluating...
                </>
              ) : (
                'Submit Solution'
              )}
            </Button>
          </CardFooter>
        </TabsContent>
        
        <TabsContent value="solution">
          <CardContent>
            <div className="prose max-w-none dark:prose-invert">
              <h3>Solution Explanation</h3>
              <div dangerouslySetInnerHTML={{ __html: challenge.solution_explanation || 'No explanation available.' }} />
            </div>
          </CardContent>
        </TabsContent>
        
        <TabsContent value="feedback">
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${userAttempt?.is_solved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {userAttempt?.is_solved ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                </div>
                <div className="ml-4">
                  <h3 className="font-medium">{userAttempt?.is_solved ? 'Solution Accepted' : 'Solution Needs Work'}</h3>
                  <p className="text-sm text-muted-foreground">Attempts: {userAttempt?.attempts}</p>
                </div>
              </div>
              
              <div className="prose max-w-none dark:prose-invert">
                <div dangerouslySetInnerHTML={{ __html: userAttempt?.feedback || 'No feedback available.' }} />
              </div>
              
              <div className="bg-muted p-4 rounded-md">
                <h4 className="font-medium mb-2">Your Solution</h4>
                <pre className="whitespace-pre-wrap text-sm font-mono">{userAttempt?.user_solution}</pre>
              </div>
            </div>
          </CardContent>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default DailyChallenge;
