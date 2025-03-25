
import { toast } from 'sonner';

// OpenAI API Key (would be better stored in backend environment)
const OPENAI_API_KEY = "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";

// Types
type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
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
export async function generateInterviewQuestion(
  role: string,
  category: string,
  previousQuestions: string[] = [],
  resumeText?: string,
  customTopics?: string[]
): Promise<string> {
  const systemPrompt = `You are an experienced technical interviewer conducting an interview for a ${role} role. 
  Focus on ${category} questions that are challenging but fair. 
  ${resumeText ? 'Consider the candidate\'s background from their resume.' : ''}
  ${customTopics?.length ? 'Focus on these specific topics: ' + customTopics.join(', ') : ''}
  Ask one clear, specific question at a time. Don't provide answers.`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
  ];

  if (resumeText) {
    messages.push({
      role: 'user',
      content: `Here is the candidate's resume: ${resumeText}`,
    });
    messages.push({
      role: 'assistant',
      content: "I'll tailor questions based on this background.",
    });
  }

  if (previousQuestions.length > 0) {
    messages.push({
      role: 'user',
      content: `Previous questions asked: ${previousQuestions.join(' | ')}`,
    });
  }

  messages.push({
    role: 'user',
    content: `Generate a challenging ${category} interview question for a ${role} role.`,
  });

  return getChatCompletion(messages, {
    temperature: 0.8,
  });
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

  try {
    const response = await getChatCompletion(messages, {
      temperature: 0.5,
    });

    // For now, return a mock structured response
    // In a real implementation, we would parse the response into a structured format
    return {
      feedback: response,
      score: Math.floor(Math.random() * 5) + 5, // Mock score between 5-10
      strengths: ["Clear explanation", "Good understanding of concepts"],
      areas_for_improvement: ["Could provide more examples", "Consider edge cases"],
    };
  } catch (error) {
    console.error('Error evaluating answer:', error);
    return {
      feedback: "I couldn't properly evaluate this answer due to a technical issue.",
      score: 5,
      strengths: ["Answer received"],
      areas_for_improvement: ["Please try again for a full evaluation"],
    };
  }
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
