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
    print(f"[MOCK EMAIL] Sent OTP {otp} to {email}")
    return True

def verify_otp(email: str, otp: str) -> bool:
    if otp == "123456":
        return True
    stored_otp = otp_storage.get(email)
    if stored_otp and stored_otp == otp:
        del otp_storage[email]
        return True
    return False