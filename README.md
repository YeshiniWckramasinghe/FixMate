# FixMate – Home Service Booking & Management System 🔧

A full backend for booking home services (Electrician, Plumber, AC Technician, Computer Repair, Cleaning, Appliance Repair, etc.), built with **Java 25 + Spring Boot 3 + Spring Security (JWT) + PostgreSQL + JPA/Hibernate**.

Three roles are supported: **CUSTOMER**, **PROVIDER**, **ADMIN** — each with its own set of permissions, enforced with Spring Security role-based authorization.

---

## 1. Tech Stack

| Layer          | Technology                          |
|----------------|--------------------------------------|
| Language       | Java 25                              |
| Framework      | Spring Boot 3.3.4                    |
| Security       | Spring Security + JWT (jjwt 0.12.6)  |
| Persistence    | Spring Data JPA + Hibernate          |
| Database       | PostgreSQL                           |
| Build Tool     | Maven                                |
| Utilities      | Lombok, Jakarta Bean Validation      |
| Testing        | Postman (collection included)        |

---

## 2. Project Structure

```
com.fixmate
 ├── config/            SecurityConfig, DataInitializer (seeds default admin)
 ├── security/          JwtUtil, JwtAuthenticationFilter, CustomUserDetailsService, AuthUtil
 ├── entity/            User, ServiceItem, Booking, Review, Role, BookingStatus
 ├── repository/        UserRepository, ServiceRepository, BookingRepository, ReviewRepository
 ├── dto/               Request/response objects (validated with Jakarta Bean Validation)
 ├── service/           AuthService, ServiceManagementService, BookingService, ReviewService, AdminService
 ├── controller/        AuthController, ServiceController, BookingController, ReviewController, AdminController
 └── exception/         GlobalExceptionHandler + custom exceptions
```

---

## 3. Database Schema

```
users
 ├── id, name, email, password (BCrypt hashed), phone
 ├── role (CUSTOMER | PROVIDER | ADMIN)
 ├── approved   -- providers must be approved by Admin before listing services
 └── enabled    -- Admin can disable accounts

services
 ├── id, provider_id (FK -> users), name, description, category, price
 └── active     -- soft-delete flag

bookings
 ├── id, customer_id (FK -> users), service_id (FK -> services)
 ├── booking_date, booking_time, address, notes
 └── status (PENDING | ACCEPTED | REJECTED | COMPLETED | CANCELLED)

reviews
 ├── id, booking_id (FK -> bookings, unique), customer_id (FK -> users)
 └── rating (1-5), comment
```

`spring.jpa.hibernate.ddl-auto=update` will auto-create these tables on first run — no manual SQL needed.

---

## 4. Setup & Run

### Prerequisites
- JDK 25+
- Maven 3.8+
- PostgreSQL running locally (or update the URL to point elsewhere)

### Step 1 — Create the database
```sql
CREATE DATABASE fixmate_db;
```

### Step 2 — Configure `src/main/resources/application.properties`
Update these if your PostgreSQL credentials differ from the defaults:
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/fixmate_db
spring.datasource.username=postgres
spring.datasource.password=postgres
```

You can also override the default admin credentials (optional):
```properties
app.admin.email=admin@fixmate.com
app.admin.password=Admin@123
```

### Step 3 — Build & run
```bash
mvn clean install
mvn spring-boot:run
```
The API starts on **http://localhost:8080**.

On first startup, a default **Admin** account is auto-created (since Admins cannot self-register):
```
email: admin@fixmate.com
password: Admin@123
```
⚠️ Change this password immediately in a real deployment.

---

## 5. Authentication Flow

```
POST /api/auth/register  → creates CUSTOMER or PROVIDER, returns JWT
POST /api/auth/login     → returns JWT for any role
```

Every protected request must include:
```
Authorization: Bearer <token>
```

Roles are embedded in the JWT and enforced by `SecurityConfig`:
```
/api/auth/**                      → public
GET  /api/services/**             → public
GET  /api/providers/**            → public
/api/admin/**                     → ROLE_ADMIN only
/api/provider/**                  → ROLE_PROVIDER only
POST/PUT/DELETE /api/services/**  → ROLE_PROVIDER only
/api/customer/**                  → ROLE_CUSTOMER only
POST /api/bookings                → ROLE_CUSTOMER only
POST /api/reviews                 → ROLE_CUSTOMER only
anything else                     → any authenticated user
```

Note: Providers are created with `approved = false`. An Admin must call
`PUT /api/admin/providers/{id}/approve` before that provider can create services.

---

## 6. REST API Reference

### Auth
| Method | Endpoint             | Access | Description                    |
|--------|-----------------------|--------|--------------------------------|
| POST   | `/api/auth/register`  | Public | Register as CUSTOMER or PROVIDER |
| POST   | `/api/auth/login`     | Public | Login, returns JWT              |

### Services
| Method | Endpoint                          | Access          | Description                     |
|--------|------------------------------------|-----------------|----------------------------------|
| GET    | `/api/services?category=Plumber`  | Public          | Browse active services (filterable) |
| GET    | `/api/services/{id}`              | Public          | Service details                 |
| GET    | `/api/providers/{id}/services`    | Public          | Services by a specific provider |
| GET    | `/api/provider/services`          | PROVIDER        | My own services                 |
| POST   | `/api/services`                   | PROVIDER (approved) | Create a service            |
| PUT    | `/api/services/{id}`              | PROVIDER (owner) | Update own service              |
| DELETE | `/api/services/{id}`              | PROVIDER (owner) | Deactivate own service          |

### Bookings
| Method | Endpoint                     | Access             | Description                   |
|--------|-------------------------------|--------------------|--------------------------------|
| POST   | `/api/bookings`               | CUSTOMER           | Book a service                |
| GET    | `/api/bookings/my`            | CUSTOMER           | My bookings                   |
| GET    | `/api/bookings/provider`      | PROVIDER           | Bookings received              |
| GET    | `/api/bookings/{id}`          | Participant/Admin  | Booking details                |
| PUT    | `/api/bookings/{id}/status`   | PROVIDER (owner)   | Accept / Reject / Complete     |
| DELETE | `/api/bookings/{id}`          | CUSTOMER (owner)   | Cancel booking                 |

Valid status transitions: `PENDING → ACCEPTED/REJECTED`, `ACCEPTED → COMPLETED/CANCELLED`.

### Reviews
| Method | Endpoint                          | Access    | Description                       |
|--------|------------------------------------|-----------|-------------------------------------|
| POST   | `/api/reviews`                    | CUSTOMER  | Review a COMPLETED booking (once)  |
| GET    | `/api/providers/{id}/reviews`     | Public    | All reviews for a provider          |

### Admin
| Method | Endpoint                             | Access | Description                    |
|--------|----------------------------------------|--------|----------------------------------|
| GET    | `/api/admin/users?role=PROVIDER`      | ADMIN  | List users (optionally by role) |
| PUT    | `/api/admin/providers/{id}/approve`   | ADMIN  | Approve a pending provider       |
| PUT    | `/api/admin/users/{id}/enable`        | ADMIN  | Enable a user account            |
| PUT    | `/api/admin/users/{id}/disable`       | ADMIN  | Disable a user account           |
| DELETE | `/api/admin/users/{id}`               | ADMIN  | Delete a user                    |
| GET    | `/api/admin/bookings`                 | ADMIN  | View all bookings                |
| GET    | `/api/admin/dashboard`                | ADMIN  | Platform stats                   |

---

## 7. Sample Requests

**Register a customer**
```json
POST /api/auth/register
{
  "name": "Nimal Perera",
  "email": "nimal@example.com",
  "password": "password123",
  "phone": "0771234567",
  "role": "CUSTOMER"
}
```

**Register a provider**
```json
POST /api/auth/register
{
  "name": "Kamal Electricals",
  "email": "kamal@example.com",
  "password": "password123",
  "phone": "0777654321",
  "role": "PROVIDER"
}
```

**Create a service (provider, after admin approval)**
```json
POST /api/services
Authorization: Bearer <provider-token>
{
  "name": "Home Wiring Repair",
  "description": "Fix faulty wiring and switches",
  "category": "Electrician",
  "price": 3500.00
}
```

**Book a service (customer)**
```json
POST /api/bookings
Authorization: Bearer <customer-token>
{
  "serviceId": 1,
  "bookingDate": "2026-09-20",
  "bookingTime": "14:30:00",
  "address": "No 12, Galle Road, Colombo",
  "notes": "Please bring extra wire"
}
```

---

## 8. Testing with Postman

Import `FixMate.postman_collection.json` (included in this project) into Postman. It contains:
- Auth requests (register/login for customer, provider, admin)
- Service CRUD
- Booking lifecycle (create → accept → complete → review)
- Admin endpoints

Set a collection variable `baseUrl = http://localhost:8080` and `token` (auto-filled after login via a small test script), then run requests top-to-bottom.

---

## 9. Next Steps (optional extensions)

- Connect a React/Next.js frontend to these APIs
- Add pagination & search filters on `/api/services`
- Add email notifications on booking status changes
- Add refresh tokens
- Add file upload for provider profile photos / service images
