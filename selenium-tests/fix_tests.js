const fs = require('fs');
const path = require('path');

function fixFile(filePath, isComprehensive) {
  let raw = fs.readFileSync(filePath);
  let encoding = 'utf8';
  
  if (raw[0] === 0xFF && raw[1] === 0xFE) {
    encoding = 'utf16le';
  } else {
    for (let i = 0; i < Math.min(raw.length, 1000); i++) {
      if (raw[i] === 0x00) {
        encoding = 'utf16le';
        break;
      }
    }
  }

  console.log(`Reading ${path.basename(filePath)} as ${encoding}...`);
  let content = raw.toString(encoding);

  if (isComprehensive) {
    // 1. Replace direct URL get calls
    content = content.replace(/await driver\.get\(baseUrl \+ '\/#\/login'\);/g, "await driver.get(baseUrl);");
    
    content = content.replace(/await driver\.get\(baseUrl \+ '\/#\/register'\);/g, 
      `await driver.get(baseUrl);
      await driver.sleep(1000);
      const registerLink = await driver.findElement(By.xpath("//*[contains(text(), 'Register')]")).catch(() => driver.findElement(By.partialLinkText('Register')));
      await registerLink.click();
      await driver.sleep(1000);`);

    content = content.replace(/await driver\.get\(baseUrl \+ '\/#\/forgot-password'\);/g, 
      `await driver.get(baseUrl);
      await driver.sleep(1000);
      const forgotLink = await driver.findElement(By.xpath("//*[contains(text(), 'Forgot')]")).catch(() => driver.findElement(By.partialLinkText('Forgot')));
      await forgotLink.click();
      await driver.sleep(1000);`);

    content = content.replace(/await driver\.get\(baseUrl \+ '\/#\/dashboard'\);/g, 
      `await driver.get(baseUrl);
      await driver.sleep(1000);
      const emailField = await driver.findElement(By.id('email'));
      const passwordField = await driver.findElement(By.id('password'));
      const loginBtn = await driver.findElement(By.id('login-button'));
      await emailField.sendKeys('test@test.com');
      await passwordField.sendKeys('password123');
      await loginBtn.click();
      await driver.sleep(3000);`);

    // 2. Replace link text locators
    content = content.replace(/By\.partialLinkText\('Register'\)/g, `By.xpath("//*[contains(text(), 'Register')]")`);
    content = content.replace(/By\.partialLinkText\('Forgot'\)/g, `By.xpath("//*[contains(text(), 'Forgot')]")`);
    content = content.replace(/By\.partialLinkText\('Login'\)/g, `By.xpath("//*[contains(text(), 'Login')]")`);
    content = content.replace(/By\.partialLinkText\('Back'\)/g, `By.xpath("//*[contains(text(), 'Back')]")`);
  } else {
    // login.test.js updates
    content = content.replace(/await driver\.get\(baseUrl \+ '\/#\/login'\);/g, "await driver.get(baseUrl);");
    content = content.replace(/test@example\.com/g, "test@test.com");
  }

  fs.writeFileSync(filePath, Buffer.from(content, encoding));
  console.log(`Successfully updated ${path.basename(filePath)}!`);
}

const compPath = path.join(__dirname, 'tests', 'comprehensive.test.js');
const loginPath = path.join(__dirname, 'tests', 'login.test.js');

fixFile(compPath, true);
fixFile(loginPath, false);
