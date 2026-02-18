$files = Get-ChildItem -Path "c:\Users\hdlfr\OneDrive\문서\St. Bernadine Official Website" -Filter "*.html"
foreach ($file in $files) {
    $content = Get-Content $file.FullName
    $lines = $content | Select-String "Make a Payment"
    foreach ($line in $lines) {
        if ($line -notmatch "payment.html") {
            Write-Host "Found unlinked 'Make a Payment' in $($file.Name): $($line.Line.Trim())"
        }
    }
}
