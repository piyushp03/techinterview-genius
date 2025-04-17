import { toast } from 'sonner';
import { getChatCompletion } from './openaiService';

// Define needed types
export interface AnalysisMetrics {
  overall: number;
  clarity: number;
  conciseness: number;
  depth: number;
  fluency: number;
  confidence: number;
}

export interface InterviewAnalysis {
  metrics: AnalysisMetrics;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  summaryText: string;
}

/**
 * Analyze an answer to an interview question
 */
export const analyzeAnswer = async (
  question: string,
  answer: string,
  role: string,
  language: string
) => {
  try {
    // Simulate API call with a mock response for now
    // In a real implementation, this would call an AI service
    return {
      score: Math.floor(Math.random() * 30) + 70, // Random score between 70-99
      feedback: `Thank you for your answer about "${question.substring(0, 30)}...". You provided some good insights.`,
      strengths: [
        "Clear communication",
        "Demonstrated technical knowledge",
        "Provided practical examples"
      ],
      weaknesses: [
        "Could elaborate more on implementation details",
        "Consider discussing alternative approaches"
      ]
    };
  } catch (error) {
    console.error('Error analyzing answer:', error);
    throw error;
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

/**
 * Analyze an interview session and provide insights on performance
 */
export const analyzeInterviewSession = async (
  questions: string[],
  answers: string[],
  role: string,
  category: string
): Promise<InterviewAnalysis> => {
  try {
    // Create a combined prompt with all Q&A pairs
    const qaPairs = questions.map((q, i) => 
      `Question: ${q}\nAnswer: ${answers[i] || "No answer provided"}`
    ).join("\n\n---\n\n");
    
    const systemPrompt = `You are an expert technical interviewer for ${role} positions.
    Analyze the following interview Q&A session focused on ${category}.
    Only consider responses that are relevant to the questions asked and ignore any irrelevant content.
    Format your response as JSON with these fields:
    - metrics: object with numerical scores from 0-10 for these aspects:
      - overall: overall interview performance
      - clarity: clarity of communication
      - conciseness: ability to be concise and to the point
      - depth: depth of technical knowledge
      - fluency: fluency in the subject matter
      - confidence: confidence in responses
    - strengths: array of 3-5 specific strengths demonstrated
    - weaknesses: array of 3-5 specific weak areas identified
    - recommendations: array of 3-5 specific actionable recommendations for improvement
    - summaryText: a paragraph summarizing the overall interview performance`;
    
    const userPrompt = `Interview Q&A Session:\n\n${qaPairs}\n\nProvide a detailed JSON analysis.`;
    
    const response = await getChatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]);
    
    try {
      const parsedResponse = JSON.parse(response);
      return {
        metrics: {
          overall: parsedResponse.metrics.overall || 5,
          clarity: parsedResponse.metrics.clarity || 5,
          conciseness: parsedResponse.metrics.conciseness || 5,
          depth: parsedResponse.metrics.depth || 5,
          fluency: parsedResponse.metrics.fluency || 5,
          confidence: parsedResponse.metrics.confidence || 5
        },
        strengths: parsedResponse.strengths || ["Good attempt"],
        weaknesses: parsedResponse.weaknesses || ["Needs improvement"],
        recommendations: parsedResponse.recommendations || ["Practice more", "Study core concepts"],
        summaryText: parsedResponse.summaryText || "Interview analysis completed."
      };
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      // Fallback structure
      return {
        metrics: {
          overall: 5,
          clarity: 5,
          conciseness: 5,
          depth: 5,
          fluency: 5,
          confidence: 5
        },
        strengths: ["Attempted to answer questions"],
        weaknesses: ["Could not analyze specific weaknesses"],
        recommendations: ["Practice more", "Study core concepts"],
        summaryText: "The interview analysis could not be properly structured. Review the raw feedback: " + response.substring(0, 200) + "..."
      };
    }
  } catch (error) {
    console.error('Error analyzing interview session:', error);
    toast.error('Failed to analyze interview');
    
    // Return a fallback response
    return {
      metrics: {
        overall: 5,
        clarity: 5,
        conciseness: 5,
        depth: 5,
        fluency: 5,
        confidence: 5
      },
      strengths: ["Unable to analyze strengths"],
      weaknesses: ["Unable to analyze weaknesses"],
      recommendations: ["Try again later"],
      summaryText: "We couldn't analyze your interview at this time."
    };
  }
};
