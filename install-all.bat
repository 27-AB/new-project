@echo off
echo.
echo =====================================================
echo   ASTU Analytics Platform - Install All Services
echo =====================================================
echo.
echo This will run npm install in all 5 services.
echo Make sure you have Node.js installed first.
echo.

cd auth-service && npm install && cd ..
echo [1/5] auth-service installed

cd research-service && npm install && cd ..
echo [2/5] research-service installed

cd community-service && npm install && cd ..
echo [3/5] community-service installed

cd college-service && npm install && cd ..
echo [4/5] college-service installed

cd analytics-service && npm install && cd ..
echo [5/5] analytics-service installed

cd frontend && npm install && cd ..
echo [6/6] frontend installed

echo.
echo =====================================================
echo   ALL INSTALLED! Now open 6 terminal windows and
echo   run one command in each:
echo =====================================================
echo.
echo   Terminal 1: cd auth-service      ^&^& npm start
echo   Terminal 2: cd research-service  ^&^& npm start
echo   Terminal 3: cd community-service ^&^& npm start
echo   Terminal 4: cd college-service   ^&^& npm start
echo   Terminal 5: cd analytics-service ^&^& npm start
echo   Terminal 6: cd frontend          ^&^& npm start
echo.
echo   Then open: http://localhost:3000
echo   Login:     admin@astu.edu.et / admin1234
echo.
echo   IMPORTANT: After first login go to Settings
echo   and click "Seed All Services" to populate the database!
echo.
pause
