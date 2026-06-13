const { remote } = require('webdriverio');
const { expect } = require('chai');

describe('Android App Login (Appium)', function () {
  this.timeout(120000);
  let client;

  before(async () => {
    const opts = {
      path: '/wd/hub',
      port: 4723,
      capabilities: {
        platformName: 'Android',
        deviceName: process.env.ANDROID_DEVICE || 'emulator-5554',
        app: process.env.ANDROID_APP || '',
        automationName: 'UiAutomator2',
        appWaitActivity: '*'
      }
    };
    client = await remote(opts);
  });

  after(async () => {
    if (client) await client.deleteSession();
  });

  it('performs a login flow', async () => {
    const emailSel = process.env.E2E_EMAIL_ACCESSIBILITY_ID || 'email';
    const passSel = process.env.E2E_PASS_ACCESSIBILITY_ID || 'password';
    const loginSel = process.env.E2E_LOGIN_BTN_ACCESSIBILITY_ID || 'login-button';

    const emailEl = await client.$(`~${emailSel}`);
    await emailEl.setValue('test@example.com');
    const passEl = await client.$(`~${passSel}`);
    await passEl.setValue('password123');
    const btn = await client.$(`~${loginSel}`);
    await btn.click();

    await client.pause(5000);
    const dashboard = await client.$('~dashboard');
    const exists = await dashboard.isExisting();
    expect(exists).to.be.true;
  });
});
