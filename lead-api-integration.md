# Lead API Integration Guide

## 1. Overview

External companies can submit leads to our application through the Lead API. The application administrator creates an API Integration, copies the API key once, and shares it with the external company's backend integration owner.

The external company is not created as an organization or tenant in our application. The API Integration identifies who submitted the lead. Incoming leads are registered directly into the Super Admin CRM without targeting or requiring an organization.

## 2. Authentication

Send the assigned API key in the `X-API-Key` header on every request.

```http
X-API-Key: <API_KEY>
```

Never place the API key in browser-side code, mobile apps, public repositories, logs, or client-visible configuration.

## 3. Base URL

The API base URL is configured by the environment running the backend.

- Development: use the value of `niticore-super-admin-backend-staging.up.railway.app`.
- Staging: request the staging API base URL from the system administrator.
- Production: request the production API base URL from the system administrator.

## 4. Create Lead Endpoint

```http
POST /api/leads
Content-Type: application/json
X-API-Key: <API_KEY>
```

The backend also supports the existing public route `/api/public/leads` with the same request body.

### Required fields

- `company_name`
- `contact_first_name`
- `contact_last_name`
- `contact_email`

### Optional fields

- `contact_phone`
- `contact_designation` or `designation`
- `company_size`
- `website`
- `company_domain`
- `business_domain` or `businessDomain` or `domain`
- `address`
- `city`
- `state`
- `postal_code` or `postalCode` or `postcode`
- `country`
- `module_ids`
- `framework_ids`

Do not send `organization_id`, `api_integration_id`, or lead source fields. They are determined by the API key and backend configuration.

## 5. Example Request

```bash
curl -X POST "$API_BASE_URL/api/leads" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: <API_KEY>" \
  -d '{
    "company_name": "Acme Ltd",
    "contact_first_name": "Ada",
    "contact_last_name": "Lovelace",
    "contact_email": "ada@acme.example",
    "contact_phone": "+1 555 0100",
    "website": "https://acme.example",
    "business_domain": "Technology"
  }'
```

## 6. Success Response

```json
{
  "code": 201,
  "status": "created",
  "data": {
    "id": 123
  },
  "message": "Lead submitted successfully"
}
```

## 7. Error Responses

The API uses the application's standard response shape.

### Missing or invalid required fields

```json
{
  "code": 400,
  "status": "bad_request",
  "message": "company_name, contact_first_name, contact_last_name, and contact_email are required"
}
```

### Missing API key

```json
{
  "code": 401,
  "status": "unauthorized",
  "message": "Missing X-API-Key header"
}
```

### Invalid, inactive, revoked, or expired key

```json
{
  "code": 401,
  "status": "unauthorized",
  "message": "Invalid API key"
}
```

The message may also be `API key is inactive`, `API key has been revoked`, or `API key has expired`.

## 8. Lead Source

Leads submitted with an API Integration key are automatically marked as `External API` by the backend. The backend records the authenticated API Integration ID. External callers cannot override these values.

## 9. Security Guidelines

- Store the API key in secure backend environment variables or a secrets manager.
- Never expose the key in frontend/browser code.
- Never commit the key to source control.
- Never share the key in public tickets, chat, or logs.
- Rotate the key if compromise is suspected.
- Contact the system administrator to revoke or rotate credentials.

## 10. Integration Examples

### Node.js

```js
await fetch(`${process.env.API_BASE_URL}/api/leads`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': process.env.LEAD_API_KEY,
  },
  body: JSON.stringify({
    company_name: 'Acme Ltd',
    contact_first_name: 'Ada',
    contact_last_name: 'Lovelace',
    contact_email: 'ada@acme.example',
  }),
})
```

### Python

```python
import os
import requests

response = requests.post(
    f"{os.environ['API_BASE_URL']}/api/leads",
    headers={"X-API-Key": os.environ["LEAD_API_KEY"]},
    json={
        "company_name": "Acme Ltd",
        "contact_first_name": "Ada",
        "contact_last_name": "Lovelace",
        "contact_email": "ada@acme.example",
    },
)
response.raise_for_status()
```

### PHP

```php
$payload = json_encode([
  'company_name' => 'Acme Ltd',
  'contact_first_name' => 'Ada',
  'contact_last_name' => 'Lovelace',
  'contact_email' => 'ada@acme.example',
]);

$ch = curl_init(getenv('API_BASE_URL') . '/api/leads');
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_HTTPHEADER => [
    'Content-Type: application/json',
    'X-API-Key: ' . getenv('LEAD_API_KEY'),
  ],
  CURLOPT_POSTFIELDS => $payload,
  CURLOPT_RETURNTRANSFER => true,
]);
$result = curl_exec($ch);
curl_close($ch);
```

## 11. Testing

Use development or staging credentials before sending production leads. Ask the system administrator for the correct environment base URL and a test API Integration key.

## 12. Support

Integration Support Contact: `<add support contact>`

Email: `<add support email>`

Please include the environment, approximate timestamp, and non-sensitive request metadata when reporting an issue. Do not send API keys in support requests.
