# FILEPATH: backend/app/domains/system/features/navigation/schemas.py
# @file: Navigation API Contracts
# @role: 📦 Data Schema
# @author: The Engineer (ansav8@gmail.com)
# @description: Pydantic definitions for the OS Shell Navigation.
# @security-level: LEVEL 0 (Public Read)
# @updated: Added 'search_tags' to API response.

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict

class NavigationNode(BaseModel):
    """
    A single item in the navigation tree.
    Recursive structure allowing infinite nesting.
    """
    key: str
    label: str
    icon: Optional[str] = None
    path: Optional[str] = None
    
    # ⚡ ARCHITECTURE METADATA
    component_path: Optional[str] = None
    api_endpoint: Optional[str] = None
    
    # ⚡ DISCOVERY
    search_tags: List[str] = []
    
    # ⚡ CONFIG: Badges, hotkeys, external links, etc.
    config: Dict[str, Any] = {}
    
    # ⚡ RECURSION: Children nodes (e.g. Sub-menus)
    children: List["NavigationNode"] = []

    model_config = ConfigDict(from_attributes=True)

class NavigationResponse(BaseModel):
    """
    The full payload injected into the System Manifest.
    """
    sidebar: List[NavigationNode] = []
    user_menu: List[NavigationNode] = []
    top_bar: List[NavigationNode] = []

    model_config = ConfigDict(from_attributes=True)

