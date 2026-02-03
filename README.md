# EasyPOS Mobile App

A Mobile POS application for small to medium businesses.

## Tech Stack
- **Framework**: Expo (React Native)
- **Language**: TypeScript
- **State Management**: Zustand (Persisted with AsyncStorage)
- **Navigation**: Expo Router
- **Backend Config**: Configurable (Firebase / SQL)

## Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Run the app:
   ```bash
   pnpm run android
   # or
   pnpm run ios
   ```

## Project Structure
- `app/`: Application routes (Expo Router).
  - `(app)/`: Authenticated routes.
  - `setup.tsx`: Initial setup screen.
  - `login.tsx`: Login screen.
- `stores/`: Zustand stores (Auth, Config, Cart, Product).
- `types/`: TypeScript interfaces.
- `components/`: UI components.

## Features Implemented
- **Setup Flow**: Choose backend, Configure API, Create Admin.
- **Authentication**: Admin/Cashier login (simulated logic aligned with PRD).
- **Dashboard**: Role-based views for Admin and Cashier.
- **Data Models**: Types defined for User, Product, Transaction, etc.

