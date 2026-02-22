import os
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from pydantic import EmailStr
from typing import List, Optional
from dotenv import load_dotenv

load_dotenv()

# Configuration
MAIL_USERNAME = os.getenv("MAIL_USERNAME")
MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")
MAIL_FROM = os.getenv("MAIL_FROM", "noreply@example.com")
MAIL_PORT = int(os.getenv("MAIL_PORT", 587))
MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.sendgrid.net")
MAIL_STARTTLS = True
MAIL_SSL_TLS = False
USE_CREDENTIALS = True
VALIDATE_CERTS = True

# Check if credentials are provided for actual sending
USE_EMAIL_SERVICE = bool(MAIL_USERNAME and MAIL_PASSWORD)

conf = None
if USE_EMAIL_SERVICE:
    conf = ConnectionConfig(
        MAIL_USERNAME=MAIL_USERNAME,
        MAIL_PASSWORD=MAIL_PASSWORD,
        MAIL_FROM=MAIL_FROM,
        MAIL_PORT=MAIL_PORT,
        MAIL_SERVER=MAIL_SERVER,
        MAIL_STARTTLS=MAIL_STARTTLS,
        MAIL_SSL_TLS=MAIL_SSL_TLS,
        USE_CREDENTIALS=USE_CREDENTIALS,
        VALIDATE_CERTS=VALIDATE_CERTS
    )

async def send_reset_email(to_email: str, reset_link: str):
    """
    Sends a password reset email.
    If credentials are not configured, logs the link to console.
    """
    subject = "Password Reset Request"

    html = f"""
    <html>
        <body>
            <p>Hello,</p>
            <p>You requested a password reset for your Hand Pose Trainer account.</p>
            <p>Click the link below to reset your password:</p>
            <p>
                <a href="{reset_link}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p>{reset_link}</p>
            <p>If you didn't ask for this, you can ignore this email.</p>
            <br>
            <p>This link will expire in 1 hour.</p>
        </body>
    </html>
    """

    if USE_EMAIL_SERVICE and conf:
        message = MessageSchema(
            subject=subject,
            recipients=[to_email],
            body=html,
            subtype=MessageType.html
        )
        fm = FastMail(conf)
        await fm.send_message(message)
        print(f"Email sent to {to_email}")
    else:
        print(f"\n==========================================")
        print(f"EMAIL SERVICE NOT CONFIGURED (Simulated):")
        print(f"To: {to_email}")
        print(f"Subject: {subject}")
        print(f"Link: {reset_link}")
        print(f"==========================================\n")
