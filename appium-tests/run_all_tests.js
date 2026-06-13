#!/usr/bin/env node

/**
 * Mobile E2E Test Suite Master Runner
 * Executes Appium tests and triggers Mobile E2E Reports (JSON, CSV, HTML, Excel)
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const REPORTS_DIR = path.join(__dirname, 'reports');

// Ensure reports directory exists
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

function executeCommand(command, cwd, description) {
  return new Promise((resolve, reject) => {
    console.log(`\n➤ ${description}`);
    console.log(`  $ ${command}\n`);
    
    const child = exec(command, { cwd, maxBuffer: 10 * 1024 * 1024 });
    
    child.stdout.on('data', (data) => {
      process.stdout.write(data);
    });
    
    child.stderr.on('data', (data) => {
      process.stderr.write(data);
    });
    
    child.on('close', (code) => {
      if (code !== 0) {
        console.log(`\n✗ ${description} failed with code ${code}`);
        reject(new Error(`Command failed: ${command}`));
      } else {
        console.log(`\n✓ ${description} completed successfully`);
        resolve(code);
      }
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || 'all'; // 'all', 'test', 'report'

  console.log(`\n============================================================`);
  console.log(`📱 APPIUM MOBILE E2E AUTOMATION RUNNER`);
  console.log(`============================================================\n`);

  try {
    if (mode === 'all' || mode === 'test') {
      // Check node_modules
      if (!fs.existsSync(path.join(__dirname, 'node_modules'))) {
        console.log('Installing dependencies for mobile testing...');
        await executeCommand('npm install', __dirname, 'Installing packages');
      }

      console.log('Running 100 Appium Android test cases...');
      // Note: We wrap the run in catch to ensure report generation runs even if tests fail
      try {
        await executeCommand('npm test', __dirname, 'Executing Mocha test suite');
      } catch (testError) {
        console.log('\n⚠ Some tests failed. Generating reports for partial run...');
      }
    }

    if (mode === 'all' || mode === 'report') {
      console.log('Generating Mobile E2E Reports (JSON, CSV, HTML, Excel)...');
      await executeCommand('node generate_report.js', __dirname, 'Creating reports');
      
      console.log(`\n📈 Reports generated successfully at: ${REPORTS_DIR}`);
      console.log(`   - JSON: mobile_e2e_report.json`);
      console.log(`   - CSV:  mobile_e2e_summary.csv`);
      console.log(`   - HTML: mobile_e2e_report.html`);
      console.log(`   - XLSX: Mobile_E2E_Test_Report.xlsx\n`);
    }

    console.log(`✅ Done!`);
    process.exit(0);
  } catch (error) {
    console.error(`\n✗ Orchestrator encountered a fatal error: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
