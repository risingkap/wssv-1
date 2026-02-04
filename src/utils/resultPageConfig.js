/**
 * Configuration constants for Results Page
 * Centralized thresholds and settings
 */

export const DISPLAY_THRESHOLDS = {
  'INFLAMMATORY': 25,
  'INFECTIOUS': 20,
  'AUTOIMMUNE': 30,
  'BENIGN_GROWTH': 15,
  'PIGMENTARY': 25,
  'SKIN_CANCER': 10,
  'ENVIRONMENTAL': 20,
  'DEFAULT': 25
};

export const URGENCY_CONFIG = {
  HIGH_THRESHOLD: 0.7,
  MODERATE_THRESHOLD: 0.5,
  HIGH_RISK_CONDITIONS: ['MEL', 'SCC']
};

export const CATEGORY_NAMES = [
  'INFLAMMATORY',
  'INFECTIOUS',
  'AUTOIMMUNE',
  'BENIGN_GROWTH',
  'PIGMENTARY',
  'SKIN_CANCER',
  'ENVIRONMENTAL'
];
