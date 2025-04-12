
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

// API key for generating daily challenges (hardcoded for testing)
const API_KEY = "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";

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
  '3': {
    id: '3',
    title: 'Merge Two Sorted Lists',
    description: 'Merge two sorted linked lists and return it as a sorted list. The list should be made by splicing together the nodes of the first two lists.',
    difficulty: 'easy',
    date: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    starter_code: 'function mergeTwoLists(l1, l2) {\n  // Your code here\n}',
    test_cases: 'mergeTwoLists([1,2,4], [1,3,4]) // should return [1,1,2,3,4,4]\nmergeTwoLists([], []) // should return []\nmergeTwoLists([], [0]) // should return [0]',
    solution_explanation: 'We can use a dummy head node to simplify the code. Then we compare the values of the two lists and append the smaller one to our result list. We continue this process until we reach the end of one or both lists. If one list is exhausted, we simply append the remaining nodes of the other list to our result.<br/><br/>Time complexity: O(n + m)<br/>Space complexity: O(1) (excluding the output list)',
  },
  '4': {
    id: '4',
    title: 'Binary Search',
    description: 'Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, then return its index. Otherwise, return -1.',
    difficulty: 'easy',
    date: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
    starter_code: 'function search(nums, target) {\n  // Your code here\n}',
    test_cases: 'search([-1,0,3,5,9,12], 9) // should return 4\nsearch([-1,0,3,5,9,12], 2) // should return -1',
    solution_explanation: 'Binary search is a divide and conquer algorithm. We start by comparing the target with the middle element of the array. If the target is equal to the middle element, we return its index. If the target is less than the middle element, we continue searching in the left half of the array. Otherwise, we search in the right half.<br/><br/>Time complexity: O(log n)<br/>Space complexity: O(1)',
  },
  '5': {
    id: '5',
    title: 'Maximum Subarray',
    description: 'Given an integer array nums, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.',
    difficulty: 'medium',
    date: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
    starter_code: 'function maxSubArray(nums) {\n  // Your code here\n}',
    test_cases: 'maxSubArray([-2,1,-3,4,-1,2,1,-5,4]) // should return 6\nmaxSubArray([1]) // should return 1\nmaxSubArray([5,4,-1,7,8]) // should return 23',
    solution_explanation: 'We can use Kadane\'s algorithm to solve this problem. The idea is to keep track of the maximum subarray sum ending at each position and update the global maximum along the way.<br/><br/>Time complexity: O(n)<br/>Space complexity: O(1)',
  },
};

// Mock data for user attempts
const USER_ATTEMPTS: Record<string, UserChallenge> = {};

// Mock data for user stats
const USER_STATS: Record<string, UserStats> = {};

// Helper to generate an ID
const generateId = (): string => Math.random().toString(36).substring(2, 9);

// Generate a new challenge for today
const generateDailyChallenge = async (): Promise<DailyChallenge> => {
  try {
    // First check if we already have a challenge for today
    const today = new Date().toISOString().split('T')[0];
    
    // Call OpenAI to generate a new challenge (this would be a real API call in production)
    // Using a hardcoded challenge for demonstration
    const randomIndex = Math.floor(Math.random() * Object.keys(MOCK_CHALLENGES).length) + 1;
    const challenge = { ...MOCK_CHALLENGES[randomIndex.toString()] };
    
    // Update the date to today
    challenge.date = new Date().toISOString();
    challenge.id = generateId();
    
    return challenge;
  } catch (error) {
    console.error('Error generating daily challenge:', error);
    // Return a default challenge if generation fails
    return MOCK_CHALLENGES['1'];
  }
};

// Get today's challenge
export const getTodaysChallenge = async (): Promise<DailyChallenge | null> => {
  // In a real app, this would fetch from the database
  // Here we generate a new challenge for demonstration
  return generateDailyChallenge();
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
  // In a real app, this would send to the backend for evaluation using OpenAI
  console.log(`Submitting solution for user ${userId}, challenge ${challengeId}`);
  
  try {
    const attemptKey = `${userId}_${challengeId}`;
    const challenge = Object.values(MOCK_CHALLENGES).find(c => c.id === challengeId);
    
    if (!challenge) {
      return {
        success: false,
        isSolved: false,
        feedback: 'Challenge not found',
      };
    }
    
    // Check if user already has an attempt
    const existingAttempt = USER_ATTEMPTS[attemptKey];
    
    // Evaluate the solution using OpenAI (mocked for demonstration)
    const isSolved = evaluateUserSolution(solution, challenge, language);
    
    // Generate feedback using OpenAI (mocked for demonstration)
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
  } catch (error) {
    console.error('Error evaluating solution:', error);
    return {
      success: false,
      isSolved: false,
      feedback: 'An error occurred while evaluating your solution.'
    };
  }
};

// Simple solution evaluator (in a real app, this would use OpenAI or another service)
const evaluateUserSolution = (solution: string, challenge: DailyChallenge, language: string): boolean => {
  // This is a very simplistic solution checker
  // In a real app, you would call OpenAI to evaluate the solution
  
  console.log('Evaluating solution with hardcoded API key in dailyChallengeService');
  
  // Check if the solution contains certain keywords that suggest it's on the right track
  if (challenge.id === '1') { // Two Sum
    return solution.includes('return') && 
           solution.includes('target') && 
           (solution.includes('Map') || solution.includes('Object') || solution.includes('{}'));
  } else if (challenge.id === '2') { // Valid Parentheses
    return solution.includes('return') && 
           (solution.includes('stack') || solution.includes('Stack') || solution.includes('Array') || solution.includes('[]'));
  } else if (challenge.id === '3') { // Merge Two Sorted Lists
    return solution.includes('return') && solution.includes('while');
  } else if (challenge.id === '4') { // Binary Search
    return solution.includes('return') && 
           (solution.includes('while') || solution.includes('mid'));
  } else if (challenge.id === '5') { // Maximum Subarray
    return solution.includes('return') && 
           (solution.includes('Math.max') || solution.includes('max'));
  }
  
  // Random result for demonstration purposes
  return Math.random() > 0.5;
};

// Get all challenges for display
export const getAllChallenges = async (): Promise<DailyChallenge[]> => {
  // In a real app, this would fetch from the database
  return Object.values(MOCK_CHALLENGES);
};
