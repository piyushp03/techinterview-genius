
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
    
    // In a production environment, this would call OpenAI API with the API_KEY
    // For now, use the API key for actual calls

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an AI interviewer conducting a ${role} interview focused on ${category}. 
            Generate a challenging interview question that is appropriate for this interview topic.
            The question should be specific, technical if appropriate, and test the candidate's knowledge.
            Keep your response concise and only include the question itself without any additional text.`
          },
          {
            role: 'user',
            content: `Please generate a ${category} interview question for a ${role} position. 
            ${previousQuestions.length > 0 ? `Here are the questions already asked, please don't repeat them: ${previousQuestions.join("; ")}` : ""}
            ${resumeText ? `Here's the candidate's resume to help tailor the question: ${resumeText.substring(0, 1000)}...` : ""}`
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      })
    });

    const data = await response.json();
    if (data.error) {
      console.error("Error from OpenAI API:", data.error);
      return fallbackQuestionGenerator(category);
    }
    
    return data.choices[0].message.content.trim();
    
  } catch (error) {
    console.error("Error generating interview question:", error);
    return fallbackQuestionGenerator(category);
  }
};

// Fallback question generator in case the API call fails
const fallbackQuestionGenerator = (category: string): string => {
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
  
  // Default to behavioral questions if category not found
  const questionsPool = questionsByCategory[category] || questionsByCategory['behavioral'];
  const randomIndex = Math.floor(Math.random() * questionsPool.length);
  return questionsPool[randomIndex];
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
    // Try to use the API key to evaluate the answer

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert ${role} interviewer evaluating a candidate's answer to a ${category} question. 
            Provide brief, constructive feedback on the answer.`
          },
          {
            role: 'user',
            content: `Question: ${question}\n\nCandidate's Answer: ${answer}`
          }
        ],
        temperature: 0.7,
        max_tokens: 150
      })
    });

    const data = await response.json();
    if (data.error) {
      console.error("Error from OpenAI API:", data.error);
      return fallbackEvaluationGenerator();
    }
    
    return data.choices[0].message.content.trim();
    
  } catch (error) {
    console.error("Error evaluating answer:", error);
    return fallbackEvaluationGenerator();
  }
};

// Fallback evaluation generator
const fallbackEvaluationGenerator = (): string => {
  const feedbacks = [
    "That's a solid response! I particularly liked how you explained your thought process.",
    "Good answer. You might consider providing a more concrete example to strengthen your point.",
    "You've covered the basics well. To make your answer stronger, try to quantify your achievements or impact.",
    "That's a comprehensive answer. I appreciate the detail you provided about your approach.",
    "Interesting perspective. Can you elaborate a bit more on how you handled the challenges you mentioned?"
  ];
  
  const randomIndex = Math.floor(Math.random() * feedbacks.length);
  return feedbacks[randomIndex];
};

/**
 * Gets a chat completion from OpenAI
 */
export const getChatCompletion = async (messages: any[]): Promise<string> => {
  try {
    console.log(`Getting chat completion for ${messages.length} messages`);
    
    // Try to use the API key to get a chat completion
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        temperature: 0.7,
        max_tokens: 150
      })
    });

    const data = await response.json();
    if (data.error) {
      console.error("Error from OpenAI API:", data.error);
      return fallbackChatResponse(messages);
    }
    
    return data.choices[0].message.content.trim();
    
  } catch (error) {
    console.error('Error in chat completion:', error);
    return fallbackChatResponse(messages);
  }
};

// Fallback chat response generator
const fallbackChatResponse = (messages: any[]): string => {
  const userMessage = messages[messages.length - 1]?.content || "";
  
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
  
  const defaultResponses = [
    "That's interesting. Could you elaborate more on your approach?",
    "Thank you for that explanation. What would you consider your biggest strength in this area?",
    "I see. How would you apply this knowledge in our specific context?",
    "Great insights. How do you typically handle situations where requirements change unexpectedly?",
    "Could you walk me through your thought process when tackling a completely new problem?"
  ];
  
  const randomIndex = Math.floor(Math.random() * defaultResponses.length);
  return defaultResponses[randomIndex];
};

/**
 * Analyzes a resume and provides feedback
 */
export const analyzeResume = async (resumeText: string): Promise<ResumeAnalysisResult> => {
  try {
    console.log("Analyzing resume of length:", resumeText.length);
    
    // Try to use the API key to analyze the resume
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert resume analyzer. Analyze the provided resume and provide detailed feedback.
            Format your response as a JSON object with the following structure:
            {
              "analysisText": "string",
              "strengths": ["string"],
              "weaknesses": ["string"],
              "suggestions": ["string"],
              "jobFit": "string" (high, medium, or low),
              "score": number (0-100),
              "matchPercentage": number (0-100),
              "keySkills": ["string"],
              "missingSkills": ["string"],
              "keywords": ["string"],
              "summary": "string"
            }`
          },
          {
            role: 'user',
            content: `Analyze this resume:\n\n${resumeText}`
          }
        ],
        temperature: 0.5,
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();
    if (data.error) {
      console.error("Error from OpenAI API:", data.error);
      return fallbackResumeAnalysis();
    }
    
    const result = JSON.parse(data.choices[0].message.content);
    return result;
    
  } catch (error) {
    console.error("Error analyzing resume:", error);
    return fallbackResumeAnalysis();
  }
};

// Fallback resume analysis
const fallbackResumeAnalysis = (): ResumeAnalysisResult => {
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
    keywords: ["React", "JavaScript", "TypeScript", "Node.js", "Agile", "AWS", "Docker", "GraphQL"],
    summary: "Your resume shows good technical skills but could be improved with more quantifiable achievements and specific examples of your impact."
  };
};
