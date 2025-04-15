// Types
export interface InterviewQuestion {
  question: string;
  role: string;
  category: string;
  language?: string;
  difficulty?: string;
}

export interface ResumeAnalysisResult {
  analysisText: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  jobFit: string;
  score: number;
  matchPercentage: number;
  keySkills: string[];
  missingSkills: string[];
  keywords: string[];
  summary: string;
}

// Hardcoded API key for demonstration (in a real app, this would be stored securely)
const API_KEY = "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";

/**
 * Generates an interview question based on role, category, and previous questions.
 */
export const generateInterviewQuestion = async (
  role: string,
  category: string,
  previousQuestions: string[],
  resumeText?: string
): Promise<string> => {
  try {
    console.log(`Generating interview question for ${role} role in ${category} category`);
    
    // In a production environment, this would call OpenAI API
    // For now, we'll use mock data
    
    const questionsByCategory: Record<string, string[]> = {
      'algorithms': [
        "Can you explain how you would implement a quicksort algorithm and analyze its time complexity?",
        "How would you design an algorithm to find the kth largest element in an unsorted array?",
        "Explain how you would approach solving a dynamic programming problem like the knapsack problem.",
        "How would you implement a breadth-first search algorithm for a graph? What's its time complexity?",
        "Describe how you would detect a cycle in a linked list using O(1) space complexity."
      ],
      'system-design': [
        "How would you design a URL shortening service like bit.ly?",
        "Design a distributed cache system with high availability and consistency requirements.",
        "How would you architect a real-time notification system that can scale to millions of users?",
        "Design a system for a ride-sharing application like Uber or Lyft.",
        "How would you design a service that stores and processes large amounts of user-generated images?"
      ],
      'behavioral': [
        "Tell me about a challenging project you worked on and how you overcame obstacles.",
        "Describe a situation where you had a conflict with a team member and how you resolved it.",
        "How do you prioritize tasks when working on multiple projects with tight deadlines?",
        "Tell me about a time you received critical feedback and how you responded to it.",
        "Describe a situation where you had to make a difficult technical decision with limited information."
      ],
      'language-specific': [
        "What are closures in JavaScript and how would you use them in practical scenarios?",
        "Explain the difference between == and === in JavaScript and when you would use each.",
        "How does React's virtual DOM work and why is it beneficial for performance?",
        "Explain the concept of promises in JavaScript and how they differ from callbacks.",
        "What are React hooks and how have they changed state management in functional components?"
      ]
    };
    
    // Make sure we have questions for this category
    const questionsPool = questionsByCategory[category] || questionsByCategory['behavioral'];
    
    // Filter out questions that have already been asked
    const availableQuestions = questionsPool.filter(q => !previousQuestions.includes(q));
    
    // If we've asked all questions, shuffle and start over
    if (availableQuestions.length === 0) {
      return "Thank you for your responses so far. Let's wrap up this interview. Is there anything you'd like to ask me about the role or company?";
    }
    
    // Pick a random question from available ones
    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    return availableQuestions[randomIndex];
  } catch (error) {
    console.error("Error generating interview question:", error);
    return "Could you tell me about a challenging problem you solved recently and how you approached it?";
  }
};

/**
 * Evaluates a user's answer to an interview question
 */
export const evaluateAnswer = async (
  question: string,
  answer: string,
  role: string,
  category: string
): Promise<string> => {
  try {
    console.log(`Evaluating answer for ${role} role in ${category} category`);
    console.log(`Question: ${question}`);
    console.log(`Answer length: ${answer.length}`);
    
    // In a production environment, this would call OpenAI API
    // For demo, we'll give generic feedback
    
    const feedbacks = [
      "That's a solid response! I particularly liked how you explained your thought process.",
      "Good answer. You might consider providing a more concrete example to strengthen your point.",
      "You've covered the basics well. To make your answer stronger, try to quantify your achievements or impact.",
      "That's a comprehensive answer. I appreciate the detail you provided about your approach.",
      "Interesting perspective. Can you elaborate a bit more on how you handled the challenges you mentioned?"
    ];
    
    const randomIndex = Math.floor(Math.random() * feedbacks.length);
    return feedbacks[randomIndex];
  } catch (error) {
    console.error("Error evaluating answer:", error);
    return "Thank you for your detailed response. Let's move on to the next question.";
  }
};

/**
 * Gets a chat completion from OpenAI
 */
export const getChatCompletion = async (messages: any[]): Promise<string> => {
  try {
    console.log(`Getting chat completion for ${messages.length} messages`);
    
    // In a production environment, this would call OpenAI API
    // For demo, we'll return a placeholder response
    
    const userMessage = messages[messages.length - 1]?.content || "";
    const systemMessage = messages[0]?.content || "";
    
    if (userMessage.toLowerCase().includes("experience")) {
      return "That's great experience! Could you tell me more about specific challenges you faced in those roles and how you overcame them?";
    }
    
    if (userMessage.toLowerCase().includes("challenge") || userMessage.toLowerCase().includes("problem")) {
      return "Thanks for sharing that challenge. Your approach sounds methodical. How did you measure the success of your solution?";
    }
    
    if (userMessage.toLowerCase().includes("team") || userMessage.toLowerCase().includes("collaborate")) {
      return "It sounds like you have good collaboration skills. Can you give a specific example of how you've resolved conflicts within a team?";
    }
    
    if (userMessage.toLowerCase().includes("skill") || userMessage.toLowerCase().includes("technology")) {
      return "You have an impressive skill set. How do you stay updated with the latest developments in your field?";
    }
    
    // Default responses
    const defaultResponses = [
      "That's interesting. Could you elaborate more on your approach?",
      "Thank you for that explanation. What would you consider your biggest strength in this area?",
      "I see. How would you apply this knowledge in our specific context?",
      "Great insights. How do you typically handle situations where requirements change unexpectedly?",
      "Could you walk me through your thought process when tackling a completely new problem?"
    ];
    
    const randomIndex = Math.floor(Math.random() * defaultResponses.length);
    return defaultResponses[randomIndex];
  } catch (error) {
    console.error("Error in chat completion:", error);
    return "I'm interested in learning more about your experience. Could you share a relevant project you've worked on?";
  }
};

/**
 * Analyzes a resume and provides feedback
 */
export const analyzeResume = async (resumeText: string): Promise<ResumeAnalysisResult> => {
  try {
    console.log("Analyzing resume of length:", resumeText.length);
    
    return {
      analysisText: "Your resume demonstrates strong technical skills and project experience. Consider adding more quantifiable achievements and metrics to showcase your impact.",
      strengths: [
        "Strong technical skills in modern web development",
        "Clear project descriptions and responsibilities",
        "Good academic background and relevant certifications"
      ],
      weaknesses: [
        "Limited quantifiable achievements or metrics",
        "Some redundancy in skill descriptions",
        "Could benefit from more specific examples of problem-solving"
      ],
      suggestions: [
        "Add metrics and specific outcomes to showcase your impact",
        "Tailor your skills section more specifically to job requirements",
        "Consider adding a brief professional summary at the beginning"
      ],
      jobFit: "medium",
      score: 78,
      matchPercentage: 78,
      keySkills: ["React", "JavaScript", "TypeScript", "Node.js", "Agile"],
      missingSkills: ["AWS", "Docker", "GraphQL"],
      keywords: ["React", "JavaScript", "TypeScript", "Node.js", "Agile", "AWS", "Docker", "GraphQL"]
    };
  } catch (error) {
    console.error("Error analyzing resume:", error);
    return {
      analysisText: "An error occurred while analyzing your resume. Please try again later.",
      strengths: [],
      weaknesses: [],
      suggestions: ["Please try uploading your resume again"],
      jobFit: "medium",
      score: 0,
      matchPercentage: 0,
      keySkills: [],
      missingSkills: ["Unable to determine missing skills"],
      keywords: [],
      summary: "Error analyzing resume"
    };
  }
};
