# Advocate API Test Results

### POST /advocate/signup
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZjQyMGE5YjcyOWJmMDU2MTA5MmYwNyIsImlhdCI6MTc3NzYwNjgyNSwiZXhwIjoxNzgwMTk4ODI1fQ.otGYuNrnsffef54ZSmfEPNvDRrIz3VgXnyus5kNYO8w",
  "data": {
    "advId": "DEA0003",
    "name": "Advocate Arjun",
    "email": "arjun_1777606824909@law.com"
  }
}
```

### GET /advocate/fees
```json
{
  "success": true,
  "data": {
    "feesPerSitting": 350,
    "yearsOfExperience": 4,
    "bracket": {
      "bracketKey": "3-6",
      "defaultFee": 350,
      "maxFee": 950
    }
  }
}
```

### PATCH /advocate/fees
```json
{
  "success": true,
  "message": "Fees updated successfully",
  "data": {
    "feesPerSitting": 950,
    "yearsOfExperience": 4,
    "bracket": {
      "bracketKey": "3-6",
      "maxFee": 950
    }
  }
}
```

