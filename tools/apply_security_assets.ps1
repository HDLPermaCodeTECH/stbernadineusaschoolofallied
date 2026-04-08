$files = Get-ChildItem -Path . -Filter *.html
foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    $changed = $false
    
    if ($content -match 'asset/script.js') {
        $content = $content -replace 'asset/script.js', 'asset/script.obfuscated.js'
        $changed = $true
    }
    
    if ($content -match 'asset/styles.css') {
        $content = $content -replace 'asset/styles.css', 'asset/styles.min.css'
        $changed = $true
    }
    
    if ($changed) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8
        Write-Host "SUCCESS: Updated $($file.Name)"
    }
}
