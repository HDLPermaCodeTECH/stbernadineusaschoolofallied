Add-Type -AssemblyName System.Drawing

$path = "c:\Users\hdlfr\OneDrive\Desktop\SAMPLE WEB\images\4d-logo.jpg"

try {
    if (Test-Path $path) {
        $img = [System.Drawing.Bitmap]::FromFile($path)
        # Get top-left pixel assuming it's background
        $pixel = $img.GetPixel(0, 0)
        
        # Output RGB and Hex
        $hex = "#{0:X2}{1:X2}{2:X2}" -f $pixel.R, $pixel.G, $pixel.B
        Write-Host "RGB: $($pixel.R), $($pixel.G), $($pixel.B)"
        Write-Host "HEX: $hex"
        
        $img.Dispose()
    }
    else {
        Write-Host "File not found: $path"
    }
}
catch {
    Write-Host "Error: $_"
}
