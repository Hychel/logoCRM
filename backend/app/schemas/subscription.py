from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class SubscriptionBase(BaseModel):
    patient_id: int
    total_lessons: int
    remaining_lessons: int
    price_paid: float
    is_active: bool = True

class SubscriptionCreate(BaseModel):
    patient_id: int
    total_lessons: int
    price_paid: float

class SubscriptionUpdate(BaseModel):
    total_lessons: Optional[int] = None
    remaining_lessons: Optional[int] = None
    price_paid: Optional[float] = None
    is_active: Optional[bool] = None

class SubscriptionResponse(SubscriptionBase):
    id: int
    purchase_date: datetime

    class Config:
        from_attributes = True
