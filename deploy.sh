#!/usr/bin/env bash
# ==============================================================================
# 🍃 NIHOL ERP - BACKEND AUTOMATED DEPLOYMENT SCRIPT (SaaS & IoT Server)
# ==============================================================================
# This script automates dependencies installation, production builds,
# database migrations, and PM2 process management.
# ==============================================================================

# Set strict shell environment
set -euo pipefail

# ANSI Color Codes for beautiful terminal logging
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0;33m' # No Color
CLEAR='\033[0m'

echo -e "${CYAN}"
echo "======================================================================"
echo " 🍃 Nihol ERP & IoT Server - Production Automatic Deployment Started "
echo "======================================================================"
echo -e "${CLEAR}"

# 1. PRE-FLIGHT SYSTEM VERIFICATION
echo -e "${CYAN}[1/5] Tizim muhitini tekshirish (System Pre-Flight Check)...${CLEAR}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}Xatolik: Node.js tizimga o'rnatilmagan! Iltimos, avval Node.js ni o'rnating.${CLEAR}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}Xatolik: npm tizimga o'rnatilmagan!${CLEAR}"
    exit 1
fi

NODE_VERSION=$(node -v)
NPM_VERSION=$(npm -v)
echo -e "${GREEN}✓ Node.js versiyasi: ${NODE_VERSION}${CLEAR}"
echo -e "${GREEN}✓ npm versiyasi: ${NPM_VERSION}${CLEAR}"

# 2. DEPENDENCIES SETUP
echo -e "\n${CYAN}[2/5] Kutubxonalar va bog'liqliklarni yangilash (Installing dependencies)...${CLEAR}"
npm install

# 3. COMPILING & BUILDING FOR PRODUCTION
echo -e "\n${CYAN}[3/5] Loyihani ishlab chiqarish rejimiga yig'ish (Compiling and building)...${CLEAR}"
npm run build

# 4. DATABASE MIGRATIONS (BLUEPRINT INTEGRITY CHECK)
echo -e "\n${CYAN}[4/5] Ma'lumotlar bazasi integratsiyasini tekshirish (Database integrity)...${CLEAR}"
if [ -f "db_data.json" ]; then
    echo -e "${GREEN}✓ 'db_data.json' in-memory ma'lumotlar ombori mavjud.${CLEAR}"
else
    echo -e "${YELLOW}ℹ 'db_data.json' topilmadi. Tizim ishga tushganda avtomatik ravishda yangi ombor yaratiladi.${CLEAR}"
fi

# 5. PM2 PROCESS MANAGEMENT & LAUNCH
echo -e "\n${CYAN}[5/5] PM2 jarayon boshqaruvini sozlash va ishga tushirish (Process management)...${CLEAR}"

if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}ℹ PM2 tizimda global ravishda topilmadi. PM2 o'rnatilmoqda...${CLEAR}"
    npm install -g pm2 || {
        echo -e "${YELLOW}⚠️ Global o'rnatish ruxsat berilmadi. PM2 ni mahalliy yoki npm orqali ishga tushiraman...${CLEAR}"
    }
fi

# Determine how to restart or start the PM2 service safely
APP_NAME="nihol-erp-backend"

if command -v pm2 &> /dev/null; then
    if pm2 show "$APP_NAME" &> /dev/null; then
        echo -e "${GREEN}✓ Tizim PM2-da allaqachon mavjud. Qayta yuklanmoqda (Zero-Downtime Reload)...${CLEAR}"
        pm2 reload "$APP_NAME" --update-env
    else
        echo -e "${GREEN}✓ Yangi PM2 jarayoni yaratilmoqda...${CLEAR}"
        pm2 start dist/server.cjs --name "$APP_NAME" --env production
    fi
    echo -e "${GREEN}✓ PM2 jarayoni holati:${CLEAR}"
    pm2 status
else
    echo -e "${YELLOW}⚠️ PM2 mavjud emas. Standart start buyrug'i orqali fonda ishga tushiraman...${CLEAR}"
    nohup npm start > backend.log 2>&1 &
    echo -e "${GREEN}✓ Server fonda ishga tushirildi (PID: $!). Jurnal 'backend.log' fayliga yozilmoqda.${CLEAR}"
fi

echo -e "\n${GREEN}======================================================================"
echo " 🎉 DEPLOYMENT COMPLETED SUCCESSFULY! / DEPLOYMENT MUVAFFOQIYATLI YAKUNLANDI "
echo "======================================================================"
echo -e "${CLEAR}"
