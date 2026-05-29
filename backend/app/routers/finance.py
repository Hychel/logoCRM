from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import func
from typing import List
from datetime import datetime, timedelta

from backend.app.database.db import get_db
from backend.app.models.models import Payment, Subscription, Patient, Lesson, User
from backend.app.schemas.subscription import SubscriptionCreate, SubscriptionResponse
from backend.app.schemas.payment import PaymentResponse
from backend.app.core.security import get_current_admin, get_current_active_user

router = APIRouter(prefix="/api/finance", tags=["Finance"])

@router.get("/payments", response_model=List[PaymentResponse])
async def list_payments(
    current_user: User = Depends(get_current_admin),  # Only admin (Director) sees financial list
    db: AsyncSession = Depends(get_db)
):
    query = select(Payment).options(selectinload(Payment.patient)).order_by(Payment.payment_date.desc())
    result = await db.execute(query)
    payments = result.scalars().all()
    
    # Map to schemas including patient name
    out = []
    for p in payments:
        p_res = PaymentResponse.model_validate(p)
        p_res.patient_name = p.patient.full_name if p.patient else "Видалений пацієнт"
        out.append(p_res)
    return out

@router.post("/subscriptions", response_model=SubscriptionResponse, status_code=status.HTTP_201_CREATED)
async def sell_subscription(
    sub_in: SubscriptionCreate,
    current_user: User = Depends(get_current_admin),  # Only admin can sell subscription
    db: AsyncSession = Depends(get_db)
):
    # Check if patient exists
    pat_query = select(Patient).where(Patient.id == sub_in.patient_id)
    pat_res = await db.execute(pat_query)
    patient = pat_res.scalars().first()
    if not patient:
        raise HTTPException(status_code=404, detail="Пацієнта не знайдено")
        
    # Create subscription
    db_sub = Subscription(
        patient_id=sub_in.patient_id,
        total_lessons=sub_in.total_lessons,
        remaining_lessons=sub_in.total_lessons,
        price_paid=sub_in.price_paid,
        purchase_date=datetime.utcnow(),
        is_active=True
    )
    db.add(db_sub)
    
    # Create matching payment
    db_payment = Payment(
        patient_id=sub_in.patient_id,
        amount=sub_in.price_paid,
        payment_type="subscription",
        payment_date=datetime.utcnow()
    )
    db.add(db_payment)
    
    await db.commit()
    await db.refresh(db_sub)
    return db_sub

@router.get("/stats")
async def get_financial_stats(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    # Simple dashboard analytics:
    # 1. Total revenue
    rev_result = await db.execute(select(func.sum(Payment.amount)))
    total_revenue = rev_result.scalar() or 0.0
    
    # 2. Total active subscriptions
    sub_result = await db.execute(select(func.count(Subscription.id)).where(Subscription.is_active == True))
    active_subscriptions = sub_result.scalar() or 0
    
    # 3. Lessons conducted vs planned
    cond_result = await db.execute(select(func.count(Lesson.id)).where(Lesson.status == "conducted"))
    lessons_conducted = cond_result.scalar() or 0
    
    plan_result = await db.execute(select(func.count(Lesson.id)).where(Lesson.status == "planned"))
    lessons_planned = plan_result.scalar() or 0
    
    # 4. Total active patients count
    pat_result = await db.execute(select(func.count(Patient.id)).where(Patient.is_active == True))
    active_patients = pat_result.scalar() or 0
    
    # 5. Last 30 days revenue
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    month_rev = await db.execute(select(func.sum(Payment.amount)).where(Payment.payment_date >= thirty_days_ago))
    monthly_revenue = month_rev.scalar() or 0.0

    return {
        "total_revenue": total_revenue,
        "monthly_revenue": monthly_revenue,
        "active_subscriptions": active_subscriptions,
        "lessons_conducted": lessons_conducted,
        "lessons_planned": lessons_planned,
        "active_patients": active_patients
    }
