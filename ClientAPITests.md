# Client API Test Results

### POST /user/signup
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZjM5ZDQ0YjcyOWJmMDU2MTA5MmVlYiIsImlhdCI6MTc3NzU3MzE4OCwiZXhwIjoxNzgwMTY1MTg4fQ.OSRcDU51vGMUZkc2He0uDeDsWb7TXsNmAkZm-1boj6g",
  "user": {
    "id": "69f39d44b729bf0561092eeb",
    "clientId": "EIMUSJB",
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
    "_id": "69f39d44b729bf0561092eeb",
    "clientId": "EIMUSJB",
    "name": "Rahul Client",
    "phone": "73712855036",
    "email": "rahul_1777573188662@client.com",
    "aadharNumber": "424811454702",
    "photo": null,
    "vStatus": "Pending",
    "createdAt": "2026-04-30T18:19:48.773Z",
    "updatedAt": "2026-04-30T18:19:48.773Z",
    "__v": 0
  }
}
```

