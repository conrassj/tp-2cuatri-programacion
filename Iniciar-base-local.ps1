$ErrorActionPreference = 'Stop'
# Esta base está separada de la carpeta de datos normal de XAMPP.
$carpetaTrabajo = Join-Path (Split-Path $PSScriptRoot -Parent) 'work'
$configuracion = Join-Path $carpetaTrabajo 'mysql-data/my.ini'
$motor = 'C:\xampp\mysql\bin\mysqld.exe'
if (-not (Test-Path -LiteralPath $motor) -or -not (Test-Path -LiteralPath $configuracion)) {
    throw 'Esta ayuda corresponde a la instalación local. Seguí backend/README.md para configurar otra computadora.'
}
$cliente = New-Object System.Net.Sockets.TcpClient
try { $cliente.Connect('127.0.0.1',3307); $encendida=$true } catch { $encendida=$false } finally { $cliente.Dispose() }
if ($encendida) { Write-Host 'Ya hay un motor escuchando en el puerto 3307.'; exit }
Start-Process -FilePath $motor -ArgumentList ('--defaults-file="'+$configuracion+'"'), '--bind-address=127.0.0.1', '--port=3307' -WindowStyle Hidden
Write-Host 'Base de demostración iniciada en 3307. Ahora ejecutá npm run dev en backend y npm start en frontend.'
