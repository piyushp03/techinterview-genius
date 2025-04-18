
/**
 * Analyzes a user's answer to an interview question and provides feedback
 */

export interface AnalysisMetrics {
  clarity: number;
  conciseness: number;
  depth: number;
  fluency: number;
  confidence: number;
  overall: number;
}

export interface InterviewAnalysis {
  metrics: AnalysisMetrics;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  summaryText: string;
}

export const analyzeAnswer = async (
  question: string,
  answer: string,
  role: string,
  technology: string
): Promise<{ feedback: string; score?: number; insights?: string[] }> => {
  try {
    if (!answer || answer.trim().length < 10) {
      return { 
        feedback: "Your answer is too brief. Could you elaborate more on your experience and knowledge?",
        score: 2,
        insights: ["Answer too short", "Lacks detail"]
      };
    }
    
    const containsTechnology = answer.toLowerCase().includes(technology.toLowerCase());
    
    let feedback = '';
    let score = 0;
    let insights = [];
    
    if (containsTechnology) {
      feedback = `That's a good starting point! I like that you mentioned ${technology}. Can you elaborate on a specific project where you've used these skills?`;
      score = 7;
      insights = ["Good technology mention", "Could provide more specific examples"];
    } else {
      feedback = `Thank you for your answer. It would be helpful if you could specifically mention your experience with ${technology} as it's crucial for this ${role} position. Could you share an example of a project where you've used ${technology}?`;
      score = 5;
      insights = ["Missing technology specifics", "Answer is too general"];
    }
    
    return { feedback, score, insights };
  } catch (error) {
    console.error("Error analyzing answer:", error);
    return {
      feedback: "I'm having trouble analyzing your answer. Could you rephrase it or provide more details?",
      score: 3,
      insights: ["Error in analysis", "Need clarification"]
    };
  }
};

// This implementation generates analysis for the interview
export const generateInterviewAnalysis = async (sessionId: string): Promise<InterviewAnalysis> => {
  try {
    // In a real implementation, we would fetch the interview questions and answers
    // from the database using the sessionId and analyze them
    
    // For now, return a mock analysis
    return {
      metrics: {
        clarity: 7,
        conciseness: 6,
        depth: 8,
        fluency: 7,
        confidence: 6,
        overall: 7
      },
      strengths: [
        "Demonstrated good technical knowledge",
        "Clear communication of complex concepts",
        "Provided specific examples from past experience"
      ],
      weaknesses: [
        "Could improve on conciseness in some answers",
        "Missed some opportunities to highlight leadership skills",
        "Technical explanations sometimes overly complex"
      ],
      recommendations: [
        "Practice more concise answers to common questions",
        "Prepare specific examples that demonstrate leadership and teamwork",
        "Study up on the latest trends in the specific technology mentioned"
      ],
      summaryText: "Overall, the interview showed strong technical aptitude and good communication skills. With some refinement in delivery and more strategic highlighting of strengths, future interviews could be even more effective."
    };
  } catch (error) {
    console.error("Error generating interview analysis:", error);
    // Return a basic analysis even if there's an error
    return {
      metrics: {
        clarity: 5,
        conciseness: 5,
        depth: 5,
        fluency: 5,
        confidence: 5,
        overall: 5
      },
      strengths: ["Analysis unavailable due to technical issues"],
      weaknesses: ["Analysis unavailable due to technical issues"],
      recommendations: ["Try again later for a detailed analysis"],
      summaryText: "We encountered an issue while analyzing your interview. Please try again later."
    };
  }
};
