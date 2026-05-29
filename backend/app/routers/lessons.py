from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime

from backend.app.database.db import get_db
from backend.app.models.models import Lesson, Patient, User, Subscription
from backend.app.schemas.lesson import LessonCreate, LessonUpdate, LessonResponse
from backend.app.core.security import get_current_active_user

router = APIRouter(prefix="/api/lessons", tags=["Lessons"])

@router.get("", response_model=List[LessonResponse])
async def list_lessons(
    start: Optional[datetime] = Query(None, description="Початкова дата фільтру"),
    end: Optional[datetime] = Query(None, description="Кінцева дата фільтру"),
    therapist_id: Optional[int] = Query(None, description="Фільтр за логопедом"),
    patient_id: Optional[int] = Query(None, description="Фільтр за пацієнтом"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Lesson).options(
        selectinload(Lesson.patient),
        selectinload(Lesson.therapist)
    )
    
    if start:
        query = query.where(Lesson.start_time >= start)
    if end:
        query = query.where(Lesson.end_time <= end)
    if therapist_id:
        query = query.where(Lesson.therapist_id == therapist_id)
    if patient_id:
        query = query.where(Lesson.patient_id == patient_id)
        
    # If role is specialist, only see their lessons
    if current_user.role == "specialist":
        query = query.where(Lesson.therapist_id == current_user.id)
        
    result = await db.execute(query.order_by(Lesson.start_time.asc()))
    lessons = result.scalars().all()
    return lessons

@router.post("", response_model=LessonResponse, status_code=status.HTTP_201_CREATED)
async def create_lesson(
    lesson_in: LessonCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    # Check scheduling overlaps for the therapist
    overlap_therapist_query = select(Lesson).where(
        Lesson.therapist_id == lesson_in.therapist_id,
        Lesson.start_time < lesson_in.end_time,
        Lesson.end_time > lesson_in.start_time,
        Lesson.status != "cancelled"
    )
    res_therapist = await db.execute(overlap_therapist_query)
    if res_therapist.scalars().first():
        raise HTTPException(
            status_code=400,
            detail="Цей логопед вже зайнятий у вказаний час"
        )
        
    # Check scheduling overlaps for the cabinet
    if lesson_in.cabinet:
        overlap_cabinet_query = select(Lesson).where(
            Lesson.cabinet == lesson_in.cabinet,
            Lesson.start_time < lesson_in.end_time,
            Lesson.end_time > lesson_in.start_time,
            Lesson.status != "cancelled"
        )
        res_cabinet = await db.execute(overlap_cabinet_query)
        if res_cabinet.scalars().first():
            raise HTTPException(
                status_code=400,
                detail=f"Кабінет '{lesson_in.cabinet}' вже зайнятий у вказаний час"
            )
            
    db_lesson = Lesson(
        patient_id=lesson_in.patient_id,
        therapist_id=lesson_in.therapist_id,
        cabinet=lesson_in.cabinet,
        start_time=lesson_in.start_time,
        end_time=lesson_in.end_time,
        status=lesson_in.status,
        notes=lesson_in.notes,
        target_sounds=lesson_in.target_sounds,
        homework=lesson_in.homework
    )
    db.add(db_lesson)
    await db.commit()
    await db.refresh(db_lesson)
    
    # Reload with relationships
    query = select(Lesson).where(Lesson.id == db_lesson.id).options(
        selectinload(Lesson.patient),
        selectinload(Lesson.therapist)
    )
    result = await db.execute(query)
    return result.scalars().first()

@router.put("/{lesson_id}", response_model=LessonResponse)
async def update_lesson(
    lesson_id: int,
    lesson_in: LessonUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Lesson).where(Lesson.id == lesson_id).options(
        selectinload(Lesson.patient),
        selectinload(Lesson.therapist)
    )
    result = await db.execute(query)
    lesson = result.scalars().first()
    
    if not lesson:
        raise HTTPException(status_code=404, detail="Заняття не знайдено")
        
    # Check specialist access
    if current_user.role == "specialist" and lesson.therapist_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Ви можете редагувати лише власні заняття"
        )
        
    old_status = lesson.status
    update_data = lesson_in.model_dump(exclude_unset=True)
    
    # Check overlays if rescheduling
    if "start_time" in update_data or "end_time" in update_data or "cabinet" in update_data:
        new_start = update_data.get("start_time", lesson.start_time)
        new_end = update_data.get("end_time", lesson.end_time)
        new_cab = update_data.get("cabinet", lesson.cabinet)
        new_therapist = update_data.get("therapist_id", lesson.therapist_id)
        
        # Overlap therapist
        overlap_therapist_query = select(Lesson).where(
            Lesson.id != lesson.id,
            Lesson.therapist_id == new_therapist,
            Lesson.start_time < new_end,
            Lesson.end_time > new_start,
            Lesson.status != "cancelled"
        )
        res_therapist = await db.execute(overlap_therapist_query)
        if res_therapist.scalars().first():
            raise HTTPException(
                status_code=400,
                detail="Цей логопед вже зайнятий у вказаний час"
            )
            
        # Overlap cabinet
        if new_cab:
            overlap_cabinet_query = select(Lesson).where(
                Lesson.id != lesson.id,
                Lesson.cabinet == new_cab,
                Lesson.start_time < new_end,
                Lesson.end_time > new_start,
                Lesson.status != "cancelled"
            )
            res_cabinet = await db.execute(overlap_cabinet_query)
            if res_cabinet.scalars().first():
                raise HTTPException(
                    status_code=400,
                    detail=f"Кабінет '{new_cab}' вже зайнятий у вказаний час"
                )
                
    # Apply changes
    for field, value in update_data.items():
        setattr(lesson, field, value)
        
    # Auto-deduct subscription balance when status changes to 'conducted'
    new_status = update_data.get("status", old_status)
    if old_status != "conducted" and new_status == "conducted":
        # Find active subscription with remaining lessons
        sub_query = select(Subscription).where(
            Subscription.patient_id == lesson.patient_id,
            Subscription.is_active == True,
            Subscription.remaining_lessons > 0
        ).order_by(Subscription.purchase_date.asc())
        
        sub_result = await db.execute(sub_query)
        active_sub = sub_result.scalars().first()
        
        if active_sub:
            active_sub.remaining_lessons -= 1
            if active_sub.remaining_lessons == 0:
                active_sub.is_active = False
            db.add(active_sub)
            
    await db.commit()
    await db.refresh(lesson)
    return lesson

@router.delete("/{lesson_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lesson(
    lesson_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Lesson).where(Lesson.id == lesson_id)
    result = await db.execute(query)
    lesson = result.scalars().first()
    
    if not lesson:
        raise HTTPException(status_code=404, detail="Заняття не знайдено")
        
    # Only Admin (Director) or assigned therapist can delete planned sessions
    if current_user.role != "admin" and lesson.therapist_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Немає прав на видалення цього заняття"
        )
        
    await db.delete(lesson)
    await db.commit()
    return None
