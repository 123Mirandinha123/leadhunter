$body = Get-Content 'D:\leadhunter\body.json' -Raw
Invoke-RestMethod -Uri 'http://localhost:3000/api/buscar' -Method Post -ContentType 'application/json' -Body $body
