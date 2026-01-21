/**
 * Assessment data formatting utilities
 * Handles conversion of assessment data for display
 */

import { BASE_QUESTIONS } from '../pages/selfAssessmentQuestions';

/**
 * Convert assessment data to displayable format
 * @param {Object} assessmentData - Assessment answers object
 * @returns {Array} - Array of formatted answer cards
 */
export function formatAssessmentAnswers(assessmentData) {
  if (!assessmentData || Object.keys(assessmentData).length === 0) {
    return [];
  }
  
  return Object.entries(assessmentData).map(([key, value]) => {
    const questionId = parseInt(key);
    const questionData = BASE_QUESTIONS[questionId];
    
    return {
      question: questionData?.text || `Question ${key}`,
      answer: value,
      questionId
    };
  });
}
