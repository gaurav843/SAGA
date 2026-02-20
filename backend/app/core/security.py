# @file Security Engine
# @author The Engineer
# @description The Cryptographic Core. Handles Password Hashing (bcrypt) and Token Minting (JWT).
#              Replaces the old 'modules/auth/logic.py'.

from datetime import datetime, timedelta
from typing import Any, Union
from jose import jwt
from passlib.context import CryptContext
from app.core.config import settings

# 1. Password Hashing Engine (bcrypt)
# "schemes=['bcrypt']" ensures we match the legacy system's security standard.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 2. Hashing Logic
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a plain-text password against the stored hash.
    Securely handles the comparison to prevent timing attacks.
    """
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """
    Generates a secure hash for a new password.
    """
    return pwd_context.hash(password)

# 3. Token Logic (JWT)
def create_access_token(subject: Union[str, Any]) -> str:
    """
    Mints a new JWT Access Token.
    Encodes the User ID (subject) and an Expiration Time.
    """
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "sub": str(subject), # Subject (User ID)
        "exp": expire,       # Expiration
        "type": "access"     # Token Type
    }
    
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.SECRET_KEY, 
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt

