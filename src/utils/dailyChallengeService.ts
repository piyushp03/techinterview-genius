
// Types
export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  date: string;
  starter_code: string;
  test_cases: string;
  solution_explanation?: string;
}

export interface UserChallenge {
  id: string;
  user_id: string;
  challenge_id: string;
  user_solution: string;
  is_solved: boolean;
  attempts: number;
  language: string;
  feedback: string;
  submitted_at: string;
}

export interface UserStats {
  user_id: string;
  total_solved: number;
  total_attempted: number;
  current_streak: number;
  longest_streak: number;
}

export interface ChallengeSubmissionResult {
  success: boolean;
  isSolved: boolean;
  feedback: string;
}

// Mock data for challenges
const MOCK_CHALLENGES: Record<string, DailyChallenge> = {
  '1': {
    id: '1',
    title: 'Two Sum',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.<br/><br/>You may assume that each input would have exactly one solution, and you may not use the same element twice.',
    difficulty: 'easy',
    date: new Date().toISOString(),
    starter_code: 'function twoSum(nums, target) {\n  // Your code here\n}',
    test_cases: 'twoSum([2,7,11,15], 9) // should return [0,1]\ntwoSum([3,2,4], 6) // should return [1,2]\ntwoSum([3,3], 6) // should return [0,1]',
    solution_explanation: 'To solve this problem, we can use a hash map to store the numbers we\'ve seen so far and their indices. For each number, we check if target - number exists in the hash map. If it does, we\'ve found our answer. Otherwise, we add the current number to the hash map and continue.<br/><br/>Time complexity: O(n)<br/>Space complexity: O(n)',
  },
  '2': {
    id: '2',
    title: 'Valid Parentheses',
    description: 'Given a string s containing just the characters \'(\', \')\', \'{\', \'}\', \'[\' and \']\', determine if the input string is valid.<br/><br/>An input string is valid if:<br/>1. Open brackets must be closed by the same type of brackets.<br/>2. Open brackets must be closed in the correct order.<br/>3. Every close bracket has a corresponding open bracket of the same type.',
    difficulty: 'medium',
    date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    starter_code: 'function isValid(s) {\n  // Your code here\n}',
    test_cases: 'isValid("()") // should return true\nisValid("()[]{}") // should return true\nisValid("(]") // should return false',
    solution_explanation: 'We can use a stack to keep track of opening brackets. When we encounter a closing bracket, we check if the top of the stack has the corresponding opening bracket. If it does, we pop it from the stack and continue. If it doesn\'t, or if the stack is empty, the string is invalid.<br/><br/>Time complexity: O(n)<br/>Space complexity: O(n)',
  },
};

// Mock data for user attempts
const USER_ATTEMPTS: Record<string, UserChallenge> = {};

// Mock data for user stats
const USER_STATS: Record<string, UserStats> = {};

// Helper to generate an ID
const generateId = (): string => Math.random().toString(36).substring(2, 9);

// Get today's challenge
export const getTodaysChallenge = async (): Promise<DailyChallenge | null> => {
  // In a real app, this would fetch from the database
  // Here we just return a mock challenge
  return MOCK_CHALLENGES['1'];
};

// Get user's attempt for a challenge
export const getUserChallengeAttempt = async (userId: string, challengeId: string): Promise<UserChallenge | null> => {
  // In a real app, this would fetch from the database
  const attemptKey = `${userId}_${challengeId}`;
  return USER_ATTEMPTS[attemptKey] || null;
};

// Get user's stats
export const getUserStats = async (userId: string): Promise<UserStats> => {
  // In a real app, this would fetch from the database
  if (!USER_STATS[userId]) {
    USER_STATS[userId] = {
      user_id: userId,
      total_solved: 0,
      total_attempted: 0,
      current_streak: 0,
      longest_streak: 0,
    };
  }
  return USER_STATS[userId];
};

// Submit a solution to a challenge
export const submitChallengeSolution = async (
  userId: string, 
  challengeId: string, 
  solution: string, 
  language: string
): Promise<ChallengeSubmissionResult> => {
  // In a real app, this would send to the backend for evaluation
  console.log(`Submitting solution for user ${userId}, challenge ${challengeId}`);
  
  const attemptKey = `${userId}_${challengeId}`;
  const challenge = MOCK_CHALLENGES[challengeId];
  
  if (!challenge) {
    return {
      success: false,
      isSolved: false,
      feedback: 'Challenge not found',
    };
  }
  
  // Check if user already has an attempt
  const existingAttempt = USER_ATTEMPTS[attemptKey];
  
  // Evaluate the solution (in a real app, this would be much more sophisticated)
  const isSolved = evaluateUserSolution(solution, challenge, language);
  
  // Generate feedback
  const feedback = isSolved 
    ? `Congratulations! Your solution passed all test cases. Here's an explanation of an optimal approach:<br/><br/>${challenge.solution_explanation || 'Great job solving this problem!'}` 
    : 'Your solution did not pass all test cases. Try again!';
  
  // Create or update the attempt
  const updatedAttempt: UserChallenge = {
    id: existingAttempt?.id || generateId(),
    user_id: userId,
    challenge_id: challengeId,
    user_solution: solution,
    is_solved: isSolved,
    attempts: (existingAttempt?.attempts || 0) + 1,
    language,
    feedback,
    submitted_at: new Date().toISOString(),
  };
  
  // Save the attempt
  USER_ATTEMPTS[attemptKey] = updatedAttempt;
  
  // Update user stats if solved for the first time
  if (isSolved && (!existingAttempt || !existingAttempt.is_solved)) {
    const stats = await getUserStats(userId);
    stats.total_solved += 1;
    stats.current_streak += 1;
    stats.longest_streak = Math.max(stats.longest_streak, stats.current_streak);
    USER_STATS[userId] = stats;
  }
  
  // Always increment total attempted if not already solved
  if (!existingAttempt?.is_solved) {
    const stats = await getUserStats(userId);
    stats.total_attempted += 1;
    USER_STATS[userId] = stats;
  }
  
  return {
    success: true,
    isSolved,
    feedback,
  };
};

// Simple solution evaluator (in a real app, this would be much more sophisticated)
const evaluateUserSolution = (solution: string, challenge: DailyChallenge, language: string): boolean => {
  // This is a very simplistic solution checker
  // In a real app, you would run the code against test cases
  
  // Check if the solution contains certain keywords that suggest it's on the right track
  if (challenge.id === '1') { // Two Sum
    return solution.includes('return') && 
           solution.includes('target') && 
           (solution.includes('Map') || solution.includes('Object') || solution.includes('{}'));
  } else if (challenge.id === '2') { // Valid Parentheses
    return solution.includes('return') && 
           solution.includes('stack') && 
           (solution.includes('push') || solution.includes('pop') || solution.includes('shift') || solution.includes('unshift'));
  }
  
  // Default to false if we don't know how to evaluate
  return false;
};
