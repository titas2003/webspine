# Client API Test Results

### POST /user/signup
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZjQyMGFhYjcyOWJmMDU2MTA5MmYxNCIsImlhdCI6MTc3NzYwNjgyNywiZXhwIjoxNzgwMTk4ODI3fQ.FyW-IGkpGIxR6A4Td8Iz_1M9vHmhSowYpFiD0nT_4ws",
  "user": {
    "id": "69f420aab729bf0561092f14",
    "clientId": "2SLTD12",
    "name": "Rahul Client",
    "vStatus": "Pending"
  }
}
```

### GET /user/profile
```json
{
  "success": true,
  "data": {
    "verificationDocs": {
      "aadharImage": null,
      "panImage": null,
      "videoUrl": null
    },
    "_id": "69f420aab729bf0561092f14",
    "clientId": "2SLTD12",
    "name": "Rahul Client",
    "phone": "79689199121",
    "email": "rahul_1777606826636@client.com",
    "aadharNumber": "318967247058",
    "photo": null,
    "vStatus": "Pending",
    "createdAt": "2026-05-01T03:40:26.998Z",
    "updatedAt": "2026-05-01T03:40:26.998Z",
    "__v": 0
  }
}
```

