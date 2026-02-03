# EasyPOS Mobile App 📱

A modern, theme-based Mobile POS (Point of Sale) application designed for small to medium businesses. Built with React Native (Expo) and TypeScript.

## 🚀 Key Features

### 🎨 Modern UI/UX
- **Centralized Theme System**: Consistent design system (`theme.ts`) managing colors, spacing, and typography across the app.
- **Interactive Dashboard**:
  - **Admin**: Revenue overview, quick action grid (Manage Products, Users, Categories), and a floating action card for high-frequency tasks (POS, History).
  - **Cashier**: Simplified interface focused on fast transaction processing.

### 🛠️ Core Functionality
- **Setup Flow**: guided onboarding to select backend (SQLite/Firebase), configure currency (Symbol/Locale), and create the first Admin account.
- **Authentication**: Role-based login (Admin/Cashier) with secure session management.
- **Point of Sale (POS)**:
  - Visual product grid with category filtering and search.
  - Cart management (adjust quantities, remove items).
  - Checkout with automatic total calculation and 'Quick Money' chips.
  - Receipt summary screen.
- **Inventory Management**:
  - **Products**: Add/Edit/Delete products with image support (Avatar API/URL) and price management.
  - **Categories**: Organize products into manageable categories.
- **User Management**:
  - Create and manage staff accounts (Admins & Cashiers).
- **Transaction History**: View detailed logs of past sales.

### ⚙️ Technical Highlights
- **Framework**: Expo (React Native) with File-based Routing (`expo-router`).
- **Language**: TypeScript for type safety.
- **State Management**: Zustand (Persisted stores for Auth, Cart, Config).
- **Database**:
  - **SQLite**: Local, offline-first data storage (using `expo-sqlite`).
  - **Firebase**: (Configurable option).
- **Icons**: Ionicons (`@expo/vector-icons`).

## 📂 Project Structure

```
easypos/
├── app/                  # Application routes (Expo Router)
│   ├── (app)/            # Protected application routes
│   │   ├── (tabs)/       # Main Dashboard & Settings tabs
│   │   ├── pos/          # POS Flow (Cart, Checkout, Success)
│   │   ├── products/     # Product Management
│   │   ├── users/        # User Management
│   │   └── transactions/ # Transaction Details
│   ├── login.tsx         # Authentication Screen
│   └── setup.tsx         # Initial Setup Screen
├── components/           # Reusable UI Components
├── constants/            # Theme & Config Constants
├── stores/               # State Management (Zustand)
├── services/             # Database & API Services
├── types/                # TypeScript Definitions
└── utils/                # Helper Functions (Currency, i18n)
```

## ⚡ Getting Started

1. **Install Dependencies**:
   ```bash
   pnpm install
   ```

2. **Run the App**:
   ```bash
   pnpm run android
   # or
   pnpm run ios
   ```

3. **Inital Setup**:
   - On first launch, you will be prompted to choose a backend (select **Local SQLite** for standalone use).
   - Set up your Store Currency (e.g., `Rp` / `id-ID` or `$ / en-US`).
   - Create your Admin account.

## 📸 Screenshots

*(Placeholders)*
- **Dashboard**: Modern grid layout with stats.
- **POS**: Product grid and Cart.
- **Checkout**: Payment input with quick chips.
