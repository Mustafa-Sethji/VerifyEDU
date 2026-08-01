const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001';

/**
 * Upload PDF to AI Microservice for text extraction, chunking, and FAISS embedding.
 * @param {string} filePath Absolute or relative path to PDF file
 * @param {string} originalName File name
 */
const processPdf = async (filePath, originalName) => {
  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath), originalName);

    const response = await axios.post(`${AI_SERVICE_URL}/process-pdf`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 120000, // 2 mins max for heavy PDFs
    });

    return response.data; // { document_id, summary, keywords, chunks, num_chunks, embedding_dim }
  } catch (error) {
    console.error('AI Service processPdf Error:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.detail || 'Failed to process PDF through AI service. Ensure AI microservice is running on port 8001.'
    );
  }
};

/**
 * Request AI Microservice to generate quiz JSON.
 * @param {string} aiDocumentId Document ID returned by /process-pdf
 * @param {number} numMcq Count of MCQ questions
 * @param {number} numDescriptive Count of Descriptive questions
 */
const generateQuiz = async (aiDocumentId, numMcq = 5, numDescriptive = 2) => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/generate-quiz`, {
      document_id: aiDocumentId,
      num_mcq: numMcq,
      num_descriptive: numDescriptive,
    }, {
      timeout: 180000, // LLM generation might take up to 3 mins
    });

    return response.data; // { mcq: [...], descriptive: [...] }
  } catch (error) {
    console.error('AI Service generateQuiz Error:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.detail || 'Failed to generate quiz from AI service. Check Ollama model status.'
    );
  }
};

/**
 * Request AI Microservice answer evaluation using semantic similarity & keyword/concept matching.
 * @param {string} aiDocumentId Document ID
 * @param {string} question Question text
 * @param {string} studentAnswer Student's submitted text answer
 * @param {string} referenceAnswer Expected answer
 */
const evaluateAnswer = async (aiDocumentId, question, studentAnswer, referenceAnswer) => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/evaluate-answer`, {
      document_id: aiDocumentId,
      question,
      student_answer: studentAnswer,
      reference_answer: referenceAnswer,
    }, {
      timeout: 30000,
    });

    return response.data; // { similarity, keyword_score, concept_score, understanding_score, feedback }
  } catch (error) {
    console.error('AI Service evaluateAnswer Error:', error.response?.data || error.message);
    // Return fallback evaluation if service has an issue
    return {
      similarity: 50.0,
      keyword_score: 50.0,
      concept_score: 50.0,
      understanding_score: 50.0,
      feedback: 'Evaluation completed with fallback score (AI service response unavailable).',
    };
  }
};

/**
 * Check health status of AI Microservice.
 */
const checkHealth = async () => {
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/health`, { timeout: 5000 });
    return response.data;
  } catch (error) {
    return { status: 'down', error: error.message };
  }
};

module.exports = {
  processPdf,
  generateQuiz,
  evaluateAnswer,
  checkHealth,
};
