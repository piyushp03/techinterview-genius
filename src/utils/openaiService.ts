import { toast } from 'sonner';

// OpenAI API Key (hardcoded for testing purposes only - kept from original file)
const OPENAI_API_KEY = "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";

// Types
export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<any>;
};

type ChatCompletionResponse = {
  id: string;
  choices: {
    message: {
      content: string;
      role: string;
    };
    index: number;
    finish_reason: string;
  }[];
};

/**
 * Get a completion from the OpenAI API
 */
export async function getChatCompletion(
  messages: ChatMessage[],
  options: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
  } = {}
): Promise<string> {
  const {
    model = 'gpt-4o-mini',
    temperature = 0.7,
    max_tokens = 1000,
  } = options;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as ChatCompletionResponse;
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    toast.error('Failed to get response from AI. Please try again.');
    return "I apologize, but I'm having trouble connecting to my knowledge base right now. Please try again in a moment.";
  }
}

/**
 * Generate a technical interview question based on parameters
 */
export const generateInterviewQuestion = async (
  role: string,
  category: string,
  previousQuestions: string[] = [],
  resumeData?: any,
  customTopics?: string[]
): Promise<string> => {
  try {
    console.log("Generating interview question for:", role, category);
    
    // Use hardcoded OpenAI API key for interview question generation
    const OPENAI_API_KEY = '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';
    
    // Optional: Include custom topics in the prompt if provided
    let customTopicsPrompt = '';
    if (customTopics && customTopics.length > 0) {
      customTopicsPrompt = `\nPlease focus on these specific topics if possible: ${customTopics.join(', ')}.`;
    }

    // Prepare previous questions to avoid repetition
    const previousQuestionsText = previousQuestions.length > 0 
      ? `\nAvoid repeating these previous questions: ${JSON.stringify(previousQuestions)}`
      : '';
    
    // Create a stronger system prompt for better questions
    const systemPrompt = `You are an expert technical interviewer for ${role} positions. 
    Generate a challenging interview question about ${category} that would be appropriate for a job interview.
    Make the question specific, technical, and designed to test the candidate's knowledge.
    The question should be concise and clear.${customTopicsPrompt}${previousQuestionsText}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate a challenging ${category} interview question for a ${role} position.` }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Question generated successfully");
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error generating interview question:", error);
    // Provide a fallback question if the API call fails
    return `Tell me about your experience with ${category} in a ${role} position?`;
  }
};

/**
 * Generate an objective multiple-choice question
 */
export async function generateObjectiveQuestion(
  role: string,
  category: string,
  language: string
): Promise<{
  question: string;
  options: string[];
  correctAnswer: number;
}> {
  const systemPrompt = `Create a multiple-choice question for a ${role} interview focusing on ${category} in ${language}. 
  The question should have exactly 4 options with only one correct answer.
  Structure your response in JSON format with fields:
  - question: the question text
  - options: array of 4 possible answers
  - correctAnswer: index (0-3) of the correct option
  
  Your response should be VALID JSON only.`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Generate a ${category} multiple-choice question for a ${role} position using ${language}.` },
  ];

  try {
    const response = await getChatCompletion(messages, {
      temperature: 0.7,
    });
    
    // Parse the JSON response
    const result = JSON.parse(response);
    return {
      question: result.question,
      options: result.options,
      correctAnswer: result.correctAnswer,
    };
  } catch (error) {
    console.error('Error generating objective question:', error);
    return {
      question: `What is a common use case for ${language} in ${category}?`,
      options: [
        'Option A',
        'Option B',
        'Option C',
        'Option D',
      ],
      correctAnswer: 0,
    };
  }
}

/**
 * Generate a coding challenge question
 */
export async function generateCodingChallenge(
  role: string,
  language: string,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium'
): Promise<{
  question: string;
  starterCode: string;
  testCases: string;
  solutionCode: string;
}> {
  const systemPrompt = `Create a coding challenge for a ${role} interview using ${language}. 
  The difficulty should be ${difficulty}.
  Structure your response in JSON format with fields:
  - question: detailed problem statement
  - starterCode: boilerplate code to get the candidate started
  - testCases: example test cases to verify solution
  - solutionCode: a working solution
  
  Your response should be VALID JSON only.`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Generate a ${difficulty} coding challenge for a ${role} position using ${language}.` },
  ];

  try {
    const response = await getChatCompletion(messages, {
      temperature: 0.7,
      max_tokens: 2000,
    });
    
    // Parse the JSON response
    const result = JSON.parse(response);
    return {
      question: result.question,
      starterCode: result.starterCode,
      testCases: result.testCases,
      solutionCode: result.solutionCode,
    };
  } catch (error) {
    console.error('Error generating coding challenge:', error);
    return {
      question: `Write a function that reverses a string in ${language}.`,
      starterCode: `// Write your code here\nfunction reverseString(str) {\n  // Your code here\n}`,
      testCases: `reverseString("hello") // should return "olleh"`,
      solutionCode: `function reverseString(str) {\n  return str.split('').reverse().join('');\n}`,
    };
  }
}

/**
 * Evaluate a candidate's answer
 */
export async function evaluateAnswer(
  question: string,
  answer: string,
  role: string,
  category: string
): Promise<{
  feedback: string;
  score: number; // 1-10
  strengths: string[];
  areas_for_improvement: string[];
}> {
  const systemPrompt = `You are an expert technical interviewer evaluating candidates for a ${role} role.
  Provide constructive, specific feedback on the candidate's answer.
  Be encouraging but honest about areas for improvement.
  Evaluate based on technical accuracy, clarity of explanation, and problem-solving approach.`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: `Question: ${question}\n\nCandidate's Answer: ${answer}\n\nPlease evaluate this answer for a ${role} position, focusing on ${category}. Provide a score from 1-10, list specific strengths, and suggest areas for improvement.`,
    },
  ];

  const response = await getChatCompletion(messages, {
    temperature: 0.5,
  });

  // Parse the response to extract score, strengths, and areas for improvement
  let score = 5; // Default score
  const strengths: string[] = [];
  const areas_for_improvement: string[] = [];

  try {
    // Very basic parsing - in a real app, you'd use a more robust approach
    if (response.includes('Score:')) {
      const scoreMatch = response.match(/Score:\s*(\d+)/i);
      if (scoreMatch && scoreMatch[1]) {
        score = parseInt(scoreMatch[1], 10);
        if (score < 1) score = 1;
        if (score > 10) score = 10;
      }
    }

    // Extract strengths
    if (response.includes('Strengths:')) {
      const strengthsSection = response.split('Strengths:')[1].split('Areas for improvement:')[0];
      const strengthItems = strengthsSection.split('\n').filter(item => item.trim().startsWith('-'));
      strengthItems.forEach(item => {
        const cleaned = item.replace(/^-\s*/, '').trim();
        if (cleaned) strengths.push(cleaned);
      });
    }

    // Extract areas for improvement
    if (response.includes('Areas for improvement:')) {
      const improvementSection = response.split('Areas for improvement:')[1];
      const improvementItems = improvementSection.split('\n').filter(item => item.trim().startsWith('-'));
      improvementItems.forEach(item => {
        const cleaned = item.replace(/^-\s*/, '').trim();
        if (cleaned) areas_for_improvement.push(cleaned);
      });
    }

    // If we couldn't parse any strengths or areas for improvement, create some defaults
    if (strengths.length === 0) {
      strengths.push("Clear explanation");
      strengths.push("Good approach to the problem");
    }

    if (areas_for_improvement.length === 0) {
      areas_for_improvement.push("Consider edge cases");
      areas_for_improvement.push("Expand on technical details");
    }
  } catch (error) {
    console.error('Error parsing AI response:', error);
  }

  return {
    feedback: response,
    score,
    strengths,
    areas_for_improvement,
  };
}

/**
 * Evaluate a coding solution
 */
export async function evaluateCodingSolution(
  question: string,
  userCode: string,
  language: string,
  expectedSolution: string
): Promise<{
  isCorrect: boolean;
  feedback: string;
  optimizationTips: string[];
}> {
  const systemPrompt = `You are an expert coding interviewer. Evaluate the candidate's code solution for correctness, efficiency, and coding style.
  Be specific in your feedback and suggest improvements.`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: `\nProblem: ${question}\n\nCandidate's Solution (${language}):\n\`\`\`\n${userCode}\n\`\`\`\n\nExpected Solution:\n\`\`\`\n${expectedSolution}\n\`\`\`\n\nEvaluate if the solution is correct. Provide specific feedback and optimization tips.\n      `,
    },
  ];

  const response = await getChatCompletion(messages, {
    temperature: 0.5,
    max_tokens: 1500,
  });

  // Determine if the solution is correct based on the AI's assessment
  const isCorrect = response.toLowerCase().includes('correct') && !response.toLowerCase().includes('incorrect');
  
  // Extract optimization tips
  const optimizationTips: string[] = [];
  if (response.includes('Optimization tips:') || response.includes('Optimization Tips:')) {
    const tipsSection = response.split(/Optimization [Tt]ips:/)[1];
    const tipItems = tipsSection.split('\n').filter(item => item.trim().startsWith('-'));
    tipItems.forEach(item => {
      const cleaned = item.replace(/^-\s*/, '').trim();
      if (cleaned) optimizationTips.push(cleaned);
    });
  }

  if (optimizationTips.length === 0) {
    // Default optimization tips if none were extracted
    optimizationTips.push("Consider edge cases");
    optimizationTips.push("Optimize for time and space complexity");
  }

  return {
    isCorrect,
    feedback: response,
    optimizationTips,
  };
}

/**
 * Calculate similarity between expected answer and provided answer
 */
export function calculateSimilarity(expectedAnswer: string, providedAnswer: string): number {
  // This is a very simple implementation
  // In a real app, you'd use more sophisticated NLP techniques
  
  // Normalize both strings
  const normalizeText = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2);
  };
  
  const expectedWords = new Set(normalizeText(expectedAnswer));
  const providedWords = normalizeText(providedAnswer);
  
  let matchCount = 0;
  for (const word of providedWords) {
    if (expectedWords.has(word)) {
      matchCount++;
    }
  }
  
  // Calculate Jaccard similarity
  const union = new Set([...normalizeText(expectedAnswer), ...normalizeText(providedAnswer)]);
  return matchCount / union.size;
}

/**
 * Extract text from resume PDF
 */
export const extractTextFromResume = async (pdfBase64: string): Promise<string> => {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at extracting text from resume PDFs. Extract all the relevant information from this resume in a well-structured format. Include name, contact details, work experience, education, skills, projects, certifications, and any other relevant sections.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract the complete text from this resume PDF. Format it in a well-structured way that preserves sections and important information.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:application/pdf;base64,${pdfBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      throw new Error('Failed to extract text from resume');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error extracting text from resume:', error);
    throw error;
  }
};

/**
 * Analyze resume and provide feedback
 */
export interface ResumeAnalysisResult {
  analysisText: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  jobFit: 'low' | 'medium' | 'high';
  score: number;
}

export async function analyzeResume(resumeText: string): Promise<ResumeAnalysisResult> {
  try {
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
            role: 'system',
            content: 'You are a professional resume reviewer who provides detailed, constructive feedback on resumes. Your analysis should be thorough, specific, and actionable.'
          },
          {
            role: 'user',
            content: `Please analyze this resume and provide detailed feedback. Include: 
            1. An overall score out of 100 
            2. Key strengths (list at least 3)
            3. Areas for improvement (list at least 3)
            4. Specific suggestions for enhancing the resume (list at least 3)
            5. Job fit assessment (low, medium, or high)
            
            Format your response with clear section headers for:
            - Strengths:
            - Weaknesses:
            - Suggestions:
            - Job Fit:
            - Score:
            
            Resume text:
            ${resumeText}`
          }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error('Failed to analyze resume');
    }

    const data = await response.json();
    const analysisText = data.choices[0].message.content;
    
    // Parse the analysis to extract structured data
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const suggestions: string[] = [];
    let jobFit: 'low' | 'medium' | 'high' = 'medium';
    let score = 70; // Default score
    
    // Extract strengths
    if (analysisText.includes('Strengths:')) {
      const strengthsSection = analysisText.split('Strengths:')[1].split(/Weaknesses:|Areas for Improvement:/)[0];
      const strengthItems = strengthsSection.split(/\n+/).filter(item => item.trim().startsWith('-'));
      strengthItems.forEach(item => {
        const cleaned = item.replace(/^-\s*/, '').trim();
        if (cleaned) strengths.push(cleaned);
      });
    }
    
    // Extract weaknesses
    const weaknessesRegex = /Weaknesses:|Areas for Improvement:|Areas to Improve:/;
    if (analysisText.match(weaknessesRegex)) {
      const weaknessesSection = analysisText.split(weaknessesRegex)[1].split(/Suggestions:|Recommendations:/)[0];
      const weaknessItems = weaknessesSection.split(/\n+/).filter(item => item.trim().startsWith('-'));
      weaknessItems.forEach(item => {
        const cleaned = item.replace(/^-\s*/, '').trim();
        if (cleaned) weaknesses.push(cleaned);
      });
    }
    
    // Extract suggestions
    const suggestionsRegex = /Suggestions:|Recommendations:/;
    if (analysisText.match(suggestionsRegex)) {
      const suggestionsSection = analysisText.split(suggestionsRegex)[1].split(/Overall Assessment:|Score:|Job Fit:/)[0];
      const suggestionItems = suggestionsSection.split(/\n+/).filter(item => item.trim().startsWith('-'));
      suggestionItems.forEach(item => {
        const cleaned = item.replace(/^-\s*/, '').trim();
        if (cleaned) suggestions.push(cleaned);
      });
    }
    
    // Extract score
    if (analysisText.includes('Score:')) {
      const scoreMatch = analysisText.match(/Score:\s*(\d+)/i);
      if (scoreMatch && scoreMatch[1]) {
        score = parseInt(scoreMatch[1], 10);
        if (score < 1) score = 1;
        if (score > 100) score = 100;
      }
    }
    
    // Extract job fit
    if (analysisText.toLowerCase().includes('job fit:')) {
      const jobFitLower = analysisText.toLowerCase();
      if (jobFitLower.includes('high') || jobFitLower.includes('strong') || jobFitLower.includes('excellent')) {
        jobFit = 'high';
      } else if (jobFitLower.includes('low') || jobFitLower.includes('poor') || jobFitLower.includes('weak')) {
        jobFit = 'low';
      } else {
        jobFit = 'medium';
      }
    }
    
    // Default values if parsing failed
    if (strengths.length === 0) strengths.push('Clear presentation of skills');
    if (weaknesses.length === 0) weaknesses.push('Could be more concise');
    if (suggestions.length === 0) suggestions.push('Add more quantifiable achievements');
    
    return {
      analysisText,
      strengths,
      weaknesses,
      suggestions,
      jobFit,
      score
    };
  } catch (error) {
    console.error('Error analyzing resume:', error);
    throw error;
  }
}

/**
 * Helper function to extract list items from a section of text
 */
function extractListSection(text: string, startMarker: string, endMarker: string): string[] | null {
  if (!text.includes(startMarker)) return null;
  
  const startIndex = text.indexOf(startMarker) + startMarker.length;
  const endIndex = text.includes(endMarker) ? text.indexOf(endMarker) : text.length;
  
  if (startIndex >= endIndex) return null;
  
  const sectionText = text.substring(startIndex, endIndex).trim();
  const items = sectionText.split(/\n+/)
    .map(line => line.trim())
    .filter(line => line.startsWith('-') || line.startsWith('•'))
    .map(line => line.replace(/^[-•]\s*/, '').trim())
    .filter(line => line.length > 0);
  
  return items.length > 0 ? items : null;
}
