Add-Type -AssemblyName System.Drawing

function Render-QorvexIcon {
    param(
        [string]$OutputPath,
        [int]$Size,
        [bool]$IsDark = $true
    )

    $bmp = New-Object System.Drawing.Bitmap $Size, $Size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

    $scale = $Size / 512.0

    # Background colors
    $cBg1 = if ($IsDark) { [System.Drawing.Color]::FromArgb(255, 11, 19, 43) } else { [System.Drawing.Color]::FromArgb(255, 248, 250, 252) }
    $cBg2 = if ($IsDark) { [System.Drawing.Color]::FromArgb(255, 58, 80, 107) } else { [System.Drawing.Color]::FromArgb(255, 226, 232, 240) }
    
    $bgRect = New-Object System.Drawing.Rectangle 0, 0, $Size, $Size
    $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $bgRect, $cBg1, $cBg2, 45.0
    
    # Rounded rectangle path
    $radius = [int](108 * $scale)
    $diameter = $radius * 2
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddArc(0, 0, $diameter, $diameter, 180, 90)
    $path.AddArc($Size - $diameter, 0, $diameter, $diameter, 270, 90)
    $path.AddArc($Size - $diameter, $Size - $diameter, $diameter, $diameter, 0, 90)
    $path.AddArc(0, $Size - $diameter, $diameter, $diameter, 90, 90)
    $path.CloseFigure()
    
    $g.FillPath($bgBrush, $path)

    # Outer tech ring
    $ringPenColor = if ($IsDark) { [System.Drawing.Color]::FromArgb(180, 42, 56, 89) } else { [System.Drawing.Color]::FromArgb(180, 203, 213, 225) }
    $ringPen = New-Object System.Drawing.Pen $ringPenColor, [float](4 * $scale)
    $ringPen.DashPattern = @([float]4.0, [float]2.0)
    $r = 180 * $scale
    $g.DrawEllipse($ringPen, [float](256 * $scale - $r), [float](256 * $scale - $r), [float]($r * 2), [float]($r * 2))

    # Diamond path
    $dPenColor1 = [System.Drawing.Color]::FromArgb(255, 0, 201, 167)
    $dPenColor2 = [System.Drawing.Color]::FromArgb(255, 0, 128, 128)
    $dRect = New-Object System.Drawing.Rectangle [int](160 * $scale), [int](160 * $scale), [int](192 * $scale), [int](192 * $scale)
    $dBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $dRect, $dPenColor1, $dPenColor2, 45.0
    $dPen = New-Object System.Drawing.Pen $dBrush, [float](20 * $scale)
    $dPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round

    $pts = @(
        (New-Object System.Drawing.PointF (160 * $scale), (256 * $scale)),
        (New-Object System.Drawing.PointF (256 * $scale), (160 * $scale)),
        (New-Object System.Drawing.PointF (352 * $scale), (256 * $scale)),
        (New-Object System.Drawing.PointF (256 * $scale), (352 * $scale))
    )
    $g.DrawPolygon($dPen, $pts)

    # Central Hexagon
    $hexPts = @(
        (New-Object System.Drawing.PointF (256 * $scale), (196 * $scale)),
        (New-Object System.Drawing.PointF (308 * $scale), (226 * $scale)),
        (New-Object System.Drawing.PointF (308 * $scale), (286 * $scale)),
        (New-Object System.Drawing.PointF (256 * $scale), (316 * $scale)),
        (New-Object System.Drawing.PointF (204 * $scale), (286 * $scale)),
        (New-Object System.Drawing.PointF (204 * $scale), (226 * $scale))
    )
    $hexFill = New-Object System.Drawing.SolidBrush (if ($IsDark) { [System.Drawing.Color]::FromArgb(255, 11, 19, 43) } else { [System.Drawing.Color]::FromArgb(255, 255, 255, 255) })
    $g.FillPolygon($hexFill, $hexPts)

    $glowColor1 = [System.Drawing.Color]::FromArgb(255, 100, 223, 223)
    $glowColor2 = [System.Drawing.Color]::FromArgb(255, 72, 191, 227)
    $glowBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $dRect, $glowColor1, $glowColor2, 45.0
    $hexPen = New-Object System.Drawing.Pen $glowBrush, [float](10 * $scale)
    $g.DrawPolygon($hexPen, $hexPts)

    # Central Q circle and tail
    $qFill = New-Object System.Drawing.SolidBrush $dPenColor1
    $qr = 28 * $scale
    $g.FillEllipse($qFill, [float](256 * $scale - $qr), [float](256 * $scale - $qr), [float]($qr * 2), [float]($qr * 2))

    $tailPen = New-Object System.Drawing.Pen $glowBrush, [float](16 * $scale)
    $tailPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $tailPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $g.DrawLine($tailPen, [float](272 * $scale), [float](272 * $scale), [float](320 * $scale), [float](320 * $scale))

    # Satellite nodes
    $nodeBrush = New-Object System.Drawing.SolidBrush $glowColor1
    $nr = 16 * $scale
    $nodes = @(
        @(256, 160),
        @(352, 256),
        @(256, 352),
        @(160, 256)
    )
    foreach ($n in $nodes) {
        $nx = $n[0] * $scale
        $ny = $n[1] * $scale
        $g.FillEllipse($nodeBrush, [float]($nx - $nr), [float]($ny - $nr), [float]($nr * 2), [float]($nr * 2))
    }

    $bmp.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Generated: $OutputPath ($Size x $Size)"
}

$assetsDir = "c:\Users\Piyush Junghare\Downloads\QORVEX_VGIL_SyncAI_MCP_MVP\public\assets"
Render-QorvexIcon -OutputPath "$assetsDir\icon-dark.png" -Size 512 -IsDark $true
Render-QorvexIcon -OutputPath "$assetsDir\icon-light.png" -Size 512 -IsDark $false
Render-QorvexIcon -OutputPath "$assetsDir\icon.png" -Size 512 -IsDark $true
Render-QorvexIcon -OutputPath "$assetsDir\composer-icon.png" -Size 128 -IsDark $true
