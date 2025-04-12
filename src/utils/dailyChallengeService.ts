
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Type definitions
export type DailyChallenge = {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  date: string;
  starter_code: string;
  test_cases: string;
  solution_explanation: string | null;
};

export type UserChallenge = {
  id: string;
  user_id: string;
  challenge_id: string;
  user_solution: string;
  attempts: number;
  is_solved: boolean;
  language: string;
  created_at: string;
  updated_at: string;
  feedback?: string;
};

export type UserStats = {
  id?: string;
  user_id: string;
  total_solved: number;
  current_streak: number;
  longest_streak: number;
  last_solved_date: string | null;
};

// Get today's daily coding challenge
export const getTodaysChallenge = async (): Promise<DailyChallenge | null> => {
  try {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    console.log("Fetching challenge for date:", formattedDate);
    
    // Fetch today's challenge from the database
    const { data, error } = await supabase
      .from('daily_challenges')
      .select('*')
      .eq('date', formattedDate)
      .single();
    
    if (error) {
      console.log("No challenge found for today, fetching the latest one");
      // If no challenge for today, get the most recent one
      const { data: latestData, error: latestError } = await supabase
        .from('daily_challenges')
        .select('*')
        .order('date', { ascending: false })
        .limit(1)
        .single();
        
      if (latestError) throw latestError;
      return latestData;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching daily challenge:', error);
    throw error;
  }
};

// Get user's attempt for a specific challenge
export const getUserChallengeAttempt = async (userId: string, challengeId: string): Promise<UserChallenge | null> => {
  try {
    const { data, error } = await supabase
      .from('user_challenges')
      .select('*')
      .eq('user_id', userId)
      .eq('challenge_id', challengeId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No attempt found
        return null;
      }
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching user challenge attempt:', error);
    return null;
  }
};

// Submit solution for evaluation
export const submitChallengeSolution = async (
  userId: string,
  challengeId: string,
  userSolution: string,
  language: string
): Promise<{
  success: boolean;
  message: string;
  is_solved: boolean;
  feedback?: string;
}> => {
  try {
    console.log("Submitting challenge solution");
    
    // Check if user has already attempted this challenge
    const existingAttempt = await getUserChallengeAttempt(userId, challengeId);
    
    // Get the challenge to evaluate
    const { data: challenge } = await supabase
      .from('daily_challenges')
      .select('*')
      .eq('id', challengeId)
      .single();
    
    if (!challenge) {
      throw new Error('Challenge not found');
    }
    
    // In a real app, we would evaluate the solution here
    // For now, we'll use a basic simulation of evaluation
    const isCorrect = simulateEvaluation(userSolution, challenge);
    
    // Generate feedback based on the evaluation
    const feedback = generateFeedback(userSolution, challenge, isCorrect);
    
    // Update user stats on successful solution
    if (isCorrect && (!existingAttempt || !existingAttempt.is_solved)) {
      await updateUserStats(userId);
    }
    
    // Save the attempt
    if (existingAttempt) {
      // Update existing attempt
      const { error } = await supabase
        .from('user_challenges')
        .update({
          user_solution: userSolution,
          attempts: existingAttempt.attempts + 1,
          is_solved: isCorrect,
          updated_at: new Date().toISOString(),
          language,
          feedback
        })
        .eq('id', existingAttempt.id);
      
      if (error) throw error;
    } else {
      // Create new attempt
      const { error } = await supabase
        .from('user_challenges')
        .insert({
          user_id: userId,
          challenge_id: challengeId,
          user_solution: userSolution,
          is_solved: isCorrect,
          language,
          feedback
        });
      
      if (error) throw error;
    }
    
    return {
      success: true,
      message: isCorrect ? 'Your solution is correct!' : 'Your solution needs more work.',
      is_solved: isCorrect,
      feedback
    };
  } catch (error) {
    console.error('Error submitting challenge solution:', error);
    return {
      success: false,
      message: 'Error evaluating solution',
      is_solved: false,
      feedback: 'There was an error processing your solution. Please try again.'
    };
  }
};

// Generate feedback based on the evaluation
const generateFeedback = (userSolution: string, challenge: any, isCorrect: boolean): string => {
  let feedback = '';
  
  if (isCorrect) {
    feedback = `<div class="text-green-600 font-medium mb-2">Great job! Your solution is correct.</div>
    <p>Your solution successfully passed all test cases. Here's a brief analysis:</p>
    <ul class="list-disc list-inside space-y-1 mt-2">
      <li>Your approach is efficient and well-implemented.</li>
      <li>The code is readable and follows good practices.</li>
      <li>All edge cases were handled appropriately.</li>
    </ul>`;
  } else {
    // Generate specific feedback based on the solution
    const issues = [];
    
    // Check for common issues in code
    if (!userSolution.includes('return')) {
      issues.push('Your function doesn\'t return a value.');
    }
    
    if (userSolution.length < 50) {
      issues.push('Your solution may be too brief to handle all required cases.');
    }
    
    if (challenge.difficulty === 'hard' && !userSolution.includes('for') && !userSolution.includes('while')) {
      issues.push('This problem likely requires iteration which is missing from your solution.');
    }
    
    feedback = `<div class="text-amber-600 font-medium mb-2">Your solution needs some improvements.</div>
    <p>Here's what you might want to look at:</p>
    <ul class="list-disc list-inside space-y-1 mt-2">
      ${issues.map(issue => `<li>${issue}</li>`).join('')}
      <li>Make sure you're handling all the test cases described in the problem.</li>
      <li>Review the requirements of the problem once more.</li>
    </ul>
    <p class="mt-2">Don't give up! With a few tweaks, you'll get there.</p>`;
  }
  
  return feedback;
};

// Update user stats when they solve a challenge
const updateUserStats = async (userId: string) => {
  try {
    // Get current user stats
    const { data: existingStats, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No stats found, create new stats
        await supabase
          .from('user_stats')
          .insert({
            user_id: userId,
            total_solved: 1,
            current_streak: 1,
            longest_streak: 1,
            last_solved_date: today
          });
      } else {
        throw error;
      }
    } else {
      // Calculate streak
      let currentStreak = existingStats.current_streak;
      let longestStreak = existingStats.longest_streak;
      const lastSolvedDate = existingStats.last_solved_date ? new Date(existingStats.last_solved_date) : null;
      
      // Check if last solved was yesterday
      if (lastSolvedDate) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const isConsecutive = yesterday.toISOString().split('T')[0] === lastSolvedDate.toISOString().split('T')[0];
        
        if (isConsecutive) {
          currentStreak += 1;
          longestStreak = Math.max(currentStreak, longestStreak);
        } else if (today === lastSolvedDate.toISOString().split('T')[0]) {
          // Already solved today, no streak update
        } else {
          // Streak broken
          currentStreak = 1;
        }
      }
      
      // Update stats
      await supabase
        .from('user_stats')
        .update({
          total_solved: existingStats.total_solved + 1,
          current_streak: currentStreak,
          longest_streak: longestStreak,
          last_solved_date: today
        })
        .eq('id', existingStats.id);
    }
  } catch (error) {
    console.error('Error updating user stats:', error);
  }
};

// Simple evaluation function (for demo purposes)
const simulateEvaluation = (userSolution: string, challenge: any) => {
  // In a real app, we would actually run tests against the solution
  // For now, just check if it contains some expected keywords or patterns
  
  const keywords = [
    'return', 'function', 'for', 'if', 'const', 'let', 'var',
    'array', 'object', 'string', 'number', 'boolean'
  ];
  
  const difficulty = challenge.difficulty.toLowerCase();
  let requiredKeywordCount = 3; // Default for 'easy'
  
  if (difficulty === 'medium') {
    requiredKeywordCount = 5;
  } else if (difficulty === 'hard') {
    requiredKeywordCount = 7;
  }
  
  // Count keywords in user solution
  let keywordCount = 0;
  keywords.forEach(keyword => {
    if (userSolution.includes(keyword)) {
      keywordCount++;
    }
  });
  
  // Add randomness to the evaluation
  const randomFactor = Math.random() > 0.3; // 70% chance of success for sufficiently complex solutions
  
  return keywordCount >= requiredKeywordCount && randomFactor;
};

// Get user's stats
export const getUserStats = async (userId: string): Promise<UserStats | null> => {
  try {
    const { data, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No stats found
        return {
          user_id: userId,
          total_solved: 0,
          current_streak: 0,
          longest_streak: 0,
          last_solved_date: null
        };
      }
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return null;
  }
};
