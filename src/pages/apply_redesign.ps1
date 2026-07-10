$path = "C:/Users/Blae/Desktop/proyectos/erp_escolar_ai/frontend/src/pages/AdminDashboard.jsx"
$content = Get-Content $path -Raw -Encoding UTF8

# Replace specific AI div
$aiDivRegex = '<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold shadow-\[0_0_15px_rgba\(99,102,241,0\.5\)\] text-lg">AI</div>'
$newAiDiv = '<img src="/logo.png" alt="Logo" className="h-10 w-auto object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]" />'
$content = [System.Text.RegularExpressions.Regex]::Replace($content, $aiDivRegex, $newAiDiv)

# Replace title
$titleOld = '<h1 className="text-xl font-bold tracking-tight leading-tight">Portal de<br/>Dirección</h1>'
$titleNew = '<h1 className="text-xl font-bold tracking-tight leading-tight">I.E.P.<br/>José María Arguedas</h1>'
$content = $content.Replace($titleOld, $titleNew)

# Replace shadows
$content = [System.Text.RegularExpressions.Regex]::Replace($content, 'shadow-\[0_0_\d+px_rgba\((?:99,102,241|79,70,229),[\d\.]+\)\]', 'shadow-blue-800/40')
$content = [System.Text.RegularExpressions.Regex]::Replace($content, 'shadow-indigo-[0-9a-zA-Z/]+', 'shadow-blue-800/40')
$content = [System.Text.RegularExpressions.Regex]::Replace($content, 'shadow-purple-[0-9a-zA-Z/]+', 'shadow-blue-800/40')
$content = [System.Text.RegularExpressions.Regex]::Replace($content, 'shadow-fuchsia-[0-9a-zA-Z/]+', 'shadow-blue-800/40')

# Replace color names
$content = $content.Replace("indigo", "blue")
$content = $content.Replace("purple", "blue")
$content = $content.Replace("fuchsia", "blue")

Set-Content -Path $path -Value $content -Encoding UTF8
