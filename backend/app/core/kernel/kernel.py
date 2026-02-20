# FILEPATH: backend/app/core/kernel/kernel.py
# @file: The Core Kernel (Kafka Edition)
# @author: The Engineer
# @description: The Central Nervous System. Manages Event Ingestion.
# UPDATED: Restored commit() helper. Enforces 'partition_key'.

import logging
from typing import Optional, Dict, Any, Union
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.kernel.models import SystemOutbox
from app.core.kernel.events import SystemEvent
from app.core.context import GlobalContext

logger = logging.getLogger("kernel.core")

class Kernel:
    """
    The Event Publisher.
    Writes to the Transactional Outbox (Postgres) to guarantee Atomicity.
    
    ENTERPRISE FEATURES:
    - Type Safety: Enforces SystemEvent objects.
    - Distributed Tracing: Injects trace_id.
    - Partitioning: Enforces partition_key for Kafka ordering.
    """

    def __init__(self):
        # Stateless singleton pattern
        pass

    async def publish(
        self, 
        db: AsyncSession, 
        event: Union[SystemEvent, str], 
        payload: Dict[str, Any], 
        entity_id: Optional[int] = None,
        partition_key: Optional[str] = None
    ):
        """
        Ingests an event into the System Outbox.
        
        Args:
            db (AsyncSession): Active session (Must be same transaction as business data).
            event (SystemEvent): The strict event definition.
            payload (dict): The data to carry.
            entity_id (int): Primary Key of the entity (Legacy/Search).
            partition_key (str): KAFKA ORDERING KEY. Defaults to str(entity_id) or "global".
        """
        # 1. RESOLVE METADATA
        event_name = ""
        event_version = "1.0.0"
        
        if isinstance(event, SystemEvent):
            event_name = event.name
            event_version = event.version
        else:
            event_name = str(event)
            logger.warning(f"⚠️ [KERNEL] Raw string event '{event_name}' is deprecated.")
            
        # 2. RESOLVE CONTEXT
        # We grab the Trace ID from the request context to link API logs with Kafka logs
        trace_id = GlobalContext.get_request_id() or "system"
        
        # 3. RESOLVE PARTITION KEY (Critical for Kafka)
        # If not provided, we try to use entity_id. If that's missing, we fallback to "global".
        # WARNING: "global" puts everything on one partition (ordering guaranteed but low throughput).
        if not partition_key:
            partition_key = str(entity_id) if entity_id else "global"

        # 4. ENVELOPE CONSTRUCTION
        envelope = {
            "meta": {
                "version": event_version,
                "timestamp": datetime.utcnow().isoformat(),
                "source": "flodock-kernel",
                "trace_id": trace_id
            },
            "data": payload
        }

        # 5. WRITE TO OUTBOX
        try:
            outbox_entry = SystemOutbox(
                event_name=event_name,
                partition_key=partition_key,
                trace_id=trace_id,
                payload=envelope,
                entity_id=entity_id,
                status='PENDING',
                created_at=datetime.utcnow()
            )
            
            db.add(outbox_entry)
            logger.debug(f"📨 [KERNEL] Buffered: {event_name} [Key: {partition_key}]")
            
        except Exception as e:
            logger.error(f"🔥 [KERNEL] Publish Failed: {e}", exc_info=True)
            # In Level 100, we DO raise. If the event cannot be logged, the transaction is unsafe.
            raise e

    async def commit(self, db: AsyncSession):
        """
        Finalizes the transaction.
        Saves both the Data Changes and the Outbox Events atomically.
        """
        try:
            await db.commit()
        except Exception as e:
            await db.rollback()
            logger.error(f"❌ [KERNEL] Commit Failed: {e}")
            raise e

# Global Instance
kernel = Kernel()

