# Admin API Test Results

### POST /admin/signup
```json
{
  "success": true,
  "message": "Admin account created successfully",
  "data": {
    "admId": "ADM000004",
    "name": "Super Admin",
    "email": "admin_1777606822505@example.com"
  }
}
```

### POST /admin/login
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZjQyMGE2YjcyOWJmMDU2MTA5MmVmNSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc3NzYwNjgyMywiZXhwIjoxNzgwMTk4ODIzfQ.CSn5LdTFl3CDhR8PHXujSHzWoO2EURXuQhkkFvg5TYc",
  "data": {
    "admId": "ADM000004",
    "name": "Super Admin",
    "email": "admin_1777606822505@example.com"
  }
}
```

### POST /admin/fee-policies/seed
```json
{
  "success": true,
  "message": "Default fee policies seeded successfully",
  "data": [
    {
      "_id": "69f39b22921b4d8fcb0a7c90",
      "bracketKey": "1-3",
      "__v": 0,
      "createdAt": "2026-04-30T18:10:42.132Z",
      "defaultFee": 300,
      "isActive": true,
      "maxFee": 700,
      "maxYears": 3,
      "minYears": 1,
      "updatedAt": "2026-05-01T03:40:23.896Z"
    },
    {
      "_id": "69f39b22921b4d8fcb0a7c91",
      "bracketKey": "3-6",
      "__v": 0,
      "createdAt": "2026-04-30T18:10:42.199Z",
      "defaultFee": 350,
      "isActive": true,
      "maxFee": 950,
      "maxYears": 6,
      "minYears": 3,
      "updatedAt": "2026-05-01T03:40:23.992Z"
    },
    {
      "_id": "69f39b22921b4d8fcb0a7c92",
      "bracketKey": "6-11",
      "__v": 0,
      "createdAt": "2026-04-30T18:10:42.258Z",
      "defaultFee": 1500,
      "isActive": true,
      "maxFee": 1800,
      "maxYears": 11,
      "minYears": 6,
      "updatedAt": "2026-05-01T03:40:24.087Z"
    },
    {
      "_id": "69f39b22921b4d8fcb0a7c93",
      "bracketKey": "11+",
      "__v": 0,
      "createdAt": "2026-04-30T18:10:42.314Z",
      "defaultFee": 4000,
      "isActive": true,
      "maxFee": 4500,
      "maxYears": null,
      "minYears": 11,
      "updatedAt": "2026-05-01T03:40:24.179Z"
    }
  ]
}
```

### POST /admin/fee-policies/refresh
```json
{
  "error": "Invalid JSON",
  "body": "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<title>Error</title>\n</head>\n<body>\n<pre>Cannot POST /api/admin/fee-policies/refresh</pre>\n</body>\n</html>\n"
}
```

### GET /admin/categories
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "69f217529817a1c1b5ab7ebb",
      "name": "Lower or Divisional Court",
      "slug": "lower-or-divisional-court",
      "description": "Courts at the district and sub-district level",
      "parent": null,
      "isActive": true,
      "order": 0,
      "createdAt": "2026-04-29T14:36:02.596Z",
      "updatedAt": "2026-04-29T14:36:02.596Z",
      "__v": 0,
      "children": [
        {
          "_id": "69f219909817a1c1b5ab7ec0",
          "name": "Civil Court",
          "slug": "civil-court",
          "description": "Handles civil disputes between individuals or organizations",
          "parent": "69f217529817a1c1b5ab7ebb",
          "isActive": true,
          "order": 1,
          "createdAt": "2026-04-29T14:45:36.716Z",
          "updatedAt": "2026-04-29T14:45:36.716Z",
          "__v": 0,
          "children": []
        },
        {
          "_id": "69f219b39817a1c1b5ab7ec3",
          "name": "Criminal Court",
          "slug": "criminal-court",
          "description": "Handles criminal proceedings and offences under IPC/CrPC",
          "parent": "69f217529817a1c1b5ab7ebb",
          "isActive": true,
          "order": 2,
          "createdAt": "2026-04-29T14:46:11.202Z",
          "updatedAt": "2026-04-29T14:46:11.202Z",
          "__v": 0,
          "children": []
        },
        {
          "_id": "69f39113caaa3b66a1657968",
          "name": "Matrimonial Matters",
          "slug": "matrimonial-matters",
          "description": "Handles divorce, alimony, custody and matrimonial disputes",
          "parent": "69f217529817a1c1b5ab7ebb",
          "isActive": true,
          "order": 3,
          "createdAt": "2026-04-30T17:27:47.545Z",
          "updatedAt": "2026-04-30T17:27:47.545Z",
          "__v": 0,
          "children": []
        }
      ]
    },
    {
      "_id": "69f3917fcaaa3b66a165796f",
      "name": "District Court",
      "slug": "district-court",
      "description": "Courts at the district level handling civil and criminal matters",
      "parent": null,
      "isActive": true,
      "order": 1,
      "createdAt": "2026-04-30T17:29:35.839Z",
      "updatedAt": "2026-04-30T17:29:35.839Z",
      "__v": 0,
      "children": [
        {
          "_id": "69f39235bc401c26eeecc405",
          "name": "Civil Court",
          "slug": "civil-court",
          "description": "Handles civil disputes between individuals or organizations",
          "parent": "69f3917fcaaa3b66a165796f",
          "isActive": true,
          "order": 1,
          "createdAt": "2026-04-30T17:32:37.580Z",
          "updatedAt": "2026-04-30T17:32:37.580Z",
          "__v": 0,
          "children": []
        },
        {
          "_id": "69f3925dbc401c26eeecc40d",
          "name": "Criminal Court",
          "slug": "criminal-court",
          "description": "Handles criminal proceedings and offences under IPC/CrPC",
          "parent": "69f3917fcaaa3b66a165796f",
          "isActive": true,
          "order": 2,
          "createdAt": "2026-04-30T17:33:17.538Z",
          "updatedAt": "2026-04-30T17:33:17.538Z",
          "__v": 0,
          "children": []
        },
        {
          "_id": "69f39285bc401c26eeecc415",
          "name": "Matrimonial Matters",
          "slug": "matrimonial-matters",
          "description": "Handles divorce, alimony, custody and matrimonial disputes",
          "parent": "69f3917fcaaa3b66a165796f",
          "isActive": true,
          "order": 3,
          "createdAt": "2026-04-30T17:33:57.684Z",
          "updatedAt": "2026-04-30T17:33:57.684Z",
          "__v": 0,
          "children": []
        }
      ]
    }
  ]
}
```

