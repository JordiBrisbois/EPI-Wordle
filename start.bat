@echo off
title EPI-Wordle Launcher

cls
echo.
echo ============================================
echo.
echo              EPI-WORDLE
echo         Clone Wordle Francais
echo.
echo ============================================
echo.

echo [1/3] Verification de Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo    ERREUR: Node.js n'est pas installe!
    echo.
    echo    Veuillez installer Node.js depuis:
    echo    https://nodejs.org/
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%a in ('node --version') do set NODE_VERSION=%%a
echo    OK Node.js %NODE_VERSION% detecte

echo.
echo [2/3] Verification des dependances...
if not exist "node_modules" (
    echo    Installation des dependances...
    call npm install
    if errorlevel 1 (
        echo.
        echo    ERREUR: Installation echouee
        echo.
        echo    Verifiez votre connexion internet
        echo.
        pause
        exit /b 1
    )
    echo    OK Dependances installees
) else (
    echo    OK Dependances deja installees
)

echo.
echo [3/3] Verification de la base de donnees...
if not exist "database\wordle.db" (
    echo    Creation de la base de donnees...
    call npm run init-db
    if errorlevel 1 (
        echo    ERREUR: Creation echouee
        pause
        exit /b 1
    )
    echo    OK Base de donnees creee
) else (
    echo    OK Base de donnees existante
)

echo.
echo [Info] Configuration securite (JWT)...
if "%JWT_SECRET%"=="" (
    echo    Generation d'une cle securisee...
    for /f "tokens=*" %%a in ('node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"') do set JWT_SECRET=%%a
    echo    OK Cle generee automatiquement
) else (
    echo    OK JWT_SECRET deja configure
)

echo.
echo ============================================
echo    Demarrage du serveur EPI-Wordle
echo ============================================
echo.
echo Adresses disponibles:
echo.

for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "ipv4"') do (
    echo    http://%%a:3000
)
echo    http://localhost:3000

echo.
echo Appuyez sur Ctrl+C pour arreter
echo.
echo ============================================
echo.

set NODE_ENV=development
npm start

if errorlevel 1 (
    echo.
    echo ERREUR: Le serveur a rencontre un probleme
    pause
)
