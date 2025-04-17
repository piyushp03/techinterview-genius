
import { toast } from 'sonner';
import { getChatCompletion } from './openaiService';

/**
 * Analyze an answer to an interview question
 */
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
    Only consider responses that are relevant to the question asked and ignore any irrelevant content.
    Provide detailed, constructive feedback.
    Format your response as JSON with these fields:
    - feedback: detailed paragraph with assessment
    - score: number between 0-100
    - strengths: array of 2-3 strengths
    - weaknesses: array of 2-3 areas for improvement`;

    const userPrompt = `Question: ${question}\n\nAnswer: ${answer}\n\nProvide a JSON analysis.`;

    const response = await getChatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]);

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
    toast.error('Failed to analyze answer');
    
    // Return a fallback response
    return {
      feedback: "We couldn't analyze your answer at this time.",
      score: 0,
      strengths: [],
      weaknesses: ["Unable to analyze"]
    };
  }
};

/**
 * Generate suggestions for improvement based on interview performance
 */
export const generateImprovementSuggestions = async (
  role: string,
  language: string,
  weaknesses: string[]
): Promise<{
  improvementAreas: string[];
  recommendedResources: { title: string; url: string }[];
}> => {
  try {
    const systemPrompt = `You are an expert technical mentor for ${role} roles using ${language}.
    Based on the identified weaknesses, provide specific suggestions for improvement
    and recommend high-quality learning resources.
    Format your response as JSON with these fields:
    - improvementAreas: array of 3-5 specific actionable improvement suggestions
    - recommendedResources: array of objects with {title, url} for learning resources (5-7 items)
    Only include legitimate, accessible resources with accurate URLs.`;

    const userPrompt = `Weaknesses identified in interview: ${weaknesses.join(', ')}
    
    Provide improvement suggestions and learning resources for a ${role} role using ${language}.`;

    const response = await getChatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]);

    // Try to parse the response as JSON
    try {
      return JSON.parse(response);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      // Fallback to a default structure
      return {
        improvementAreas: ["Practice coding more regularly", "Study core concepts"],
        recommendedResources: [
          { 
            title: "Free Programming Books", 
            url: "https://github.com/EbookFoundation/free-programming-books" 
          }
        ]
      };
    }
  } catch (error) {
    console.error('Error generating improvement suggestions:', error);
    toast.error('Failed to generate improvement suggestions');
    
    // Return a fallback response
    return {
      improvementAreas: ["Practice more", "Review core concepts"],
      recommendedResources: [
        { 
          title: "Free Programming Books", 
          url: "https://github.com/EbookFoundation/free-programming-books" 
        }
      ]
    };
  }
};
