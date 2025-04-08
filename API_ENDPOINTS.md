# InsuranceTracker CRM API Documentation for 3CX Integration

**Authentication Method:** API Key Authentication via X-API-KEY header

## 1. Contact Lookup

### Purpose
Find a contact by phone number during an incoming call.

### HTTP Method
GET

### Full URL
https://yourcrm.com/api/contacts?phone=[Number]

### Authentication
API Key sent in the X-API-KEY header.

### Request Headers
```
X-API-KEY: Your secret API key
Accept: application/json
```

### Request Parameters
- **phone** (required): The phone number to search for. Can be in various formats (e.g., +1234567890, (555) 345-6789).

### Success Response

#### Description
Returns contact information if a match is found based on the provided phone number.

#### HTTP Status Code
200 OK

#### Response Body
| Field       | Type   | Description                           |
|-------------|--------|---------------------------------------|
| contact_id  | String | Unique identifier for the contact     |
| first_name  | String | Contact's first name                  |
| last_name   | String | Contact's last name                   |
| phone       | String | Contact's phone number                |
| email       | String | Contact's email address               |
| company     | String | Company associated with the contact   |
| contact_url | String | URL to view the contact in the CRM    |

#### Example Response (Contact Found)
```json
{
  "contact_id": "3",
  "first_name": "Emily",
  "last_name": "Chen",
  "phone": "(555) 345-6789",
  "email": "emily.c@example.com",
  "company": "Secure Insurance",
  "contact_url": "https://yourcrm.com/contacts/3"
}
```

#### Example Response (No Contact Found)
```json
[]
```

### Error Response
#### HTTP Status Code
400 Bad Request, 401 Unauthorized, or 500 Internal Server Error

#### Example Error Response
```json
{
  "message": "Invalid phone number format",
  "success": false
}
```

## 2. Contact Creation

### Purpose
Create a new contact when a lookup fails to find a matching contact.

### HTTP Method
POST

### Full URL
https://yourcrm.com/api/contacts

### Authentication
API Key sent in the X-API-KEY header.

### Request Headers
```
X-API-KEY: Your secret API key
Content-Type: application/json
Accept: application/json
```

### Request Body

#### Description
Contains the information needed to create a new contact in the CRM.

#### Fields
| Field      | Type   | Required | Description              |
|------------|--------|----------|--------------------------|
| first_name | String | Yes      | Contact's first name     |
| last_name  | String | Yes      | Contact's last name      |
| phone      | String | Yes      | Contact's phone number   |
| email      | String | No       | Contact's email address  |

#### Example Request Body
```json
{
  "first_name": "John",
  "last_name": "Smith",
  "phone": "+1234567890",
  "email": "john.smith@example.com"
}
```

### Success Response

#### Description
Returns details of the newly created contact.

#### HTTP Status Code
201 Created

#### Response Body
| Field       | Type   | Description                           |
|-------------|--------|---------------------------------------|
| contact_id  | String | Unique identifier for the newly created contact |
| first_name  | String | Contact's first name                  |
| last_name   | String | Contact's last name                   |
| phone       | String | Contact's phone number                |
| email       | String | Contact's email address               |
| company     | String | Company associated with the contact   |
| contact_url | String | URL to view the contact in the CRM    |

#### Example Response
```json
{
  "contact_id": "6",
  "first_name": "John",
  "last_name": "Smith",
  "phone": "+1234567890",
  "email": "john.smith@example.com",
  "company": "",
  "contact_url": "https://yourcrm.com/contacts/6"
}
```

### Error Response
#### HTTP Status Codes
400 Bad Request, 401 Unauthorized, or 500 Internal Server Error

#### Example Error Response
```json
{
  "message": "Phone number is required",
  "success": false
}
```

## 3. Call Journaling

### Purpose
Log details of a completed call in the CRM.

### HTTP Method
POST

### Full URL
https://yourcrm.com/api/calls

### Authentication
API Key sent in the X-API-KEY header.

### Request Headers
```
X-API-KEY: Your secret API key
Content-Type: application/json
Accept: application/json
```

### Request Body

#### Description
Contains details about the call to be logged in the CRM.

#### Fields
| Field       | Type   | Required | Description                           |
|-------------|--------|----------|---------------------------------------|
| contact_id  | String | No       | ID of the contact associated with the call (if known) |
| call_type   | String | Yes      | Type of call: "inbound" or "outbound" |
| duration    | Number | Yes      | Duration of the call in seconds       |
| notes       | String | No       | Notes or summary of the call          |
| agent       | String | No       | Name or extension of the agent who handled the call |
| phone       | String | Yes      | External phone number involved in the call |

#### Example Request Body
```json
{
  "contact_id": "3",
  "call_type": "inbound",
  "duration": 120,
  "notes": "Discussed policy renewal options",
  "agent": "Sarah Johnson",
  "phone": "+1234567890"
}
```

### Success Response

#### Description
Confirms the call was successfully logged in the CRM.

#### HTTP Status Code
201 Created

#### Response Body
| Field   | Type   | Description                                      |
|---------|--------|--------------------------------------------------|
| status  | String | Result of the operation ("success" or "error")   |
| message | String | Description of the result                        |
| log_id  | String | Unique identifier for the created call log       |

#### Example Response
```json
{
  "status": "success",
  "message": "Call logged successfully.",
  "log_id": "10"
}
```

### Error Response
#### HTTP Status Codes
400 Bad Request, 401 Unauthorized, or 500 Internal Server Error

#### Example Error Response
```json
{
  "message": "Invalid call type. Must be 'inbound' or 'outbound'",
  "success": false
}
```

## Implementation Notes for Supabase Integration

This API is now implemented with Supabase as the database backend:

### Current Implementation:

- **Database Provider:** Supabase
- **Authentication:** Simple API key authentication (for future enhancement)

### Database Schema:

The following tables have been created in Supabase:

#### contacts table:
```sql
CREATE TABLE contacts (
  id SERIAL PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  email TEXT,
  job_title TEXT,
  company TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_contacts_phone ON contacts(phone);
```

#### calls table:
```sql
CREATE TABLE calls (
  id SERIAL PRIMARY KEY,
  contact_id INTEGER REFERENCES contacts(id),
  call_type TEXT NOT NULL,
  duration INTEGER NOT NULL,
  notes TEXT,
  agent TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_calls_contact_id ON calls(contact_id);
```

### Phone Number Handling:

- Phone numbers are normalized for lookups to improve match accuracy
- Both exact and fuzzy matching are supported to handle different phone number formats

### Testing the API:

1. **Using Postman:**
   - Import this documentation as a Postman collection
   - Set the base URL to your server address
   - Test each endpoint with the example payloads

2. **Using cURL:**
   - Contact Lookup: 
     ```bash
     curl -X GET "https://yourserver.com/api/contacts?phone=5553456789" -H "Accept: application/json"
     ```
   - Create Contact: 
     ```bash
     curl -X POST "https://yourserver.com/api/contacts" -H "Content-Type: application/json" -d '{"first_name":"John","last_name":"Smith","phone":"+1234567890"}'
     ```
   - Log Call: 
     ```bash
     curl -X POST "https://yourserver.com/api/calls" -H "Content-Type: application/json" -d '{"contact_id":"3","call_type":"inbound","duration":120,"notes":"Customer called about policy renewal","agent":"Your Name","phone":"+1234567890"}'
     ```