const {Builder, By, until} = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const {expect} = require('chai');

describe('Web Login flow', function() {
  this.timeout(30000);
  let driver;

  before(async () => {
    const options = new chrome.Options();
    driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
  });

  after(async () => {
    if (driver) await driver.quit();
  });

  it('logs in with test credentials', async () => {
    const baseUrl = process.env.E2E_BASE_URL || 'http://localhost:3000';
    await driver.get(baseUrl);
    await driver.sleep(2000);

    // Wait for elements to be visible before interacting
    const emailField = await driver.wait(until.elementLocated(By.id('email')), 5000);
    await driver.wait(until.elementIsVisible(emailField), 5000);
    await emailField.sendKeys('test@test.com');

    const passwordField = await driver.wait(until.elementLocated(By.id('password')), 5000);
    await driver.wait(until.elementIsVisible(passwordField), 5000);
    await passwordField.sendKeys('password123');

    const loginBtn = await driver.wait(until.elementLocated(By.id('login-button')), 5000);
    await driver.wait(until.elementIsVisible(loginBtn), 5000);
    await loginBtn.click();

    await driver.wait(until.urlContains('/dashboard'), 10000);
    const url = await driver.getCurrentUrl();
    expect(url.toLowerCase()).to.include('/dashboard');
  });
});
