from fastapi import FastAPI, File, UploadFile, Depends, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel, validator
from ultralytics import YOLO
from PIL import Image
import io
import os
import uvicorn
import re
from pathlib import Path
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from database import get_db, create_tables, User
from schemas import UserCreate, UserLogin, Token
from auth import hash_password, verify_password, create_access_token, decode_token
from otp import generate_otp, send_otp_email, verify_otp

app = FastAPI()

# Rate Limiter
limiter = Limiter(key_func=get_remote_address)
LOGIN_RATE_LIMIT = os.getenv("LOGIN_RATE_LIMIT", "5/minute")
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = Path(os.getenv("MODEL_PATH", Path(__file__).with_name("best.pt")))
model = None


def get_model():
    global model
    if model is not None:
        return model

    if os.getenv("SKIP_MODEL_LOAD", "").lower() in {"1", "true", "yes"}:
        raise HTTPException(status_code=503, detail="Model loading is disabled")

    if not MODEL_PATH.exists():
        raise HTTPException(status_code=503, detail=f"Model file not found: {MODEL_PATH}")

    model = YOLO(str(MODEL_PATH))
    return model

create_tables()

# Seed default test user for E2E tests
from database import SessionLocal
db_session = SessionLocal()
try:
    existing = db_session.query(User).filter(User.username == "test@test.com").first()
    if not existing:
        db_user = User(
            username="test@test.com",
            email="test@test.com",
            password=hash_password("password123")
        )
        db_session.add(db_user)
        db_session.commit()
        print("✓ E2E test user seeded successfully")
except Exception as e:
    print("⚠ E2E test user seeding failed:", e)
finally:
    db_session.close()

@app.exception_handler(RateLimitExceeded)
async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Rate limit exceeded. Please try again later."},
    )

# ──────────────────────────────────────────
# SECURITY UTILITIES
# ──────────────────────────────────────────

def validate_email(email: str) -> bool:
    """Validate email format to prevent SQL injection"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_username(username: str) -> bool:
    """Validate username format"""
    pattern = r'^[a-zA-Z0-9_-]{3,20}$'
    return re.match(pattern, username) is not None

async def get_current_user(authorization: str = Header(None)):
    """Extract and validate JWT token from Authorization header"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authentication scheme")
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid authorization header format")
    
    username = decode_token(token)
    if not username:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    return username

# ──────────────────────────────────────────
# PYDANTIC MODELS
# ──────────────────────────────────────────

class ForgotPassword(BaseModel):
    email: str

    @validator('email')
    def validate_email_field(cls, value):
        if not validate_email(value):
            raise ValueError('Invalid email format')
        return value

class ResetPassword(BaseModel):
    email: str
    new_password: str

    @validator('email')
    def validate_email_field(cls, value):
        if not validate_email(value):
            raise ValueError('Invalid email format')
        return value

# ──────────────────────────────────────────
# AUTH ROUTES
# ──────────────────────────────────────────

@app.post("/register", response_model=Token)
def register(user: UserCreate, db: Session = Depends(get_db)):
    # Input validation to prevent SQL injection
    if not validate_email(user.email):
        raise HTTPException(status_code=400, detail="Invalid email format")
    
    if not validate_username(user.username):
        raise HTTPException(status_code=400, detail="Username must be 3-20 characters, alphanumeric, underscore or dash")
    
    if len(user.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    
    existing_user = db.query(User).filter(User.username == user.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already taken!")

    existing_email = db.query(User).filter(User.email == user.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered!")

    new_user = User(
        username=user.username,
        email=user.email,
        password=hash_password(user.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token(data={"sub": user.username})
    return {"access_token": token, "token_type": "bearer"}


@app.post("/login", response_model=Token)
@limiter.limit(LOGIN_RATE_LIMIT)
def login(request: Request, user: UserLogin, db: Session = Depends(get_db)):
    """Login endpoint with rate limiting (5 attempts per minute)"""
    db_user = db.query(User).filter(User.username == user.username).first()
    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid username or password!")

    if not verify_password(user.password, db_user.password):
        raise HTTPException(status_code=400, detail="Invalid username or password!")

    token = create_access_token(data={"sub": user.username})
    return {"access_token": token, "token_type": "bearer"}


# ──────────────────────────────────────────
# OTP ROUTES
# ──────────────────────────────────────────

@app.post("/send-otp")
def send_otp(user: UserCreate, db: Session = Depends(get_db)):
    """Send OTP for registration with input validation"""
    # Input validation to prevent SQL injection
    if not validate_email(user.email):
        raise HTTPException(status_code=400, detail="Invalid email format")
    
    if not validate_username(user.username):
        raise HTTPException(status_code=400, detail="Username must be 3-20 characters, alphanumeric, underscore or dash")
    
    existing_user = db.query(User).filter(User.username == user.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already taken!")

    existing_email = db.query(User).filter(User.email == user.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered!")

    otp = generate_otp(user.email)
    success = send_otp_email(user.email, otp)

    if not success:
        raise HTTPException(status_code=500, detail="Failed to send OTP email!")

    return {"message": "OTP sent successfully to your email!"}


@app.post("/verify-otp")
def verify_otp_route(user: UserCreate, otp_code: str, db: Session = Depends(get_db)):
    if not verify_otp(user.email, otp_code):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP!")

    new_user = User(
        username=user.username,
        email=user.email,
        password=hash_password(user.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "Account created successfully! Please login."}


# ──────────────────────────────────────────
# FORGOT PASSWORD ROUTES
# ──────────────────────────────────────────

@app.post("/forgot-password")
def forgot_password(data: ForgotPassword, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=400, detail="Email not found!")

    otp = generate_otp(data.email)
    success = send_otp_email(data.email, otp)

    if not success:
        raise HTTPException(status_code=500, detail="Failed to send OTP email!")

    return {"message": "OTP sent to your email!"}


@app.post("/reset-password")
def reset_password(data: ResetPassword, otp_code: str, db: Session = Depends(get_db)):
    if not verify_otp(data.email, otp_code):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP!")

    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=400, detail="Email not found!")

    user.password = hash_password(data.new_password)
    db.commit()

    return {"message": "Password reset successfully! Please login."}


# ──────────────────────────────────────────
# DETECT ROUTE
# ──────────────────────────────────────────

@app.post("/detect")
async def detect_gingivitis(file: UploadFile = File(...), current_user: str = Depends(get_current_user)):
    """Gingivitis detection with JWT authentication"""
    contents = await file.read()
    try:
        image = Image.open(io.BytesIO(contents))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid or corrupted image file")

    print("Image received! Analyzing...")
    try:
        results = get_model()(image, conf=0.5)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Image analysis failed: {str(exc)[:120]}")

    print("Detections found:", len(results[0].boxes))

    detections = []
    tooth_found = False

    for result in results:
        for box in result.boxes:
            label = result.names[int(box.cls)]
            confidence = float(box.conf)

            # Only accept detections with confidence > 50%
            if confidence < 0.5:
                continue

            # Check detection box size (reject tiny false detections)
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            box_width = x2 - x1
            box_height = y2 - y1
            img_width, img_height = image.size
            box_area_ratio = (box_width * box_height) / (img_width * img_height)

            # Reject if detection is too small (less than 2% of image)
            if box_area_ratio < 0.02:
                continue

            detections.append({
                "label": label,
                "confidence": round(confidence * 100, 2)
            })

            if label == "Tooth" or label == "Decoloration tooth":
                tooth_found = True

    if not tooth_found and len(detections) == 0:
        return {
            "has_gingivitis": False,
            "detections": [],
            "message": "No teeth detected! Please upload a clear tooth image.",
            "is_valid": False
        }

    has_gingivitis = any(
        d["label"] == "Decoloration tooth"
        for d in detections
    )

    return {
        "has_gingivitis": has_gingivitis,
        "detections": detections,
        "message": "Gingivitis detected! Please consult a dentist."
                if has_gingivitis
                else "Teeth look healthy!",
        "is_valid": True
    }

@app.get("/")
def home():
    return {"status": "Gingivitis Detection API is running!"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
