# FILEPATH: backend/app/core/kernel/models.py
# @file: Kernel Data Models (Kafka-Ready v2.1)
# @author: ansav8@gmail.com
# @description: Data Models for the Core Kernel.
# UPDATED: Added 'partition_key' and 'trace_id' for Distributed Relay.

from datetime import datetime
from typing import Optional, Dict, Any

from sqlalchemy import Integer, String, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import JSONB

from app.core.database.base import Base

class SystemOutbox(Base):
    """
    TRANSACTIONAL OUTBOX (The Kafka Waiting Room).
    Stores events atomically with business data.
    The 'Relay' process reads this table and pushes to Kafka.
    """
    __tablename__ = 'system_outbox'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    
    # ⚡ KAFKA ROUTING
    # The Event Key (e.g. 'CONTAINER:GATE_IN')
    event_name: Mapped[str] = mapped_column(String(100), nullable=False)
    
    # Guaranteed Ordering Key (e.g. 'container_123', 'user_456')
    # All events for the same entity MUST have the same partition_key
    partition_key: Mapped[str] = mapped_column(String(100), nullable=False, index=True, default="global")
    
    # Distributed Trace ID (OpenTelemetry compatible)
    trace_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    # The actual payload (Schema Versioned)
    payload: Mapped[Dict[str, Any]] = mapped_column(JSONB, nullable=False)
    
    # Metadata for legacy tracing
    entity_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True) 
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # ⚡ PROCESSING STATUS
    # PENDING   : Ready to be sent to Kafka
    # PUBLISHED : Successfully sent to Kafka (Acked)
    # FAILED    : Kafka rejected it (Poison Pill)
    status: Mapped[str] = mapped_column(String(20), default='PENDING', index=True) 
    
    processed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    retry_count: Mapped[int] = mapped_column(Integer, default=0)
    error_log: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    def to_dict(self):
        """
        Serialization helper for the Relay.
        """
        return {
            'id': self.id,
            'event': self.event_name,
            'key': self.partition_key,
            'payload': self.payload,
            'trace_id': self.trace_id,
            'timestamp': self.created_at.isoformat() if self.created_at else None
        }
