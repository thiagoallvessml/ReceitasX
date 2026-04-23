$blogDir = "c:\Users\thiag\dyad-apps\ReceitasX\blog"
$files = Get-ChildItem "$blogDir\*.html" | Where-Object { $_.Name -ne "como-calcular-preco-bolo.html" -and $_.Name -ne "ponto-de-equilibrio-confeitaria.html" }

foreach ($file in $files) {
    # Read as UTF8
    $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
    
    # 1. Update links to remove .html
    $content = $content.Replace('href="../landing.html"', 'href="../landing"')
    $content = $content.Replace('href="../blog.html"', 'href="../blog"')
    $content = $content.Replace('href="../acesso-vitalicio.html"', 'href="../login"')
    $content = $content.Replace('href="../login.html"', 'href="../login"')
    
    # 2. Fix the sticky banner mojibake and convert to standard HTML entities/text like the 2 fixed files
    $content = $content.Replace('ðŸš€', '&#x1F680;')
    $content = $content.Replace('â€”', '&#8212;')
    $content = $content.Replace('PreÃ§o', 'Preço')
    $content = $content.Replace('ComeÃ§ar grÃ¡tis â†’', 'Começar grátis &#x2192;')
    $content = $content.Replace('âœ•', '&#x2715;')
    
    # Also just in case "Comecar gratis" was used
    $content = $content.Replace('Comecar gratis &#x2192;', 'Começar grátis &#x2192;')
    
    # 3. Write back with NO BOM
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($file.FullName, $content, $utf8NoBom)
}

Write-Host "Done fixing 27 blog files!"
