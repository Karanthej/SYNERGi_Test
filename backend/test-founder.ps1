$authUrl = 'http://localhost:8080/api/v1/auth/login'
$loginData = @{ email = 'karanthejkk@gmail.com'; password = 'Karan@123' } | ConvertTo-Json
$response = Invoke-RestMethod -Uri $authUrl -Method Post -Body $loginData -ContentType 'application/json'
$token = $response.data.accessToken

$startupsUrl = 'http://localhost:8080/api/v1/founder/startups'
$startups = Invoke-RestMethod -Uri $startupsUrl -Headers @{ Authorization = "Bearer $token" }
$startupUuid = $startups.data[0].uuid

$membersUrl = "http://localhost:8080/api/v1/workspaces/$startupUuid/members"
$members = Invoke-RestMethod -Uri $membersUrl -Headers @{ Authorization = "Bearer $token" }
$members.data | Select-Object fullName, email, isOnline | Format-Table
