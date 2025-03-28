
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import CodeEditor from '@/components/CodeEditor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, RotateCcw, Trophy } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { getChatCompletion } from '@/utils/openaiService';

// Types for daily challenges
interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  date: string;
  starter_code: string;
  test_cases: string;
  solution_explanation: string;
}

interface UserChallenge {
  id: string;
  user_id: string;
  challenge_id: string;
  user_solution: string;
  is_solved: boolean;
  language: string;
  attempts: number;
  created_at: string;
  updated_at: string;
}

const OPENAI_API_KEY = "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";

const DailyChallenge = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [userChallenge, setUserChallenge] = useState<UserChallenge | null>(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [streakData, setStreakData] = useState({
    current: 0,
    longest: 0,
    total: 0
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth');
    } else if (isAuthenticated) {
      fetchTodaysChallenge();
      fetchUserStreakData();
    }
  }, [isAuthenticated, isLoading, navigate]);

  const fetchTodaysChallenge = async () => {
    try {
      // Format today's date as YYYY-MM-DD for query
      const today = new Date().toISOString().split('T')[0];
      
      // Check if we already have a challenge for today
      const { data: existingChallenges, error: fetchError } = await supabase
        .from('daily_challenges')
        .select('*')
        .eq('date', today)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching challenge:', fetchError);
        toast.error('Failed to load today\'s challenge');
        return;
      }
      
      if (existingChallenges) {
        setChallenge(existingChallenges);
        setCode(existingChallenges.starter_code);
        await fetchUserProgress(existingChallenges.id);
        return;
      }
      
      // If no challenge exists for today, generate a new one
      await generateNewChallenge();
    } catch (error) {
      console.error('Error in fetchTodaysChallenge:', error);
      toast.error('Failed to load the daily challenge');
    }
  };

  const generateNewChallenge = async () => {
    try {
      setIsProcessing(true);
      toast.info('Generating today\'s coding challenge...');
      
      // Generate challenge using GPT-4o-mini
      const prompt = `Create a coding challenge suitable for a daily programming practice. Include the following as a JSON object:
      1. title: A catchy title for the challenge
      2. description: Detailed problem statement
      3. difficulty: One of "easy", "medium", or "hard"
      4. starter_code: JavaScript code template to start with
      5. test_cases: Example inputs and expected outputs
      6. solution_explanation: Brief explanation of the solution approach
      
      The challenge should be solvable in around 15-30 minutes and focus on algorithms, data structures, or practical programming scenarios.`;
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          response_format: { type: "json_object" }
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate challenge');
      }
      
      const data = await response.json();
      const challengeData = JSON.parse(data.choices[0].message.content);
      
      // Format today's date as YYYY-MM-DD
      const today = new Date().toISOString().split('T')[0];
      
      // Save the challenge to the database
      const { data: newChallenge, error } = await supabase
        .from('daily_challenges')
        .insert({
          title: challengeData.title,
          description: challengeData.description,
          difficulty: challengeData.difficulty,
          date: today,
          starter_code: challengeData.starter_code,
          test_cases: challengeData.test_cases,
          solution_explanation: challengeData.solution_explanation
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      setChallenge(newChallenge);
      setCode(newChallenge.starter_code);
      
    } catch (error) {
      console.error('Error generating challenge:', error);
      toast.error('Failed to generate today\'s challenge');
    } finally {
      setIsProcessing(false);
    }
  };

  const fetchUserProgress = async (challengeId: string) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_challenges')
        .select('*')
        .eq('user_id', user.id)
        .eq('challenge_id', challengeId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user progress:', error);
        return;
      }
      
      if (data) {
        setUserChallenge(data);
        setCode(data.user_solution);
        setLanguage(data.language);
        setIsCorrect(data.is_solved);
      }
    } catch (error) {
      console.error('Error in fetchUserProgress:', error);
    }
  };

  const fetchUserStreakData = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user stats:', error);
        return;
      }
      
      if (data) {
        setStreakData({
          current: data.current_streak,
          longest: data.longest_streak,
          total: data.total_solved
        });
      }
    } catch (error) {
      console.error('Error in fetchUserStreakData:', error);
    }
  };

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
  };

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(event.target.value);
  };

  const saveUserProgress = async (isCorrect: boolean) => {
    if (!user || !challenge) return;
    
    try {
      // Check if user progress already exists
      if (userChallenge) {
        // Update existing record
        const { error } = await supabase
          .from('user_challenges')
          .update({
            user_solution: code,
            is_solved: isCorrect,
            language,
            attempts: userChallenge.attempts + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', userChallenge.id);
        
        if (error) throw error;
      } else {
        // Create new record
        const { error } = await supabase
          .from('user_challenges')
          .insert({
            user_id: user.id,
            challenge_id: challenge.id,
            user_solution: code,
            is_solved: isCorrect,
            language,
            attempts: 1
          });
        
        if (error) throw error;
      }
      
      // Update user stats if solution is correct and wasn't already solved
      if (isCorrect && (!userChallenge || !userChallenge.is_solved)) {
        await updateUserStats();
      }
      
      // Refresh user progress data
      await fetchUserProgress(challenge.id);
      
    } catch (error) {
      console.error('Error saving progress:', error);
      toast.error('Failed to save your progress');
    }
  };

  const updateUserStats = async () => {
    if (!user) return;
    
    try {
      // First, get current stats
      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user stats:', error);
        throw error;
      }
      
      const today = new Date().toISOString().split('T')[0];
      
      if (data) {
        // Check if last solved date is yesterday to continue the streak
        const lastDate = new Date(data.last_solved_date);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        const isConsecutive = 
          lastDate.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0];
        
        const currentStreak = isConsecutive ? data.current_streak + 1 : 1;
        const longestStreak = Math.max(currentStreak, data.longest_streak);
        
        // Update existing stats
        const { error: updateError } = await supabase
          .from('user_stats')
          .update({
            total_solved: data.total_solved + 1,
            current_streak: currentStreak,
            longest_streak: longestStreak,
            last_solved_date: today,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
        
        if (updateError) throw updateError;
        
        setStreakData({
          current: currentStreak,
          longest: longestStreak,
          total: data.total_solved + 1
        });
        
      } else {
        // Create new stats record
        const { error: insertError } = await supabase
          .from('user_stats')
          .insert({
            user_id: user.id,
            total_solved: 1,
            current_streak: 1,
            longest_streak: 1,
            last_solved_date: today
          });
        
        if (insertError) throw insertError;
        
        setStreakData({
          current: 1,
          longest: 1,
          total: 1
        });
      }
      
    } catch (error) {
      console.error('Error updating user stats:', error);
    }
  };

  const handleSubmitSolution = async () => {
    if (!challenge || !code.trim()) {
      toast.error('Please write some code before submitting');
      return;
    }
    
    setIsProcessing(true);
    setFeedback('');
    setIsCorrect(null);
    
    try {
      // Evaluate solution using GPT-4o-mini
      const prompt = `You are a coding challenge evaluator. Evaluate the following solution for the given problem:
      
      PROBLEM:
      ${challenge.description}
      
      TEST CASES:
      ${challenge.test_cases}
      
      USER SOLUTION (${language}):
      ${code}
      
      Evaluate if this solution correctly solves the problem. Consider:
      1. Does it produce the correct output for the test cases?
      2. Is the logic valid for the specified problem?
      3. Are there any edge cases it doesn't handle?
      
      First, provide a Yes/No answer if the solution is CORRECT, and then a detailed explanation of your evaluation.
      Format your response as a JSON object with keys:
      - isCorrect: boolean
      - feedback: string (your detailed evaluation)`;
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          response_format: { type: "json_object" }
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to evaluate solution');
      }
      
      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);
      
      setIsCorrect(result.isCorrect);
      setFeedback(result.feedback);
      
      // Save progress
      await saveUserProgress(result.isCorrect);
      
      if (result.isCorrect) {
        toast.success('Congratulations! Your solution is correct!');
      } else {
        toast.error('Your solution needs some work. Review the feedback and try again.');
      }
      
    } catch (error) {
      console.error('Error evaluating solution:', error);
      toast.error('Failed to evaluate your solution');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetSolution = () => {
    if (challenge) {
      setCode(challenge.starter_code);
      toast.info('Solution reset to starter code');
    }
  };

  if (isLoading) {
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
          <h1 className="text-3xl font-bold">Daily Coding Challenge</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <span className="text-sm font-medium">Streak: {streakData.current} days</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-purple-500" />
              <span className="text-sm font-medium">Best: {streakData.longest} days</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium">Total: {streakData.total} solved</span>
            </div>
          </div>
        </div>

        {isProcessing && !challenge ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4"></div>
            <p className="text-lg">Generating today's challenge...</p>
          </div>
        ) : challenge ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="flex flex-col">
              <Card className="flex-1">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{challenge.title}</CardTitle>
                      <CardDescription className="mt-1">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs mr-2 ${
                          challenge.difficulty === 'easy' 
                            ? 'bg-green-100 text-green-800' 
                            : challenge.difficulty === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {challenge.difficulty.charAt(0).toUpperCase() + challenge.difficulty.slice(1)}
                        </span>
                        {new Date(challenge.date).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    {isCorrect !== null && (
                      <div className={`p-2 rounded-full ${isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
                        {isCorrect ? (
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        ) : (
                          <XCircle className="h-6 w-6 text-red-600" />
                        )}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose dark:prose-invert max-w-none">
                    <h3>Description</h3>
                    <p className="whitespace-pre-wrap">{challenge.description}</p>
                    
                    <h3 className="mt-4">Test Cases</h3>
                    <pre className="bg-muted p-2 rounded-md overflow-auto">
                      <code>{challenge.test_cases}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>
              
              {feedback && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle>Feedback</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`p-4 rounded-md ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                      <p className="whitespace-pre-wrap">{feedback}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
            
            <div className="flex flex-col">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <select
                    value={language}
                    onChange={handleLanguageChange}
                    className="py-2 px-3 rounded-md border border-input bg-background text-sm"
                    disabled={isProcessing}
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                  </select>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={resetSolution}
                  disabled={isProcessing}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reset
                </Button>
              </div>
              
              <div className="flex-1 min-h-[400px] border rounded-md overflow-hidden">
                <CodeEditor
                  language={language}
                  initialCode={code}
                  onChange={handleCodeChange}
                  readOnly={isProcessing}
                />
              </div>
              
              <div className="mt-4 flex justify-end">
                <Button 
                  onClick={handleSubmitSolution} 
                  disabled={isProcessing || !code.trim()}
                  className="w-full"
                >
                  {isProcessing ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2"></div>
                      Evaluating...
                    </>
                  ) : userChallenge?.is_solved ? (
                    'Submit Again'
                  ) : (
                    'Submit Solution'
                  )}
                </Button>
              </div>
              
              {userChallenge && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-1">
                    {userChallenge.attempts} {userChallenge.attempts === 1 ? 'attempt' : 'attempts'} made
                  </p>
                  <Progress value={userChallenge.is_solved ? 100 : Math.min(userChallenge.attempts * 10, 90)} className="h-2" />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-lg mb-4">No challenge available for today.</p>
            <Button onClick={generateNewChallenge} disabled={isProcessing}>
              Generate Today's Challenge
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default DailyChallenge;
