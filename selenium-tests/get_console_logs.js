const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

async function main() {
  const options = new chrome.Options();
  options.addArguments('--headless=new');
  const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
  
  try {
    console.log('Navigating to http://localhost:3000/#/register...');
    await driver.get('http://localhost:3000/#/register');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('Retrieving console logs:');
    const logs = await driver.manage().logs().get('browser');
    console.log(JSON.stringify(logs, null, 2));
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await driver.quit();
  }
}

main();
