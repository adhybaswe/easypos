# Product Requirements Document (PRD)

## 1. Overview

### Product Name
Mobile POS (Point of Sale) Application

### Purpose
This Mobile POS application is designed to help small to medium businesses manage sales transactions, products, and reports efficiently using a mobile device. The app includes an initial setup flow to choose the backend (SQL or Firebase) and supports role-based access with two main roles: **Admin** and **Cashier**.

### Target Users
- Store Owner / Admin
- Cashier

### Platform
- Mobile App (Android & iOS)
- Frontend: Expo (React Native)
- Backend: Firebase **or** SQL-based API (selected during initial setup)

---

## 2. Goals & Objectives

- Provide a simple, stable, and easy-to-use mobile POS system
- Support multi-user access with role-based permissions
- Deliver standard POS functionality (products, cart, checkout, reports)
- Allow flexible backend configuration (Firebase or SQL)
- **Implement a modern, centralized theme-based UI system for consistent branding**

### Success Metrics
- Admin can complete initial setup without errors
- Average transaction processing time < 5 seconds
- Reports load without noticeable delay

---

## 3. Assumptions & Constraints

### Assumptions
- Single store (single outlet)
- Local currency only
- Online usage (no offline mode in v1)

### Constraints
- No multi-outlet support in v1
- No payment gateway integration in v1

---

## 4. User Roles & Permissions

### 4.1 Admin
- Log in to the application
- Manage products (CRUD)
- Manage categories
- Manage users (Admin & Cashier)
- View all reports
- Configure backend during initial setup

### 4.2 Cashier
- Log in to the application
- Process sales transactions
- View product list
- View personal transaction history

---

## 5. User Flows

### 5.1 First-Time Setup Flow
1. Open the application
2. Select backend:
   - Firebase
   - SQL (API Base URL + credentials)
3. Create Admin account:
   - Username
   - Password
4. Log in as Admin

### 5.2 Login Flow
1. Enter username and password
2. System validates credentials
3. Redirect user based on role (Admin / Cashier)

### 5.3 Transaction Flow (Cashier)
1. Select product(s)
2. Input quantity
3. Add to cart
4. Checkout
5. Enter payment amount
6. Display change
7. Complete transaction

---

## 6. Functional Requirements

### 6.1 Authentication & Authorization
- Username & password login
- Role-based access control
- Secure session handling

### 6.2 Backend Configuration
**Setup Screen**
- Backend selection:
  - [x] **Firebase Integration**
    - [x] Install Firebase SDK (`pnpm install firebase`).
    - [x] Create `services/firebase.ts`.
    - [x] Refactor `services/sqlite.ts` to Async.
    - [x] Create Unified `services/db.ts`.
    - [x] Update Setup Screen for Firebase Config.
    - [x] Update Stores to use new Async DB Service.
  - Local SQLite
- SQLite configuration:
  - Database Name (default: easypos.db)
- **Currency Configuration:**
  - Symbol (e.g., Rp, $, €)
  - Locale (e.g., id-ID, en-US)

### 6.3 UI & Experience
- **Centralized Theme System:**
  - Consistent colors, typography, and spacing via `theme.ts`.
  - Modern "Card-based" layout for dashboards and lists.
- **Admin Dashboard:**
  - Modern grid layout for quick actions (Manage Products, Users, etc.).
  - Floating action card for high-frequency tasks.
  - Quick revenue overview.

### 6.4 Product Management (Admin)
- Create, read, update, delete products
- Product attributes:
  - Name
  - Price
  - Stock
  - Category
  - SKU (optional)
- Search and filter products

### 6.5 Category Management (Admin)
- Create, read, update, delete categories

### 6.6 User Management (Admin)
- Create user
  - Username
  - Password
  - Role (Admin / Cashier)
- Edit user
- Activate / deactivate user

### 6.7 POS / Transactions (Admin & Cashier)
- Product list view
- Shopping cart
- Update item quantity
- Automatic total calculation
- Payment input
- Change calculation
- Save transaction

### 6.8 Reports

**Admin**
- Daily sales report
- Total transactions
- Total revenue

**Cashier**
- Personal transaction history

---

## 7. Non-Functional Requirements

### Performance
- App load time < 2 seconds
- Transaction save time < 1 second

### Security
- Password hashing
- Secure API communication (HTTPS)

### Usability
- Simple and intuitive UI
- Optimized for mobile screens

### Scalability
- Backend structure prepared for future multi-outlet support

---

## 8. High-Level Data Model

### User
- id
- username
- password_hash
- role
- is_active

### Product
- id
- name
- price
- stock
- category_id

### Category
- id
- name

### Transaction
- id
- user_id
- total_amount
- payment_amount
- change_amount
- created_at

### TransactionItem
- id
- transaction_id
- product_id
- quantity
- price

---

## 9. Tech Stack & Architecture

### Frontend (Mobile App)
- **Framework**: Expo (React Native)
- **Language**: TypeScript
- **State Management**: Zustand
- **Navigation**: Expo Router or React Navigation
- **UI**: Native components + reusable custom components

### State Management (Zustand)
Zustand is used to manage:
- Authentication state (user, role, session)
- Cart state (items, quantity, total)
- Product state (list, selected product)
- App configuration state (selected backend)

### Backend Option A – Firebase
- Firebase Authentication
- Firestore Database
- Firebase Security Rules (role-based access)

### Backend Option B – Local SQLite
- Local on-device database using `expo-sqlite`
- Ideal for standalone usage
- Data stored locally on the device

### Development Tools
- Expo CLI
- ESLint & Prettier
- Git (GitHub)

---

## 10. Future Enhancements

- Multi-outlet support
- Export reports (PDF / Excel)
- Payment gateway integration
- Barcode scanner support
- Offline mode

---

## 11. Out of Scope (v1)

- Accounting features
- Tax integration
- Loyalty or membership system

