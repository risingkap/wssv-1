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

import {
  calculateWeightedResults,
  getTargetCategory
} from './SelfAssessment';

import {
  CONDITION_DESCRIPTIONS
} from './MedicalConditions';
import { BASE_QUESTIONS } from './selfAssessmentQuestions';
import { CONFIG } from '../config';

const DISPLAY_THRESHOLDS = {
  'INFLAMMATORY': 25,
  'INFECTIOUS': 20,
  'AUTOIMMUNE': 30,
  'BENIGN_GROWTH': 15,
  'PIGMENTARY': 25,
  'SKIN_CANCER': 10,
  'ENVIRONMENTAL': 20,
  'DEFAULT': 25
};

function ResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const predictions = location.state?.predictions;
  const capturedImage = location.state?.capturedImage;
  const assessmentData = location.state?.answers;
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

  const sortedPredictionsRaw = Object.entries(predictions.predictions)
    .map(([condition, probability]) => {
      const desc = CONDITION_DESCRIPTIONS[condition] || {};
      return {
        condition,
        probability,
        name: desc.name || condition,
        description: desc.description,
        description1: desc.description1,
        treatment: desc.treatment || "Unknown",
        recommendations: desc.recommendations || []
      };
    })
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 1);

  const topPrediction = sortedPredictionsRaw[0];
  const urgencyLevel =
    topPrediction.probability > 0.7 && (topPrediction.condition === 'MEL' || topPrediction.condition === 'SCC')
      ? 'high'
      : topPrediction.probability > 0.5
        ? 'moderate'
        : 'low';

  const handleDownloadReport = () => {
    const reportContent = `
      <html>
        <head>
          <title>SkinSight AI Analysis Report</title>
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              padding: 40px; 
              color: #333;
              line-height: 1.6;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #1e3a8a;
              margin-bottom: 30px;
              padding-bottom: 20px;
            }
            .header h1 { color: #1e3a8a; margin: 0; }
            .meta-info {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
              font-size: 0.9rem;
              color: #666;
            }
            .section { margin-bottom: 40px; }
            .section-title {
              font-size: 1.2rem;
              font-weight: bold;
              color: #1e3a8a;
              border-bottom: 1px solid #e5e7eb;
              margin-bottom: 15px;
              padding-bottom: 5px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th, td {
              text-align: left;
              padding: 12px;
              border: 1px solid #e5e7eb;
            }
            th {
              background-color: #f8fafc;
              color: #1e3a8a;
              font-weight: 600;
            }
            .image-container {
              text-align: center;
              margin-bottom: 30px;
            }
            .image-container img {
              max-width: 400px;
              border-radius: 8px;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .recommendation-item {
              margin-bottom: 8px;
              padding-left: 20px;
              position: relative;
            }
            .recommendation-item::before {
              content: "•";
              position: absolute;
              left: 0;
              color: #1e3a8a;
              font-weight: bold;
            }
            .footer {
              margin-top: 50px;
              font-size: 0.8rem;
              color: #999;
              text-align: center;
              border-top: 1px solid #eee;
              padding-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>SkinSight AI Analysis Report</h1>
          </div>

          <div class="meta-info">
            <span>Report ID: SS-${Math.floor(Math.random() * 1000000)}</span>
            <span>Generated: ${new Date().toLocaleString()}</span>
          </div>

          <div class="section">
            <div class="section-title">Analysis Image</div>
            <div class="image-container">
              <img src="${capturedImage}" alt="Skin Analysis Image"/>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Top Detected Conditions</div>
            <table>
              <thead>
                <tr>
                  <th>Condition</th>
                  <th>Confidence Percentage</th>
                </tr>
              </thead>
              <tbody>
                ${allDiseaseResults.slice(0, 4).map(res => `
                  <tr>
                    <td>${res.disease.replace(/_/g, ' ')}</td>
                    <td>${res.percentage}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="section">
            <div class="section-title">Self-Assessment Data</div>
            <table>
              <thead>
                <tr>
                  <th>Question</th>
                  <th>User Answer</th>
                </tr>
              </thead>
              <tbody>
                ${assessmentAnswers.map(item => `
                  <tr>
                    <td>${item.question}</td>
                    <td>${item.answer}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="section">
            <div class="section-title">Clinical Recommendations</div>
            <div class="recommendations">
              ${topPrediction.recommendations.map(rec => `
                <div class="recommendation-item">${typeof rec === "string" ? rec : rec.text}</div>
              `).join('')}
            </div>
          </div>

          <div class="footer">
            <p>This report is generated by AI for informational purposes only and does not substitute professional medical advice.</p>
            <p>© 2025 SkinSight AI. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;

    const blob = new Blob([reportContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skin-analysis-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getAllCategoriesResults = () => {
    const results = [];
    
    if (isAdaptive && diseaseScores && Object.keys(diseaseScores).length > 0) {
      const targetCategory = getTargetCategory(topPrediction.condition);
      const categoryData = diseaseScores;
      const categoryThreshold = DISPLAY_THRESHOLDS[targetCategory] || DISPLAY_THRESHOLDS.DEFAULT;
      
      if (Object.keys(categoryData).length > 0) {
        const top4 = Object.entries(categoryData)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4);

        const totalScore = top4.reduce((sum, [, score]) => sum + score, 0);
        
        const normalizedResults = top4
          .map(([disease, score]) => {
            const percentage = totalScore > 0 ? (score / totalScore) * 100 : 0;
            return {
              disease,
              percentage: Number(percentage.toFixed(1)),
              category: targetCategory,
              threshold: categoryThreshold
            };
          })
          .filter(result => result.percentage >= categoryThreshold);

        results.push(...normalizedResults);
      }
    } else if (assessmentData) {
      const categories = ['INFLAMMATORY', 'INFECTIOUS', 'AUTOIMMUNE', 'BENIGN_GROWTH', 'PIGMENTARY', 'SKIN_CANCER', 'ENVIRONMENTAL'];
      
      categories.forEach(category => {
        const weightedCategories = calculateWeightedResults(assessmentData, topPrediction.condition);
        const categoryData = weightedCategories[category];
        const categoryThreshold = DISPLAY_THRESHOLDS[category] || DISPLAY_THRESHOLDS.DEFAULT;
        
        if (categoryData && Object.keys(categoryData).length > 0) {
          const top4 = Object.entries(categoryData)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4);

          const totalScore = top4.reduce((sum, [, score]) => sum + score, 0);
          
          const normalizedResults = top4
            .map(([disease, score]) => {
              const percentage = totalScore > 0 ? (score / totalScore) * 100 : 0;
              return {
                disease,
                percentage: Number(percentage.toFixed(1)),
                category: category,
                threshold: categoryThreshold
              };
            })
            .filter(result => result.percentage >= categoryThreshold);

          results.push(...normalizedResults);
        }
      });
    }

    return results.sort((a, b) => b.percentage - a.percentage);
  };

  const allDiseaseResults = getAllCategoriesResults();

  // Get assessment answers for display
  const assessmentAnswers = assessmentData ? Object.entries(assessmentData).map(([key, value]) => {
    const questionId = parseInt(key);
    const questionData = BASE_QUESTIONS[questionId];
    return {
      question: questionData?.text || `Question ${key}`,
      answer: value,
      questionId: questionId
    };
  }) : [];

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
            {allDiseaseResults.length > 0 ? (
              allDiseaseResults.slice(0, 4).map((result, index) => {
                // Try multiple key formats to find the condition
                const key1 = result.disease.replace(/_/g, ' ');
                const key2 = result.disease.replace(/_/g, '').replace(/\b\w/g, l => l.toUpperCase());
                const key3 = result.disease.split('_').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                ).join(' ');
                
                // Find the condition info using any matching key
                const info = CONDITION_DESCRIPTIONS[key1] || 
                            CONDITION_DESCRIPTIONS[key2] || 
                            CONDITION_DESCRIPTIONS[key3] ||
                            Object.values(CONDITION_DESCRIPTIONS).find(desc => 
                              desc.name && desc.name.toLowerCase().replace(/\s+/g, '') === 
                              result.disease.toLowerCase().replace(/_/g, '')
                            );
                
                // Get disease name - use info.name if available, otherwise format the disease key
                const diseaseName = info?.name || 
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
              {topPrediction.recommendations.map((rec, index) => (
                <div key={index} className="recommendation-item">
                  <FaCheckCircle className="recommendation-icon" />
                  <span>{typeof rec === "string" ? rec : rec.text}</span>
                </div>
              ))}
            </div>
            <div className="recommendation-note">
              <p>Note: For a more personalized recommendation, contact a professional.</p>
            </div>
            <button className="book-appointment-btn" onClick={() => window.location.href = CONFIG.BOOKING_URL}>
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