"""
Datetime utility functions
"""
from datetime import datetime, timezone
from typing import Optional


def to_naive_utc(dt: Optional[datetime]) -> Optional[datetime]:
    """
    Convert timezone-aware datetime to timezone-naive UTC datetime.
    PostgreSQL TIMESTAMP WITHOUT TIME ZONE columns require naive datetimes.
    """
    if dt is None:
        return None
    if dt.tzinfo is not None:
        # Convert to UTC and remove timezone info
        return dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


def ensure_naive_utc(dt: Optional[datetime]) -> Optional[datetime]:
    """
    Ensure datetime is timezone-naive (assumes UTC if naive).
    For database storage compatibility.
    """
    if dt is None:
        return None
    if dt.tzinfo is not None:
        return dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt

