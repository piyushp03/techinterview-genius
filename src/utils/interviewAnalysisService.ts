
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
    // In a production environment, this would call an API to analyze the answer
    // For now, we'll generate some basic feedback based on the question and answer
    
    if (!answer || answer.trim().length < 10) {
      return { 
        feedback: "Your answer is too brief. Could you elaborate more on your experience and knowledge?",
        score: 2,
        insights: ["Answer too short", "Lacks detail"]
      };
    }
    
    // Check if the answer contains keywords related to the technology
    const containsTechnology = answer.toLowerCase().includes(technology.toLowerCase());
    
    // Generate appropriate feedback based on the answer content
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
    
    // Add a follow-up question to continue the interview flow
    feedback += `\n\nNext question: How do you handle challenging problems in your development workflow when working with ${technology}?`;
    
    return { feedback, score, insights };
  } catch (error) {
    console.error("Error analyzing answer:", error);
    return {
      feedback: "I'm having trouble analyzing your answer. Let's move on to the next question: Can you tell me about a challenging project you've worked on?",
    };
  }
};
