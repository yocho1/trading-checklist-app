# Trading Checklist App 📈

A professional Forex trading assistant that helps traders evaluate trade setups using a comprehensive multi-timeframe checklist system with confluence scoring and trade journaling.

![Trading Checklist](https://img.shields.io/badge/React-18.2.0-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38B2AC) ![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Features

### 🎯 Trade Analysis

- **Multi-timeframe Checklist**: Weekly, Daily, 4H, 1H/30m analysis
- **Confluence Scoring**: Automated scoring system (0-100%) for trade setups
- **Real-time Calculations**: Dynamic score updates as you check items

### 💾 Trade Management

- **Save Trade Modal**: Comprehensive trade entry with all parameters
- **Risk Management**: Automatic lot size, risk amount, and stop loss calculations
- **Chart Upload**: Save chart images with trades
- **Currency Pairs**: Support for 50+ Forex pairs and metals

### 📊 Trading Journal

- **Trade History**: Complete trading journal with filtering
- **Status Tracking**: Mark trades as Win/Loss/Breakeven/Before
- **Search & Filter**: Find trades by pair, score, or status
- **Performance Analysis**: Track your trading performance over time

## 🚀 Quick Start

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yocho1/trading-checklist-app.git

# Navigate to project
cd trading-checklist-app

# Install dependencies
npm install

# Start development server
npm run dev
```

### Supabase setup

1. Create a Supabase project at https://app.supabase.com
2. Copy the project URL and the anon public key into `.env` as `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY` respectively.
3. Run the SQL in `supabase/init_schema.sql` to create tables and example RLS policies.
4. Make sure `REACT_APP_EMAILJS_*` and `REACT_APP_GOOGLE_CLIENT_ID` are set in `.env` for email and Google auth integrations.

Notes:

- The app includes `src/services/supabaseClient.js` and a `databaseService` helper at `src/services/databaseService.js`.
- RLS policies in the SQL file should be reviewed & adapted to your auth setup. For production use, prefer server-side migrations and server-only admin tasks.

### Migrating local data to Supabase

If you have existing localStorage users/trades that you want to migrate, export your `trading_app_shared_data` JSON from the browser local storage, then use the migration script:

```powershell
setx SUPABASE_URL "https://your-project.supabase.co"
setx SUPABASE_SERVICE_ROLE_KEY "your-service-role-key"
node scripts/migrate_local_to_supabase.js /path/to/trading_app_shared_data_export.json
```

This script will create auth users using the Supabase Admin API and populate a profile row in the `public.users` table.
