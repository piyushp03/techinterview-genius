/**
 * Analyzes a user's answer to an interview question and provides feedback
 */
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
