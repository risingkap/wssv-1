/**
 * Urgency level calculation utilities
 * Determines risk level based on predictions
 */

import { URGENCY_CONFIG } from './resultPageConfig';

/**
 * Calculate urgency level based on prediction confidence and condition type
 * @param {Object} prediction - Prediction with probability and condition
 * @returns {string} - 'high', 'moderate', or 'low'
 */
export function calculateUrgencyLevel(prediction) {
  if (!prediction) return 'low';
  
  const isHighRiskCondition = URGENCY_CONFIG.HIGH_RISK_CONDITIONS.includes(prediction.condition);
  
  if (prediction.probability > URGENCY_CONFIG.HIGH_THRESHOLD && isHighRiskCondition) {
    return 'high';
  }
  
  if (prediction.probability > URGENCY_CONFIG.MODERATE_THRESHOLD) {
    return 'moderate';
  }
  
  return 'low';
}
