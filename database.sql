-- PostgreSQL Database Schema for Nihol AI ERP (Multi-Tenant Bog'cha Ekotizimi)
-- Compatible with PostgreSQL 13+

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TENANT TABLE: KINDERGARTENS
CREATE TABLE kindergartens (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    director_name VARCHAR(150),
    director_username VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. EMPLOYEES / USERS TABLE (RBAC)
CREATE TABLE employees (
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('SuperAdmin', 'Direktor', 'Tarbiyachi', 'Oshpaz', 'Hamshira', 'Buxgalter')),
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(50),
    passport VARCHAR(50),
    birth_date DATE,
    joined_date DATE,
    status VARCHAR(20) DEFAULT 'Faol' CHECK (status IN ('Faol', 'Nofaol')),
    kindergarten_id VARCHAR(50) REFERENCES kindergartens(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. GROUPS TABLE
CREATE TABLE groups (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    teacher_id VARCHAR(50) REFERENCES employees(id) ON DELETE SET NULL,
    capacity INT DEFAULT 25,
    spots INT DEFAULT 0,
    kindergarten_id VARCHAR(50) REFERENCES kindergartens(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. CHILDREN TABLE (Student Directory with Medical and Document details)
CREATE TABLE children (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    birth_date DATE NOT NULL,
    age INT,
    gender VARCHAR(10) CHECK (gender IN ('O''g''il', 'Qiz')),
    group_id VARCHAR(50) REFERENCES groups(id) ON DELETE SET NULL,
    parent_phone VARCHAR(50) NOT NULL,
    parent_name VARCHAR(150) NOT NULL,
    photo TEXT, -- Base64 or Image URL
    status VARCHAR(20) DEFAULT 'Kelmagan' CHECK (status IN ('Bog''chada', 'Kelmagan', 'Kechikdi', 'Sababli')),
    telegram_chat_id VARCHAR(100),
    
    -- Documents (Boolean Flags)
    birth_certificate BOOLEAN DEFAULT FALSE,
    medical_card_flag BOOLEAN DEFAULT FALSE,
    passport_copy BOOLEAN DEFAULT FALSE,
    contract_flag BOOLEAN DEFAULT FALSE,
    photo_uploaded BOOLEAN DEFAULT FALSE,
    
    -- Medical Card Details
    allergies TEXT,
    blood_group VARCHAR(10),
    rh_factor VARCHAR(20),
    vaccinations TEXT[], -- Array of vaccines
    height INT, -- cm
    weight INT, -- kg
    bmi NUMERIC(4,1),
    last_checkup DATE,
    
    kindergarten_id VARCHAR(50) REFERENCES kindergartens(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. ATTENDANCE TABLE (Includes pickup person photo feature)
CREATE TABLE attendance (
    id VARCHAR(50) PRIMARY KEY,
    child_id VARCHAR(50) REFERENCES children(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in VARCHAR(10), -- e.g., '08:15'
    check_out VARCHAR(10), -- e.g., '17:30'
    status VARCHAR(20) NOT NULL CHECK (status IN ('Keldi', 'Ketdi', 'Kechikdi', 'Sababli', 'Sababsiz')),
    reason VARCHAR(255),
    device_ip VARCHAR(50),
    pickup_photo TEXT, -- Photographic record of person picking up the child
    kindergarten_id VARCHAR(50) REFERENCES kindergartens(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(child_id, date)
);

-- 6. PAYMENTS TABLE (Child contract tracking)
CREATE TABLE payments (
    id VARCHAR(50) PRIMARY KEY,
    child_id VARCHAR(50) REFERENCES children(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount DECIMAL(12,2) NOT NULL,
    payment_type VARCHAR(50) NOT NULL CHECK (payment_type IN ('Naqd', 'Click', 'Payme', 'Humo', 'Visa', 'Mastercard', 'Bank O''tkazmasi', 'Uzum Bank')),
    month VARCHAR(20) NOT NULL, -- e.g. 'Iyun'
    status VARCHAR(20) NOT NULL CHECK (status IN ('To''landi', 'Qisman', 'Qarzdor')),
    discount DECIMAL(12,2) DEFAULT 0.00,
    penalty DECIMAL(12,2) DEFAULT 0.00,
    receipt_number VARCHAR(100),
    operator_name VARCHAR(150),
    kindergarten_id VARCHAR(50) REFERENCES kindergartens(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. EXPENSES TABLE (Kindergarten expenditure)
CREATE TABLE expenses (
    id VARCHAR(50) PRIMARY KEY,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    category VARCHAR(100) NOT NULL CHECK (category IN ('Oziq-ovqat', 'Kommunal xizmatlar', 'Ish haqi', 'Tozalash vositalari', 'O''yinchoqlar', 'Ta''mirlash', 'Transport', 'Soliq', 'Boshqa xarajatlar')),
    description TEXT,
    amount DECIMAL(12,2) NOT NULL,
    payment_type VARCHAR(50) NOT NULL,
    responsible VARCHAR(150),
    receipt_url TEXT,
    kindergarten_id VARCHAR(50) REFERENCES kindergartens(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. PAYROLL TABLE (Staff Salaries)
CREATE TABLE payrolls (
    id VARCHAR(50) PRIMARY KEY,
    employee_id VARCHAR(50) REFERENCES employees(id) ON DELETE CASCADE,
    base_salary DECIMAL(12,2) NOT NULL,
    bonus DECIMAL(12,2) DEFAULT 0.00,
    fine DECIMAL(12,2) DEFAULT 0.00,
    tax DECIMAL(12,2) DEFAULT 0.00,
    final_amount DECIMAL(12,2) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'To''landi' CHECK (status IN ('To''landi', 'Kutilmoqda')),
    kindergarten_id VARCHAR(50) REFERENCES kindergartens(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. INCOMES TABLE (Additional non-tuition revenue)
CREATE TABLE incomes (
    id VARCHAR(50) PRIMARY KEY,
    source VARCHAR(100) NOT NULL, -- 'Oylik to''lov', 'Qo''shimcha dars', 'Ekskursiya', 'Homiylik', 'Davlat subsidiyasi'
    amount DECIMAL(12,2) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT,
    kindergarten_id VARCHAR(50) REFERENCES kindergartens(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. PURCHASE REQUESTS (Inventory and Kitchen workflow)
CREATE TABLE purchase_requests (
    id VARCHAR(50) PRIMARY KEY,
    sender_name VARCHAR(150) NOT NULL,
    sender_role VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(50) DEFAULT 'Kutilmoqda' CHECK (status IN ('Kutilmoqda', 'Tasdiqlandi', 'To''landi')),
    approved_by VARCHAR(150),
    kindergarten_id VARCHAR(50) REFERENCES kindergartens(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. MEAL PLANS TABLE
CREATE TABLE meal_plans (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    meal_type VARCHAR(20) CHECK (meal_type IN ('breakfast', 'lunch', 'dinner')),
    title VARCHAR(255) NOT NULL,
    calories INT,
    protein INT,
    fat INT,
    carb INT,
    vitamins TEXT,
    minerals TEXT,
    image TEXT,
    ai_comment TEXT,
    kindergarten_id VARCHAR(50) REFERENCES kindergartens(id) ON DELETE CASCADE,
    UNIQUE(date, meal_type, kindergarten_id)
);

-- 12. COMPLAINTS TABLE
CREATE TABLE complaints (
    id VARCHAR(50) PRIMARY KEY,
    parent_name VARCHAR(150) NOT NULL,
    child_id VARCHAR(50) REFERENCES children(id) ON DELETE CASCADE,
    phone VARCHAR(50) NOT NULL,
    text TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'Yangi' CHECK (status IN ('Yangi', 'Ko''rildi', 'Hal etildi')),
    kindergarten_id VARCHAR(50) REFERENCES kindergartens(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. AUDIT LOGS TABLE
CREATE TABLE audit_logs (
    id VARCHAR(50) PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    username VARCHAR(100) NOT NULL,
    action TEXT NOT NULL,
    ip VARCHAR(50),
    device VARCHAR(150),
    kindergarten_id VARCHAR(50) REFERENCES kindergartens(id) ON DELETE SET NULL
);

-- INDEXES FOR SEAMLESS MULTI-TENANCY DATA ACCESS
CREATE INDEX idx_employees_kg ON employees(kindergarten_id);
CREATE INDEX idx_groups_kg ON groups(kindergarten_id);
CREATE INDEX idx_children_kg ON children(kindergarten_id);
CREATE INDEX idx_attendance_kg ON attendance(kindergarten_id);
CREATE INDEX idx_payments_kg ON payments(kindergarten_id);
CREATE INDEX idx_expenses_kg ON expenses(kindergarten_id);
CREATE INDEX idx_payrolls_kg ON payrolls(kindergarten_id);
CREATE INDEX idx_incomes_kg ON incomes(kindergarten_id);
CREATE INDEX idx_purchase_requests_kg ON purchase_requests(kindergarten_id);
CREATE INDEX idx_meal_plans_kg ON meal_plans(kindergarten_id);
CREATE INDEX idx_complaints_kg ON complaints(kindergarten_id);
CREATE INDEX idx_audit_logs_kg ON audit_logs(kindergarten_id);

-- SEED DATA
INSERT INTO kindergartens (id, name, address, phone, director_name, director_username) VALUES
('K-1', 'Nihol AI Bog''chasi (Chilonzor filiali)', 'Toshkent sh., Chilonzor tumani, 5-mavze', '+998711234567', 'Karimov Shaxzod Baxtiyorovich', 'director'),
('K-2', 'Kamalak G''unchalari Bog''chasi (Yunusobod filiali)', 'Toshkent sh., Yunusobod tumani, 11-mavze', '+998717654321', 'Siddiqov Elyor', 'director2');

INSERT INTO employees (id, username, password_hash, role, name, phone, passport, birth_date, joined_date, status, kindergarten_id) VALUES
('E-1', 'superadmin', 'admin135@', 'SuperAdmin', 'Asqarov Jamshid', '+998909990000', 'AA1234567', '1988-05-15', '2024-01-01', 'Faol', NULL),
('E-2', 'director', 'admin135@', 'Direktor', 'Karimov Shaxzod Baxtiyorovich', '+998901112233', 'AB9876543', '1982-11-22', '2024-03-10', 'Faol', 'K-1'),
('E-3', 'teacher', 'admin135@', 'Tarbiyachi', 'Rahimova Nodira Shavkatovna', '+998974445566', 'AC1112223', '1994-08-05', '2024-09-01', 'Faol', 'K-1'),
('E-4', 'chef', 'admin135@', 'Oshpaz', 'Abdullayev Rustam G''ofurovich', '+998946667788', 'AD3334445', '1975-02-14', '2024-05-01', 'Faol', 'K-1'),
('E-5', 'nurse', 'admin135@', 'Hamshira', 'Soliqova Nilufar Alisherovna', '+998937778899', 'AE5556667', '1990-12-10', '2024-06-15', 'Faol', 'K-1'),
('E-6', 'accountant', 'admin135@', 'Buxgalter', 'Xalilov Azizbek Husanovich', '+998912223344', 'AF7778889', '1985-04-18', '2024-04-01', 'Faol', 'K-1');
