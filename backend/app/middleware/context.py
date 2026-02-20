# FILEPATH: backend/app/middleware/context.py
# @file: Context Hydration Middleware (Self-Contained)
# @author: The Engineer (ansav8@gmail.com)
# @description: Extracts Metadata (User, ID) from the Request and injects it into GlobalContext.
# @security-level: LEVEL 9 (JWT Inspection)
# @invariant: Must run BEFORE any Domain Logic or Interceptors.

import uuid
import logging
from typing import Optional

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from jose import jwt, JWTError

from app.core.context import GlobalContext
from app.core.config import settings

# ⚡ LOGGER: Use standard logging as this is low-level infrastructure
logger = logging.getLogger("middleware.context")

class ContextMiddleware(BaseHTTPMiddleware):
    """
    Ensures every request has a Trace ID and populates the GlobalContext
    by inspecting the Authorization Header directly.
    """
    
    async def dispatch(self, request: Request, call_next):
        # 1. ⚡ TRACE ID (Generate or Propagate)
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        GlobalContext.set_request_id(request_id)

        # 2. ⚡ AUTHENTICATION INSPECTION
        # We manually decode the JWT here to ensure the Context is available 
        # even if the endpoint doesn't strictly require auth (e.g. for logging).
        auth_header = request.headers.get("Authorization")
        user_data = None

        if auth_header and auth_header.startswith("Bearer "):
            try:
                token = auth_header.split(" ")[1]
                
                # Decode JWT
                payload = jwt.decode(
                    token, 
                    settings.SECRET_KEY, 
                    algorithms=[settings.ALGORITHM]
                )
                
                user_id = payload.get("sub")
                
                if user_id:
                    # Hydrate Context from Token Claims
                    # Note: Ideally the token contains role/email. 
                    # If not, we set safe defaults that the ActorProvider can return.
                    user_data = {
                        "id": int(user_id) if user_id.isdigit() else user_id,
                        "email": payload.get("email", "unknown@token"),
                        "role": payload.get("role", "user"),
                        "is_superuser": payload.get("is_superuser", False)
                    }
                    
            except JWTError as e:
                # ⚡ FAIL OPEN (For Middleware):
                # We don't block the request here. We just don't set the context.
                # The Domain Enforcer or Endpoint Dependency will handle 401s.
                logger.warning(f"⚠️ [Context] Invalid Token: {e}")
            except Exception as e:
                logger.error(f"🔥 [Context] Decoding Logic Failed: {e}")

        # 3. ⚡ SET GLOBAL CONTEXT
        GlobalContext.set_current_user(user_data)
        
        if user_data:
            logger.debug(f"👤 [Context] Active Actor: {user_data.get('id')} ({user_data.get('role')})")

        # 4. ⚡ EXECUTE REQUEST
        response = await call_next(request)
        
        # 5. ⚡ INJECT TRACE ID INTO RESPONSE HEADER
        response.headers["X-Request-ID"] = request_id
        
        return response

