import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

/**
 * Get a chat completion from Gemini via edge function
 */
export async function getChatCompletion(
  messages: ChatMessage[],
  options?: {
    temperature?: number;
    maxTokens?: number;
  }
): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke('gemini-completion', {
      body: {
        messages,
        temperature: options?.temperature || 0.7,
        maxTokens: options?.maxTokens || 2000,
      },
    });

    if (error) throw error;
    if (!data?.content) throw new Error('No content in response');

    return data.content;
  } catch (error) {
    console.error('Error getting chat completion:', error);
    toast.error('Failed to get AI response');
    throw error;
  }
}

/**
 * Generate an interview question based on role and category
 */
export async function generateInterviewQuestion(
  role: string,
  category: string,
  previousQuestions?: string[],
  resumeText?: string | any,
  customTopics?: string[],
  questionType: 'objective' | 'subjective' | 'mixed' = 'subjective',
  isCodingEnabled: boolean = false
): Promise<string> {
  const systemPrompt = `You are an expert technical interviewer. Generate a ${questionType} interview question for a ${role} position in the ${category} category.`;
  
  let userPrompt = `Generate a challenging ${questionType} interview question for a ${role} position focusing on ${category}.`;
  
  if (customTopics && customTopics.length > 0) {
    userPrompt += `\nFocus on these specific topics: ${customTopics.join(', ')}.`;
  }
  
  if (resumeText) {
    const resumeString = typeof resumeText === 'string' ? resumeText : JSON.stringify(resumeText);
    userPrompt += `\nConsider the candidate's resume:\n${resumeString.substring(0, 500)}`;
  }
  
  if (previousQuestions && previousQuestions.length > 0) {
    userPrompt += `\n\nPrevious questions asked:\n${previousQuestions.join('\n')}`;
    userPrompt += '\n\nGenerate a DIFFERENT question that covers a new aspect.';
  }
  
  if (questionType === 'objective') {
    userPrompt += '\n\nProvide 4 options and indicate the correct answer.';
  }
  
  if (isCodingEnabled) {
    userPrompt += '\n\nThis can be a coding question if appropriate.';
  }

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  return await getChatCompletion(messages, { temperature: 0.8 });
}

/**
 * Generate an objective question with multiple choice options
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
  const systemPrompt = 'You are an expert technical interviewer creating multiple-choice questions.';
  const userPrompt = `Create a multiple-choice question for a ${role} position about ${category} in ${language}.

Return ONLY a JSON object with this exact structure:
{
  "question": "the question text",
  "options": ["option1", "option2", "option3", "option4"],
  "correctAnswer": 0
}

The correctAnswer should be the index (0-3) of the correct option.`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  const response = await getChatCompletion(messages, { temperature: 0.7 });
  
  try {
    const parsed = JSON.parse(response);
    return {
      question: parsed.question,
      options: parsed.options,
      correctAnswer: parsed.correctAnswer
    };
  } catch (error) {
    console.error('Error parsing objective question:', error);
    throw new Error('Failed to parse question format');
  }
}

/**
 * Generate a coding challenge
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
  const systemPrompt = 'You are an expert at creating coding challenges for technical interviews.';
  const userPrompt = `Create a ${difficulty} coding challenge for a ${role} position using ${language}.

Return ONLY a JSON object with this structure:
{
  "question": "problem description",
  "starterCode": "starter code template",
  "testCases": "test cases description",
  "solutionCode": "complete solution"
}`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  const response = await getChatCompletion(messages, { temperature: 0.7, maxTokens: 3000 });
  
  try {
    const parsed = JSON.parse(response);
    return {
      question: parsed.question,
      starterCode: parsed.starterCode,
      testCases: parsed.testCases,
      solutionCode: parsed.solutionCode
    };
  } catch (error) {
    console.error('Error parsing coding challenge:', error);
    throw new Error('Failed to parse coding challenge format');
  }
}

/**
 * Evaluate an answer to an interview question
 */
export async function evaluateAnswer(
  question: string,
  answer: string,
  role: string,
  category: string
): Promise<{
  feedback: string;
  score: number;
  strengths: string[];
  areas_for_improvement: string[];
}> {
  const systemPrompt = 'You are an expert interviewer evaluating candidate responses.';
  const userPrompt = `Evaluate this answer for a ${role} position in ${category}:

Question: ${question}
Answer: ${answer}

Return ONLY a JSON object with this structure:
{
  "feedback": "detailed feedback",
  "score": 85,
  "strengths": ["strength1", "strength2"],
  "areas_for_improvement": ["area1", "area2"]
}

Score should be 0-100.`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  const response = await getChatCompletion(messages, { temperature: 0.3 });
  
  try {
    const parsed = JSON.parse(response);
    return {
      feedback: parsed.feedback,
      score: parsed.score,
      strengths: parsed.strengths || [],
      areas_for_improvement: parsed.areas_for_improvement || []
    };
  } catch (error) {
    console.error('Error parsing evaluation:', error);
    throw new Error('Failed to parse evaluation format');
  }
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
  const systemPrompt = 'You are an expert code reviewer.';
  const userPrompt = `Evaluate this ${language} code solution:

Problem: ${question}
User's Code: ${userCode}
Expected Solution: ${expectedSolution}

Return ONLY a JSON object with this structure:
{
  "isCorrect": true,
  "feedback": "detailed feedback",
  "optimizationTips": ["tip1", "tip2"]
}`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  const response = await getChatCompletion(messages, { temperature: 0.3 });
  
  try {
    const parsed = JSON.parse(response);
    return {
      isCorrect: parsed.isCorrect,
      feedback: parsed.feedback,
      optimizationTips: parsed.optimizationTips || []
    };
  } catch (error) {
    console.error('Error parsing code evaluation:', error);
    throw new Error('Failed to parse evaluation format');
  }
}

/**
 * Extract text from a PDF resume
 */
export async function extractTextFromResume(pdfBase64: string): Promise<string> {
  const systemPrompt = 'You are an expert at extracting text from PDF documents.';
  const userPrompt = 'Extract all text from this PDF resume. Return only the extracted text, no formatting or explanations.';

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `${userPrompt}\n\n[PDF Base64 Data - length: ${pdfBase64.length} chars]` }
  ];

  try {
    return await getChatCompletion(messages, { maxTokens: 4000 });
  } catch (error) {
    console.error('Error extracting text from resume:', error);
    toast.error('Failed to extract text from resume');
    throw error;
  }
}

export interface ResumeAnalysisResult {
  score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  overall_feedback: string;
  technical_skills: string[];
  experience_summary: string;
  education: string[];
  job_fit_score: number;
}

/**
 * Analyze a resume and provide feedback
 */
export async function analyzeResume(resumeText: string): Promise<ResumeAnalysisResult> {
  const systemPrompt = 'You are an expert resume reviewer and career advisor.';
  const userPrompt = `Analyze this resume and provide detailed feedback:

${resumeText}

Return ONLY a JSON object with this structure:
{
  "score": 85,
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "suggestions": ["suggestion1", "suggestion2"],
  "overall_feedback": "summary",
  "technical_skills": ["skill1", "skill2"],
  "experience_summary": "summary",
  "education": ["degree1", "degree2"],
  "job_fit_score": 80
}

All scores should be 0-100.`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  const response = await getChatCompletion(messages, { maxTokens: 3000 });
  
  try {
    const parsed = JSON.parse(response);
    return {
      score: parsed.score,
      strengths: parsed.strengths || [],
      weaknesses: parsed.weaknesses || [],
      suggestions: parsed.suggestions || [],
      overall_feedback: parsed.overall_feedback || '',
      technical_skills: parsed.technical_skills || [],
      experience_summary: parsed.experience_summary || '',
      education: parsed.education || [],
      job_fit_score: parsed.job_fit_score || 0
    };
  } catch (error) {
    console.error('Error parsing resume analysis:', error);
    throw new Error('Failed to parse resume analysis format');
  }
}