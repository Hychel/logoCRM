from sqlalchemy import String, Integer, ForeignKey, Boolean, DateTime, Float, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, date
from typing import List, Optional

from backend.app.database.db import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    full_name: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[str] = mapped_column(String, default="specialist", nullable=False)  # admin, specialist
    specialty: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    patients: Mapped[List["Patient"]] = relationship("Patient", back_populates="therapist")
    lessons: Mapped[List["Lesson"]] = relationship("Lesson", back_populates="therapist")


class Patient(Base):
    __tablename__ = "patients"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    full_name: Mapped[str] = mapped_column(String, index=True, nullable=False)
    birth_date: Mapped[date] = mapped_column(Date, nullable=False)
    parent_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    parent_phone: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    diagnosis: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    therapist_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    therapist: Mapped[Optional["User"]] = relationship("User", back_populates="patients")
    lessons: Mapped[List["Lesson"]] = relationship("Lesson", back_populates="patient", cascade="all, delete-orphan")
    subscriptions: Mapped[List["Subscription"]] = relationship("Subscription", back_populates="patient", cascade="all, delete-orphan")
    payments: Mapped[List["Payment"]] = relationship("Payment", back_populates="patient", cascade="all, delete-orphan")


class Lesson(Base):
    __tablename__ = "lessons"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    patient_id: Mapped[int] = mapped_column(Integer, ForeignKey("patients.id"), nullable=False)
    therapist_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    cabinet: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    start_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    status: Mapped[str] = mapped_column(String, default="planned", nullable=False)  # planned, conducted, cancelled, rescheduled
    notes: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    target_sounds: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    homework: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    # Relationships
    patient: Mapped["Patient"] = relationship("Patient", back_populates="lessons")
    therapist: Mapped["User"] = relationship("User", back_populates="lessons")


class Subscription(Base):
    __tablename__ = "subscriptions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    patient_id: Mapped[int] = mapped_column(Integer, ForeignKey("patients.id"), nullable=False)
    total_lessons: Mapped[int] = mapped_column(Integer, nullable=False)
    remaining_lessons: Mapped[int] = mapped_column(Integer, nullable=False)
    price_paid: Mapped[float] = mapped_column(Float, nullable=False)
    purchase_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    patient: Mapped["Patient"] = relationship("Patient", back_populates="subscriptions")


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    patient_id: Mapped[int] = mapped_column(Integer, ForeignKey("patients.id"), nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    payment_type: Mapped[str] = mapped_column(String, default="single", nullable=False)  # single, subscription
    payment_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    patient: Mapped["Patient"] = relationship("Patient", back_populates="payments")
