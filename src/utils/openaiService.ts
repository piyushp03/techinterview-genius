
// This file contains utility functions for interacting with OpenAI API
import { toast } from 'sonner';

// Hardcoded API key for demo purposes (in a real application, use environment variables)
const OPENAI_API_KEY = "demo_key_for_lovable_ai";

/**
 * This function generates an interview question based on the specified parameters
 */
export const generateInterviewQuestion = async (
  role: string,
  category: string,
  previousQuestions: string[] = [],
  resumeData?: any,
  customTopics?: string[]
): Promise<string> => {
  try {
    console.log("Generating question for:", { role, category });
    
    // In a real application, this would make an API call to OpenAI
    // For demo purposes, we'll generate a hardcoded response based on the parameters
    
    // Simulate API request delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate a hardcoded question based on the role and category
    const question = getHardcodedQuestion(role, category, previousQuestions, customTopics);
    
    return question;
  } catch (error) {
    console.error("Error generating interview question:", error);
    
    // Fallback question in case of an error
    return "Tell me about a challenging project you worked on recently and how you overcame the obstacles you faced.";
  }
};

/**
 * This function evaluates an interview answer and provides feedback
 */
export const evaluateAnswer = async (
  answer: string,
  question: string,
  role: string,
  category: string
): Promise<{ feedback: string; score: number }> => {
  try {
    console.log("Evaluating answer for:", { role, category });
    
    // In a real application, this would make an API call to OpenAI
    // For demo purposes, we'll generate a hardcoded response
    
    // Simulate API request delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Basic sentiment analysis based on answer length and keywords
    const score = Math.min(Math.max(Math.floor(answer.length / 20), 1), 10);
    
    // Generate feedback based on the score
    let feedback = "";
    if (score >= 8) {
      feedback = "Excellent answer! You demonstrated strong knowledge and articulated your points clearly.";
    } else if (score >= 5) {
      feedback = "Good answer. You covered the main points, but could expand on certain aspects.";
    } else {
      feedback = "Your answer could be more comprehensive. Consider addressing more aspects of the question.";
    }
    
    return { feedback, score };
  } catch (error) {
    console.error("Error evaluating answer:", error);
    return {
      feedback: "We couldn't evaluate your answer due to a technical issue. Please try again.",
      score: 0
    };
  }
};

/**
 * This function generates a mock analysis of an interview session
 */
export const generateInterviewAnalysis = async (
  messages: any[],
  sessionInfo: any
): Promise<any> => {
  try {
    console.log("Generating interview analysis for session:", sessionInfo.id);
    
    // Simulate API request delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Count user messages
    const userMessages = messages.filter(msg => !msg.is_bot);
    
    // Can't analyze if no user messages
    if (userMessages.length === 0) {
      return null;
    }
    
    // Simple scoring based on message length and number of messages
    const participationScore = Math.min(userMessages.length / 5, 1) * 100;
    const avgLength = userMessages.reduce((sum, msg) => sum + msg.content.length, 0) / userMessages.length;
    const detailScore = Math.min(avgLength / 100, 1) * 100;
    
    // Overall score is an average
    const overallScore = Math.floor((participationScore + detailScore) / 2);
    
    // Different analysis based on the interview type
    let strengths, areasForImprovement, resources;
    
    if (sessionInfo.category === 'algorithms') {
      strengths = [
        'Good problem-solving approach',
        'Structured thinking when tackling algorithm questions',
        'Able to explain the time and space complexity'
      ];
      
      areasForImprovement = [
        'Consider edge cases more thoroughly',
        'Practice optimizing solutions further',
        'Work on explaining your thought process more clearly'
      ];
      
      resources = [
        'LeetCode - Data Structures and Algorithms',
        'Cracking the Coding Interview by Gayle Laakmann McDowell',
        'AlgoExpert.io for interactive algorithm practice'
      ];
    } else if (sessionInfo.category === 'system-design') {
      strengths = [
        'Good understanding of scalability concepts',
        'Ability to break down complex problems',
        'Consideration of non-functional requirements'
      ];
      
      areasForImprovement = [
        'Dive deeper into database design considerations',
        'Consider trade-offs between different architectural approaches',
        'Expand knowledge of caching strategies'
      ];
      
      resources = [
        'System Design Interview by Alex Xu',
        'Designing Data-Intensive Applications by Martin Kleppmann',
        'High Scalability blog for real-world architecture examples'
      ];
    } else {
      // Default for other categories
      strengths = [
        'Good technical knowledge in relevant areas',
        'Clear communication skills',
        'Structured approach to problem-solving'
      ];
      
      areasForImprovement = [
        'Deepen knowledge in specific technical areas',
        'Practice explaining complex concepts more simply',
        'Consider different approaches to problems'
      ];
      
      resources = [
        'Resources specific to ' + sessionInfo.language,
        'Practice platforms like Exercism or HackerRank',
        'Join communities related to ' + sessionInfo.role_type
      ];
    }
    
    // Detailed feedback for the user
    const detailedFeedback = `You demonstrated ${strengths[0].toLowerCase()} during this interview session. 
    Your responses showed that you have a good grasp of ${sessionInfo.category} concepts relevant to ${sessionInfo.role_type} roles.
    
    For your ${sessionInfo.language} knowledge, you could benefit from more practice with real-world scenarios. 
    You should focus on ${areasForImprovement[0].toLowerCase()} as this will significantly improve your performance in future interviews.
    
    Continue building on your strengths, particularly your ability to ${strengths[1].toLowerCase()}.`;
    
    return {
      overall_score: overallScore,
      strengths: strengths,
      areas_for_improvement: areasForImprovement,
      recommended_resources: resources,
      detailed_feedback: detailedFeedback,
      technical_accuracy: Math.floor(60 + Math.random() * 30),
      communication_clarity: Math.floor(70 + Math.random() * 20),
      problem_solving: Math.floor(65 + Math.random() * 25),
      key_insights: [
        'Good foundation in core concepts',
        'Room for improvement in advanced topics',
        'Would benefit from more practical experience'
      ]
    };
  } catch (error) {
    console.error("Error generating interview analysis:", error);
    return null;
  }
};

/**
 * Generate hardcoded questions based on role and category
 */
const getHardcodedQuestion = (
  role: string,
  category: string,
  previousQuestions: string[] = [],
  customTopics?: string[]
): string => {
  // Define question banks by role and category
  const questionBanks: Record<string, Record<string, string[]>> = {
    frontend: {
      algorithms: [
        "Can you explain how you would implement a debounce function for a search input?",
        "How would you optimize a recursive function that calculates Fibonacci numbers?",
        "Explain how you would implement a virtual scrolling component for displaying large lists efficiently.",
        "How would you implement a throttle function for window resize events?",
        "Can you explain the difference between memoization and dynamic programming with examples?"
      ],
      "system-design": [
        "How would you design a real-time chat application that can handle millions of users?",
        "Describe your approach to designing a client-side state management system for a complex application.",
        "How would you architect a design system for a company with multiple frontend teams?",
        "Explain how you would design a high-performance image carousel component.",
        "How would you design a data-fetching strategy for a complex dashboard with many widgets?"
      ],
      behavioral: [
        "Tell me about a difficult bug you discovered and fixed in a frontend application.",
        "Describe a situation where you had to convince your team to adopt a new frontend technology.",
        "How do you balance quality with tight deadlines in frontend development?",
        "Share an experience where you helped improve the performance of a frontend application.",
        "Tell me about a time when you received critical feedback on your code. How did you respond?"
      ],
      "language-specific": [
        "How do React hooks work under the hood?",
        "Explain the difference between controlled and uncontrolled components in React.",
        "What are the benefits of using TypeScript in a frontend project?",
        "How would you handle side effects in a Redux application?",
        "Explain how CSS-in-JS solutions work and their advantages/disadvantages."
      ]
    },
    backend: {
      algorithms: [
        "How would you design an LRU cache with O(1) time complexity for both get and put operations?",
        "Explain how you would implement a rate-limiting middleware for an API.",
        "How would you design a system that detects cycles in a directed graph?",
        "Explain how you would implement database connection pooling.",
        "How would you efficiently handle pagination for large datasets?"
      ],
      "system-design": [
        "How would you design a URL shortening service like bit.ly?",
        "Design a distributed file storage system like Google Drive.",
        "How would you implement a notification service that can handle millions of users?",
        "Design a system for processing payments that's resilient to failures.",
        "How would you design a recommendation system for an e-commerce platform?"
      ],
      behavioral: [
        "Tell me about a complex backend problem you solved recently.",
        "Describe a situation where you had to make trade-offs between performance and reliability.",
        "How do you handle technical debt in backend systems?",
        "Tell me about a time when you improved the scalability of a backend service.",
        "Describe a situation where you had to diagnose and fix a production outage."
      ],
      "language-specific": [
        "What are the benefits of using async/await patterns in Node.js?",
        "How does garbage collection work in your preferred backend language?",
        "Explain how you would handle database migrations in a production environment.",
        "What strategies would you use to optimize database queries?",
        "How do you handle error management and logging in backend applications?"
      ]
    },
    fullstack: {
      algorithms: [
        "How would you implement a full-text search for a database with millions of records?",
        "Explain how you would design an efficient algorithm for matching users based on preferences.",
        "How would you approach implementing a collaborative editing feature like Google Docs?",
        "Explain the algorithm you would use to implement a recommendation system.",
        "How would you design a system to detect and prevent duplicate form submissions?"
      ],
      "system-design": [
        "Design a real-time multiplayer game system.",
        "How would you design an e-commerce platform from scratch?",
        "Design a scalable architecture for a social media application.",
        "How would you implement a system for handling video uploads and transcoding?",
        "Design a microservices architecture for a food delivery application."
      ],
      behavioral: [
        "Tell me about a project where you had to work on both frontend and backend components.",
        "How do you manage your time when working on full-stack features?",
        "Describe a situation where you had to optimize both client and server performance.",
        "Tell me about a time you had to refactor a large codebase that spanned frontend and backend.",
        "How do you approach learning new technologies as a full-stack developer?"
      ],
      "language-specific": [
        "How would you share code between frontend and backend in a TypeScript project?",
        "Explain your approach to handling authentication and authorization in full-stack applications.",
        "How do you manage database schema changes that affect both backend and frontend?",
        "What are the advantages and disadvantages of using the same language on both client and server?",
        "How would you implement real-time features in your preferred technology stack?"
      ]
    },
    devops: {
      algorithms: [
        "How would you design an algorithm to detect anomalies in server metrics?",
        "Explain how you would implement a load balancing algorithm for a microservices architecture.",
        "How would you approach auto-scaling resources based on traffic patterns?",
        "Design an algorithm for efficiently deploying updates to a large cluster of servers.",
        "How would you implement a rollback mechanism for failed deployments?"
      ],
      "system-design": [
        "Design a CI/CD pipeline for a microservices architecture.",
        "How would you design a monitoring and alerting system for a large-scale application?",
        "Design a disaster recovery strategy for a mission-critical system.",
        "How would you design a zero-downtime deployment process?",
        "Design a secure infrastructure for handling sensitive user data."
      ],
      behavioral: [
        "Tell me about a time you diagnosed and fixed a critical production issue.",
        "Describe a situation where you improved the reliability of a deployment process.",
        "How do you balance security with developer productivity?",
        "Tell me about a time you had to convince developers to adopt a new DevOps practice.",
        "Describe a situation where you had to handle a major outage or service disruption."
      ],
      "language-specific": [
        "How would you use Terraform to manage infrastructure as code?",
        "Explain how you would set up a Kubernetes cluster for a production application.",
        "How would you use Docker to improve the local development experience?",
        "Explain how you would implement secrets management in a CI/CD pipeline.",
        "How would you use Prometheus and Grafana for monitoring infrastructure?"
      ]
    }
  };
  
  // Ensure role exists in our question bank, otherwise default to frontend
  const roleQuestions = questionBanks[role.toLowerCase()] || questionBanks.frontend;
  
  // Ensure category exists, otherwise default to behavioral
  const categoryQuestions = roleQuestions[category.toLowerCase()] || roleQuestions.behavioral;
  
  // Filter out questions that have been asked before
  const availableQuestions = categoryQuestions.filter(q => 
    !previousQuestions.some(pq => pq.includes(q))
  );
  
  // If all questions have been asked, return a default question
  if (availableQuestions.length === 0) {
    return "Based on your experience, what would you say are the most important skills for this role, and how have you demonstrated them in your previous work?";
  }
  
  // Select a random question from the available ones
  const randomIndex = Math.floor(Math.random() * availableQuestions.length);
  return availableQuestions[randomIndex];
};
