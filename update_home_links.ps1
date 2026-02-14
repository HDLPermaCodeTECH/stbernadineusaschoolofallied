$rootPath = "C:\Users\hdlfr\OneDrive\문서\St. Bernadine Official Website"
$htmlFiles = Get-ChildItem -Path $rootPath -Filter *.html

foreach ($file in $htmlFiles) {
    $content = Get-Content -Path $file.FullName -Raw
    
    # Replace href="index.html" with the absolute URL
    $newContent = $content -replace 'href="index.html"', 'href="https://hdlpermacodetech.github.io/stbernadineusaschoolofallied/"'
    
    if ($content -ne $newContent) {
        $newContent | Set-Content -Path $file.FullName
        Write-Host "Updated $($file.Name)"
    }
    else {
        Write-Host "No changes needed for $($file.Name)"
    }
}
