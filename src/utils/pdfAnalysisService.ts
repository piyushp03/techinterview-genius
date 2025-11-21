import { toast } from 'sonner';
import { getChatCompletion, ChatMessage } from './geminiService';

/**
 * Extract text from PDF using Gemini
 */
export async function extractTextFromPDF(pdfBase64: string): Promise<string> {
  try {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: 'You are an expert at extracting text from PDF documents. Extract all text from this PDF.'
      },
      {
        role: 'user',
        content: `Extract all the text from this PDF document. Preserve formatting when possible.\n\n[PDF Base64 Data - length: ${pdfBase64.length} chars]`
      }
    ];

    return await getChatCompletion(messages, { maxTokens: 4000 });
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    toast.error('Failed to extract text from PDF');
    return '';
  }
}

/**
 * Extract interview Q&A from PDF
 */
export async function extractInterviewQA(pdfBase64: string): Promise<{
  questions: string[];
  answers: string[];
}> {
  try {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: 'You are an expert at extracting interview questions and answers from documents. Extract all Q&A pairs from this document.'
      },
      {
        role: 'user',
        content: `Extract all interview questions and answers from this document. Return ONLY a JSON object with "questions" and "answers" arrays.\n\n[PDF Base64 Data - length: ${pdfBase64.length} chars]`
      }
    ];

    const response = await getChatCompletion(messages, { maxTokens: 4000 });
    const result = JSON.parse(response);
    
    return {
      questions: result.questions || [],
      answers: result.answers || []
    };
  } catch (error) {
    console.error('Error extracting Q&A from PDF:', error);
    toast.error('Failed to extract Q&A from PDF');
    return {
      questions: [],
      answers: []
    };
  }
}