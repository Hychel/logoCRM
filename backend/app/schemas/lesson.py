from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class LessonBase(BaseModel):
    patient_id: int
    therapist_id: int
    cabinet: Optional[str] = None
    start_time: datetime
    end_time: datetime
    status: str = "planned"  # planned, conducted, cancelled, rescheduled
    notes: Optional[str] = None
    target_sounds: Optional[str] = None
    homework: Optional[str] = None

class LessonCreate(LessonBase):
    pass

class LessonUpdate(BaseModel):
    patient_id: Optional[int] = None
    therapist_id: Optional[int] = None
    cabinet: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    target_sounds: Optional[str] = None
    homework: Optional[str] = None

# Custom response showing patient and therapist details
class LessonPatientInfo(BaseModel):
    id: int
    full_name: str
    diagnosis: Optional[str] = None

    class Config:
        from_attributes = True

class LessonTherapistInfo(BaseModel):
    id: int
    full_name: str
    specialty: Optional[str] = None

    class Config:
        from_attributes = True

class LessonResponse(LessonBase):
    id: int
    patient: LessonPatientInfo
    therapist: LessonTherapistInfo

    class Config:
        from_attributes = True
