# Advocate API Test Results

### POST /advocate/signup
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZjM5ZDQzYjcyOWJmMDU2MTA5MmVkZSIsImlhdCI6MTc3NzU3MzE4OCwiZXhwIjoxNzgwMTY1MTg4fQ.R3rtgb4fEfjyy-vEV_iyVJG37TBzlYaTYeqX8g9w6ek",
  "data": {
    "advId": "DEA0002",
    "name": "Advocate Arjun",
    "email": "arjun_1777573187562@law.com"
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

