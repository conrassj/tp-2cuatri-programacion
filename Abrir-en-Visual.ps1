$ErrorActionPreference = 'Stop'
# Dos proyectos, dos ventanas de Visual Studio Code.
& code.cmd --new-window (Join-Path $PSScriptRoot 'backend/Backend.code-workspace')
& code.cmd --new-window (Join-Path $PSScriptRoot 'frontend/Frontend.code-workspace')
