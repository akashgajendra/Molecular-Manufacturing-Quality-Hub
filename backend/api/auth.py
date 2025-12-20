import jwt
from datetime import datetime, timedelta
from fastapi import Request, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db, UserModel
import bcrypt

# Configuration
SECRET_KEY = "YOUR_SYSTEM_SECRET_KEY" # In production, use os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480 # 8 Hour Shift

def get_password_hash(password: str) -> str:
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        plain_password.encode('utf-8'), 
        hashed_password.encode('utf-8')
    )

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def authenticate_user(db: Session, username, password):
    user = db.query(UserModel).filter(UserModel.username == username).first()
    if not user or not verify_password(password, user.password_hash):
        return False
    return user

async def get_current_user(request: Request, db: Session = Depends(get_db)):
    """Extractor that reads the JWT from the HttpOnly cookie."""
    token = request.cookies.get("helix_token")
    if not token:
        raise HTTPException(status_code=401, detail="Uplink Required")
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        user = db.query(UserModel).filter(UserModel.username == username).first()
        if user is None:
            raise HTTPException(status_code=401)
        return user
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Session Expired")