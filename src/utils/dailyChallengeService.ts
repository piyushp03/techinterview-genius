
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

// Seeded data for use when database has no entries
const SEED_CHALLENGES = [
  {
    id: "daily-challenge-1",
    title: "Two Sum",
    description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.
    
You may assume that each input would have exactly one solution, and you may not use the same element twice.
You can return the answer in any order.

Example 1:
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].

Example 2:
Input: nums = [3,2,4], target = 6
Output: [1,2]

Example 3:
Input: nums = [3,3], target = 6
Output: [0,1]`,
    difficulty: "easy",
    date: new Date().toISOString().split('T')[0],
    starter_code: `function twoSum(nums, target) {
  // Write your code here
  
}`,
    test_cases: `twoSum([2,7,11,15], 9) => [0,1]
twoSum([3,2,4], 6) => [1,2]
twoSum([3,3], 6) => [0,1]`,
    solution_explanation: `To solve this problem, we can use a hash map to keep track of the numbers we've seen and their indices. For each number in the array, we check if the complement (target - current number) exists in the hash map. If it does, we've found our pair and return their indices. If not, we add the current number and its index to the hash map.

```javascript
function twoSum(nums, target) {
  const map = new Map();
  
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    
    map.set(nums[i], i);
  }
  
  return null; // No solution found
}
```

This solution has a time complexity of O(n) where n is the length of the input array, as we only need to traverse the array once. The space complexity is also O(n) for storing the hash map.`
  },
  {
    id: "daily-challenge-2",
    title: "Palindrome Number",
    description: `Given an integer x, return true if x is a palindrome, and false otherwise.

Example 1:
Input: x = 121
Output: true
Explanation: 121 reads as 121 from left to right and from right to left.

Example 2:
Input: x = -121
Output: false
Explanation: From left to right, it reads -121. From right to left, it reads 121-. Therefore it is not a palindrome.

Example 3:
Input: x = 10
Output: false
Explanation: Reads 01 from right to left. Therefore it is not a palindrome.`,
    difficulty: "easy",
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
    starter_code: `function isPalindrome(x) {
  // Write your code here
  
}`,
    test_cases: `isPalindrome(121) => true
isPalindrome(-121) => false
isPalindrome(10) => false`,
    solution_explanation: `There are multiple ways to solve this problem. One approach is to convert the number to a string and check if it reads the same forwards and backwards. Another approach is to reverse the number and compare it with the original.

String approach:
```javascript
function isPalindrome(x) {
  if (x < 0) return false;
  
  const str = x.toString();
  return str === str.split('').reverse().join('');
}
```

Numeric approach (without converting to string):
```javascript
function isPalindrome(x) {
  // Negative numbers are not palindromes
  if (x < 0) return false;
  // Single digit numbers are always palindromes
  if (x < 10) return true;
  // Numbers ending with 0 can't be palindromes (except 0 itself)
  if (x % 10 === 0 && x !== 0) return false;
  
  let reversed = 0;
  while (x > reversed) {
    reversed = reversed * 10 + (x % 10);
    x = Math.floor(x / 10);
  }
  
  // For even digit count: x === reversed
  // For odd digit count: x === Math.floor(reversed / 10)
  return x === reversed || x === Math.floor(reversed / 10);
}
```

Both solutions have a time complexity of O(log n) where n is the input number, as we're processing each digit. The space complexity is O(1) for the numeric approach and O(log n) for the string approach due to the string conversion.`
  },
  {
    id: "daily-challenge-3",
    title: "Valid Parentheses",
    description: `Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.

Example 1:
Input: s = "()"
Output: true

Example 2:
Input: s = "()[]{}"
Output: true

Example 3:
Input: s = "(]"
Output: false`,
    difficulty: "medium",
    date: new Date(Date.now() - 172800000).toISOString().split('T')[0], // 2 days ago
    starter_code: `function isValid(s) {
  // Write your code here
  
}`,
    test_cases: `isValid("()") => true
isValid("()[]{}") => true
isValid("(]") => false
isValid("([)]") => false
isValid("{[]}") => true`,
    solution_explanation: `To solve this problem, we can use a stack to keep track of opening brackets. Whenever we encounter a closing bracket, we check if it matches the most recent opening bracket (which should be at the top of the stack). If it does, we pop the opening bracket from the stack and continue. If not, the string is invalid.

```javascript
function isValid(s) {
  const stack = [];
  const pairs = {
    '(': ')',
    '[': ']',
    '{': '}'
  };
  
  for (let char of s) {
    if (char in pairs) {
      // Opening bracket
      stack.push(char);
    } else {
      // Closing bracket
      const lastBracket = stack.pop();
      
      // Check if the current closing bracket matches the most recent opening bracket
      if (pairs[lastBracket] !== char) {
        return false;
      }
    }
  }
  
  // If the stack is empty, all brackets have been matched
  return stack.length === 0;
}
```

This solution has a time complexity of O(n) where n is the length of the input string, as we only need to traverse the string once. The space complexity is also O(n) in the worst case, where all characters are opening brackets.`
  }
];

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
      .maybeSingle();
    
    if (error) {
      console.error("Error fetching today's challenge:", error);
      // Try getting the most recent challenge instead
      const { data: latestData, error: latestError } = await supabase
        .from('daily_challenges')
        .select('*')
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle();
        
      if (latestError) {
        console.error("Error fetching latest challenge:", latestError);
        // If no data in the database, return a seed challenge
        return getSeedChallenge();
      }
      
      if (!latestData) {
        return getSeedChallenge();
      }
      
      return latestData;
    }
    
    if (!data) {
      // If no challenge for today, get the most recent one
      console.log("No challenge found for today, fetching the latest one");
      const { data: latestData, error: latestError } = await supabase
        .from('daily_challenges')
        .select('*')
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle();
        
      if (latestError || !latestData) {
        return getSeedChallenge();
      }
      
      return latestData;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching daily challenge:', error);
    // Fallback to seed data if there's an error
    return getSeedChallenge();
  }
};

// Seed challenge when no database entries exist
const getSeedChallenge = (): DailyChallenge => {
  // Get today's date to match with a seed challenge or default to the first one
  const today = new Date().toISOString().split('T')[0];
  
  // Find a challenge matching today's date or use the first one
  const challenge = SEED_CHALLENGES.find(c => c.date === today) || SEED_CHALLENGES[0];
  
  // Make sure the challenge has today's date
  return {
    ...challenge,
    date: today
  };
};

// Get user's attempt for a specific challenge
export const getUserChallengeAttempt = async (userId: string, challengeId: string): Promise<UserChallenge | null> => {
  try {
    const { data, error } = await supabase
      .from('user_challenges')
      .select('*')
      .eq('user_id', userId)
      .eq('challenge_id', challengeId)
      .maybeSingle();
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    return data || null;
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
      .maybeSingle();
    
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
      .maybeSingle();
    
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    if (!existingStats) {
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
      return;
    }
    
    // Calculate streak
    let currentStreak = existingStats.current_streak;
    let longestStreak = existingStats.longest_streak;
    const lastSolvedDate = existingStats.last_solved_date ? new Date(existingStats.last_solved_date) : null;
    
    // Check if last solved was yesterday
    if (lastSolvedDate) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = yesterday.toISOString().split('T')[0];
      const lastSolvedString = lastSolvedDate.toISOString().split('T')[0];
      const isConsecutive = yesterdayString === lastSolvedString;
      
      if (isConsecutive) {
        currentStreak += 1;
        longestStreak = Math.max(currentStreak, longestStreak);
      } else if (today === lastSolvedString) {
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
      .maybeSingle();
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    if (!data) {
      return {
        user_id: userId,
        total_solved: 0,
        current_streak: 0,
        longest_streak: 0,
        last_solved_date: null
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return null;
  }
};
