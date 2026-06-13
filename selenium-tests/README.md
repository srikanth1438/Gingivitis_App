# Gingivitis Detector - Web E2E Test Suite (Selenium)

This directory contains the complete web end-to-end testing suite with **100 test cases** targeting the web application of the Gingivitis Detector.

## 📋 Overview

- **100 Web Tests**: Selenium WebDriver + Mocha + Chai (Chrome browser)
- **Unified Reporting**: Custom JSON, CSV, HTML, and Excel analysis reports
- **Security Testing**: SQL injection, XSS inputs, token validation, rate-limiting behavior checks
- **Comprehensive Coverage**: login, registration, OTP validation, password resets, dashboard file upload, and general responsive UI checks

## 🗂️ Directory Structure

```
selenium-tests/
├── package.json
├── README.md
├── run_all_tests.js (orchestrator runner)
├── generate_report.js (custom report engine)
├── excel_generator.js (excel builder)
├── tests/
│   ├── login.test.js (sample web login)
│   └── comprehensive.test.js (100 E2E web tests)
└── reports/ (generated)
```

## 🚀 Setup & Execution

### Prerequisites

- Node.js >= 16.x
- Google Chrome browser installed
- ChromeDriver matching the Google Chrome version installed and added to your system path:
  ```bash
  chromedriver --version
  ```

### Installation

```bash
# Install web test suite dependencies
npm install
```

### Run Tests

To run the orchestrator (which installs dependencies, runs all tests, and compiles the Excel analysis report):

```bash
# Run all tests and generate Excel/HTML reports
node run_all_tests.js

# Or run tests directly
npm test
```

### Environment Variables

Configure your execution targets via environment variables:

- `E2E_BASE_URL`: Target web application URL (defaults to `http://localhost:3000`)

## 📊 Viewing Reports

After running the suite, reports are exported into `selenium-tests/reports/`:

- `Web_E2E_Test_Report.xlsx`: Excel workbook with multi-sheet dashboard, test definitions, criticality styling, and risk assessments.
- `web_e2e_report.html`: Interactive responsive dashboard report.
- `web_e2e_report.json`: Machine-readable test data.
- `web_e2e_summary.csv`: Condensed comma-separated table.
