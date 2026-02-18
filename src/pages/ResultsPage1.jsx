import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage } from '@fortawesome/free-solid-svg-icons';
import {
  FaChartBar,
  FaListUl,
  FaDownload,
  FaHome,
  FaCheckCircle,
  FaExclamationTriangle,
  FaBandAid
} from 'react-icons/fa';
import './css/ResultsPage.css';

// Utility imports
import {
  getTopPredictionWithDetails,
  findConditionDescription,
  formatDiseaseName
} from '../utils/predictionProcessing';
import { getAllCategoriesResults } from '../utils/diseaseScoring';
import { generateAndDownloadReport } from '../utils/reportGenerator';
import { formatAssessmentAnswers } from '../utils/assessmentFormatter';
import { DISEASES } from '../data/diseases';

function ResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const predictions = location.state?.predictions;
  const capturedImage = location.state?.capturedImage;
  const assessmentData = location.state?.answers;
  const assessmentQuestions = location.state?.assessmentQuestions;
  const diseaseScores = location.state?.diseaseScores;
  const isAdaptive = location.state?.adaptive || false;

  if (!predictions || !capturedImage) {
    return (
      <div className="results-container">
        <div className="results-content">
          <div className="error-state">
            <FaExclamationTriangle className="error-icon" />
            <h2>Error</h2>
            <p>No analysis results available.</p>
            <button className="action-btn secondary-btn" onClick={() => navigate('/')}>
              <FaHome /> Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const topPrediction = getTopPredictionWithDetails(predictions);

  const allDiseaseResults = getAllCategoriesResults({
    isAdaptive,
    diseaseScores,
    assessmentData,
    topCondition: topPrediction?.condition
  }).filter(result => result.percentage > 0);

  // Determine how many results to show (3 or 4) and renormalize so they sum to 100
  let displayResults = allDiseaseResults.slice(0, 4);
  if (displayResults.length > 0) {
    const topPct = displayResults[0].percentage || 0;
    const targetCount = topPct > 40 ? Math.min(3, displayResults.length) : Math.min(4, displayResults.length);
    displayResults = displayResults.slice(0, targetCount);

    const rawTotal = displayResults.reduce((sum, r) => sum + r.percentage, 0);
    if (rawTotal > 0) {
      const recalculated = displayResults.map((item, index) => {
        if (index === displayResults.length - 1) {
          const sumFirst = displayResults
            .slice(0, -1)
            .reduce(
              (sum, r) => sum + Math.round((r.percentage / rawTotal) * 100),
              0
            );
          return {
            ...item,
            percentage: 100 - sumFirst
          };
        }
        return {
          ...item,
          percentage: Math.round((item.percentage / rawTotal) * 100)
        };
      });
      displayResults = recalculated;

      // Break any remaining percentage ties using attribute-based bias
      const percentageGroups = displayResults.reduce((acc, item, index) => {
        const key = item.percentage;
        if (!acc[key]) acc[key] = [];
        acc[key].push(index);
        return acc;
      }, {});

      Object.values(percentageGroups).forEach(indices => {
        if (indices.length <= 1) return;

        const enriched = indices
          .map(idx => {
            const item = displayResults[idx];
            const attrs =
              (item.category &&
                DISEASES[item.category] &&
                DISEASES[item.category][item.disease] &&
                DISEASES[item.category][item.disease].attributes) ||
              [];
            const zeroCount = attrs.filter(v => v === 0).length;
            return { idx, zeroCount };
          })
          .sort((a, b) => a.zeroCount - b.zeroCount || a.idx - b.idx);

        for (let i = 1; i < enriched.length; i++) {
          const downIdx = enriched[i].idx;
          const upIdx = enriched[0].idx;

          const downItem = displayResults[downIdx];
          const upItem = displayResults[upIdx];

          const delta = 1;

          displayResults[downIdx] = {
            ...downItem,
            percentage: Math.max(0, downItem.percentage - delta)
          };
          displayResults[upIdx] = {
            ...upItem,
            percentage: upItem.percentage + delta
          };
        }
      });
    }
  }

  // Get assessment answers for display (use same questions as SelfAssessment when available)
  const assessmentAnswers = formatAssessmentAnswers(assessmentData, assessmentQuestions);

  const handleDownloadReport = () => {
    generateAndDownloadReport(capturedImage);
  };

  return (
    <div className="results-container">
      {/* Header Navigation */}
      <nav className="results-nav">
        <div className="nav-content">
          <div className="nav-logo">SkinSight AI</div>
          <div className="nav-links">
            <a href="#home" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Home</a>
            <a href="#about">About</a>
            <a href="#how-to-use">How To Use</a>
            <button className="nav-contact-btn" onClick={() => navigate('/')}>Contact Us</button>
          </div>
        </div>
      </nav>

      <div className="results-content">
        <div className="results-header">
          <h1>Analysis Results</h1>
        </div>

        {/* Detected Conditions */}
        <div className="detected-conditions-section">
          <h2 className="section-title">Detected Conditions</h2>
          <div className="conditions-grid">
            {displayResults.length > 0 ? (
              displayResults.map((result, index) => {
                // Get condition information
                const conditionInfo = findConditionDescription(result.disease);
                
                // Get disease name - use info.name if available, otherwise format the disease key
                const diseaseName = conditionInfo?.name || 
                                  result.disease.split('_').map(word => 
                                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                                  ).join(' ') ||
                                  result.disease.replace(/_/g, ' ');
                return (
                  <div key={index} className="condition-card">
                    <div className="condition-info">
                      <h3>{diseaseName}</h3>


                    </div>
                    <div className="progress-circle" style={{'--progress': result.percentage}}>
                      <span className="progress-value">{result.percentage}%</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="condition-card">
                <div className="condition-info">
                  <h3>No Conditions Detected</h3>


                </div>
                <div className="progress-circle" style={{'--progress': 0}}>
                  <span className="progress-value">0%</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Skin Image */}
        <div className="skin-image-section">
          {capturedImage ? (
            <>
              <img 
                src={capturedImage} 
                alt="Analyzed skin condition" 
                onError={(e) => {
                  e.target.style.display = 'none';
                  const placeholder = e.target.parentElement.querySelector('.image-placeholder');
                  if (placeholder) placeholder.style.display = 'flex';
                }} 
              />
              <div className="image-placeholder" style={{display: 'none'}}>
                <FontAwesomeIcon icon={faImage} className="placeholder-icon" />
                <p>Failed to load image</p>
              </div>
            </>
          ) : (
            <div className="image-placeholder">
              <FontAwesomeIcon icon={faImage} className="placeholder-icon" />
              <p>No image available</p>
            </div>
          )}
        </div>

        {/* Two Column Layout */}
        <div className="results-two-column">
          {/* Left Column - Self-Assessment Answers */}
          <div className="column-left">
            <h2 className="section-title">Self-Assessment Answers</h2>
            <div className="answers-list">
              {assessmentAnswers.length > 0 ? (
                assessmentAnswers.map((item, index) => (
                  <div key={index} className="answer-card">
                    <span className="answer-icon">👤</span>
                    <div className="answer-content">
                      <p className="answer-question">{item.question}</p>
                      <p className="answer-text">{item.answer}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p>No assessment answers available</p>
              )}
            </div>
          </div>

          {/* Right Column - Recommendations */}
          <div className="column-right">
            <h2 className="section-title">Recommendations</h2>
            <div className="recommendations-list">
              {topPrediction?.recommendations && topPrediction.recommendations.length > 0 ? (
                topPrediction.recommendations.map((rec, index) => (
                  <div key={index} className="recommendation-item">
                    <FaCheckCircle className="recommendation-icon" />
                    <span>{typeof rec === "string" ? rec : rec.text}</span>
                  </div>
                ))
              ) : (
                <p>No recommendations available</p>
              )}
            </div>
            <div className="recommendation-note">
              <p>Note: For a more personalized recommendation, contact a professional.</p>
            </div>
            <button className="book-appointment-btn">
              Book an Appointment
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="results-actions">
          <button className="action-btn primary-btn" onClick={handleDownloadReport}>
            <FaDownload /> Download Report as PDF
          </button>
          <button className="action-btn secondary-btn" onClick={() => navigate('/')}>
            <FaHome /> Return Home
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="results-footer">
        <div className="footer-left">
          <h3>SkinSight AI</h3>
          <p>Empower Your Skin Health Journey. Trusted skin health journey since 2025</p>
        </div>
        <div className="footer-right">
          <div className="footer-links">
            <a href="#about">About</a>
            <a href="#how-to-use">How To Use</a>
            <button className="footer-contact-btn" onClick={() => navigate('/')}>Contact Us</button>
          </div>
          <p className="footer-copyright">© 2025 SkinSight AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default ResultsPage;