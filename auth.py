from jose import jwt
from datetime import datetime, timedelta

SECRET_KEY = "CHANGE_THIS_SECRET_KEY"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# Demo admin credentials (simple)
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

def authenticate_admin(username, password):
    return username == ADMIN_USERNAME and password == ADMIN_PASSWORD

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
