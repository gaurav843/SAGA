# C:\Pythonproject\P2\core\kernel\payload\factory.py
# C:\Pythonproject\P2\modules\core\kernel\payload\factory.py
# @file           factory.py
# @author         ansav8@gmail.com
# @date           2025-12-28
# @description    The "Payload Factory" (Enterprise CDC Engine).
#                 Provides a Context Manager to automatically generate rich, 
#                 standardized event payloads by observing SQLAlchemy state.

import uuid
import logging
import json
from datetime import datetime, timezone, date
from flask import request, session
from sqlalchemy import inspect
from app.core.database import db
from .manager import payload_manager

logger = logging.getLogger(__name__)

class ChangeContext:
    """
    A Context Manager that watches an Entity and the Database Session 
    to generate an Enterprise-Grade Event Payload.
    
    Features:
    - Auto-Snapshotting (Pre/Post)
    - Auto-Diffing (Changeset)
    - Impact Analysis (Touched Tables)
    - Federated Enrichment (Via PayloadManager)
    """

    def __init__(self, entity=None, user_id=None, event_key=None, trigger_source=None):
        self.entity = entity
        self.user_id = user_id
        self.event_key = event_key
        self.trigger_source = trigger_source or "System Logic"
        
        # State Storage
        self._pre_snapshot = {}
        self._post_snapshot = {}
        self.payload = {}
        self.extended_data = {}
        
        # Capture trace if available from request
        self.trace_id = None
        if request:
            self.trace_id = request.headers.get('X-Correlation-ID') or request.headers.get('X-Request-ID')
        if not self.trace_id:
            self.trace_id = str(uuid.uuid4())

    def set_entity(self, entity):
        """
        Allows setting the entity late (e.g., if it was just created inside the block).
        """
        self.entity = entity

    def add_extended_data(self, key, value):
        """
        Injects ad-hoc data into the 'extended_data' block of the payload.
        """
        self.extended_data[key] = value

    def _serialize_value(self, val):
        """Helper to safely serialize DB values."""
        if isinstance(val, (datetime, date)):
            return val.isoformat()
        if hasattr(val, '__dict__'):
            return str(val)
        return val

    def _snapshot(self, entity):
        """
        Serializes a SQLAlchemy model into a clean dictionary using Inspection.
        """
        if not entity:
            return {}
        
        try:
            inspector = inspect(entity)
            data = {}
            
            # Map columns
            for col in inspector.mapper.column_attrs:
                val = getattr(entity, col.key)
                data[col.key] = self._serialize_value(val)
            
            return data
        except Exception as e:
            logger.warning(f"Snapshot failed for {entity}: {e}")
            return {"error": "Snapshot Failed"}

    def _enrich(self, entity):
        """
        Delegates to the PayloadManager to find domain-specific enrichment logic.
        """
        if not entity:
            return {}
        
        strategy = payload_manager.get_strategy(entity)
        if strategy:
            try:
                return strategy(entity)
            except Exception as e:
                logger.error(f"Enrichment Strategy failed for {type(entity).__name__}: {e}")
                return {"enrichment_error": str(e)}
        return {}

    def _calculate_changes(self, old, new):
        """
        Generates the Delta (Old vs New).
        """
        changes = {}
        all_keys = set(old.keys()) | set(new.keys())
        
        for key in all_keys:
            old_val = old.get(key)
            new_val = new.get(key)
            
            # Simple equality check
            if old_val != new_val:
                changes[key] = {
                    "old": old_val,
                    "new": new_val
                }
        return changes

    def _detect_impact(self):
        """
        Scans the generic DB session to find ALL tables touched in this transaction.
        """
        tables = set()
        
        # Check New, Dirty, and Deleted objects in the session
        for obj in db.session.new:
            tables.add(obj.__tablename__)
        for obj in db.session.dirty:
            tables.add(obj.__tablename__)
        for obj in db.session.deleted:
            tables.add(obj.__tablename__)
            
        return list(tables)

    def __enter__(self):
        # Capture "Before" State
        if self.entity:
            self._pre_snapshot = self._snapshot(self.entity)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type:
            # If code crashed (Exception raised), don't build payload. 
            # Let the exception propagate.
            return False

        # Capture "After" State
        # If entity was set late (creation), snapshot it now
        if self.entity:
            self._post_snapshot = self._snapshot(self.entity)
        
        # 1. Logic Calculation
        changeset = self._calculate_changes(self._pre_snapshot, self._post_snapshot)
        impact_scope = self._detect_impact()
        
        # 2. Federated Enrichment
        domain_enrichment = self._enrich(self.entity)
        
        # Merge manual extended data with domain strategy data
        final_extended_data = {**domain_enrichment, **self.extended_data}

        # 3. Build Context (Actor)
        actor_context = {
            "user_id": self.user_id,
            "ip_address": request.remote_addr if request else "CLI",
            "session_id": session.get('sid', 'N/A') if request else "N/A"
        }

        # 4. CONSTRUCT THE ENTERPRISE PAYLOAD
        self.payload = {
            "meta": {
                "event_id": str(uuid.uuid4()),
                "trace_id": self.trace_id,
                "event_key": self.event_key or "UNKNOWN_EVENT",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "version": "2.0",
                "environment": "production", # TODO: Load from config
                "trigger_source": self.trigger_source
            },
            "actor": actor_context,
            "impact_scope": {
                "primary_table": self.entity.__tablename__ if self.entity else "unknown",
                "affected_tables": impact_scope
            },
            "entity": {
                "id": self.entity.id if self.entity else None,
                "reference": getattr(self.entity, 'container_number', 'N/A') if self.entity else 'N/A',
                "state_snapshot": self._post_snapshot
            },
            "changeset": changeset,
            "extended_data": final_extended_data
        }
        
        logger.debug(f"[Payload Factory] Generated payload for {self.event_key}. Tables impacted: {impact_scope}")
