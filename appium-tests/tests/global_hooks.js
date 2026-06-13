const fs = require('fs');
const path = require('path');

const resultsDir = path.join(__dirname, '../results');
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

const testResults = [];

afterEach(function () {
  if (this.currentTest) {
    testResults.push({
      title: this.currentTest.title,
      state: this.currentTest.state,
      error: this.currentTest.err ? this.currentTest.err.message : null
    });
  }
});

after(function () {
  fs.writeFileSync(
    path.join(resultsDir, 'mocha-results.json'),
    JSON.stringify(testResults, null, 2)
  );
  console.log(`\nSaved ${testResults.length} Appium test results to mocha-results.json`);
});
