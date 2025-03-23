#!/bin/bash

# Colores para la salida
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Iniciando servidores...${NC}"

# Matar procesos que usen los puertos necesarios
echo -e "${YELLOW}Limpiando puertos en uso...${NC}"
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Verificar si existe el entorno virtual, si no, crearlo
if [ ! -d "Backend/.venv" ]; then
    echo -e "${YELLOW}Entorno virtual no encontrado. Creando uno nuevo...${NC}"
    cd Backend
    python3 -m venv .venv
    source .venv/bin/activate
    pip install django
    pip install djangorestframework
    pip install django-cors-headers
    pip install python-dotenv
    pip install psycopg2-binary
    cd ..
else
    echo -e "${GREEN}Entorno virtual encontrado.${NC}"
fi

# Iniciar el backend
echo -e "${BLUE}Iniciando el servidor backend...${NC}"
cd Backend
source .venv/bin/activate
cd api_Mascotas/

# Limpiar la base de datos y migraciones
echo -e "${YELLOW}Limpiando base de datos y migraciones...${NC}"
rm -f db.sqlite3
rm -rf */migrations/

# Crear directorios de migraciones
mkdir -p dueño/migrations mascotas/migrations
touch dueño/migrations/__init__.py mascotas/migrations/__init__.py

# Crear y aplicar migraciones
echo -e "${YELLOW}Creando nuevas migraciones...${NC}"
python3 manage.py makemigrations dueño
python3 manage.py makemigrations mascotas
echo -e "${YELLOW}Aplicando migraciones...${NC}"
python3 manage.py migrate

# Iniciar el servidor Django
python3 manage.py runserver &
BACKEND_PID=$!
echo -e "${GREEN}Servidor backend iniciado con PID: $BACKEND_PID${NC}"

# Esperar un momento para que el backend se inicie completamente
sleep 2

# Iniciar el frontend
echo -e "${BLUE}Iniciando el servidor frontend...${NC}"
cd ../../Frontend/mascotas-front
npm run dev &
FRONTEND_PID=$!
echo -e "${GREEN}Servidor frontend iniciado con PID: $FRONTEND_PID${NC}"

echo -e "${GREEN}Ambos servidores están en ejecución.${NC}"
echo -e "${YELLOW}Si estás usando ngrok, recuerda actualizar las URLs en el archivo .env.local${NC}"
echo -e "${GREEN}Para detener los servidores, presiona Ctrl+C${NC}"

# Función para manejar la señal de interrupción (Ctrl+C)
cleanup() {
    echo -e "${BLUE}Deteniendo servidores...${NC}"
    kill $BACKEND_PID
    kill $FRONTEND_PID
    echo -e "${GREEN}Servidores detenidos.${NC}"
    exit 0
}

# Registrar la función de limpieza para la señal de interrupción
trap cleanup SIGINT

# Mantener el script en ejecución
wait 