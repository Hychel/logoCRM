from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class PaymentBase(BaseModel):
    patient_id: int
    amount: float
    payment_type: str = "single"  # single, subscription

class PaymentCreate(PaymentBase):
    pass

class PaymentResponse(PaymentBase):
    id: int
    payment_date: datetime
    patient_name: Optional[str] = None  # To show patient name in billing list

    class Config:
        from_attributes = True
