import smtplib
import random
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Replace with your Gmail and App Password
GMAIL_USER = "saisrikanth.kondapalli@gmail.com"
GMAIL_APP_PASSWORD = "xdbj waub rbud unbz"

# Store OTPs temporarily in memory
otp_storage = {}

def generate_otp(email: str) -> str:
    otp = str(random.randint(100000, 999999))
    otp_storage[email] = otp
    return otp

def send_otp_email(email: str, otp: str) -> bool:
    try:
        msg = MIMEMultipart()
        msg['From'] = GMAIL_USER
        msg['To'] = email
        msg['Subject'] = "Your Gingivitis App OTP"

        body = f"""
        Hello!

        Your OTP for Gingivitis Detector App is:

        🔐 {otp}

        This OTP is valid for 5 minutes.
        Do not share this with anyone.

        Regards,
        Gingivitis Detector Team
        """
        msg.attach(MIMEText(body, 'plain'))

        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(GMAIL_USER, GMAIL_APP_PASSWORD)
        server.sendmail(GMAIL_USER, email, msg.as_string())
        server.quit()
        return True
    except Exception as e:
        print(f"Email error: {e}")
        return False

def verify_otp(email: str, otp: str) -> bool:
    stored_otp = otp_storage.get(email)
    if stored_otp and stored_otp == otp:
        del otp_storage[email]
        return True
    return False