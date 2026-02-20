# @file Auth Validation Schemas (Pydantic)
# @author The Engineer
# @description Defines the Data Contracts (Input/Output shapes) for the API.

from typing import Optional
from pydantic import BaseModel, EmailStr

# --- 1. SHARED PROPERTIES ---
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    is_active: bool = True
    role: str = "operator"

# --- 2. INPUTS (Requests) ---

# For Registration (POST /register)
class UserCreate(UserBase):
    password: str

# For Login (POST /login)
# The Frontend sends this exactly
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# --- 3. OUTPUTS (Responses) ---

# For reading user data (Never return the password!)
class UserRead(UserBase):
    id: int
    
    class Config:
        from_attributes = True # Allows reading from SQLAlchemy models

# --- 4. TOKENS (JWT) ---
# The exact shape expected by the Frontend's Auth Machine
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead # We send the user profile along with the token

class TokenPayload(BaseModel):
    sub: Optional[str] = None # The User ID inside the token

