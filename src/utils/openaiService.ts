
// Define the interface for resume analysis results
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

export const generateInterviewQuestion = async (
  roleType: string,
  category: string,
  previousQuestions: string[]
): Promise<string> => {
  try {
    console.log("Generating interview question for:", roleType, category);
    
    // Hardcoded API key for demonstration (in a real app, this would be stored securely)
    const API_KEY = "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";
    
    // Try to use the API key to generate a question
    try {
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
              content: `You are an expert technical interviewer for a ${roleType} position. Generate a challenging but fair question related to ${category}. The question should be specific, technical, and designed to evaluate a candidate's knowledge and problem-solving skills.
              
              Previous questions that have been asked (DO NOT repeat these):
              ${previousQuestions.join("\n")}`
            },
            {
              role: 'user',
              content: `Generate a new ${category} interview question for a ${roleType} position. Make it a detailed, technical question that would be appropriate in a real interview.`
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.message || "Error from OpenAI API");
      }
      
      return data.choices[0].message.content;
    } catch (apiError) {
      console.error("API error:", apiError);
      // Fall back to generating a predefined question if the API call fails
      return getFallbackQuestion(roleType, category);
    }
    
  } catch (error) {
    console.error("Error generating question:", error);
    return getFallbackQuestion(roleType, category);
  }
};

export const evaluateAnswer = async (
  question: string,
  answer: string,
  roleType: string,
  category: string
): Promise<string> => {
  try {
    console.log("Evaluating answer for:", roleType, category);
    
    // Hardcoded API key for demonstration (in a real app, this would be stored securely)
    const API_KEY = "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";
    
    // Try to use the API key to evaluate the answer
    try {
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
              content: `You are an expert technical interviewer for a ${roleType} position. Evaluate the candidate's answer to the question and provide constructive feedback. 
              
              Return the evaluation as a JSON object with this structure:
              {
                "feedback": "detailed feedback text",
                "score": a number from 1-10 representing the quality of the answer,
                "strengths": ["strength1", "strength2", ...],
                "areas_for_improvement": ["area1", "area2", ...]
              }`
            },
            {
              role: 'user',
              content: `Question: ${question}\n\nCandidate's Answer: ${answer}\n\nPlease evaluate this answer.`
            }
          ],
          temperature: 0.5,
          response_format: { type: "json_object" }
        })
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.message || "Error from OpenAI API");
      }
      
      return data.choices[0].message.content;
    } catch (apiError) {
      console.error("API error:", apiError);
      // Fall back to a mock evaluation if the API call fails
      return JSON.stringify(getFallbackEvaluation(question, answer));
    }
    
  } catch (error) {
    console.error("Error evaluating answer:", error);
    return JSON.stringify(getFallbackEvaluation(question, answer));
  }
};

// Helper function to get a fallback question if API call fails
function getFallbackQuestion(roleType: string, category: string): string {
  const fallbackQuestions = {
    algorithms: [
      "Explain how you would implement a function to determine if a string is a palindrome. What's the time and space complexity of your solution?",
      "How would you detect a cycle in a linked list?",
      "Describe how you would implement a binary search tree and the basic operations."
    ],
    "system-design": [
      "How would you design a URL shortening service like bit.ly?",
      "Explain how you would architect a real-time chat application.",
      "Design a distributed cache system."
    ],
    behavioral: [
      "Tell me about a time you had to deal with a difficult team member.",
      "Describe a situation where you had to meet a tight deadline.",
      "Give an example of a time you had to make a difficult decision."
    ],
    "language-specific": [
      "Explain the event loop in JavaScript and how asynchronous operations work.",
      "What are some new features in ES6+ that you find most useful?",
      "Describe the differences between var, let, and const in JavaScript."
    ]
  };

  // Default to general questions if category is not found
  const categoryKey = Object.keys(fallbackQuestions).find(key => 
    category.toLowerCase().includes(key.toLowerCase())
  ) || 'behavioral';
  
  const questions = fallbackQuestions[categoryKey as keyof typeof fallbackQuestions];
  return questions[Math.floor(Math.random() * questions.length)];
}

// Helper function to get a fallback evaluation if API call fails
function getFallbackEvaluation(question: string, answer: string) {
  // Determine a fake score based on answer length as a simple heuristic
  const wordCount = answer.split(/\s+/).length;
  const score = Math.min(Math.max(Math.floor(wordCount / 10), 4), 9);
  
  return {
    feedback: "Your answer showed understanding of the core concepts, but could benefit from more specific examples and deeper technical explanation.",
    score: score,
    strengths: [
      "Addressed the main parts of the question",
      "Logical structure to the response"
    ],
    areas_for_improvement: [
      "Could provide more specific technical details",
      "Would benefit from concrete examples",
      "Consider discussing performance implications"
    ]
  };
}

export function getChatCompletion(messages: { role: 'system' | 'user' | 'assistant'; content: string }[]): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      // Hardcoded API key for demonstration (in a real app, this would be stored securely)
      const API_KEY = "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";
      
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
          max_tokens: 800
        })
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.message || "Error from OpenAI API");
      }
      
      resolve(data.choices[0].message.content);
    } catch (error) {
      console.error("Error getting chat completion:", error);
      
      // Return a fallback response
      resolve("I couldn't process that request. Let's continue with our conversation.");
    }
  });
}
