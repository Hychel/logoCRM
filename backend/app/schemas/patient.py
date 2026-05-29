from pydantic import BaseModel, Field
from datetime import date
from typing import Optional, List
from backend.app.schemas.user import UserResponse

class PatientBase(BaseModel):
    full_name: str = Field(..., examples=["Ковальчук Максим Дмитрович"])
    birth_date: date = Field(..., examples=["2018-05-15"])
    parent_name: Optional[str] = Field(None, examples=["Ковальчук Дмитро"])
    parent_phone: Optional[str] = Field(None, examples=["+380671234567"])
    diagnosis: Optional[str] = Field(None, examples=["Дислалія (порушення вимови звуків Р, Л)"])
    therapist_id: Optional[int] = Field(None, examples=[2])
    is_active: bool = True

class PatientCreate(PatientBase):
    pass

class PatientUpdate(BaseModel):
    full_name: Optional[str] = None
    birth_date: Optional[date] = None
    parent_name: Optional[str] = None
    parent_phone: Optional[str] = None
    diagnosis: Optional[str] = None
    therapist_id: Optional[int] = None
    is_active: Optional[bool] = None

# Subschema to show balance inside patient response
class PatientSubscriptionBalance(BaseModel):
    total_lessons: int
    remaining_lessons: int
    is_active: bool

    class Config:
        from_attributes = True

class PatientResponse(PatientBase):
    id: int
    therapist: Optional[UserResponse] = None
    remaining_lessons: int = 0
    active_subscriptions: List[PatientSubscriptionBalance] = []

    class Config:
        from_attributes = True

# JSON DTO Representation requested by USER:
"""
{
  "id": 12,
  "full_name": "Ковальчук Максим Дмитрович",
  "birth_date": "2018-05-15",
  "parent_name": "Ковальчук Дмитро",
  "parent_phone": "+380671234567",
  "diagnosis": "Дислалія (порушення вимови звуків Р, Л)",
  "therapist_id": 2,
  "is_active": true,
  "therapist": {
    "id": 2,
    "email": "therapist1@logocrm.com",
    "full_name": "Мельник Ольга Василівна",
    "role": "specialist",
    "specialty": "логопед-дефектолог",
    "is_active": true
  },
  "remaining_lessons": 8,
  "active_subscriptions": [
    {
      "total_lessons": 10,
      "remaining_lessons": 8,
      "is_active": true
    }
  ]
}
"""
