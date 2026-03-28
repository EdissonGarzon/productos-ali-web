@echo off
cd /d "%~dp0"
if "%CLOUDFLARE_API_TOKEN%"=="" (
  echo Falta CLOUDFLARE_API_TOKEN en las variables del sistema o de la sesion.
  pause
  exit /b 1
)
if "%CLOUDFLARE_ACCOUNT_ID%"=="" (
  echo Falta CLOUDFLARE_ACCOUNT_ID en las variables del sistema o de la sesion.
  pause
  exit /b 1
)

echo Desplegando productos-ali-bot...
npx.cmd wrangler deploy .\bot-worker.js --name productos-ali-bot --compatibility-date 2026-03-26 --compatibility-flags global_fetch_strictly_public
pause
