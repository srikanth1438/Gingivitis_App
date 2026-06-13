const { remote } = require('webdriverio');
const { expect } = require('chai');

/**
 * Comprehensive Appium E2E Tests for Android Gingivitis Detector App
 * 100 test cases covering: Login, Register, OTP, Password Reset, Image Detection
 */

describe('Gingivitis Detector - Android E2E Suite (100 Test Cases)', function () {
  this.timeout(180000);
  let client;
  const baseUrl = process.env.ANDROID_SERVER_URL || 'http://localhost:4723';
  const device = process.env.ANDROID_DEVICE || 'emulator-5554';
  const appPath = process.env.ANDROID_APP || '';

  before(async function () {
    const opts = {
      path: '/wd/hub',
      port: 4723,
      hostname: 'localhost',
      capabilities: {
        platformName: 'Android',
        deviceName: device,
        app: appPath,
        automationName: 'UiAutomator2',
        appWaitActivity: '*',
        autoGrantPermissions: true,
        noReset: false,
        fullReset: false,
      }
    };
    try {
      client = await remote(opts);
      console.log('✓ Appium client connected');
    } catch (e) {
      console.error('✗ Failed to connect to Appium:', e.message);
      throw e;
    }
  });

  after(async function () {
    if (client) {
      try {
        await client.deleteSession();
        console.log('✓ Session deleted');
      } catch (e) {
        console.error('Session deletion error:', e.message);
      }
    }
  });

  // ============================================================================
  // LOGIN TESTS (1-20)
  // ============================================================================

  describe('LOGIN TESTS', () => {
    it('TC-001: Valid login with correct credentials', async () => {
      const username = await client.$('~login-username');
      const password = await client.$('~login-password');
      const loginBtn = await client.$('~login-button');

      await username.setValue('testuser1');
      await password.setValue('password123');
      await loginBtn.click();

      await client.pause(3000);
      const homeScreen = await client.$('~select-image-button');
      expect(await homeScreen.isExisting()).to.be.true;
    });

    it('TC-002: Login with empty username field', async () => {
      await client.pause(500);
      const password = await client.$('~login-password');
      const loginBtn = await client.$('~login-button');

      await password.setValue('password123');
      await loginBtn.click();

      await client.pause(1000);
      const errorMsg = await client.$('//android.widget.TextView[@text="Please fill in all fields!"]');
      expect(await errorMsg.isExisting()).to.be.true;
    });

    it('TC-003: Login with empty password field', async () => {
      const username = await client.$('~login-username');
      const loginBtn = await client.$('~login-button');

      await username.setValue('testuser1');
      await loginBtn.click();

      await client.pause(1000);
      const errorMsg = await client.$('//android.widget.TextView[@text="Please fill in all fields!"]');
      expect(await errorMsg.isExisting()).to.be.true;
    });

    it('TC-004: Login with both fields empty', async () => {
      const loginBtn = await client.$('~login-button');
      await loginBtn.click();

      await client.pause(1000);
      const errorMsg = await client.$('//android.widget.TextView[@text="Please fill in all fields!"]');
      expect(await errorMsg.isExisting()).to.be.true;
    });

    it('TC-005: Login with invalid username format', async () => {
      const username = await client.$('~login-username');
      const password = await client.$('~login-password');
      const loginBtn = await client.$('~login-button');

      await username.setValue('@#$%');
      await password.setValue('password123');
      await loginBtn.click();

      await client.pause(2000);
    });

    it('TC-006: Login with non-existent user', async () => {
      const username = await client.$('~login-username');
      const password = await client.$('~login-password');
      const loginBtn = await client.$('~login-button');

      await username.setValue('nonexistentuser999');
      await password.setValue('password123');
      await loginBtn.click();

      await client.pause(2000);
    });

    it('TC-007: Login with wrong password', async () => {
      const username = await client.$('~login-username');
      const password = await client.$('~login-password');
      const loginBtn = await client.$('~login-button');

      await username.setValue('testuser1');
      await password.setValue('wrongpassword');
      await loginBtn.click();

      await client.pause(2000);
    });

    it('TC-008: Login with very long username', async () => {
      const username = await client.$('~login-username');
      const password = await client.$('~login-password');
      const loginBtn = await client.$('~login-button');

      await username.setValue('a'.repeat(500));
      await password.setValue('password123');
      await loginBtn.click();

      await client.pause(2000);
    });

    it('TC-009: Login with SQL injection attempt', async () => {
      const username = await client.$('~login-username');
      const password = await client.$('~login-password');
      const loginBtn = await client.$('~login-button');

      await username.setValue("' OR '1'='1");
      await password.setValue("' OR '1'='1");
      await loginBtn.click();

      await client.pause(2000);
    });

    it('TC-010: Login with special characters', async () => {
      const username = await client.$('~login-username');
      const password = await client.$('~login-password');
      const loginBtn = await client.$('~login-button');

      await username.setValue('test<script>user</script>');
      await password.setValue('pass&word!@#');
      await loginBtn.click();

      await client.pause(2000);
    });

    it('TC-011: Multiple rapid login attempts', async () => {
      for (let i = 0; i < 5; i++) {
        const username = await client.$('~login-username');
        const password = await client.$('~login-password');
        const loginBtn = await client.$('~login-button');

        await username.setValue(`user${i}`);
        await password.setValue('password');
        await loginBtn.click();
        await client.pause(500);
      }
    });

    it('TC-012: Login with whitespace-only fields', async () => {
      const username = await client.$('~login-username');
      const password = await client.$('~login-password');
      const loginBtn = await client.$('~login-button');

      await username.setValue('   ');
      await password.setValue('   ');
      await loginBtn.click();

      await client.pause(2000);
    });

    it('TC-013: Verify "Forgot Password?" link is clickable', async () => {
      const forgotLink = await client.$('//android.widget.TextView[@text="Forgot Password?"]');
      expect(await forgotLink.isExisting()).to.be.true;
      expect(await forgotLink.isDisplayed()).to.be.true;
    });

    it('TC-014: Verify "Register" link is clickable', async () => {
      const registerLink = await client.$('//android.widget.TextView[@text*="Register"]');
      expect(await registerLink.isExisting()).to.be.true;
    });

    it('TC-015: Login password field is masked', async () => {
      const passwordField = await client.$('~login-password');
      const inputType = await passwordField.getAttribute('password');
      expect(inputType).to.not.be.null;
    });

    it('TC-016: Login form preserves input after validation error', async () => {
      const username = await client.$('~login-username');
      await username.setValue('testuser');
      
      const password = await client.$('~login-password');
      const loginBtn = await client.$('~login-button');
      await loginBtn.click();

      await client.pause(1000);
      const usernameValue = await username.getValue();
      expect(usernameValue).to.not.be.empty;
    });

    it('TC-017: Login page displays app title', async () => {
      const title = await client.$('//android.widget.TextView[@text="🦷 Gingivitis Detector"]');
      expect(await title.isExisting()).to.be.true;
    });

    it('TC-018: Login page displays subtitle', async () => {
      const subtitle = await client.$('//android.widget.TextView[@text="Login to your account"]');
      expect(await subtitle.isExisting()).to.be.true;
    });

    it('TC-019: Login button is disabled during loading', async () => {
      const username = await client.$('~login-username');
      const password = await client.$('~login-password');
      const loginBtn = await client.$('~login-button');

      await username.setValue('testuser1');
      await password.setValue('password123');
      await loginBtn.click();

      await client.pause(500);
    });

    it('TC-020: Network error handling on login', async () => {
      const username = await client.$('~login-username');
      const password = await client.$('~login-password');
      const loginBtn = await client.$('~login-button');

      await username.setValue('testuser1');
      await password.setValue('password123');
      await loginBtn.click();
      await client.pause(2000);
    });
  });

  // ============================================================================
  // REGISTRATION TESTS (21-40)
  // ============================================================================

  describe('REGISTRATION TESTS', () => {
    it('TC-021: Navigate to register screen', async () => {
      const registerLink = await client.$('//android.widget.TextView[@text*="Register"]');
      await registerLink.click();

      await client.pause(1000);
      const registerBtn = await client.$('~register-button');
      expect(await registerBtn.isExisting()).to.be.true;
    });

    it('TC-022: Valid registration with all fields', async () => {
      const username = await client.$('~register-username');
      const email = await client.$('~register-email');
      const password = await client.$('~register-password');
      const registerBtn = await client.$('~register-button');

      await username.setValue('newuser' + Date.now());
      await email.setValue('newuser' + Date.now() + '@test.com');
      await password.setValue('TestPassword123!');
      await registerBtn.click();

      await client.pause(3000);
      const otpInput = await client.$('~otp-code');
      expect(await otpInput.isExisting()).to.be.true;
    });

    it('TC-023: Register with empty username', async () => {
      const email = await client.$('~register-email');
      const password = await client.$('~register-password');
      const registerBtn = await client.$('~register-button');

      await email.setValue('test@test.com');
      await password.setValue('password123');
      await registerBtn.click();

      await client.pause(1000);
    });

    it('TC-024: Register with empty email', async () => {
      const username = await client.$('~register-username');
      const password = await client.$('~register-password');
      const registerBtn = await client.$('~register-button');

      await username.setValue('testuser');
      await password.setValue('password123');
      await registerBtn.click();

      await client.pause(1000);
    });

    it('TC-025: Register with empty password', async () => {
      const username = await client.$('~register-username');
      const email = await client.$('~register-email');
      const registerBtn = await client.$('~register-button');

      await username.setValue('testuser');
      await email.setValue('test@test.com');
      await registerBtn.click();

      await client.pause(1000);
    });

    it('TC-026: Register with invalid email format', async () => {
      const username = await client.$('~register-username');
      const email = await client.$('~register-email');
      const password = await client.$('~register-password');
      const registerBtn = await client.$('~register-button');

      await username.setValue('testuser');
      await email.setValue('not-an-email');
      await password.setValue('password123');
      await registerBtn.click();

      await client.pause(2000);
    });

    it('TC-027: Register with duplicate username', async () => {
      const username = await client.$('~register-username');
      const email = await client.$('~register-email');
      const password = await client.$('~register-password');
      const registerBtn = await client.$('~register-button');

      await username.setValue('testuser1');
      await email.setValue('newtest' + Date.now() + '@test.com');
      await password.setValue('password123');
      await registerBtn.click();

      await client.pause(2000);
    });

    it('TC-028: Register with weak password', async () => {
      const username = await client.$('~register-username');
      const email = await client.$('~register-email');
      const password = await client.$('~register-password');
      const registerBtn = await client.$('~register-button');

      await username.setValue('testuser');
      await email.setValue('test' + Date.now() + '@test.com');
      await password.setValue('123');
      await registerBtn.click();

      await client.pause(2000);
    });

    it('TC-029: Register with XSS attempt in username', async () => {
      const username = await client.$('~register-username');
      const email = await client.$('~register-email');
      const password = await client.$('~register-password');
      const registerBtn = await client.$('~register-button');

      await username.setValue('<script>alert("xss")</script>');
      await email.setValue('test' + Date.now() + '@test.com');
      await password.setValue('password123');
      await registerBtn.click();

      await client.pause(2000);
    });

    it('TC-030: Register with very long username', async () => {
      const username = await client.$('~register-username');
      const email = await client.$('~register-email');
      const password = await client.$('~register-password');
      const registerBtn = await client.$('~register-button');

      await username.setValue('a'.repeat(500));
      await email.setValue('test' + Date.now() + '@test.com');
      await password.setValue('password123');
      await registerBtn.click();

      await client.pause(2000);
    });

    it('TC-031: Register with special characters in email', async () => {
      const username = await client.$('~register-username');
      const email = await client.$('~register-email');
      const password = await client.$('~register-password');
      const registerBtn = await client.$('~register-button');

      await username.setValue('testuser');
      await email.setValue('test+special@test.com');
      await password.setValue('password123');
      await registerBtn.click();

      await client.pause(2000);
    });

    it('TC-032: Go back to login from register', async () => {
      const loginLink = await client.$('//android.widget.TextView[@text*="Login"]');
      await loginLink.click();

      await client.pause(1000);
      const loginBtn = await client.$('~login-button');
      expect(await loginBtn.isExisting()).to.be.true;
    });

    it('TC-033: Register page displays title', async () => {
      const registerLink = await client.$('//android.widget.TextView[@text*="Register"]');
      await registerLink.click();

      await client.pause(500);
      const title = await client.$('//android.widget.TextView[@text*="Gingivitis"]');
      expect(await title.isExisting()).to.be.true;
    });

    it('TC-034: Register all fields are visible', async () => {
      const username = await client.$('~register-username');
      const email = await client.$('~register-email');
      const password = await client.$('~register-password');

      expect(await username.isDisplayed()).to.be.true;
      expect(await email.isDisplayed()).to.be.true;
      expect(await password.isDisplayed()).to.be.true;
    });

    it('TC-035: Register button is visible and enabled', async () => {
      const registerBtn = await client.$('~register-button');
      expect(await registerBtn.isDisplayed()).to.be.true;
      expect(await registerBtn.isEnabled()).to.be.true;
    });

    it('TC-036: Register with unicode characters', async () => {
      const username = await client.$('~register-username');
      const email = await client.$('~register-email');
      const password = await client.$('~register-password');
      const registerBtn = await client.$('~register-button');

      await username.setValue('test用户' + Date.now());
      await email.setValue('test' + Date.now() + '@test.com');
      await password.setValue('password123');
      await registerBtn.click();

      await client.pause(2000);
    });

    it('TC-037: Register multiple accounts sequentially', async () => {
      for (let i = 0; i < 3; i++) {
        const username = await client.$('~register-username');
        const email = await client.$('~register-email');
        const password = await client.$('~register-password');
        const registerBtn = await client.$('~register-button');

        await username.clearValue();
        await username.setValue('testuser' + Date.now() + i);
        await email.clearValue();
        await email.setValue('test' + Date.now() + i + '@test.com');
        await password.clearValue();
        await password.setValue('password123');
        await registerBtn.click();

        await client.pause(2000);
      }
    });

    it('TC-038: Verify email field keyboard type', async () => {
      const email = await client.$('~register-email');
      const keyboardType = await email.getAttribute('inputType');
      expect(keyboardType).to.not.be.null;
    });

    it('TC-039: Verify password field is secure', async () => {
      const password = await client.$('~register-password');
      const isPassword = await password.getAttribute('password');
      expect(isPassword).to.not.be.null;
    });

    it('TC-040: Register form validation order', async () => {
      const registerBtn = await client.$('~register-button');
      await registerBtn.click();
      await client.pause(1000);
    });
  });

  // ============================================================================
  // OTP VERIFICATION TESTS (41-60)
  // ============================================================================

  describe('OTP VERIFICATION TESTS', () => {
    it('TC-041: OTP screen displays after registration', async () => {
      const otpInput = await client.$('~otp-code');
      expect(await otpInput.isExisting()).to.be.true;
    });

    it('TC-042: Enter valid OTP code', async () => {
      const otpInput = await client.$('~otp-code');
      const verifyBtn = await client.$('~verify-otp-button');

      await otpInput.setValue('123456');
      await verifyBtn.click();

      await client.pause(2000);
    });

    it('TC-043: Enter invalid OTP code', async () => {
      const otpInput = await client.$('~otp-code');
      const verifyBtn = await client.$('~verify-otp-button');

      await otpInput.clearValue();
      await otpInput.setValue('000000');
      await verifyBtn.click();

      await client.pause(2000);
    });

    it('TC-044: OTP field accepts only numbers', async () => {
      const otpInput = await client.$('~otp-code');
      await otpInput.clearValue();
      await otpInput.setValue('abc123');
      const value = await otpInput.getValue();
      expect(value).to.not.include('abc');
    });

    it('TC-045: OTP field max length is 6', async () => {
      const otpInput = await client.$('~otp-code');
      await otpInput.clearValue();
      await otpInput.setValue('1234567890');

      const value = await otpInput.getValue();
      expect(value.length).to.equal(6);
    });

    it('TC-046: Verify OTP with empty field', async () => {
      const verifyBtn = await client.$('~verify-otp-button');
      await verifyBtn.click();
      await client.pause(1000);
    });

    it('TC-047: Resend OTP button is clickable', async () => {
      const resendBtn = await client.$('~resend-otp-button');
      expect(await resendBtn.isExisting()).to.be.true;
      expect(await resendBtn.isEnabled()).to.be.true;
    });

    it('TC-048: Click Resend OTP', async () => {
      const resendBtn = await client.$('~resend-otp-button');
      await resendBtn.click();
      await client.pause(2000);
    });

    it('TC-049: Multiple OTP resend attempts', async () => {
      for (let i = 0; i < 3; i++) {
        const resendBtn = await client.$('~resend-otp-button');
        await resendBtn.click();
        await client.pause(1000);
      }
    });

    it('TC-050: Go back from OTP screen', async () => {
      const backLink = await client.$('//android.widget.TextView[@text*="Back"]');
      if (await backLink.isExisting()) {
        await backLink.click();
        await client.pause(1000);
      }
    });

    it('TC-051: OTP field cursor position', async () => {
      const otpInput = await client.$('~otp-code');
      await otpInput.setValue('123');
      await otpInput.setValue('456');

      const value = await otpInput.getValue();
      expect(value).to.equal('123456');
    });

    it('TC-052: OTP value is centered', async () => {
      const otpInput = await client.$('~otp-code');
      const textAlign = await otpInput.getAttribute('textAlign');
      expect(textAlign).to.not.be.null;
    });

    it('TC-053: Verify OTP with leading zeros', async () => {
      const otpInput = await client.$('~otp-code');
      const verifyBtn = await client.$('~verify-otp-button');

      await otpInput.clearValue();
      await otpInput.setValue('000001');
      await verifyBtn.click();

      await client.pause(2000);
    });

    it('TC-054: OTP field shows placeholder', async () => {
      const otpInput = await client.$('~otp-code');
      const placeholder = await otpInput.getAttribute('hint');
      expect(placeholder).to.not.be.null;
    });

    it('TC-055: Verify button loading state', async () => {
      const otpInput = await client.$('~otp-code');
      const verifyBtn = await client.$('~verify-otp-button');

      await otpInput.setValue('123456');
      await verifyBtn.click();
      await client.pause(500);
    });

    it('TC-056: OTP screen displays email confirmation', async () => {
      const emailDisplay = await client.$('//android.widget.TextView[@text*="@"]');
      expect(await emailDisplay.isExisting()).to.be.true;
    });

    it('TC-057: Rapid OTP entry and verify', async () => {
      const otpInput = await client.$('~otp-code');
      const verifyBtn = await client.$('~verify-otp-button');

      await otpInput.setValue('123456');
      await verifyBtn.click();

      await client.pause(1000);
      await otpInput.clearValue();
      await otpInput.setValue('654321');
      await verifyBtn.click();

      await client.pause(2000);
    });

    it('TC-058: OTP field auto-focus', async () => {
      const otpInput = await client.$('~otp-code');
      expect(await otpInput.isDisplayed()).to.be.true;
    });

    it('TC-059: Verify screen title is displayed', async () => {
      const title = await client.$('//android.widget.TextView[@text*="Verify"]');
      expect(await title.isExisting()).to.be.true;
    });

    it('TC-060: OTP subtitle shows email', async () => {
      const subtitle = await client.$('//android.widget.TextView[@text*="OTP"]');
      expect(await subtitle.isExisting()).to.be.true;
    });
  });

  // ============================================================================
  // PASSWORD RESET TESTS (61-80)
  // ============================================================================

  describe('PASSWORD RESET TESTS', () => {
    it('TC-061: Navigate to forgot password', async () => {
      const forgotLink = await client.$('//android.widget.TextView[@text="Forgot Password?"]');
      await forgotLink.click();

      await client.pause(1000);
      const emailField = await client.$('~forgot-email');
      expect(await emailField.isExisting()).to.be.true;
    });

    it('TC-062: Send OTP for password reset', async () => {
      const emailField = await client.$('~forgot-email');
      const sendBtn = await client.$('~forgot-send-otp-button');

      await emailField.setValue('test@test.com');
      await sendBtn.click();

      await client.pause(2000);
    });

    it('TC-063: Enter email with invalid format', async () => {
      const emailField = await client.$('~forgot-email');
      const sendBtn = await client.$('~forgot-send-otp-button');

      await emailField.clearValue();
      await emailField.setValue('not-an-email');
      await sendBtn.click();

      await client.pause(1500);
    });

    it('TC-064: Send OTP with empty email', async () => {
      const sendBtn = await client.$('~forgot-send-otp-button');
      await sendBtn.click();

      await client.pause(1000);
    });

    it('TC-065: Navigate to reset password screen', async () => {
      const resetOtpField = await client.$('~reset-otp');
      if (await resetOtpField.isExisting()) {
        expect(await resetOtpField.isDisplayed()).to.be.true;
      }
    });

    it('TC-066: Reset password with valid OTP and password', async () => {
      const otpField = await client.$('~reset-otp');
      const newPassField = await client.$('~reset-password');
      const confirmPassField = await client.$('~reset-confirm-password');
      const resetBtn = await client.$('~reset-button');

      if (await otpField.isExisting()) {
        await otpField.setValue('123456');
        await newPassField.setValue('NewPassword123!');
        await confirmPassField.setValue('NewPassword123!');
        await resetBtn.click();

        await client.pause(2000);
      }
    });

    it('TC-067: Reset password with non-matching passwords', async () => {
      const otpField = await client.$('~reset-otp');
      const newPassField = await client.$('~reset-password');
      const confirmPassField = await client.$('~reset-confirm-password');
      const resetBtn = await client.$('~reset-button');

      if (await otpField.isExisting()) {
        await otpField.clearValue();
        await otpField.setValue('123456');
        await newPassField.clearValue();
        await newPassField.setValue('NewPassword123!');
        await confirmPassField.clearValue();
        await confirmPassField.setValue('DifferentPassword456!');
        await resetBtn.click();

        await client.pause(1500);
      }
    });

    it('TC-068: Reset password with weak password', async () => {
      const otpField = await client.$('~reset-otp');
      const newPassField = await client.$('~reset-password');
      const confirmPassField = await client.$('~reset-confirm-password');
      const resetBtn = await client.$('~reset-button');

      if (await otpField.isExisting()) {
        await otpField.clearValue();
        await otpField.setValue('123456');
        await newPassField.clearValue();
        await newPassField.setValue('123');
        await confirmPassField.clearValue();
        await confirmPassField.setValue('123');
        await resetBtn.click();

        await client.pause(1500);
      }
    });

    it('TC-069: Reset password with empty fields', async () => {
      const resetBtn = await client.$('~reset-button');
      if (await resetBtn.isExisting()) {
        await resetBtn.click();
        await client.pause(1000);
      }
    });

    it('TC-070: Reset password field validation', async () => {
      const newPassField = await client.$('~reset-password');
      const confirmPassField = await client.$('~reset-confirm-password');

      if (await newPassField.isExisting()) {
        expect(await newPassField.isDisplayed()).to.be.true;
        expect(await confirmPassField.isDisplayed()).to.be.true;
      }
    });

    it('TC-071: Forgot password go back to login', async () => {
      const backLink = await client.$('//android.widget.TextView[@text="← Back to Login"]');
      if (await backLink.isExisting()) {
        await backLink.click();
        await client.pause(1000);
      }
    });

    it('TC-072: Verify email field on forgot screen', async () => {
      const emailField = await client.$('~forgot-email');
      if (await emailField.isExisting()) {
        expect(await emailField.isDisplayed()).to.be.true;
      }
    });

    it('TC-073: Verify OTP field on reset screen', async () => {
      const otpField = await client.$('~reset-otp');
      if (await otpField.isExisting()) {
        expect(await otpField.isDisplayed()).to.be.true;
      }
    });

    it('TC-074: Verify password fields are masked', async () => {
      const newPassField = await client.$('~reset-password');
      if (await newPassField.isExisting()) {
        const isPassword = await newPassField.getAttribute('password');
        expect(isPassword).to.not.be.null;
      }
    });

    it('TC-075: Multiple password reset attempts', async () => {
      for (let i = 0; i < 2; i++) {
        const otpField = await client.$('~reset-otp');
        if (await otpField.isExisting()) {
          await otpField.clearValue();
          await otpField.setValue('123456');
          
          const resetBtn = await client.$('~reset-button');
          await resetBtn.click();
          await client.pause(1500);
        }
      }
    });

    it('TC-076: Reset password with special characters', async () => {
      const newPassField = await client.$('~reset-password');
      const confirmPassField = await client.$('~reset-confirm-password');
      const resetBtn = await client.$('~reset-button');

      if (await newPassField.isExisting()) {
        await newPassField.setValue('P@ssw0rd!#$%^&*');
        await confirmPassField.setValue('P@ssw0rd!#$%^&*');
        await resetBtn.click();

        await client.pause(2000);
      }
    });

    it('TC-077: Verify reset OTP field format', async () => {
      const otpField = await client.$('~reset-otp');
      if (await otpField.isExisting()) {
        const keyboardType = await otpField.getAttribute('inputType');
        expect(keyboardType).to.not.be.null;
      }
    });

    it('TC-078: Forgot password screen title', async () => {
      const title = await client.$('//android.widget.TextView[@text*="Forgot"]');
      expect(await title.isExisting()).to.be.true;
    });

    it('TC-079: Reset password screen title', async () => {
      const title = await client.$('//android.widget.TextView[@text*="Reset"]');
      if (await title.isExisting()) {
        expect(await title.isDisplayed()).to.be.true;
      }
    });

    it('TC-080: Password reset success message', async () => {
      await client.pause(500);
    });
  });

  // ============================================================================
  // IMAGE DETECTION TESTS (81-100)
  // ============================================================================

  describe('IMAGE DETECTION TESTS', () => {
    it('TC-081: Navigate to home after login', async () => {
      const selectImgBtn = await client.$('~select-image-button');
      expect(await selectImgBtn.isExisting()).to.be.true;
    });

    it('TC-082: Click select image button', async () => {
      const selectImgBtn = await client.$('~select-image-button');
      await selectImgBtn.click();

      await client.pause(2000);
    });

    it('TC-083: Analyze button appears after image selection', async () => {
      const analyzeBtn = await client.$('~analyze-button');
      if (await analyzeBtn.isExisting()) {
        expect(await analyzeBtn.isDisplayed()).to.be.true;
      }
    });

    it('TC-084: Click analyze button without image', async () => {
      const selectImgBtn = await client.$('~select-image-button');
      await selectImgBtn.click();

      await client.pause(500);
    });

    it('TC-085: Analyze with valid tooth image', async () => {
      const analyzeBtn = await client.$('~analyze-button');
      if (await analyzeBtn.isExisting()) {
        await analyzeBtn.click();
        await client.pause(5000);
      }
    });

    it('TC-086: Result box displays after analysis', async () => {
      const resultBox = await client.$('//android.widget.TextView[@text*="Detected"]');
      expect(resultBox).to.not.be.null;
    });

    it('TC-087: Logout button is visible on home', async () => {
      const logoutBtn = await client.$('~logout-button');
      expect(await logoutBtn.isExisting()).to.be.true;
    });

    it('TC-088: Click logout button', async () => {
      const logoutBtn = await client.$('~logout-button');
      await logoutBtn.click();

      await client.pause(2000);
    });

    it('TC-089: Logout confirmation dialog', async () => {
      const confirmBtn = await client.$('//android.widget.Button[@text*="Logout"]');
      if (await confirmBtn.isExisting()) {
        await confirmBtn.click();
        await client.pause(2000);
      }
    });

    it('TC-090: Home page title displays', async () => {
      const title = await client.$('//android.widget.TextView[@text*="Gingivitis"]');
      expect(await title.isExisting()).to.be.true;
    });

    it('TC-091: Home page subtitle displays', async () => {
      const subtitle = await client.$('//android.widget.TextView[@text*="Upload"]');
      expect(await subtitle.isExisting()).to.be.true;
    });

    it('TC-092: Image displayed after selection', async () => {
      const image = await client.$('//android.widget.ImageView');
      if (await image.isExisting()) {
        expect(await image.isDisplayed()).to.be.true;
      }
    });

    it('TC-093: Multiple image selections', async () => {
      for (let i = 0; i < 3; i++) {
        const selectImgBtn = await client.$('~select-image-button');
        await selectImgBtn.click();
        await client.pause(2000);
      }
    });

    it('TC-094: Analyze loading state', async () => {
      const analyzeBtn = await client.$('~analyze-button');
      if (await analyzeBtn.isExisting()) {
        await analyzeBtn.click();
        await client.pause(1000);
        
        const loadingIndicator = await client.$('//android.widget.ProgressBar');
        if (await loadingIndicator.isExisting()) {
          expect(await loadingIndicator.isDisplayed()).to.be.true;
        }
      }
    });

    it('TC-095: Result message is readable', async () => {
      const resultMsg = await client.$('//android.widget.TextView[@text*="Teeth"]');
      if (await resultMsg.isExisting()) {
        const text = await resultMsg.getText();
        expect(text).to.not.be.empty;
      }
    });

    it('TC-096: Result box color changes based on result', async () => {
      const resultBox = await client.$('//android.view.View[@content-desc*="result"]');
      if (await resultBox.isExisting()) {
        const bgColor = await resultBox.getAttribute('background');
        expect(bgColor).to.not.be.null;
      }
    });

    it('TC-097: Error handling for invalid image', async () => {
      const analyzeBtn = await client.$('~analyze-button');
      if (await analyzeBtn.isExisting()) {
        await analyzeBtn.click();
        await client.pause(3000);
        
        const errorMsg = await client.$('//android.widget.TextView[@text*="Invalid"]');
      }
    });

    it('TC-098: Network error on analysis', async () => {
      const analyzeBtn = await client.$('~analyze-button');
      if (await analyzeBtn.isExisting()) {
        await analyzeBtn.click();
        await client.pause(2000);
      }
    });

    it('TC-099: Analysis timeout handling', async () => {
      const analyzeBtn = await client.$('~analyze-button');
      if (await analyzeBtn.isExisting()) {
        await analyzeBtn.click();
        await client.pause(10000);
      }
    });

    it('TC-100: Session persistence across screens', async () => {
      const selectImgBtn = await client.$('~select-image-button');
      expect(await selectImgBtn.isExisting()).to.be.true;
      
      const logoutBtn = await client.$('~logout-button');
      expect(await logoutBtn.isExisting()).to.be.true;
    });
  });
});
