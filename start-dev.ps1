$ErrorActionPreference = 'Stop'
$frontendRoot = $PSScriptRoot
$backendRoot = Join-Path (Split-Path -Parent $frontendRoot) 'stressed-backend'
$backendPython = Join-Path $backendRoot '.venv\Scripts\python.exe'
if (-not (Test-Path -LiteralPath $backendPython)) { throw 'Create the backend virtual environment and follow its README first.' }
$backendProcess = Start-Process -FilePath $backendPython -ArgumentList @('-m', 'uvicorn', 'main:app', '--host', '127.0.0.1', '--port', '8000', '--no-access-log') -WorkingDirectory $backendRoot -WindowStyle Hidden -PassThru
try {
    Set-Location -LiteralPath $frontendRoot
    npm run dev
} finally {
    if (-not $backendProcess.HasExited) { Stop-Process -Id $backendProcess.Id }
}
