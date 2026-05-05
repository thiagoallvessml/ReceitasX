Get-ChildItem -Path . -Recurse -Filter *.html | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    if ($content -match '<link rel="canonical" href="([^"]+)\.html"') {
        $newContent = $content -replace '<link rel="canonical" href="([^"]+)\.html"', '<link rel="canonical" href="$1"'
        Set-Content -Path $_.FullName -Value $newContent -Encoding UTF8
        Write-Host "Fixed $($_.FullName)"
    }
}
