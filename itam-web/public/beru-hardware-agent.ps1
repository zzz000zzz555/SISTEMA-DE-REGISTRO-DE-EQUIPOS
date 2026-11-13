# ============================================================================
# BERU Hardware Agent - Micro-listener HTTP local para registro automatico
# Ejecutar en PowerShell: powershell -ExecutionPolicy Bypass -File beru-hardware-agent.ps1
# Responde en http://localhost:9191/scan-hardware con JSON del hardware
# ============================================================================

$port = 9191
$prefix = "http://localhost:$port/"

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)
$listener.Start()
Write-Host "BERU Hardware Agent escuchando en $prefix" -ForegroundColor Green
Write-Host "Presiona Ctrl+C para detener." -ForegroundColor Yellow

function Get-HardwareInfo {
    $ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.PrefixOrigin -ne "WellKnown" } | Select-Object -First 1).IPAddress
    if (-not $ip) { $ip = "0.0.0.0" }

    $mac = (Get-NetAdapter | Where-Object { $_.Status -eq "Up" } | Select-Object -First 1).MacAddress
    if (-not $mac) { $mac = "00:00:00:00:00:00" }

    $cpu = Get-CimInstance Win32_Processor | Select-Object -First 1
    $os = Get-CimInstance Win32_OperatingSystem
    $board = Get-CimInstance Win32_BaseBoard | Select-Object -First 1
    $bios = Get-CimInstance Win32_BIOS | Select-Object -First 1
    $ram = Get-CimInstance Win32_PhysicalMemory
    $disks = Get-CimInstance Win32_LogicalDisk -Filter "DriveType=3"

    $ramTotalGB = [math]::Round(($ram | Measure-Object -Property Capacity -Sum).Sum / 1GB, 2)
    $ramSlots = $ram.Count

    $diskInfo = @()
    foreach ($d in $disks) {
        $diskInfo += @{
            drive = $d.DeviceID
            model = $d.VolumeName
            size_gb = [math]::Round($d.Size / 1GB, 2)
            free_gb = [math]::Round($d.FreeSpace / 1GB, 2)
        }
    }

    $obj = @{
        hostname = $env:COMPUTERNAME
        usuario_windows = $env:USERNAME
        ip_local = $ip
        mac = $mac
        sistema_operativo = $os.Caption
        version_so = $os.Version
        serie_bios = $bios.SerialNumber
        placa_madre = @{
            fabricante = $board.Manufacturer
            modelo = $board.Product
        }
        procesador = @{
            modelo = $cpu.Name
            nucleos = $cpu.NumberOfCores
            hilos = $cpu.NumberOfLogicalProcessors
            frecuencia_mhz = $cpu.MaxClockSpeed
        }
        ram = @{
            total_gb = $ramTotalGB
            slots_ocupados = $ramSlots
        }
        discos = $diskInfo
        fecha_escaneo = (Get-Date).ToString("o")
    }

    return ($obj | ConvertTo-Json -Depth 5)
}

while ($true) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response

    # CORS headers
    $response.Headers.Add("Access-Control-Allow-Origin", "*")
    $response.Headers.Add("Access-Control-Allow-Methods", "GET, OPTIONS")
    $response.Headers.Add("Access-Control-Allow-Headers", "Content-Type")

    if ($request.HttpMethod -eq "OPTIONS") {
        $response.StatusCode = 204
        $response.Close()
        continue
    }

    if ($request.Url.LocalPath -eq "/scan-hardware") {
        $json = Get-HardwareInfo
        $buffer = [System.Text.Encoding]::UTF8.GetBytes($json)
        $response.ContentType = "application/json"
        $response.ContentLength64 = $buffer.Length
        $response.OutputStream.Write($buffer, 0, $buffer.Length)
        $response.StatusCode = 200
    } else {
        $msg = '{"error":"Endpoint no encontrado. Usa /scan-hardware"}'
        $buffer = [System.Text.Encoding]::UTF8.GetBytes($msg)
        $response.ContentType = "application/json"
        $response.ContentLength64 = $buffer.Length
        $response.OutputStream.Write($buffer, 0, $buffer.Length)
        $response.StatusCode = 404
    }
    $response.Close()
}