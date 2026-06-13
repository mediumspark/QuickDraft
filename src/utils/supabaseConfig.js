const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export function getSupabaseConfigStatus() {
  const issues = []
  const steps = []

  if (!supabaseUrl) {
    issues.push('VITE_SUPABASE_URL is missing from your .env file')
  } else if (supabaseUrl.includes('your-project')) {
    issues.push('VITE_SUPABASE_URL still has the placeholder value')
  } else if (!supabaseUrl.startsWith('https://')) {
    issues.push('VITE_SUPABASE_URL should start with https://')
  }

  if (!supabaseAnonKey) {
    issues.push('VITE_SUPABASE_ANON_KEY is missing from your .env file')
  } else if (supabaseAnonKey.includes('your-anon')) {
    issues.push('VITE_SUPABASE_ANON_KEY still has the placeholder value')
  }

  if (issues.length === 0) {
    return {
      configured: true,
      issues: [],
      steps: [],
      projectUrl: supabaseUrl,
    }
  }

  steps.push(
    'Create a free project at https://supabase.com/dashboard',
    'Open Project Settings → API and copy the Project URL and anon public key',
    'Create a .env file in the project root (copy from .env.example)',
    'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env',
    'Run supabase/schema.sql in the Supabase SQL Editor',
    'In Authentication → URL Configuration, set Site URL to http://localhost:5173',
    'Add http://localhost:5173/** to Redirect URLs',
    'Enable Google in Authentication → Providers → Google (add Client ID + Secret from Google Cloud)',
    'In Google Cloud Console, set Authorized redirect URI to https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback',
    'Restart the dev server: npm run dev',
  )

  return {
    configured: false,
    issues,
    steps,
    projectUrl: supabaseUrl || null,
  }
}
