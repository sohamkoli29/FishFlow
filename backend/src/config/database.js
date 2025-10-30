import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl) {
  throw new Error('Supabase URL is required')
}

if (!supabaseAnonKey && !supabaseServiceKey) {
  throw new Error('Either Supabase Anon Key or Service Key is required')
}

// Main Supabase client for general database operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey || supabaseServiceKey)

// Supabase Auth client for server-side authentication (uses service key)
export const supabaseAuth = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
})

// Client for frontend operations (uses anon key)
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)

// Verify connection on startup
supabase
  .from('products')
  .select('count')
  .limit(1)
  .then(({ error }) => {
    if (error) {
      console.error('❌ Supabase connection failed:', error.message)
    } else {
      console.log('✅ Supabase connected successfully')
    }
  })
  .catch(error => {
    console.error('❌ Supabase connection error:', error.message)
  })

  export const testStorageConnection = async () => {
  try {
    const { data, error } = await supabase.storage
      .from('product-images')
      .list('', { limit: 1 })
    
    if (error) {
      console.error('Storage connection test failed:', error)
      return false
    }
    
    console.log('✅ Storage connection successful')
    return true
  } catch (error) {
    console.error('Storage connection test error:', error)
    return false
  }
}