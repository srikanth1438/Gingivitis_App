const { Builder, By } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

async function checkUrl(url) {
  const options = new chrome.Options();
  options.addArguments('--headless=new');
  const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
  
  try {
    console.log(`Checking ${url}...`);
    await driver.get(url);
    await new Promise(resolve => setTimeout(resolve, 3000));
    const currentUrl = await driver.getCurrentUrl();
    console.log(`  Current URL in browser: ${currentUrl}`);
    const button = await driver.findElement(By.id('register-button')).catch(() => null);
    if (button) {
      console.log(`  SUCCESS: found register-button!`);
    } else {
      console.log(`  FAILED: register-button not found.`);
    }
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await driver.quit();
  }
}

async function main() {
  await checkUrl('http://localhost:3000/#/register');
  await checkUrl('http://localhost:3000/#/Register');
  await checkUrl('http://localhost:3000/register');
  await checkUrl('http://localhost:3000/Register');
}

main();
