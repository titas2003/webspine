# MacclouSpine API Documentation

**Base URL**: `http://localhost:5005/api`

---

## 🛡️ Admin APIs
**Route Prefix**: `/admin`
**Auth**: Bearer Token in `Authorization` header.

### 1. Auth & Profile
| Endpoint | Method | Description | Example Input (JSON) |
| :--- | :--- | :--- | :--- |
| `/signup` | `POST` | Create admin account (Requires secret) | `{"name":"Admin","email":"admin@macclouspine.com","phone":"9999999999","panNumber":"ABCDE1234F","address":"Kolkata","password":"AdminPass@123","signupSecret":"macclouspine@admin2026"}` |
| `/login` | `POST` | Login with ADM ID + Password | `{"admId":"ADM000001","password":"AdminPass@123"}` |
| `/request-otp` | `POST` | Step 1: Send OTP to email | `{"admId":"ADM000001"}` |
| `/login-otp` | `POST` | Step 2: Verify OTP and Login | `{"admId":"ADM000001","otp":"123456"}` |
| `/profile` | `GET` | Get current admin details | (Header: `Authorization: Bearer <token>`) |
| `/logout` | `POST` | Invalidate current token | (Header: `Authorization: Bearer <token>`) |

### 2. Category Management
| Endpoint | Method | Description | Example Input (JSON) |
| :--- | :--- | :--- | :--- |
| `/categories` | `POST` | Create Category/Subcategory | `{"name":"District Court","description":"District level courts","order":1}` |
| `/categories` | `GET` | Get full nested tree | (Optional Query: `?flat=true`) |
| `/categories/:id`| `GET` | Get single category + children | (id: `69f217529817a1c1b5ab7ebb`) |
| `/categories/:id`| `PATCH` | Update category details | `{"name":"Updated Court Name"}` |
| `/categories/:id`| `DELETE`| Soft delete (deactivates children too) | (id: `69f217529817a1c1b5ab7ebb`) |

### 3. Fee Policy Management
| Endpoint | Method | Description | Example Input (JSON) |
| :--- | :--- | :--- | :--- |
| `/fee-policies/seed` | `POST` | Create default 4 brackets | (No body required) |
| `/fee-policies` | `GET` | List all experience brackets | (No body required) |
| `/fee-policies/:key` | `PUT` | Update bracket fees/limits | (Key: `3-6`, Body: `{"defaultFee":750,"maxFee":1100}`) |
| `/fee-policies/refreshFees` | `POST` | Audit fee violations & email notifications | (No body required) |

---

## ⚖️ Advocate APIs
**Route Prefix**: `/advocate`
**Auth**: Bearer Token in `Authorization` header.

### 1. Auth & Fees
| Endpoint | Method | Description | Example Input (JSON) |
| :--- | :--- | :--- | :--- |
| `/signup` | `POST` | Register as Advocate | `{"name":"Arjun Singh","email":"arjun@law.com","phone":"9876543210","state":"Delhi","password":"Pass123","yearsOfExperience":4}` |
| `/login` | `POST` | Login with Email/AdvID | `{"identifier":"arjun@law.com","password":"Pass123"}` |
| `/fees` | `GET` | View current fee + bracket | (Header: `Authorization: Bearer <token>`) |
| `/fees` | `PATCH` | Update fee or experience | `{"feesPerSitting":950}` |

### 2. Verification (Multipart Form-Data)
*Requires Bearer Token. Use `form-data` in Postman.*
| Endpoint | Method | Field Key | Description |
| :--- | :--- | :--- | :--- |
| `/verify/pan` | `PATCH` | `panImage` (File), `panNumber` (Text) | Upload PAN Card |
| `/verify/aadhar` | `PATCH` | `aadharImage` (File), `aadharNumber` (Text) | Upload Aadhar Card |
| `/verify/enrollment`| `PATCH` | `enrollmentCertificate` (File), `barId` (Text) | Upload BAR ID |
| `/verify/photo` | `PATCH` | `photo` (File) | Upload Profile Photo |
| `/verify/video` | `PATCH` | `video` (File) | Upload 5-sec Verification Video |

### 3. Availability & Appointments
| Endpoint | Method | Description | Example Input (JSON) |
| :--- | :--- | :--- | :--- |
| `/availability` | `POST` | Set Slots (Single or Recurring) | `{"date":"2026-05-10","startTime":"10:00","endTime":"11:00","recurrence":"weekly","recurrenceEnd":"2026-06-10"}` |
| `/availability` | `GET` | List my slots | (Optional Query: `?status=available&from=2026-05-01`) |
| `/appointments/requests` | `GET` | View pending bookings | (Header: `Authorization: Bearer <token>`) |
| `/appointments/:id/respond`| `PATCH` | Accept or Reject request | `{"status":"accepted"}` |
| `/appointments/:id/schedule`| `PATCH` | Add Meeting Link/Location | `{"meetingType":"video","meetingLink":"https://meet.google.com/abc"}` |

---

## 👤 Client (User) APIs
**Route Prefix**: `/client`
**Auth**: Bearer Token in `Authorization` header.

### 1. Auth & Account
| Endpoint | Method | Description | Example Input (JSON) |
| :--- | :--- | :--- | :--- |
| `/signup` | `POST` | Register Client | `{"name":"Rahul Roy","phone":"9123456789","email":"rahul@mail.com","govId":"123456789012","password":"Pass123"}` |
| `/login` | `POST` | Login with Phone/Email/ClientID | `{"identifier":"9123456789","password":"Pass123"}` |
| `/location` | `PATCH` | Update GPS Location | `{"latitude":22.5726,"longitude":88.3639,"address":"Kolkata, WB"}` |

### 2. Appointments
| Endpoint | Method | Description | Example Input (JSON) |
| :--- | :--- | :--- | :--- |
| `/advocates/:advId/slots`| `GET` | Browse an Advocate's slots | (advId: `WBA0001`) |
| `/appointments` | `POST` | Book an Available Slot | `{"slotId":"69f217529817a1c1b5ab7ebb","notes":"Family dispute"}` |
| `/appointments/upcoming` | `GET` | My accepted bookings | (Header: `Authorization: Bearer <token>`) |
| `/appointments/:id/cancel` | `PATCH` | Cancel a booking | (id: `appointment_id`) |

---

## 📋 Tested Response Samples

### Success: Advocate Signup
```json
{
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI...",
    "data": {
        "advId": "WBA0004",
        "name": "Arjun Singh",
        "email": "arjun@law.com"
    }
}
```

### Success: Fee Update (Bracket Change)
```json
{
    "success": true,
    "message": "Experience bracket updated to '6-11'. Fee reset to default ₹1500.",
    "data": {
        "feesPerSitting": 1500,
        "yearsOfExperience": 7,
        "bracket": { "bracketKey": "6-11", "maxFee": 1800 }
    }
}
```

### Error: Invalid Fee (Over Cap)
```json
{
    "success": false,
    "message": "Fees cannot exceed ₹1000 for your experience bracket (3-6 years)"
}
```

---

## 💰 Platform Fee Split (10%)
All fees (`feesPerSitting`) now calculate a **10% Platform Charge** split as follows:
- **Client Contribution (4%)**: Added as a surcharge to the client.
- **Advocate Contribution (6%)**: Deducted from the advocate's payout.
- **Total Platform Revenue**: 10% of the base fee.

*Example: If `feesPerSitting` = ₹1000:*
- *Client pays: ₹1040*
- *Advocate receives: ₹940*
- *Platform earns: ₹100*
