$body = @{
    name = "Test Equipment"
    description = "Test Description" 
    rarity = "common"
    type = "misc"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:3000/api/equipment" `
    -Method Post `
    -Body $body `
    -ContentType "application/json" `
    -UseBasicParsing

Write-Host "Status: $($response.StatusCode)"
Write-Host "Response: $($response.Content)"
