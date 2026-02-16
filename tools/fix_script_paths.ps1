$files = Get-ChildItem -Path . -Filter *.html
foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    # Replace src="script.js with src="asset/script.js (handling version tags)
    if ($content -match 'src="script.js') {
        $newContent = $content -replace 'src="script.js', 'src="asset/script.js'
        Set-Content -Path $file.FullName -Value $newContent -Encoding UTF8
        Write-Host "Fixed $($file.Name)"
    }
}
