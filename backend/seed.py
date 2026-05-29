import asyncio
from datetime import datetime, timedelta, date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.app.database.db import engine, Base, SessionLocal
from backend.app.models.models import User, Patient, Lesson, Subscription, Payment
from backend.app.core.security import get_password_hash

async def seed_data():
    print("Початок наповнення бази даних (Data Seeding)...")
    
    # 1. Створення таблиць
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
        
    async with SessionLocal() as db:
        # 2. Створення користувачів (логопеди та директор)
        password_hash = get_password_hash("password123")
        
        users = [
            User(
                email="director@logocrm.com",
                hashed_password=get_password_hash("admin123"),
                full_name="Коваленко Іван Петрович",
                role="admin",
                specialty="Керівник центру",
                is_active=True
            ),
            User(
                email="olga@logocrm.com",
                hashed_password=password_hash,
                full_name="Мельник Ольга Василівна",
                role="specialist",
                specialty="логопед-дефектолог",
                is_active=True
            ),
            User(
                email="maria@logocrm.com",
                hashed_password=password_hash,
                full_name="Шевченко Марія Ігорівна",
                role="specialist",
                specialty="логопед-нейропсихолог",
                is_active=True
            ),
        ]
        
        db.add_all(users)
        await db.commit()
        
        # Отримуємо ID логопедів
        olga_id = users[1].id
        maria_id = users[2].id
        
        # 3. Список кабінетів
        cabinets = ["Кабінет 1 (Звуковий)", "Кабінет 2 (Ігровий)", "Кабінет 3 (Сенсорний)", "Кабінет 4", "Кабінет 5"]
        
        # 4. Створення пацієнтів (20 осіб)
        patients_data = [
            ("Ковальчук Максим", date(2018, 5, 15), "Ковальчук Дмитро", "+380671112233", "Дислалія (звуки Р, Л)", olga_id),
            ("Шевченко Софія", date(2019, 10, 2), "Шевченко Ганна", "+380502223344", "ЗРМ (Затримка мовленнєвого розвитку)", olga_id),
            ("Поліщук Артем", date(2017, 3, 20), "Поліщук Сергій", "+380933334455", "Алалія", olga_id),
            ("Лисенко Данило", date(2018, 12, 12), "Лисенко Олена", "+380684445566", "Дислалія (сигматизм)", olga_id),
            ("Кравченко Марія", date(2016, 7, 8), "Кравченко Ігор", "+380955556677", "ФФНМ (фонетико-фонематичне порушення)", olga_id),
            
            ("Григоренко Денис", date(2017, 1, 30), "Григоренко Юрій", "+380636667788", "Дисграфія та дислексія", maria_id),
            ("Ткаченко Анастасія", date(2020, 2, 14), "Ткаченко Світлана", "+380677778899", "ЗПРМ (Затримка психіко-мовленнєвого розвитку)", maria_id),
            ("Романюк Владислав", date(2015, 9, 25), "Романюк Андрій", "+380508889900", "Порушення темпо-ритмічної сторони мовлення (заїкання)", maria_id),
            ("Бондар Єва", date(2019, 6, 5), "Бондар Вікторія", "+380939990011", "Дислалія (звук Ш, Ж)", maria_id),
            ("Мороз Олександр", date(2018, 4, 17), "Мороз Тетяна", "+380680001122", "РАС (розлади аутистичного спектру)", maria_id),
            
            ("Петренко Ілля", date(2019, 11, 30), "Петренко Наталія", "+380991234567", "Дислалія", olga_id),
            ("Савченко Злата", date(2017, 8, 22), "Савченко Віталій", "+380937654321", "ЗРМ", olga_id),
            ("Клименко Дарина", date(2018, 2, 11), "Клименко Тетяна", "+380672345678", "ФНМ", olga_id),
            ("Дмитренко Тимофій", date(2016, 5, 29), "Дмитренко Олег", "+380508765432", "Алалія сенсорна", olga_id),
            ("Федоренко Поліна", date(2019, 12, 1), "Федоренко Ганна", "+380633456789", "ЗРМ", olga_id),
            
            ("Козак Микита", date(2015, 12, 18), "Козак Сергій", "+380689876543", "СДУГ (синдром дефіциту уваги та гіперактивності)", maria_id),
            ("Кузьменко Емілія", date(2020, 1, 9), "Кузьменко Олена", "+380954567890", "ЗРМ", maria_id),
            ("Мельниченко Марк", date(2018, 9, 4), "Мельниченко Яна", "+380675432109", "Дислалія (звуки Р, Р')", maria_id),
            ("Степаненко Кирил", date(2017, 6, 14), "Степаненко Віктор", "+380935678901", "Дислалія", maria_id),
            ("Харченко Аліса", date(2019, 3, 23), "Харченко Юлія", "+380504321098", "ЗРМ", maria_id),
        ]
        
        patients = []
        for name, dob, parent, phone, diag, th_id in patients_data:
            p = Patient(
                full_name=name,
                birth_date=dob,
                parent_name=parent,
                parent_phone=phone,
                diagnosis=diag,
                therapist_id=th_id,
                is_active=True
            )
            db.add(p)
            patients.append(p)
            
        await db.commit()
        
        # 5. Створення абонементів та оплат для перших 15 пацієнтів
        print("Наповнення абонементами та оплатами...")
        for i in range(15):
            patient = patients[i]
            # Абонемент на 10 занять
            total_les = 10
            rem_les = 10 - (i % 5)  # 10, 9, 8, 7, 6 залишків занять
            price = 4500.0  # 450 грн за заняття
            
            sub = Subscription(
                patient_id=patient.id,
                total_lessons=total_les,
                remaining_lessons=rem_les,
                price_paid=price,
                purchase_date=datetime.utcnow() - timedelta(days=i),
                is_active=(rem_les > 0)
            )
            db.add(sub)
            
            # Створюємо відповідну оплату
            payment = Payment(
                patient_id=patient.id,
                amount=price,
                payment_type="subscription",
                payment_date=datetime.utcnow() - timedelta(days=i)
            )
            db.add(payment)
            
        # Разові оплати для останніх 5 пацієнтів
        for i in range(15, 20):
            patient = patients[i]
            payment = Payment(
                patient_id=patient.id,
                amount=500.0,  # 500 грн разове
                payment_type="single",
                payment_date=datetime.utcnow() - timedelta(days=i)
            )
            db.add(payment)
            
        await db.commit()
        
        # 6. Створення розкладу занять на поточний тиждень
        print("Створення розкладу занять...")
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        start_of_week = today - timedelta(days=today.weekday())  # Понеділок
        
        # Створимо декілька занять на кожен день тижня
        lessons_seed = []
        
        # Понеділок - Неділя
        for day_offset in range(7):
            day_date = start_of_week + timedelta(days=day_offset)
            
            # Логопед Ольга (Мельник) - робочий час з 9:00 до 14:00
            for hour in range(9, 14):
                patient_idx = (day_offset * 3 + (hour - 9)) % 10  # Пацієнти Ольги
                patient = patients[patient_idx]
                
                start_time = day_date.replace(hour=hour, minute=0)
                end_time = day_date.replace(hour=hour, minute=45)
                
                # Статус: якщо день минув — проведено, якщо сьогодні або майбутнє — заплановано
                status = "conducted" if start_time < datetime.utcnow() else "planned"
                if day_offset == 1 and hour == 10:  # Робимо одне скасованим
                    status = "cancelled"
                
                lesson = Lesson(
                    patient_id=patient.id,
                    therapist_id=olga_id,
                    cabinet=cabinets[0] if hour % 2 == 0 else cabinets[3],
                    start_time=start_time,
                    end_time=end_time,
                    status=status,
                    notes="Дитина активно працювала на занятті. Почали підготовку до автоматизації звуку Р." if status == "conducted" else None,
                    target_sounds="Р" if status == "conducted" else None,
                    homework="Робити артикуляційну гімнастику 'Грибок' та 'Дятел' перед дзеркалом по 5 хвилин щодня." if status == "conducted" else None
                )
                db.add(lesson)
                
            # Логопед Марія (Шевченко) - робочий час з 13:00 до 18:00
            for hour in range(13, 18):
                patient_idx = 10 + ((day_offset * 3 + (hour - 13)) % 10)  # Пацієнти Марії
                patient = patients[patient_idx]
                
                start_time = day_date.replace(hour=hour, minute=0)
                end_time = day_date.replace(hour=hour, minute=45)
                
                status = "conducted" if start_time < datetime.utcnow() else "planned"
                
                lesson = Lesson(
                    patient_id=patient.id,
                    therapist_id=maria_id,
                    cabinet=cabinets[1] if hour % 2 == 0 else cabinets[2],
                    start_time=start_time,
                    end_time=end_time,
                    status=status,
                    notes="Проведено нейроігри на розвиток міжпівкульної взаємодії та координації рухів." if status == "conducted" else None,
                    target_sounds="Дихання, координація" if status == "conducted" else None,
                    homework="Гра 'Двома руками' (малювання симетричних фігур обома руками одночасно)." if status == "conducted" else None
                )
                db.add(lesson)
                
        await db.commit()
        print("Базу даних успішно заповнено тестовими даними (20 пацієнтів, розклад, фінанси)!")

if __name__ == "__main__":
    asyncio.run(seed_data())
