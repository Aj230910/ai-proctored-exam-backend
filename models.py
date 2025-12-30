from pydantic import BaseModel
from typing import Optional

class ViolationEvent(BaseModel):
    user_id: str
    exam_id: str
    event_type: str   # tab-switch | blur | face-missing
    risk: int
