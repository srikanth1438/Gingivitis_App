# Gingivitis Detector - Mobile E2E Test Suite (Appium)

This directory contains the complete mobile end-to-end testing suite with **100 test cases** targeting the Android build of the Gingivitis Detector App.

## 📋 Overview

- **100 Mobile Tests**: Appium + WebdriverIO + Mocha + Chai (Android platform)
- **Unified Reporting**: Custom JSON, CSV, HTML, and Excel analysis reports
- **Security Testing**: SQL injection, XSS inputs, token validation, rate-limiting behavior checks
- **Comprehensive Coverage**: login, registration, OTP validation, password resets, camera upload, and YOLO analysis results screen

## 🗂️ Directory Structure

```
appium-tests/
├── package.json
├── README.md
├── run_all_tests.js (orchestrator runner)
├── generate_report.js (custom report engine)
├── excel_generator.js (excel builder)
├── tests/
│   ├── android_login.test.js (sample mobile login)
│   └── comprehensive.test.js (100 E2E mobile tests)
└── reports/ (generated)
```

## 🚀 Setup & Execution

### Prerequisites

- Node.js >= 16.x
- Java Development Kit (JDK) installed and configured
- Android SDK (for emulator / adb connections)
- Appium Server running globally:
  ```bash
  npm install -g appium
  appium --port 4723 --allow-cors
  ```

### Installation

```bash
# Install mobile test suite dependencies
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

- `ANDROID_SERVER_URL`: Appium server endpoint (defaults to `http://localhost:4723`)
- `ANDROID_DEVICE`: Target device name or id (defaults to `emulator-5554`)
- `ANDROID_APP`: Path to target app APK file

## 📊 Viewing Reports

After running the suite, reports are exported into `appium-tests/reports/`:

- `Mobile_E2E_Test_Report.xlsx`: Excel workbook with multi-sheet dashboard, test definitions, criticality styling, and risk assessments.
- `mobile_e2e_report.html`: Interactive responsive dashboard report.
- `mobile_e2e_report.json`: Machine-readable test data.
- `mobile_e2e_summary.csv`: Condensed comma-separated table.
