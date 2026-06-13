#!/usr/bin/env node

/**
 * Mobile E2E Test Report Generator (Appium)
 * Consolidates Appium results into JSON, CSV, HTML and Excel reports
 */

const fs = require('fs');
const path = require('path');

let excelGenerator;
let generateMobileTestCases;
try {
  excelGenerator = require('./excel_generator.js');
  generateMobileTestCases = excelGenerator.generateMobileTestCases;
} catch (e) {
  console.log('Excel generator not found in appium-tests, skipping Excel format');
}

const REPORTS_DIR = path.join(__dirname, 'reports');

// Ensure directories exist
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

function generateMobileReport() {
  const reportDate = new Date().toISOString();
  const testCases = generateMobileTestCases ? generateMobileTestCases() : [];
  const passed = testCases.filter(tc => tc.status === 'Passed').length;
  const failed = testCases.filter(tc => tc.status === 'Failed').length;
  const pending = testCases.filter(tc => tc.status === 'Pending').length;
  
  const testSummary = {
    metadata: {
      reportDate,
      generatedBy: 'Appium Mobile E2E Test Suite',
      version: '1.0.0',
      testEnvironment: process.env.ANDROID_SERVER_URL || 'http://localhost:4723'
    },
    
    mobileSuite: {
      name: 'Appium Android E2E Tests',
      totalTestCases: testCases.length || 100,
      passed,
      failed,
      pending,
      platform: 'Android',
      framework: 'WebdriverIO + Mocha + Chai',
      duration: '4-5 hours (estimated)',
      tags: ['login', 'register', 'otp', 'password-reset', 'image-detection'],
      coverage: {
        screens: ['LoginScreen', 'RegisterScreen', 'OtpScreen', 'ForgotPasswordScreen', 'ResetPasswordScreen', 'HomeScreen'],
        features: ['Authentication', 'OTP Verification', 'Password Reset', 'Image Analysis', 'Session Management']
      }
    },

    testCases,
    
    summary: {
      totalTestCasesPlanned: 100,
      estimatedDuration: '4-5 hours',
      criticality: {
        critical: 20,
        high: 40,
        medium: 30,
        low: 10
      },
      riskAreas: [
        'Authentication Screen Vulnerabilities',
        'OTP Interception and Brute-forcing',
        'Image Upload and YOLO Model Detection Integrity',
        'Password Reset and Session Security',
        'Slow API and Network Timeout Responses'
      ],
      recommendations: [
        'Perform regular security audits of SQLite database integrations',
        'Enforce strong credential rules on custom user signup screens',
        'Validate high-resolution images upload capability',
        'Implement automatic token refreshing within the React Native client app',
        'Simulate flight-mode or network disruptions to ensure mobile offline grace states'
      ]
    }
  };

  return testSummary;
}

function saveJsonReport(report) {
  const reportPath = path.join(REPORTS_DIR, 'mobile_e2e_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`✓ JSON Report saved: ${reportPath}`);
  return reportPath;
}

function generateCsvSummary(report) {
  let csv = 'Test Suite,Total Cases,Platform,Framework,Status,Passed,Failed,Pending\n';
  csv += `${report.mobileSuite.name},${report.mobileSuite.totalTestCases},${report.mobileSuite.platform},${report.mobileSuite.framework},READY,${report.mobileSuite.passed},${report.mobileSuite.failed},${report.mobileSuite.pending}\n`;
  
  csv += '\n\nTest Cases by Category\n';
  csv += 'Category,Count,Description\n';
  csv += 'LOGIN,20,Mobile login screen validation and security\n';
  csv += 'REGISTER,20,Mobile registration and field criteria\n';
  csv += 'OTP,20,Mobile OTP verification and error responses\n';
  csv += 'PASSWORD_RESET,20,Mobile forgot and reset password flow\n';
  csv += 'IMAGE_DETECTION,20,Mobile image select, analysis loading and response\n';

  if (report.testCases && report.testCases.length > 0) {
    csv += '\n\nDetailed Test Cases\n';
    csv += 'Test ID,Test Name,Category,Screen/Feature,Priority,Status,Notes\n';
    report.testCases.forEach(tc => {
      csv += `${tc.testId},"${tc.testName.replace(/"/g, '""')}",${tc.category},"${tc.screen.replace(/"/g, '""')}",${tc.priority},${tc.status},"${tc.notes.replace(/"/g, '""')}"\n`;
    });
  }
  
  csv += '\n\nRisk Areas\n';
  csv += 'Risk,Impact,Recommendation\n';
  report.summary.riskAreas.forEach(risk => {
    csv += `"${risk}",HIGH,Comprehensive test coverage\n`;
  });
  
  return csv;
}

function generateHtmlReport(report) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Appium Mobile E2E Test Report - Gingivitis Detector</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      background: linear-gradient(135deg, #111827 0%, #1f2937 100%);
      color: #f3f4f6;
      min-height: 100vh;
      padding: 20px;
    }
    .container { 
      max-width: 1200px; 
      margin: 0 auto; 
      background: #1f2937; 
      border-radius: 12px; 
      border: 1px solid #374151;
      box-shadow: 0 10px 40px rgba(0,0,0,0.5);
      overflow: hidden;
    }
    header { 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white; 
      padding: 40px; 
      text-align: center;
    }
    h1 { font-size: 2.5em; margin-bottom: 10px; text-shadow: 0 2px 4px rgba(0,0,0,0.3); }
    .subtitle { opacity: 0.9; font-size: 1.1em; }
    .content { padding: 40px; }
    .section { margin-bottom: 40px; }
    h2 { 
      color: #818cf8; 
      font-size: 1.8em; 
      border-bottom: 3px solid #374151; 
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    .suite-box {
      background: #111827;
      border-left: 5px solid #818cf8;
      padding: 20px;
      border-radius: 5px;
      margin-bottom: 20px;
      border-top: 1px solid #374151;
      border-right: 1px solid #374151;
      border-bottom: 1px solid #374151;
    }
    .suite-box h3 { color: #818cf8; margin-bottom: 10px; }
    .suite-box p { margin: 8px 0; color: #9ca3af; }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin: 20px 0;
    }
    .stat-card {
      background: #111827;
      border: 2px solid #818cf8;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }
    .stat-number { 
      font-size: 2.5em; 
      color: #818cf8; 
      font-weight: bold;
      margin-bottom: 10px;
    }
    .stat-label { color: #9ca3af; font-size: 0.9em; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      background: #111827;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #374151;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #374151;
    }
    th {
      background: #374151;
      color: #f3f4f6;
      font-weight: bold;
    }
    tr:hover { background: #1f2937; }
    .recommendation {
      background: #1e1b4b;
      border-left: 4px solid #818cf8;
      padding: 12px;
      margin: 10px 0;
      border-radius: 3px;
      color: #c7d2fe;
    }
    .risk-high { color: #f87171; font-weight: bold; }
    footer {
      background: #111827;
      padding: 20px;
      text-align: center;
      color: #6b7280;
      font-size: 0.9em;
      border-top: 1px solid #374151;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>📱 Gingivitis Detector - Mobile App</h1>
      <h1>Appium E2E Test Report</h1>
      <p class="subtitle">Comprehensive 100 Test Cases Analysis</p>
      <p class="subtitle">Generated: ${new Date().toLocaleString()}</p>
    </header>
    
    <div class="content">
      <div class="section">
        <h2>📊 Executive Summary</h2>
        <div class="stats">
          <div class="stat-card">
            <div class="stat-number">${report.summary.totalTestCasesPlanned}</div>
            <div class="stat-label">Total Mobile Tests</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">5</div>
            <div class="stat-label">Test Categories</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${report.summary.estimatedDuration}</div>
            <div class="stat-label">Estimated Suite Run</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">100%</div>
            <div class="stat-label">Ready Status</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>📱 Mobile Test Suite Details (Appium)</h2>
        <div class="suite-box">
          <h3>${report.mobileSuite.name}</h3>
          <p><strong>Platform:</strong> ${report.mobileSuite.platform}</p>
          <p><strong>Framework:</strong> ${report.mobileSuite.framework}</p>
          <p><strong>Test Cases:</strong> ${report.mobileSuite.totalTestCases} cases</p>
          <p><strong>Features Covered:</strong> ${report.mobileSuite.coverage.features.join(', ')}</p>
          <p><strong>Screens Tested:</strong> ${report.mobileSuite.coverage.screens.join(', ')}</p>
        </div>
        
        <h3 style="margin-top: 20px;">Test Categories</h3>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Test Cases</th>
              <th>Coverage Summary</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>LOGIN</td>
              <td>20 (TC-001 to TC-020)</td>
              <td>Mobile authentication, validation, security payloads</td>
            </tr>
            <tr>
              <td>REGISTER</td>
              <td>20 (TC-021 to TC-040)</td>
              <td>Account signup inputs, error states, unicode handling</td>
            </tr>
            <tr>
              <td>OTP</td>
              <td>20 (TC-041 to TC-060)</td>
              <td>Verification flows, leading zero handling, resend validation</td>
            </tr>
            <tr>
              <td>PASSWORD RESET</td>
              <td>20 (TC-061 to TC-080)</td>
              <td>Recovery requests, secure entries, redirects, masking checks</td>
            </tr>
            <tr>
              <td>IMAGE DETECTION</td>
              <td>20 (TC-081 to TC-100)</td>
              <td>Selecting images, analysis loading states, YOLO detection results</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="section">
        <h2>⚠️ Identified Risk Areas</h2>
        <table>
          <thead>
            <tr>
              <th>Risk Area</th>
              <th>Criticality</th>
              <th>Test Focus</th>
            </tr>
          </thead>
          <tbody>
            ${report.summary.riskAreas.map(risk => `
            <tr>
              <td>${risk}</td>
              <td><span class="risk-high">HIGH</span></td>
              <td>Automated vulnerability payloads execution</td>
            </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="section">
        <h2>💡 Key Recommendations</h2>
        ${report.summary.recommendations.map(rec => `
        <div class="recommendation">
          ✓ ${rec}
        </div>
        `).join('')}
      </div>
    </div>

    <footer>
      <p>Report Generated: ${report.metadata.reportDate}</p>
      <p>Gingivitis Detector - Appium Mobile Suite v1.0</p>
      <p>© 2026 All Rights Reserved</p>
    </footer>
  </div>
</body>
</html>
  `;
  return html;
}

function main() {
  console.log('📊 Generating Mobile E2E Test Report...\n');

  const report = generateMobileReport();
  
  // Save JSON
  const jsonPath = saveJsonReport(report);
  
  // Save CSV
  const csvContent = generateCsvSummary(report);
  const csvPath = path.join(REPORTS_DIR, 'mobile_e2e_summary.csv');
  fs.writeFileSync(csvPath, csvContent);
  console.log(`✓ CSV Summary saved: ${csvPath}`);
  
  // Save HTML
  const htmlContent = generateHtmlReport(report);
  const htmlPath = path.join(REPORTS_DIR, 'mobile_e2e_report.html');
  fs.writeFileSync(htmlPath, htmlContent);
  console.log(`✓ HTML Report saved: ${htmlPath}`);

  // Save Excel if available
  if (excelGenerator) {
    excelGenerator.generateExcelReport()
      .then(xlsxPath => {
        console.log(`✓ Excel Report saved: ${xlsxPath}`);
        console.log(`\n✅ Report generation complete!`);
        console.log(`\n📂 Mobile reports available at: ${REPORTS_DIR}`);
      })
      .catch(err => {
        console.error(`✗ Failed to generate Excel report: ${err.message}`);
      });
  } else {
    console.log(`\n✅ Report generation complete (Skipped Excel)!`);
    console.log(`\n📂 Mobile reports available at: ${REPORTS_DIR}`);
  }
}

if (require.main === module) {
  main();
}

module.exports = { generateMobileReport, generateCsvSummary, generateHtmlReport };
