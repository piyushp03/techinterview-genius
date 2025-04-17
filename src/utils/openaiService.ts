
// OpenAI Service for Interview App
// This file contains functions for interacting with the OpenAI API

import { toast } from 'sonner';

// Hardcoded API key (for development purposes only - in production this should be secured)
const OPENAI_API_KEY = "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";

// Types for API requests
type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

// Resume Analysis Result Type
export interface ResumeAnalysisResult {
  analysisText: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  jobFit: 'low' | 'medium' | 'high';
  score: number;
}

/**
 * Get a completion from OpenAI's chat completion API
 */
export const getChatCompletion = async (messages: ChatMessage[], model: string = 'gpt-4o-mini'): Promise<string> => {
  try {
    console.log('Sending request to OpenAI:', { messages, model });
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error in getChatCompletion:', error);
    toast.error('Failed to get response from AI');
    
    // Return a fallback response
    return "I'm having trouble connecting to my knowledge base right now. Please try again in a moment.";
  }
};

/**
 * Generate an interview question based on role, category, etc.
 */
export const generateInterviewQuestion = async (
  role: string,
  category: string,
  previousQuestions: string[] = [],
  resumeText?: string,
  customTopics?: string[]
): Promise<string> => {
  const systemPrompt = `You are an expert technical interviewer for ${role} roles. 
  Create a challenging but fair question about ${category}${customTopics?.length ? ` focusing on ${customTopics.join(', ')}` : ''}. 
  Make the question specific, clear, and designed to assess real-world skills.
  ${previousQuestions.length > 0 ? `Do not repeat any of these previous questions: ${previousQuestions.join('\n')}` : ''}
  ${resumeText ? `Consider the candidate's experience from this resume excerpt: ${resumeText.substring(0, 500)}...` : ''}`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: 'Generate a technical interview question.' }
  ];

  return getChatCompletion(messages);
};

/**
 * Evaluate a candidate's answer to an interview question
 */
export const evaluateAnswer = async (
  question: string,
  answer: string,
  role: string,
  category: string
): Promise<string> => {
  const systemPrompt = `You are an expert technical interviewer for ${role} positions.
  Evaluate the following answer to a ${category} question. 
  Provide constructive feedback, highlighting strengths and areas for improvement.
  Be fair but thorough in your assessment. Provide a score out of 10 at the end.`;

  const userPrompt = `Question: ${question}\n\nAnswer: ${answer}\n\nEvaluate this answer in detail.`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  return getChatCompletion(messages);
};

/**
 * Analyze an interview session and provide overall feedback
 */
export const analyzeInterviewSession = async (
  role: string,
  category: string,
  questions: string[],
  answers: string[]
): Promise<string> => {
  // Check if questions and answers arrays match in length
  if (questions.length !== answers.length) {
    console.error('Questions and answers arrays must be of equal length');
    return "Error: Unable to analyze the interview session due to data mismatch";
  }

  // Prepare QA pairs for the prompt
  const qaPairs = questions.map((q, i) => `Q: ${q}\nA: ${answers[i]}`).join('\n\n');

  const systemPrompt = `You are an expert technical interviewer for ${role} positions.
  Analyze the following interview Q&A session for a ${category} interview.
  Provide comprehensive feedback about the candidate's:
  - Technical knowledge and accuracy
  - Communication clarity
  - Problem-solving approach
  - Areas of strength
  - Areas for improvement
  
  End with an overall assessment score out of 100 and a final recommendation.`;

  const userPrompt = `Interview Q&A Session:\n\n${qaPairs}\n\nPlease provide a detailed analysis of this interview session.`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  return getChatCompletion(messages, 'gpt-4o-mini');
};

/**
 * Generate personalized interview recommendations based on user profile
 */
export const generateInterviewRecommendations = async (
  userData: any
): Promise<string> => {
  const systemPrompt = `You are an expert career advisor specializing in technical interviews.
  Based on the user's profile, provide personalized recommendations for interview preparation,
  including topics to study, practice resources, and interview strategies.`;

  const userPrompt = `User Profile: ${JSON.stringify(userData)}\n\nPlease provide personalized interview preparation recommendations.`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  return getChatCompletion(messages);
};

export const analyzeAnswer = async (
  question: string,
  answer: string,
  role: string,
  language: string
): Promise<{
  feedback: string;
  score: number;
  strengths: string[];
  weaknesses: string[];
}> => {
  try {
    const systemPrompt = `You are an expert technical interviewer for ${role} roles using ${language}.
    Analyze the following answer to a technical question.
    Provide detailed, constructive feedback.
    Format your response as JSON with these fields:
    - feedback: detailed paragraph with assessment
    - score: number between 0-100
    - strengths: array of 2-3 strengths
    - weaknesses: array of 2-3 areas for improvement`;

    const userPrompt = `Question: ${question}\n\nAnswer: ${answer}\n\nProvide a JSON analysis.`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    const response = await getChatCompletion(messages);

    // Try to parse the response as JSON
    try {
      return JSON.parse(response);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      // Fallback to a default structure
      return {
        feedback: response,
        score: 70,
        strengths: ["Good attempt"],
        weaknesses: ["More detail needed"]
      };
    }
  } catch (error) {
    console.error('Error analyzing answer:', error);
    return {
      feedback: "We couldn't analyze your answer at this time.",
      score: 0,
      strengths: [],
      weaknesses: ["Unable to analyze"]
    };
  }
};

/**
 * Analyze a resume and provide feedback
 */
export const analyzeResume = async (resumeText: string): Promise<ResumeAnalysisResult> => {
  try {
    const systemPrompt = `You are an expert resume reviewer with extensive experience in technical hiring.
    Analyze the following resume and provide detailed feedback.
    Format your response as JSON with these fields:
    - analysisText: detailed paragraph with overall assessment
    - strengths: array of 3-5 strengths of the resume
    - weaknesses: array of 3-5 areas for improvement
    - suggestions: array of 3-5 specific actionable suggestions
    - jobFit: one of "low", "medium", or "high" indicating overall fit for technical roles
    - score: number between 0-100 indicating overall resume quality`;

    const userPrompt = `Resume text:\n\n${resumeText}\n\nProvide a detailed analysis as JSON.`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    const response = await getChatCompletion(messages, 'gpt-4o-mini');

    // Try to parse the response as JSON
    try {
      const parsedResponse = JSON.parse(response);
      return {
        analysisText: parsedResponse.analysisText || "Resume analysis completed.",
        strengths: parsedResponse.strengths || ["Good technical background"],
        weaknesses: parsedResponse.weaknesses || ["Could improve formatting"],
        suggestions: parsedResponse.suggestions || ["Add more quantifiable achievements"],
        jobFit: parsedResponse.jobFit || "medium",
        score: parsedResponse.score || 70
      };
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      // Fallback to a default structure with the text response
      return {
        analysisText: response,
        strengths: ["Good technical background"],
        weaknesses: ["Could improve formatting"],
        suggestions: ["Add more quantifiable achievements"],
        jobFit: "medium",
        score: 70
      };
    }
  } catch (error) {
    console.error('Error analyzing resume:', error);
    toast.error('Failed to analyze resume');
    
    // Return a fallback response
    return {
      analysisText: "We couldn't analyze your resume at this time. Please try again later.",
      strengths: [],
      weaknesses: [],
      suggestions: ["Try again later"],
      jobFit: "medium",
      score: 0
    };
  }
};

// Add the interview results analysis function
export const analyzeInterviewResults = async (
  sessionData: any,
  messages: any[]
): Promise<{
  overallScore: number;
  feedback: string;
  strengths: string[];
  weaknesses: string[];
  improvementAreas: string[];
  recommendedResources: { title: string; url: string }[];
}> => {
  try {
    // Filter only user answers
    const userAnswers = messages.filter(msg => !msg.is_bot).map(msg => msg.content);
    
    // Filter only AI questions
    const aiQuestions = messages.filter(msg => msg.is_bot).map(msg => msg.content);
    
    // Prepare Q&A pairs
    const qaPairs = aiQuestions.slice(0, userAnswers.length).map((q, i) => 
      `Question: ${q}\n\nAnswer: ${userAnswers[i] || "No answer provided"}`
    ).join('\n\n---\n\n');
    
    const systemPrompt = `You are an expert technical interviewer for ${sessionData.role_type} positions using ${sessionData.language}.
    Analyze the following interview Q&A session thoroughly and provide detailed feedback.
    Only consider responses that are relevant to the questions asked and ignore any irrelevant content.
    Format your response as JSON with these fields:
    - overallScore: number between 0-100
    - feedback: detailed paragraph with overall assessment
    - strengths: array of 3-5 specific strengths demonstrated
    - weaknesses: array of 3-5 specific weak areas identified
    - improvementAreas: array of 3-5 specific areas to focus on improving
    - recommendedResources: array of objects with {title, url} for learning resources (5-7 items)`;

    const userPrompt = `Interview for ${sessionData.role_type} role, focusing on ${sessionData.category} using ${sessionData.language}:\n\n${qaPairs}\n\nProvide a detailed JSON analysis of this interview performance.`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    const response = await getChatCompletion(messages, 'gpt-4o-mini');
    
    try {
      return JSON.parse(response);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      // Fallback structure
      return {
        overallScore: 70,
        feedback: "The interview analysis could not be properly structured. " + response,
        strengths: ["Attempted to answer questions"],
        weaknesses: ["Could not analyze specific weaknesses"],
        improvementAreas: ["General technical knowledge", "Communication clarity"],
        recommendedResources: [
          { title: "General programming resources", url: "https://github.com/EbookFoundation/free-programming-books" }
        ]
      };
    }
  } catch (error) {
    console.error('Error analyzing interview results:', error);
    return {
      overallScore: 50,
      feedback: "Unable to analyze the interview results at this time. Please try again later.",
      strengths: [],
      weaknesses: [],
      improvementAreas: [],
      recommendedResources: [
        { title: "General programming resources", url: "https://github.com/EbookFoundation/free-programming-books" }
      ]
    };
  }
};
