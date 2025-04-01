
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// API key for OpenAI API (hardcoded for testing)
const API_KEY = "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";

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  date: string;
  starter_code: string;
  test_cases: string;
  solution_explanation?: string;
}

export interface UserChallenge {
  id: string;
  challenge_id: string;
  user_id: string;
  user_solution: string;
  is_solved: boolean;
  attempts: number;
  language: string;
  created_at: string;
  updated_at: string;
}

export interface UserStats {
  id: string;
  user_id: string;
  total_solved: number;
  current_streak: number;
  longest_streak: number;
  last_solved_date: string | null;
  created_at: string;
  updated_at: string;
}

// Sample challenges for fallback
const SAMPLE_CHALLENGES: DailyChallenge[] = [
  {
    id: '1',
    title: 'Two Sum',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.',
    difficulty: 'easy',
    date: new Date().toISOString().split('T')[0],
    starter_code: 'function twoSum(nums, target) {\n  // Your code here\n}',
    test_cases: 'twoSum([2,7,11,15], 9) should return [0,1]',
    solution_explanation: 'Use a hash map to store the numbers you\'ve seen so far. For each number, check if the complement (target - num) exists in the hash map.'
  },
  {
    id: '2',
    title: 'Valid Parentheses',
    description: 'Given a string s containing just the characters \'(\', \')\', \'{\', \'}\', \'[\' and \']\', determine if the input string is valid. An input string is valid if open brackets must be closed by the same type of brackets, and open brackets must be closed in the correct order.',
    difficulty: 'easy',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    starter_code: 'function isValid(s) {\n  // Your code here\n}',
    test_cases: 'isValid("()[]{}") should return true\nisValid("([)]") should return false',
    solution_explanation: 'Use a stack to keep track of opening brackets and pop them when matching closing brackets are encountered.'
  }
];

// Get today's challenge
export const getTodaysChallenge = async (): Promise<DailyChallenge | null> => {
  const today = new Date().toISOString().split('T')[0];
  
  try {
    // First check if there's already a challenge for today in the database
    const { data: existingChallenge, error: fetchError } = await supabase
      .from('daily_challenges')
      .select('*')
      .eq('date', today)
      .single();
    
    if (existingChallenge) {
      return existingChallenge;
    }
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching challenge:', fetchError);
      throw fetchError;
    }
    
    // If no challenge exists for today, generate a new one using OpenAI
    const newChallenge = await generateNewChallenge();
    
    // Save the new challenge to the database
    const { data: savedChallenge, error: saveError } = await supabase
      .from('daily_challenges')
      .insert({
        title: newChallenge.title,
        description: newChallenge.description,
        difficulty: newChallenge.difficulty,
        date: today,
        starter_code: newChallenge.starter_code,
        test_cases: newChallenge.test_cases,
        solution_explanation: newChallenge.solution_explanation
      })
      .select()
      .single();
    
    if (saveError) {
      console.error('Error saving challenge:', saveError);
      throw saveError;
    }
    
    return savedChallenge;
  } catch (error) {
    console.error('Error getting daily challenge:', error);
    
    // Fallback to a sample challenge if API call fails
    return SAMPLE_CHALLENGES[0];
  }
};

// Generate a new challenge using OpenAI
const generateNewChallenge = async (): Promise<DailyChallenge> => {
  try {
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
            content: 'You are a coding interview preparation assistant. Generate a coding challenge in JSON format with the following fields: title, description, difficulty (easy, medium, hard), starter_code (JavaScript), test_cases, and solution_explanation.'
          },
          {
            role: 'user',
            content: 'Generate a new daily coding challenge.'
          }
        ]
      })
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }
    
    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Extract the JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from API response');
    }
    
    const challengeData = JSON.parse(jsonMatch[0]);
    
    return {
      id: crypto.randomUUID(),
      title: challengeData.title,
      description: challengeData.description,
      difficulty: challengeData.difficulty.toLowerCase(),
      date: new Date().toISOString().split('T')[0],
      starter_code: challengeData.starter_code,
      test_cases: challengeData.test_cases,
      solution_explanation: challengeData.solution_explanation
    };
  } catch (error) {
    console.error('Error generating challenge:', error);
    // Fallback to a sample challenge
    return SAMPLE_CHALLENGES[0];
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
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user challenge:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error getting user challenge:', error);
    return null;
  }
};

// Submit a solution to a challenge
export const submitChallengeSolution = async (
  userId: string,
  challengeId: string,
  solution: string,
  language: string = 'javascript'
): Promise<{ success: boolean; message: string; is_solved: boolean }> => {
  try {
    // Check if the user has already attempted this challenge
    const existingAttempt = await getUserChallengeAttempt(userId, challengeId);
    
    // Verify solution using OpenAI
    const verificationResult = await verifyChallengeSolution(challengeId, solution);
    
    if (existingAttempt) {
      // Update existing attempt
      const { error } = await supabase
        .from('user_challenges')
        .update({
          user_solution: solution,
          is_solved: verificationResult.is_solved,
          attempts: existingAttempt.attempts + 1,
          language,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingAttempt.id);
      
      if (error) {
        throw error;
      }
    } else {
      // Create new attempt
      const { error } = await supabase
        .from('user_challenges')
        .insert({
          user_id: userId,
          challenge_id: challengeId,
          user_solution: solution,
          is_solved: verificationResult.is_solved,
          language,
          attempts: 1
        });
      
      if (error) {
        throw error;
      }
    }
    
    // If solution is correct and this is first time solving or it was previously unsolved
    if (verificationResult.is_solved && (!existingAttempt || !existingAttempt.is_solved)) {
      await updateUserStats(userId);
    }
    
    return verificationResult;
  } catch (error) {
    console.error('Error submitting solution:', error);
    return {
      success: false,
      message: 'Failed to submit solution. Please try again.',
      is_solved: false
    };
  }
};

// Verify a challenge solution using OpenAI
const verifyChallengeSolution = async (
  challengeId: string,
  solution: string
): Promise<{ success: boolean; message: string; is_solved: boolean }> => {
  try {
    // Get the challenge to check against test cases
    const { data: challenge, error } = await supabase
      .from('daily_challenges')
      .select('*')
      .eq('id', challengeId)
      .single();
    
    if (error) {
      throw error;
    }
    
    // Use OpenAI to verify the solution
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
            content: 'You are a code evaluator. Verify if the provided solution correctly solves the coding challenge according to the test cases. Return a JSON object with properties: success (boolean), message (string), and is_solved (boolean).'
          },
          {
            role: 'user',
            content: `
Challenge: ${challenge.title}
Description: ${challenge.description}
Test Cases: ${challenge.test_cases}

User Solution:
${solution}

Evaluate if this solution passes all the test cases.
`
          }
        ]
      })
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }
    
    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Extract the JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from API response');
    }
    
    const result = JSON.parse(jsonMatch[0]);
    
    return {
      success: result.success,
      message: result.message,
      is_solved: result.is_solved
    };
  } catch (error) {
    console.error('Error verifying solution:', error);
    
    // Default response for error cases
    return {
      success: false,
      message: 'There was an error evaluating your solution. Please try again.',
      is_solved: false
    };
  }
};

// Get user's stats
export const getUserStats = async (userId: string): Promise<UserStats | null> => {
  try {
    // Try to get existing stats
    const { data, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user stats:', error);
      throw error;
    }
    
    // If no stats exist, create default stats
    if (!data) {
      const { data: newStats, error: createError } = await supabase
        .from('user_stats')
        .insert({
          user_id: userId,
          total_solved: 0,
          current_streak: 0,
          longest_streak: 0
        })
        .select()
        .single();
      
      if (createError) {
        throw createError;
      }
      
      return newStats;
    }
    
    return data;
  } catch (error) {
    console.error('Error getting user stats:', error);
    return null;
  }
};

// Update user's stats after solving a challenge
const updateUserStats = async (userId: string): Promise<void> => {
  try {
    // Get current stats
    const stats = await getUserStats(userId);
    if (!stats) {
      throw new Error('User stats not found');
    }
    
    const today = new Date().toISOString().split('T')[0];
    const lastSolvedDate = stats.last_solved_date;
    
    // Calculate new streak
    let currentStreak = stats.current_streak;
    
    if (!lastSolvedDate) {
      // First time solving
      currentStreak = 1;
    } else {
      const lastDate = new Date(lastSolvedDate);
      const todayDate = new Date(today);
      const diffInDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffInDays === 1) {
        // Consecutive day
        currentStreak += 1;
      } else if (diffInDays > 1) {
        // Streak broken
        currentStreak = 1;
      }
      // If diffInDays === 0, it's the same day, don't increment streak
    }
    
    // Update stats
    const { error } = await supabase
      .from('user_stats')
      .update({
        total_solved: stats.total_solved + 1,
        current_streak: currentStreak,
        longest_streak: Math.max(currentStreak, stats.longest_streak),
        last_solved_date: today,
        updated_at: new Date().toISOString()
      })
      .eq('id', stats.id);
    
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error updating user stats:', error);
    toast.error('Failed to update stats. Your progress may not be saved.');
  }
};

// Clear all challenge attempts for testing
export const clearChallengeAttempts = async (userId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('user_challenges')
      .delete()
      .eq('user_id', userId);
    
    if (error) {
      throw error;
    }
    
    toast.success('All challenge attempts cleared');
  } catch (error) {
    console.error('Error clearing challenge attempts:', error);
    toast.error('Failed to clear challenge attempts');
  }
};
