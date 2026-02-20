# FILEPATH: backend/app/core/meta/features/topology/service.py
# @file: Topology Service
# @role: 🗺️ Database Cartographer
# @author: The Engineer
# @description: Generates the System Topology Graph with Nested Workflow Grouping.
# @security-level: LEVEL 9 (Read-Only)
# @updated: Injected 'subsection' metadata to enable 3-Level Hierarchy (Workflows -> Type -> Scope).

from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.meta.features.topology.schemas import TopologyNode, TopologyNodeType
from app.domains.system.models import KernelDomain, KernelScope
from app.core.meta.features.states.models import WorkflowType
from app.core.meta.constants import ScopeType
import logging

logger = logging.getLogger(__name__)

class TopologyService:
    """
    The Cartographer of the Database.
    Scans Domains, Entities, and Scopes to build a navigational graph.
    """

    @staticmethod
    async def get_domain_topology(db: AsyncSession, domain_key: str) -> List[TopologyNode]:
        """
        Generates the Concrete Children for a specific Domain.
        """
        nodes: List[TopologyNode] = []
        
        try:
            # ⚡ 0A. FETCH DYNAMIC WORKFLOW TYPES (Async)
            stmt_types = select(WorkflowType)
            result_types = await db.execute(stmt_types)
            workflow_types = result_types.scalars().all()
            
            # ⚡ 0B. FETCH DOMAIN METADATA (Async)
            stmt_domain = select(KernelDomain).where(KernelDomain.key == domain_key)
            result_domain = await db.execute(stmt_domain)
            domain = result_domain.scalars().first()
            
            if not domain:
                return []

            # ⚡ SAFETY: Resolve attributes defensively
            d_type = getattr(domain, 'domain_type', getattr(domain, 'type', 'STANDARD'))
            
            # ---------------------------------------------------------
            # 1. ⚡ ENTITY NODE (Data Dictionary)
            # ---------------------------------------------------------
            if d_type in ['STANDARD', 'SYSTEM', 'AUTH']: 
                entity_icon = "antd:DatabaseOutlined"
                
                nodes.append(TopologyNode(
                    key=f"entity_{domain_key}",
                    label="Data Dictionary",
                    type=TopologyNodeType.ENTITY,
                    route=f"/dictionary/{domain_key}?domain={domain_key}",
                    icon=entity_icon,
                    description="Primary Relational Data Storage",
                    metadata={
                        "count": 1, 
                        "technical_key": domain_key,
                        "physical_target": domain_key.lower() + "s"
                    }
                ))

            # ---------------------------------------------------------
            # 2. ⚡ GOVERNANCE NODE (Policies)
            # ---------------------------------------------------------
            nodes.append(TopologyNode(
                key=f"gov_{domain_key}",
                label="Governance Policy", 
                type=TopologyNodeType.GOVERNANCE,
                route=f"/governance/{domain_key}?domain={domain_key}",
                icon="antd:SafetyCertificateOutlined",
                description="State machine controlling entity lifecycle status.",
                metadata={
                    "count": 2,
                    "technical_key": domain_key
                }
            ))

            # ---------------------------------------------------------
            # 3. ⚡ WORKFLOW NODES (Scopes)
            # ---------------------------------------------------------
            stmt_scopes = select(KernelScope).where(KernelScope.domain_key == domain_key)
            result_scopes = await db.execute(stmt_scopes)
            scopes = result_scopes.scalars().all()

            if scopes:
                for scope in scopes:
                    # ⚡ FETCH TYPE DEFINITION
                    workflow_type = next((wt for wt in workflow_types if wt.key == scope.type), None)
                    
                    # ⚡ DEFAULT ICONS
                    item_icon = workflow_type.ui_config.get('icon') if workflow_type else "antd:AppstoreOutlined"

                    # ---------------------------------------------------------
                    # ⚡ GROUPING LOGIC (The "Hierarchy Builder")
                    # ---------------------------------------------------------
                    
                    # Initialize vars
                    section_key = None
                    section_label = None
                    section_icon = None
                    subsection_key = None
                    subsection_label = None
                    subsection_icon = None

                    # CASE A: WORKFLOWS (Wizards, Jobs, Views, Governance Flows)
                    # We group these under "WORKFLOWS" -> "TYPE"
                    if scope.type in ['WIZARD', 'JOB', 'VIEW', 'GOVERNANCE']:
                        # Parent Folder
                        section_key = "WORKFLOWS"
                        section_label = "Workflows"
                        section_icon = "antd:PartitionOutlined"
                        
                        # Child Folder (The Sub-Tree)
                        # Use the Label from the Workflow Type Definition (e.g. "Interactive Wizard")
                        if workflow_type:
                            subsection_key = workflow_type.key
                            subsection_label = workflow_type.label
                            subsection_icon = workflow_type.ui_config.get('icon')
                        else:
                            # Fallback if type def missing
                            subsection_key = scope.type
                            subsection_label = scope.type.title()
                            subsection_icon = "antd:FolderOutlined"

                    # CASE B: FALLBACK
                    else:
                        section_key = workflow_type.key if workflow_type else scope.type
                        section_label = workflow_type.label if workflow_type else scope.type
                        section_icon = workflow_type.ui_config.get('icon') if workflow_type else "antd:FolderOutlined"
                    # ---------------------------------------------------------

                    nodes.append(TopologyNode(
                        key=f"scope_{scope.key}",
                        label=scope.label,
                        type=TopologyNodeType.SCOPE,
                        route=f"/app/{domain_key.lower()}-{scope.key.lower()}",
                        icon=item_icon,
                        description=workflow_type.description if workflow_type else "System Process",
                        metadata={
                            "scope_type": scope.type,
                            "target_entity": scope.target_field,
                            "technical_key": scope.key,
                            
                            # ⚡ HIERARCHY METADATA
                            "section_key": section_key,
                            "section_label": section_label,
                            "section_icon": section_icon,
                            "subsection_key": subsection_key,
                            "subsection_label": subsection_label,
                            "subsection_icon": subsection_icon
                        }
                    ))

            # ---------------------------------------------------------
            # 4. ⚡ CHILD DOMAINS (Sub-Modules)
            # ---------------------------------------------------------
            stmt_children = select(KernelDomain).where(KernelDomain.parent_domain == domain_key)
            result_children = await db.execute(stmt_children)
            children = result_children.scalars().all()
            
            for child in children:
                c_icon = getattr(child, 'module_icon', getattr(child, 'icon', 'antd:FolderOutlined'))
                if not c_icon: c_icon = 'antd:FolderOutlined'
                
                nodes.append(TopologyNode(
                    key=f"domain_{child.key}",
                    label=child.label,
                    type=TopologyNodeType.FOLDER,
                    route=f"/topology/{child.key}",
                    icon=c_icon,
                    description=child.module_label, 
                    metadata={
                        "is_domain": True,
                        "domain_key": child.key,
                        "technical_key": child.key,
                        "section_key": "CHILD_DOMAINS",
                        "section_label": "Sub-Modules",
                        "section_icon": "antd:FolderOpenOutlined"
                    }
                ))

            return nodes
            
        except Exception as e:
            try:
                attrs = dir(domain) if domain else "None"
                logger.error(f"🔥 [Topology] CRASH DETAILS. Valid Attributes on KernelDomain: {attrs}")
            except:
                pass
            logger.error(f"🔥 [Topology] CRASH processing domain '{domain_key}': {str(e)}")
            raise e
