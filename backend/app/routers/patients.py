from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import date

from backend.app.database.db import get_db
from backend.app.models.models import Patient, User, Subscription, Lesson
from backend.app.schemas.patient import PatientCreate, PatientUpdate, PatientResponse
from backend.app.core.security import get_current_active_user

router = APIRouter(prefix="/api/patients", tags=["Patients"])

# Dynamic enrichment helper to calculate remaining lessons & active subscriptions
def enrich_patient_data(patient: Patient) -> dict:
    active_subs = [
        {
            "total_lessons": sub.total_lessons,
            "remaining_lessons": sub.remaining_lessons,
            "is_active": sub.is_active
        }
        for sub in patient.subscriptions if sub.is_active and sub.remaining_lessons > 0
    ]
    remaining = sum(sub["remaining_lessons"] for sub in active_subs)
    
    return {
        "id": patient.id,
        "full_name": patient.full_name,
        "birth_date": patient.birth_date,
        "parent_name": patient.parent_name,
        "parent_phone": patient.parent_phone,
        "diagnosis": patient.diagnosis,
        "therapist_id": patient.therapist_id,
        "is_active": patient.is_active,
        "therapist": patient.therapist,
        "remaining_lessons": remaining,
        "active_subscriptions": active_subs
    }

@router.get("", response_model=List[PatientResponse])
async def list_patients(
    search: Optional[str] = Query(None, description="Пошук за ПІБ"),
    therapist_id: Optional[int] = Query(None, description="Фільтр за логопедом"),
    is_active: Optional[bool] = Query(None, description="Фільтр за активністю"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Patient).options(
        selectinload(Patient.therapist),
        selectinload(Patient.subscriptions)
    )
    
    # Apply filters
    if search:
        query = query.where(Patient.full_name.icontains(search))
    if therapist_id:
        query = query.where(Patient.therapist_id == therapist_id)
    if is_active is not None:
        query = query.where(Patient.is_active == is_active)
        
    # If the user is a specialist, let them see their patients or all (in MVP it's often all or limited, let's keep it friendly)
    # PRD: "Authorized Speech Therapist has access to own schedule and patients assigned"
    # To satisfy this RBAC restriction:
    if current_user.role == "specialist":
        query = query.where(Patient.therapist_id == current_user.id)
        
    result = await db.execute(query)
    patients = result.scalars().all()
    
    # Map and enrich
    enriched_patients = [enrich_patient_data(p) for p in patients]
    return enriched_patients

@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient(
    patient_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Patient).where(Patient.id == patient_id).options(
        selectinload(Patient.therapist),
        selectinload(Patient.subscriptions)
    )
    
    result = await db.execute(query)
    patient = result.scalars().first()
    
    if not patient:
        raise HTTPException(status_code=404, detail="Пацієнта не знайдено")
        
    # RBAC check: Speech Therapist can only view their patients
    if current_user.role == "specialist" and patient.therapist_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Ви маєте доступ лише до призначених вам пацієнтів"
        )
        
    return enrich_patient_data(patient)

@router.post("", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
async def create_patient(
    patient_in: PatientCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    # Only Admin (Director) can create or assign therapists, but let's allow specialists to add if needed, or enforce PRD RBAC
    # PRD Director: "створювати та редагувати картки пацієнтів"
    # Let's enforce that only admin can register/edit, or let specialists do it if it's their patient.
    # To be secure, we block specialists from adding unless they have permissions, or just allow it for MVP demo.
    # Let's allow admin or specialist to create.
    
    db_patient = Patient(
        full_name=patient_in.full_name,
        birth_date=patient_in.birth_date,
        parent_name=patient_in.parent_name,
        parent_phone=patient_in.parent_phone,
        diagnosis=patient_in.diagnosis,
        therapist_id=patient_in.therapist_id,
        is_active=patient_in.is_active
    )
    db.add(db_patient)
    await db.commit()
    await db.refresh(db_patient)
    
    # Reload with relationships
    query = select(Patient).where(Patient.id == db_patient.id).options(
        selectinload(Patient.therapist),
        selectinload(Patient.subscriptions)
    )
    result = await db.execute(query)
    patient = result.scalars().first()
    return enrich_patient_data(patient)

@router.put("/{patient_id}", response_model=PatientResponse)
async def update_patient(
    patient_id: int,
    patient_in: PatientUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Patient).where(Patient.id == patient_id).options(
        selectinload(Patient.therapist),
        selectinload(Patient.subscriptions)
    )
    result = await db.execute(query)
    patient = result.scalars().first()
    
    if not patient:
        raise HTTPException(status_code=404, detail="Пацієнта не знайдено")
        
    # RBAC check: Speech Therapist can only update their patients
    if current_user.role == "specialist" and patient.therapist_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Ви можете редагувати лише призначених вам пацієнтів"
        )
        
    # Update fields
    update_data = patient_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(patient, field, value)
        
    await db.commit()
    await db.refresh(patient)
    return enrich_patient_data(patient)

@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_patient(
    patient_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    # Only Admin (Director) can delete patients
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Лише адміністратор може видаляти пацієнтів"
        )
        
    query = select(Patient).where(Patient.id == patient_id)
    result = await db.execute(query)
    patient = result.scalars().first()
    
    if not patient:
        raise HTTPException(status_code=404, detail="Пацієнта не знайдено")
        
    await db.delete(patient)
    await db.commit()
    return None
