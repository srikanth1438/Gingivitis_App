from fastapi import FastAPI, File, UploadFile, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from ultralytics import YOLO
from PIL import Image
import io
import uvicorn

from database import get_db, create_tables, User
from schemas import UserCreate, UserLogin, Token
from auth import hash_password, verify_password, create_access_token
from otp import generate_otp, send_otp_email, verify_otp

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

model = YOLO("best.pt")

create_tables()

# ──────────────────────────────────────────
# PYDANTIC MODELS
# ──────────────────────────────────────────

class ForgotPassword(BaseModel):
    email: str

class ResetPassword(BaseModel):
    email: str
    new_password: str

# ──────────────────────────────────────────
# AUTH ROUTES
# ──────────────────────────────────────────

@app.post("/register", response_model=Token)
def register(user: UserCreate, db: Session = Depends(get_db)):
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
def login(user: UserLogin, db: Session = Depends(get_db)):
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
async def detect_gingivitis(file: UploadFile = File(...)):
    contents = await file.read()
    image = Image.open(io.BytesIO(contents))

    print("Image received! Analyzing...")
    results = model(image, conf=0.5)
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