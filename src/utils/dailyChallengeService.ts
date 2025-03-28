
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getChatCompletion } from './openaiService';

// Types for our daily challenge system
export type ChallengeLevel = 'easy' | 'medium' | 'hard';

export type DailyChallenge = {
  id: string;
  title: string;
  description: string;
  difficulty: ChallengeLevel;
  date: string;
  starter_code: string;
  test_cases: string;
  solution_explanation?: string;
  created_at: string;
};

export type UserChallenge = {
  id: string;
  user_id: string;
  challenge_id: string;
  user_solution: string;
  is_solved: boolean;
  language: string;
  attempts: number;
  created_at: string;
  updated_at: string;
};

export type UserStats = {
  id: string;
  user_id: string;
  total_solved: number;
  current_streak: number;
  longest_streak: number;
  last_solved_date?: string;
  created_at: string;
  updated_at: string;
};

// Fetch today's challenge
export async function getTodaysChallenge(): Promise<DailyChallenge | null> {
  try {
    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    
    const { data, error } = await supabase
      .from('daily_challenges')
      .select('*')
      .eq('date', today)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No challenge found for today, let's generate one
        return await generateDailyChallenge();
      }
      
      console.error('Error fetching daily challenge:', error);
      toast.error('Failed to fetch today\'s challenge');
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getTodaysChallenge:', error);
    toast.error('An unexpected error occurred');
    return null;
  }
}

// Generate a new daily challenge using OpenAI
async function generateDailyChallenge(): Promise<DailyChallenge | null> {
  try {
    // Generate the challenge using OpenAI
    const prompt = `Create a coding challenge suitable for interview preparation. Include:
    1. A clear title
    2. A detailed description of the problem
    3. Difficulty level (easy, medium, or hard)
    4. Starter code in JavaScript
    5. Test cases to verify the solution
    6. An explanation of the solution approach

    Format your response as a JSON object with these fields:
    {
      "title": "...",
      "description": "...",
      "difficulty": "easy|medium|hard",
      "starter_code": "...",
      "test_cases": "...",
      "solution_explanation": "..."
    }`;

    const response = await getChatCompletion([
      { role: 'system', content: 'You are an expert coding interview problem creator.' },
      { role: 'user', content: prompt }
    ]);

    // Parse the response as JSON
    const challengeData = JSON.parse(response);
    
    // Insert the new challenge into the database
    const { data, error } = await supabase
      .from('daily_challenges')
      .insert({
        title: challengeData.title,
        description: challengeData.description,
        difficulty: challengeData.difficulty,
        date: new Date().toISOString().split('T')[0],
        starter_code: challengeData.starter_code,
        test_cases: challengeData.test_cases,
        solution_explanation: challengeData.solution_explanation
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error inserting daily challenge:', error);
      toast.error('Failed to generate today\'s challenge');
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error generating daily challenge:', error);
    toast.error('Failed to generate today\'s challenge');
    return null;
  }
}

// Get user's attempt for today's challenge
export async function getUserChallengeAttempt(userId: string, challengeId: string): Promise<UserChallenge | null> {
  try {
    const { data, error } = await supabase
      .from('user_challenges')
      .select('*')
      .eq('user_id', userId)
      .eq('challenge_id', challengeId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No attempt found, return null
        return null;
      }
      
      console.error('Error fetching user challenge attempt:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getUserChallengeAttempt:', error);
    return null;
  }
}

// Submit a solution to a challenge
export async function submitChallengeSolution(
  userId: string,
  challengeId: string,
  solution: string,
  language: string
): Promise<{ success: boolean; feedback: string; isSolved: boolean }> {
  try {
    // Check if the user has an existing attempt
    const existingAttempt = await getUserChallengeAttempt(userId, challengeId);
    
    // Get the challenge to evaluate against
    const { data: challenge, error: challengeError } = await supabase
      .from('daily_challenges')
      .select('*')
      .eq('id', challengeId)
      .single();
    
    if (challengeError) {
      console.error('Error fetching challenge:', challengeError);
      return { success: false, feedback: 'Failed to fetch challenge details', isSolved: false };
    }
    
    // Evaluate the solution using OpenAI
    const evaluationPrompt = `
    I'm working on this coding challenge:
    
    Title: ${challenge.title}
    Description: ${challenge.description}
    
    Here are the test cases that should pass:
    ${challenge.test_cases}
    
    My solution (in ${language}):
    ${solution}
    
    Please evaluate if my solution is correct and would pass all the test cases.
    Provide feedback on the approach, complexity, and any edge cases I might have missed.
    Finally, determine whether the solution is correct or not.
    
    Format your response as a JSON object:
    {
      "isCorrect": true/false,
      "feedback": "detailed feedback here",
      "complexity": "time and space complexity analysis"
    }`;
    
    const evaluationResponse = await getChatCompletion([
      { role: 'system', content: 'You are an expert code reviewer. Evaluate the provided solution against the test cases and requirements.' },
      { role: 'user', content: evaluationPrompt }
    ]);
    
    // Parse the evaluation
    const evaluation = JSON.parse(evaluationResponse);
    const isSolved = evaluation.isCorrect;
    
    // Update or insert the user attempt
    if (existingAttempt) {
      // Update existing attempt
      const { error: updateError } = await supabase
        .from('user_challenges')
        .update({
          user_solution: solution,
          is_solved: isSolved,
          language,
          attempts: existingAttempt.attempts + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingAttempt.id);
      
      if (updateError) {
        console.error('Error updating user attempt:', updateError);
        return { success: false, feedback: 'Failed to save your solution', isSolved };
      }
    } else {
      // Insert new attempt
      const { error: insertError } = await supabase
        .from('user_challenges')
        .insert({
          user_id: userId,
          challenge_id: challengeId,
          user_solution: solution,
          is_solved: isSolved,
          language,
          attempts: 1
        });
      
      if (insertError) {
        console.error('Error inserting user attempt:', insertError);
        return { success: false, feedback: 'Failed to save your solution', isSolved };
      }
    }
    
    // If solved, update user stats
    if (isSolved) {
      await updateUserStats(userId);
    }
    
    return {
      success: true,
      feedback: evaluation.feedback,
      isSolved
    };
  } catch (error) {
    console.error('Error in submitChallengeSolution:', error);
    return { success: false, feedback: 'An unexpected error occurred', isSolved: false };
  }
}

// Update user statistics after solving a challenge
async function updateUserStats(userId: string): Promise<void> {
  try {
    // First, get current user stats
    const { data: existingStats, error: statsError } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    const today = new Date().toISOString().split('T')[0];
    
    if (statsError && statsError.code !== 'PGRST116') {
      console.error('Error fetching user stats:', statsError);
      return;
    }
    
    if (existingStats) {
      // Calculate streak
      let currentStreak = existingStats.current_streak;
      let longestStreak = existingStats.longest_streak;
      
      // Check if the last solved date was yesterday
      if (existingStats.last_solved_date) {
        const lastSolvedDate = new Date(existingStats.last_solved_date);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        // Format as YYYY-MM-DD for comparison
        const yesterdayFormatted = yesterday.toISOString().split('T')[0];
        const lastSolvedFormatted = lastSolvedDate.toISOString().split('T')[0];
        
        if (lastSolvedFormatted === yesterdayFormatted) {
          // Continuing the streak
          currentStreak += 1;
        } else if (lastSolvedFormatted !== today) {
          // Streak broken
          currentStreak = 1;
        }
      } else {
        // First time solving
        currentStreak = 1;
      }
      
      // Update longest streak if needed
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }
      
      // Update stats
      await supabase
        .from('user_stats')
        .update({
          total_solved: existingStats.total_solved + 1,
          current_streak: currentStreak,
          longest_streak: longestStreak,
          last_solved_date: today,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingStats.id);
    } else {
      // Create new stats record
      await supabase
        .from('user_stats')
        .insert({
          user_id: userId,
          total_solved: 1,
          current_streak: 1,
          longest_streak: 1,
          last_solved_date: today
        });
    }
  } catch (error) {
    console.error('Error updating user stats:', error);
  }
}

// Get user statistics
export async function getUserStats(userId: string): Promise<UserStats | null> {
  try {
    const { data, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No stats found, return default
        return {
          id: '',
          user_id: userId,
          total_solved: 0,
          current_streak: 0,
          longest_streak: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }
      
      console.error('Error fetching user stats:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getUserStats:', error);
    return null;
  }
}
