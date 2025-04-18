
import { supabase } from '@/integrations/supabase/client';
import { InterviewAnalysis } from './interviewAnalysisService';
import { getChatCompletion } from './openaiService';

// Function to generate a comprehensive analysis of the interview
export const generateInterviewResults = async (sessionId: string): Promise<InterviewAnalysis> => {
  try {
    // 1. Get the interview session data
    const { data: sessionData, error: sessionError } = await supabase
      .from('interview_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
    
    if (sessionError) {
      throw sessionError;
    }
    
    // 2. Get all messages from the interview
    const { data: messages, error: messagesError } = await supabase
      .from('interview_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    
    if (messagesError) {
      throw messagesError;
    }
    
    // Extract the questions (bot messages) and answers (user messages)
    const questions: string[] = [];
    const answers: string[] = [];
    
    for (let i = 0; i < messages.length - 1; i++) {
      if (messages[i].is_bot && !messages[i+1].is_bot) {
        questions.push(messages[i].content);
        answers.push(messages[i+1].content);
      }
    }
    
    // If there are no Q&A pairs, return a basic analysis
    if (questions.length === 0 || answers.length === 0) {
      return createBasicAnalysis("Not enough interview data to analyze. The interview may have been too short.");
    }
    
    // 3. Generate analysis using OpenAI
    const analysisPrompt = `
    You are an expert technical interviewer for a ${sessionData.role_type} position.
    Please analyze the following interview Q&A session focused on ${sessionData.category} using ${sessionData.language}.
    
    ${questions.map((q, i) => `Question ${i+1}: ${q}\nAnswer: ${answers[i] || "No answer provided"}`).join("\n\n")}
    
    Provide a detailed analysis with the following:
    1. Strengths (3-5 points)
    2. Weaknesses (3-5 points)
    3. Recommendations for improvement (3-5 specific suggestions)
    4. Provide numerical scores (1-10) for: clarity, conciseness, depth of knowledge, fluency, confidence
    5. Overall score (1-10)
    6. A summary paragraph
    `;
    
    const aiAnalysis = await getChatCompletion([
      { role: 'system', content: 'You are an expert technical interviewer providing detailed feedback.' },
      { role: 'user', content: analysisPrompt }
    ], 'gpt-4o-mini');
    
    // 4. Parse the AI response into our analysis format
    // For simplicity, we'll use a pseudo-parser here
    const analysis = parseAIResponse(aiAnalysis);
    
    // 5. Save the analysis to the database
    await saveAnalysisToDatabase(sessionId, analysis);
    
    return analysis;
  } catch (error) {
    console.error("Error generating interview results:", error);
    return createBasicAnalysis("An error occurred while analyzing your interview. Please try again later.");
  }
};

// Parse the AI response into our analysis format
const parseAIResponse = (aiResponse: string): InterviewAnalysis => {
  // This is a very basic parser - in a real app, you would want to use
  // a more robust way to extract the information or ask the AI to return JSON
  
  const strengthsMatch = aiResponse.match(/Strengths:?([\s\S]*?)(?=Weaknesses:|$)/i);
  const weaknessesMatch = aiResponse.match(/Weaknesses:?([\s\S]*?)(?=Recommendations:|$)/i);
  const recommendationsMatch = aiResponse.match(/Recommendations:?([\s\S]*?)(?=\d+\.|\n\n|$)/i);
  
  const clarityMatch = aiResponse.match(/clarity:?\s*(\d+)/i);
  const concisenessMatch = aiResponse.match(/conciseness:?\s*(\d+)/i);
  const depthMatch = aiResponse.match(/depth:?\s*(\d+)/i);
  const fluencyMatch = aiResponse.match(/fluency:?\s*(\d+)/i);
  const confidenceMatch = aiResponse.match(/confidence:?\s*(\d+)/i);
  const overallMatch = aiResponse.match(/overall:?\s*(\d+)/i);
  
  // Extract summary paragraph - usually comes after all the scores
  let summaryText = '';
  if (overallMatch && overallMatch.index) {
    summaryText = aiResponse.substring(overallMatch.index + overallMatch[0].length).trim();
  } else {
    // Fallback: take the last paragraph
    const paragraphs = aiResponse.split('\n\n');
    summaryText = paragraphs[paragraphs.length - 1].trim();
  }
  
  // Extract bullet points from text sections
  const extractBulletPoints = (text: string | null): string[] => {
    if (!text) return [];
    
    // Look for bullet points or numbered items
    const bulletPoints = text.split(/\n-|\n\d+\.|\n•/).filter(Boolean).map(item => item.trim());
    
    if (bulletPoints.length <= 1) {
      // If no bullet points found, try splitting by new lines
      return text.split('\n').filter(Boolean).map(item => item.trim());
    }
    
    return bulletPoints;
  };
  
  return {
    metrics: {
      clarity: parseInt(clarityMatch?.[1] || '7'),
      conciseness: parseInt(concisenessMatch?.[1] || '6'),
      depth: parseInt(depthMatch?.[1] || '8'),
      fluency: parseInt(fluencyMatch?.[1] || '7'),
      confidence: parseInt(confidenceMatch?.[1] || '6'),
      overall: parseInt(overallMatch?.[1] || '7'),
    },
    strengths: extractBulletPoints(strengthsMatch?.[1]),
    weaknesses: extractBulletPoints(weaknessesMatch?.[1]),
    recommendations: extractBulletPoints(recommendationsMatch?.[1]),
    summaryText: summaryText || "Overall, you did well in the interview, but there's room for improvement."
  };
};

// Save the analysis to the database
const saveAnalysisToDatabase = async (sessionId: string, analysis: InterviewAnalysis) => {
  try {
    // Convert the analysis to JSON for storage
    const jsonAnalysis = JSON.stringify(analysis);
    
    // Check if an analysis already exists for this session
    const { data, error } = await supabase
      .from('interview_analysis')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle();
    
    if (error) {
      throw error;
    }
    
    if (data) {
      // Update existing analysis
      await supabase
        .from('interview_analysis')
        .update({ summary: jsonAnalysis })
        .eq('session_id', sessionId);
    } else {
      // Create new analysis
      await supabase
        .from('interview_analysis')
        .insert({
          session_id: sessionId,
          summary: jsonAnalysis
        });
    }
  } catch (error) {
    console.error("Error saving analysis to database:", error);
    throw error;
  }
};

// Create a basic analysis when we can't generate a proper one
const createBasicAnalysis = (reason: string): InterviewAnalysis => {
  return {
    metrics: {
      clarity: 5,
      conciseness: 5,
      depth: 5,
      fluency: 5,
      confidence: 5,
      overall: 5
    },
    strengths: ["Unable to provide detailed strengths analysis"],
    weaknesses: ["Unable to provide detailed weaknesses analysis"],
    recommendations: [
      "Practice more with mock interviews",
      "Study the core concepts in your technical field",
      "Work on communicating your ideas clearly and concisely"
    ],
    summaryText: reason
  };
};
