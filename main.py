from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from jose import jwt, JWTError

from db import sessions_col, violations_col
from auth import authenticate_admin, create_access_token, SECRET_KEY, ALGORITHM

app = FastAPI()

# ---------------- CORS ----------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- ADMIN UI ----------------
app.mount("/admin", StaticFiles(directory="admin", html=True), name="admin")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/admin/login")

# ---------------- MODELS ----------------
class ViolationEvent(BaseModel):
    user_id: str
    exam_id: str
    event_type: str
    risk: int

class SubmitExam(BaseModel):
    user_id: str
    exam_id: str
    score: int

# ---------------- ADMIN AUTH ----------------
def get_current_admin(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload["sub"]
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

@app.post("/api/admin/login")
def admin_login(data: dict):
    username = data.get("username")
    password = data.get("password")

    if not authenticate_admin(username, password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": username})
    return {"access_token": token}

# ---------------- USER LOGIN ----------------
@app.post("/user-login")
def user_login(user_id: str, exam_id: str):
    sessions_col.update_one(
        {"user_id": user_id},
        {"$set": {
            "user_id": user_id,
            "exam_id": exam_id,
            "risk": 0,
            "violations": 0,
            "status": "Logged In",
            "terminated": False
        }},
        upsert=True
    )
    return {"message": "User logged in"}

# ---------------- START EXAM ----------------
@app.post("/start-exam")
def start_exam(user_id: str, exam_id: str):
    sessions_col.update_one(
        {"user_id": user_id},
        {"$set": {
            "exam_id": exam_id,
            "status": "In Exam"
        }}
    )
    return {"message": "Exam started"}

# ---------------- SUBMIT EXAM ----------------
@app.post("/submit-exam")
def submit_exam(data: SubmitExam):
    sessions_col.update_one(
        {"user_id": data.user_id},
        {"$set": {
            "score": data.score,
            "status": "Completed"
        }}
    )
    return {"message": "Score saved"}

# ---------------- VIOLATIONS ----------------
@app.post("/violation")
def log_violation(event: ViolationEvent):
    session = sessions_col.find_one({"user_id": event.user_id})
    if not session:
        return {"error": "Session not found"}

    new_violations = session.get("violations", 0) + 1
    new_risk = session.get("risk", 0) + event.risk
    terminated = new_violations > 4

    sessions_col.update_one(
        {"user_id": event.user_id},
        {"$set": {
            "violations": new_violations,
            "risk": new_risk,
            "terminated": terminated,
            "status": "Terminated" if terminated else session.get("status")
        }}
    )

    violations_col.insert_one(event.dict())
    return {"terminated": terminated}

# ---------------- ADMIN DASHBOARD ----------------
@app.get("/api/admin/sessions")
def get_sessions(admin: str = Depends(get_current_admin)):
    return list(sessions_col.find({}, {"_id": 0}))

@app.delete("/api/admin/delete-user")
def delete_user(user_id: str, admin: str = Depends(get_current_admin)):
    sessions_col.delete_one({"user_id": user_id})
    violations_col.delete_many({"user_id": user_id})
    return {"message": "User deleted"}

import os

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 8000))
    )
