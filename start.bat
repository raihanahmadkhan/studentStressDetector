@echo off
echo Starting Student Stress Detector...
echo.

echo Installing frontend dependencies...
call npm install
echo.

echo Installing backend dependencies...
cd backend
pip install -r requirements.txt
cd ..
echo.

echo Starting backend server on port 8000...
start cmd /k "cd backend && uvicorn main:app --reload --port 8000"

timeout /t 3 /nobreak > nul

echo Starting frontend server...
start cmd /k "npm run dev"

echo.
echo Both servers are starting!
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo.
pause
