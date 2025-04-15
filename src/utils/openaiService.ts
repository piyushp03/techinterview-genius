
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
  previousQuestions: string[] = [],
  resumeText?: string | null,
  customTopics?: string[] | null
): Promise<string> => {
  console.log(`Generating interview question for ${role} in ${category} category`);
  
  try {
    // In a real implementation, this would call the OpenAI API
    // For demo purposes, we'll return a hard-coded response
    const questions = {
      frontend: [
        "Can you explain the difference between controlled and uncontrolled components in React?",
        "How do you optimize performance in a React application?",
        "Explain how CSS Grid and Flexbox differ and when you would use each.",
        "What are React hooks and how have they changed React development?",
        "Describe your approach to making websites responsive and accessible."
      ],
      backend: [
        "Describe how you would design a REST API for a social media application.",
        "How would you handle database migrations in a production environment?",
        "Explain the concept of middleware in server applications.",
        "What techniques would you use to optimize database query performance?",
        "How would you implement authentication and authorization in a web API?"
      ],
      fullstack: [
        "How do you manage state between frontend and backend systems?",
        "Describe your approach to designing and implementing a full-stack application.",
        "How would you handle error reporting across a full-stack application?",
        "What strategies would you use to ensure consistent data validation between frontend and backend?",
        "How would you architect a real-time notification system?"
      ],
      behavioral: [
        "Tell me about a challenging project you worked on and how you approached it.",
        "Describe a situation where you had to work under pressure to meet a deadline.",
        "How do you handle conflicting priorities or disagreements on a team?",
        "Tell me about a time you received difficult feedback and how you responded to it.",
        "How do you stay updated with the latest technologies and industry trends?"
      ],
      algorithms: [
        "How would you implement a function to check if a string is a palindrome?",
        "Can you explain how you would solve the two-sum problem?",
        "Describe an algorithm to find the first non-repeating character in a string.",
        "How would you implement a basic caching mechanism for expensive operations?",
        "Explain how you would approach solving a dynamic programming problem."
      ],
      "system-design": [
        "How would you design a URL shortening service like bit.ly?",
        "Design a simple version of a distributed file storage system.",
        "How would you architect a notification service that needs to send millions of notifications per day?",
        "Design a basic e-commerce checkout system.",
        "How would you design a real-time chat application?"
      ]
    };
    
    // Select questions based on category
    const categoryQuestions = questions[category as keyof typeof questions] || questions.frontend;
    
    // Filter out previously asked questions
    const availableQuestions = categoryQuestions.filter(q => !previousQuestions.includes(q));
    
    // If we have custom topics, prioritize them (in a real implementation)
    if (customTopics && customTopics.length > 0) {
      console.log("Using custom topics:", customTopics);
    }
    
    // If we have resume text, personalize the question (in a real implementation)
    if (resumeText) {
      console.log("Using resume text for personalization");
    }
    
    // Return a random question, or a default if all have been asked
    if (availableQuestions.length > 0) {
      return availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
    } else {
      return "Based on your experience, what do you consider the most challenging aspect of software development and how do you address it?";
    }
  } catch (error) {
    console.error("Error generating interview question:", error);
    return "Tell me about a challenging technical problem you've solved recently.";
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
    // In a real implementation, this would call the OpenAI API
    // For demo purposes, we'll return a hard-coded response
    return "Your answer demonstrates good understanding of the concepts. Consider providing more specific examples in future responses to highlight your practical experience with these technologies.";
  } catch (error) {
    console.error("Error evaluating answer:", error);
    return "Thank you for your response. Let's move on to the next question.";
  }
};

/**
 * Gets a chat completion from OpenAI
 */
export const getChatCompletion = async (
  messages: Array<{ role: string; content: string }>,
  model: string = "gpt-4o-mini"
): Promise<string> => {
  try {
    // In a real implementation, this would call the OpenAI API
    // For demo purposes, we'll return a hard-coded response
    console.log("Getting chat completion with messages:", messages);
    return "This is a simulated response from the AI. In a real implementation, this would be generated by the OpenAI API based on your messages.";
  } catch (error) {
    console.error("Error getting chat completion:", error);
    return "I apologize, but I encountered an error. Please try again.";
  }
};

/**
 * Analyzes a resume and provides feedback
 */
export const analyzeResume = async (resumeText: string): Promise<ResumeAnalysisResult> => {
  try {
    // In a real implementation, this would call the OpenAI API
    // For demo purposes, we'll return a hard-coded response
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
