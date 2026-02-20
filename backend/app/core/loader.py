# @file Domain Plugin Loader (The Kernel)
# @author The Engineer
# @description Scans the 'app/domains' directory and auto-registers valid Plugins.
#              UPDATED: Enforces Strict Namespacing (e.g. /api/v1/{domain}/...)

import importlib
import pkgutil
import logging
from fastapi import FastAPI

logger = logging.getLogger("flodock.loader")

def load_domains(app: FastAPI):
    """
    1. Scans 'app/domains/' for sub-packages.
    2. Checks if they have an '__init__.py' with a 'router'.
    3. Mounts the router to the FastAPI app with the DOMAIN NAME as the prefix.
    """
    logger.info("🔌 [Kernel] Scanning for Domain Plugins...")
    
    # Path to the domains directory
    domains_path = "app/domains"
    
    # Iterate over all folders in app/domains
    # pkgutil.iter_modules returns (module_loader, name, ispkg)
    count = 0
    for _, domain_name, ispkg in pkgutil.iter_modules([domains_path]):
        if ispkg:
            try:
                # Dynamically import the module (e.g., app.domains.auth)
                module_path = f"app.domains.{domain_name}"
                module = importlib.import_module(module_path)
                
                # Check for the 'router' attribute (The Plug)
                if hasattr(module, "router"):
                    
                    # ⚡ CRITICAL FIX: Auto-Namespace the Route
                    # OLD: prefix="/api/v1"
                    # NEW: prefix="/api/v1/auth"
                    route_prefix = f"/api/v1/{domain_name}"

                    # Register the Router
                    app.include_router(
                        module.router, 
                        prefix=route_prefix, 
                        tags=[domain_name.capitalize()] # Auto-tagging for Swagger UI
                    )
                    logger.info(f"   ✅ Loaded Plugin: [{domain_name.upper()}] -> {route_prefix}")
                    count += 1
                else:
                    logger.warning(f"   ⚠️  Skipped [{domain_name}]: No 'router' exported.")
                    
            except Exception as e:
                logger.error(f"   ❌ Failed to load [{domain_name}]: {e}")

    logger.info(f"🔌 [Kernel] System Startup Complete. {count} Domains Active.")

