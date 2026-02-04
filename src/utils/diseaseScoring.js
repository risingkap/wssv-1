/**
 * Disease scoring and aggregation utilities
 * Handles calculation and normalization of disease scores
 */

import { DISPLAY_THRESHOLDS, CATEGORY_NAMES } from './resultPageConfig';
import { getTargetCategory, calculateWeightedResults } from '../pages/SelfAssessment';

/**
 * Normalize percentages to ensure sum equals 100%
 * @param {Array} items - Items with percentage property
 * @returns {Array} - Items with adjusted percentages
 */
function normalizePercentages(items) {
  if (items.length === 0) return items;
  
  const adjusted = [...items];
  const sumOfFirst = adjusted.slice(0, -1).reduce((sum, r) => sum + r.percentage, 0);
  
  if (adjusted.length > 0) {
    adjusted[adjusted.length - 1].percentage = 100 - sumOfFirst;
  }
  
  return adjusted;
}

/**
 * Process adaptive assessment disease scores
 * @param {Object} diseaseScores - Disease scores object
 * @param {string} topCondition - Top predicted condition
 * @returns {Array} - Normalized disease results
 */
function processAdaptiveScores(diseaseScores, topCondition) {
  if (!diseaseScores || Object.keys(diseaseScores).length === 0) {
    return [];
  }
  
  const targetCategory = getTargetCategory(topCondition);
  const categoryThreshold = DISPLAY_THRESHOLDS[targetCategory] || DISPLAY_THRESHOLDS.DEFAULT;
  
  const top3 = Object.entries(diseaseScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  
  const totalScore = top3.reduce((sum, [, score]) => sum + score, 0);
  
  const normalized = top3.map(([disease, score], index) => ({
    disease,
    percentage: Number(((totalScore > 0 ? (score / totalScore) * 100 : 0).toFixed(0))),
    category: targetCategory,
    threshold: categoryThreshold,
    index
  }));
  
  return normalizePercentages(normalized);
}

/**
 * Process non-adaptive assessment-based disease scores
 * @param {Object} assessmentData - Assessment answers
 * @param {string} topCondition - Top predicted condition
 * @returns {Array} - Normalized disease results
 */
function processAssessmentScores(assessmentData, topCondition) {
  if (!assessmentData || Object.keys(assessmentData).length === 0) {
    return [];
  }
  
  const results = [];
  
  CATEGORY_NAMES.forEach(category => {
    const weightedCategories = calculateWeightedResults(assessmentData, topCondition);
    const categoryData = weightedCategories[category];
    const categoryThreshold = DISPLAY_THRESHOLDS[category] || DISPLAY_THRESHOLDS.DEFAULT;
    
    if (!categoryData || Object.keys(categoryData).length === 0) {
      return;
    }
    
    const top3 = Object.entries(categoryData)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    
    const totalScore = top3.reduce((sum, [, score]) => sum + score, 0);
    
    const normalized = top3.map(([disease, score], index) => ({
      disease,
      percentage: Number(((totalScore > 0 ? (score / totalScore) * 100 : 0).toFixed(1))),
      category,
      threshold: categoryThreshold,
      index
    }));
    
    results.push(...normalizePercentages(normalized));
  });
  
  return results;
}

/**
 * Get all disease category results from available data
 * @param {Object} params - Parameters object
 * @param {boolean} params.isAdaptive - Using adaptive assessment
 * @param {Object} params.diseaseScores - Disease scores from adaptive
 * @param {Object} params.assessmentData - Assessment answers
 * @param {string} params.topCondition - Top predicted condition
 * @returns {Array} - Sorted disease results by percentage
 */
export function getAllCategoriesResults(params) {
  const { isAdaptive, diseaseScores, assessmentData, topCondition } = params;
  
  let results = [];
  
  if (isAdaptive && diseaseScores) {
    results = processAdaptiveScores(diseaseScores, topCondition);
  } else if (assessmentData) {
    results = processAssessmentScores(assessmentData, topCondition);
  }
  
  return results.sort((a, b) => b.percentage - a.percentage);
}
