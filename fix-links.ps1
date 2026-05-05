Get-ChildItem -Path . -Recurse -Filter *.html | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $newContent = $content -replace 'href="([^"]+)\.html"', 'href="$1"'
    if ($content -ne $newContent) {
        Set-Content -Path $_.FullName -Value $newContent -Encoding UTF8
        Write-Host "Fixed links in $($_.FullName)"
    }
}
