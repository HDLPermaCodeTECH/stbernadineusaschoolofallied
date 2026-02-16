$files = Get-ChildItem -Path . -Filter *.html
foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    $newContent = $content -replace 'href="styles.css', 'href="asset/styles.css'
    $newContent = $newContent -replace 'src="script.js"', 'src="asset/script.js"'
    Set-Content -Path $file.FullName -Value $newContent -Encoding UTF8
    Write-Host "Updated $($file.Name)"
}
