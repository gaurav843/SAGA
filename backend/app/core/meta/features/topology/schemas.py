# FILEPATH: backend/app/core/meta/features/topology/schemas.py
# @file: Topology Data Contracts
# @author: The Engineer (ansav8@gmail.com)
# @description: Pydantic models for the System Topology Graph.
# @security-level: LEVEL 0 (Kernel Core)

from typing import List, Optional, Dict, Any
from enum import Enum
from pydantic import BaseModel, ConfigDict, Field

class TopologyNodeType(str, Enum):
    """
    Defines the biological classification of a System Node.
    Used by the Frontend IconFactory to render the correct visual.
    """
    ENTITY = "ENTITY"           # Physical Data Table
    GOVERNANCE = "GOVERNANCE"   # Policy/Rule Set
    SCOPE = "SCOPE"             # Workflow/Process
    DASHBOARD = "DASHBOARD"     # Analytics View
    
    # ⚡ STRUCTURE
    FOLDER = "FOLDER"           # Logical Grouping / Sub-Domain

class TopologyNode(BaseModel):
    """
    A single node in the System Hierarchy.
    "The Atom of Navigation."
    """
    key: str
    label: str
    type: TopologyNodeType
    
    # ⚡ NAVIGATION INSTRUCTION
    # The absolute path the frontend should navigate to.
    # e.g., "/meta-v2/dictionary/USER"
    route: str
    
    # Visuals
    icon: Optional[str] = None
    description: Optional[str] = None
    
    # Metadata for Advanced UI (e.g. Badges, Status)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    
    # ⚡ RECURSION (Future Proofing)
    # Allows infinite nesting if needed.
    children: List["TopologyNode"] = []

    model_config = ConfigDict(from_attributes=True)

