# E2E Test Suite - Quick Execution Guide

## 🎯 One-Minute Setup

```bash
# 1. Install all dependencies
npm install
cd selenium-tests/mobile && npm install && cd ../..
cd selenium-tests/web && npm install && cd ../..

# 2. Start backend
cd backend && python -m uvicorn main:app --reload --port 8000 &

# 3. Start frontend
cd frontend && npm start &  # or npm run dev

# 4. Start Appium (in new terminal)
appium --port 4723

# 5. Run all E2E tests
cd selenium-tests
node run_all_tests.js
```

---

## 📱 Mobile Tests Only

```bash
# Prerequisites
# ✓ Appium running on port 4723
# ✓ Android emulator/device connected
# ✓ Backend running on 8000

cd selenium-tests/mobile
npm test

# Output:
# ✓ 20 LOGIN tests
# ✓ 20 REGISTER tests
# ✓ 20 OTP tests
# ✓ 20 PASSWORD_RESET tests
# ✓ 20 IMAGE_DETECTION tests
# ---
# ✓ 100 passing
```

---

## 🌐 Web Tests Only

```bash
# Prerequisites
# ✓ Frontend running on port 3000
# ✓ Backend running on port 8000
# ✓ ChromeDriver installed

cd selenium-tests/web
npm test

# Output:
# ✓ 20 LOGIN tests
# ✓ 20 REGISTER tests
# ✓ 20 OTP tests
# ✓ 20 PASSWORD_RESET tests
# ✓ 20 UI/UX tests
# ---
# ✓ 100 passing
```

---

## 🔄 Run All Tests

```bash
# Sequential (recommended)
cd selenium-tests
node run_all_tests.js

# Parallel execution
PARALLEL=true node run_all_tests.js

# Expected output:
# ================================
# 📱 MOBILE TEST SUITE
# ================================
# ✓ 100 passing (4-5 hours)
#
# ================================
# 🌐 WEB TEST SUITE
# ================================
# ✓ 100 passing (3-4 hours)
#
# ================================
# 📊 GENERATING CONSOLIDATED REPORTS
# ================================
# ✓ JSON Report
# ✓ CSV Report
# ✓ HTML Report
# ✓ Excel Report
```

---

## 📊 View Reports

```bash
cd selenium-tests/reports

# View all available reports
ls -la

# HTML Report (interactive)
open e2e_test_report.html
# or
firefox e2e_test_report.html

# Excel Report (spreadsheet)
open E2E_Test_Report.xlsx
# or
libreoffice E2E_Test_Report.xlsx

# JSON Report (raw data)
cat e2e_test_report.json | jq .

# CSV Report (spreadsheet data)
cat e2e_test_summary.csv
```

---

## 🧪 Test-Specific Commands

### Run Only LOGIN Tests
```bash
# Mobile
cd selenium-tests/mobile
npm test -- --grep "LOGIN"

# Web
cd selenium-tests/web
npm test -- --grep "LOGIN"
```

### Run Single Test
```bash
# Mobile - TC-001
cd selenium-tests/mobile
npm test -- --grep "TC-001"

# Web - WEB-TC-001
cd selenium-tests/web
npm test -- --grep "WEB-TC-001"
```

### Run Specific Category
```bash
# LOGIN tests
npm test -- --grep "LOGIN"

# REGISTER tests
npm test -- --grep "REGISTER"

# OTP tests
npm test -- --grep "OTP"

# PASSWORD RESET tests
npm test -- --grep "PASSWORD_RESET|PASSWORD RESET"

# IMAGE DETECTION tests (mobile only)
npm test -- --grep "IMAGE_DETECTION|IMAGE DETECTION"

# UI/UX tests (web only)
npm test -- --grep "UI/UX|UI_UX"
```

### Run with Extended Timeout
```bash
# For slower networks
npm test -- --timeout 300000  # 5 minutes per test
```

---

## 📋 Pre-Execution Checklist

### Backend
```bash
# ✓ Check backend is running
curl http://localhost:8000/health

# Expected response:
# {"status": "ok"}

# If not running:
cd backend
python -m uvicorn main:app --reload --port 8000
```

### Frontend
```bash
# ✓ Check frontend is running
curl http://localhost:3000

# Expected: HTML page content

# If not running:
cd frontend
npm start
```

### Appium
```bash
# ✓ Check Appium is running
curl http://localhost:4723/wd/hub/status

# Expected:
# {"value":{"ready":true,...}}

# If not running:
appium --port 4723
```

### Android Device
```bash
# ✓ Check device connection
adb devices

# Expected:
# List of attached devices
# emulator-5554     device  (for emulator)
# 192.168.x.x:5555  device  (for physical device)

# If not connected:
# For emulator: emulator -avd <name>
# For physical: Enable USB debugging and connect via adb
```

### ChromeDriver
```bash
# ✓ Check ChromeDriver version
chromedriver --version

# ✓ Check Chrome version
google-chrome --version

# Should match! If not:
# Download matching ChromeDriver from https://chromedriver.chromium.org/
```

---

## 🚨 Common Issues & Solutions

### Port Already in Use

```bash
# Find process using port
lsof -i :8000    # Backend
lsof -i :3000    # Frontend
lsof -i :4723    # Appium

# Kill process
kill -9 <PID>

# Or use different port
python -m uvicorn main:app --port 8001  # Backend
npm start -- --port 3001                # Frontend
appium --port 4724                      # Appium
```

### Device Not Found (Appium)

```bash
# Reset ADB connection
adb kill-server
adb start-server
adb devices

# Or restart Appium
appium --port 4723 --allow-cors
```

### ChromeDriver Version Mismatch

```bash
# Check versions
google-chrome --version
chromedriver --version

# Download matching version
# https://chromedriver.chromium.org/

# Or use npm version
npm install chromedriver@<version>
```

### Tests Timeout

```bash
# Increase timeout
npm test -- --timeout 300000

# Check network connectivity
ping google.com

# Verify backend/frontend responses
curl http://localhost:8000
curl http://localhost:3000
```

---

## 📈 Performance Optimization

### Run Tests Faster

```bash
# Parallel execution
PARALLEL=true node run_all_tests.js

# Run only essential tests
npm test -- --grep "LOGIN|REGISTER"

# Skip slow tests
npm test -- --grep "IMAGE_DETECTION" --invert
```

### Monitor Resources

```bash
# CPU/Memory during tests
watch -n 1 'ps aux | grep node'

# Network traffic
iftop -i eth0

# Disk usage
df -h
```

---

## 📝 Test Case Quick Reference

### Mobile Test IDs (Total: 100)

```
LOGIN (TC-001 to TC-020)
├── Valid credentials, empty fields, invalid format
├── Non-existent user, wrong password, long input
├── SQL injection, XSS, special characters
└── Field validation, navigation, error handling

REGISTER (TC-021 to TC-040)
├── Valid registration, empty fields
├── Invalid email, weak password, duplicate user
├── XSS injection, very long input, special chars
└── Unicode support, field visibility, button state

OTP (TC-041 to TC-060)
├── Valid OTP, invalid OTP, empty field
├── Numeric validation, max length validation
├── Resend OTP, multiple attempts
└── Error messages, timeout handling

PASSWORD RESET (TC-061 to TC-080)
├── Forgot password flow, email validation
├── OTP verification, password matching
├── Weak password, empty fields
└── Success message, redirect behavior

IMAGE DETECTION (TC-081 to TC-100)
├── Image selection, image display
├── Analysis execution, result display
├── Logout functionality, session persistence
└── Error handling, network issues
```

### Web Test IDs (Total: 100)

```
LOGIN (WEB-TC-001 to WEB-TC-020)
├── Page navigation, element visibility
├── Field validation, form submission
├── Security tests (SQL, XSS, special chars)
└── Error handling, accessibility

REGISTER (WEB-TC-021 to WEB-TC-040)
├── Form elements, field validation
├── Registration flow, error scenarios
├── Security tests, input validation
└── Button states, navigation

OTP (WEB-TC-041 to WEB-TC-060)
├── Input validation, verification flow
├── Resend functionality, error handling
└── Browser interaction, timing

PASSWORD RESET (WEB-TC-061 to WEB-TC-080)
├── Forgot password page, email validation
├── OTP verification, password update
├── Success feedback, navigation

UI/UX (WEB-TC-081 to WEB-TC-100)
├── Page responsiveness, accessibility
├── Performance metrics, browser compatibility
├── Navigation flow, console errors
└── Session management, final smoke test
```

---

## 🎯 Success Criteria

✅ **All Tests Passing**
- Mobile: 100/100
- Web: 100/100
- Total: 200/200

✅ **Reports Generated**
- JSON Report: Present and valid
- CSV Report: Present and formatted
- HTML Report: Present and styled
- Excel Report: Present with multiple sheets

✅ **No Security Issues**
- SQL Injection: Blocked
- XSS Attacks: Blocked
- Authentication: Validated
- Rate Limiting: Working

✅ **Performance**
- Mobile tests: Complete in 4-5 hours
- Web tests: Complete in 3-4 hours
- Reports: Generated in < 5 seconds

---

## 🚀 Deployment Checklist

- [ ] All dependencies installed
- [ ] Backend running and responding
- [ ] Frontend running and accessible
- [ ] Appium server running
- [ ] Android device/emulator connected
- [ ] ChromeDriver installed
- [ ] Sufficient disk space (1GB+)
- [ ] Network connectivity verified
- [ ] Database initialized
- [ ] All ports available (3000, 8000, 4723)
- [ ] NPM packages up to date
- [ ] Mocha and Chai installed
- [ ] Test files present and readable
- [ ] Reports directory writable
- [ ] Test credentials prepared

---

## 📞 Quick Help

```bash
# List all test commands
npm run

# Show test configuration
cat package.json | jq '.scripts'

# Run tests with verbose output
npm test -- --reporter spec

# Generate coverage report
npm test -- --coverage

# Run in watch mode
npm test -- --watch

# Save test output to file
npm test > test_results.log 2>&1

# Run tests in debug mode
node --inspect-brk node_modules/.bin/mocha tests/
```

---

## 📚 Full Documentation

For detailed information, see:
- `selenium-tests/README.md` - Complete guide
- `TEST_SUITE_SUMMARY.md` - Implementation details
- `e2e_test_report.html` - Generated report

---

**Quick Start Complete! 🎉**

Your E2E test suite is ready to execute 200 comprehensive tests across mobile and web platforms.

```bash
cd selenium-tests
node run_all_tests.js
```
