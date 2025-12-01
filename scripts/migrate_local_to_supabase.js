/* scripts/migrate_local_to_supabase.js
 * Node script that migrates local JSON export of users/trades to Supabase using a SERVICE_ROLE_KEY.
 * Usage:
 *  1) Create an export file from local storage: `trading_app_shared_data.json` with keys users, verificationCodes, trades.
 *  2) Run: node scripts/migrate_local_to_supabase.js path/to/export.json
 *  3) Set environment variables SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment before running.
 */

import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

const filePath = process.argv[2]
if (!filePath) {
  console.error(
    'Usage: node migrate_local_to_supabase.js <path-to-export.json>'
  )
  process.exit(1)
}

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables'
  )
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function migrate() {
  const raw = fs.readFileSync(path.resolve(process.cwd(), filePath), 'utf-8')
  const data = JSON.parse(raw)
  const users = data.users || []
  const trades = data.trades || []

  console.log(`Migrating ${users.length} users and ${trades.length} trades`)

  for (const u of users) {
    try {
      // Create Supabase auth user with a random password (or hashed)
      // This script requires service role privileges to manage users.
      const email = u.email
      const name = u.name || 'Imported User'
      const password = u.password || Math.random().toString(36).slice(-10)
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        user_metadata: { name },
        email_confirm: true,
      })
      if (error) {
        console.warn('Error creating supabase auth user', email, error.message)
        continue
      }
      console.log('Created supabase auth user:', data.user.email)

      // Create profile row
      const { data: profile, error: pErr } = await supabase
        .from('users')
        .insert([
          {
            auth_user_id: data.user.id,
            name,
            email,
            is_verified: u.isVerified || true,
          },
        ])
      if (pErr) {
        console.warn('Profile insert error', pErr.message)
        continue
      }
    } catch (err) {
      console.error('Unexpected error creating user', u.email, err)
    }
  }

  // Trade migration (requires user mapping from local id to supabase profile ids)
  // This is left as a manual/optional step; you may add mapping logic based on exported user IDs
}

migrate()
  .then(() => console.log('Migration complete'))
  .catch((err) => console.error('Migration failed', err))
