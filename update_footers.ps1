
$pagesDir = "c:\Users\hdlfr\OneDrive\Desktop\St. Bernadine Official Website\pages"
$files = Get-ChildItem -Path $pagesDir -Filter *.html

foreach ($file in $files) {
    try {
        $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
        
        # pattern to find footer bottom paragraph
        # using (?s) for single-line mode (dot matches newline)
        $pattern = '(?s)(<div class="footer-bottom">\s*<p>)(.*?)(<\/p>\s*<\/div>)'
        
        if ($content -match "Privacy & Safety") {
            Write-Host "Skipping $($file.Name): Links already exist."
            continue
        }
        
        if ($content -match $pattern) {
            # $matches[0] is the whole match
            # $matches[1] is start tag
            # $matches[2] is existing text
            # $matches[3] is end tag
            
            # Note: PowerShell -replace operator uses regex, but substitution references are $1, $2 etc.
            # We want to append to group 2.
            
            # The replacement string needs to be carefully constructed.
            # We escape quotes by doubling them or using single quotes for the string.
            
            $newContent = $content -replace $pattern, '${1}${2} | <a href="privacy.html" style="color: inherit; text-decoration: none;">Privacy & Safety</a> | <a href="terms.html" style="color: inherit; text-decoration: none;">Terms & Conditions</a>${3}'
            
            Set-Content -Path $file.FullName -Value $newContent -Encoding UTF8
            Write-Host "Updated $($file.Name)"
        }
        else {
            Write-Host "Warning: Footer pattern not found in $($file.Name)"
        }
    }
    catch {
        Write-Host "Error updating $($file.Name): $_"
    }
}
