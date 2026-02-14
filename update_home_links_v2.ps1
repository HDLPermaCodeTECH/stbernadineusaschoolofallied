$rootPath = "."
$htmlFiles = Get-ChildItem -Path $rootPath -Filter *.html

foreach ($file in $htmlFiles) {
    try {
        $content = Get-Content -Path $file.FullName -Raw -ErrorAction Stop
        
        # Replace href="index.html" with the absolute URL
        $newContent = $content -replace 'href="index.html"', 'href="https://hdlpermacodetech.github.io/stbernadineusaschoolofallied/"'
        
        if ($content -ne $newContent) {
            $newContent | Set-Content -Path $file.FullName -Encoding UTF8
            Write-Host "Updated $($file.Name)"
        }
        else {
            Write-Host "No changes needed for $($file.Name)"
        }
    }
    catch {
        Write-Error "Failed to process $($file.Name): $_"
    }
}
