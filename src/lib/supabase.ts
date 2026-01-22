import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types (auto-generate with: npx supabase gen types typescript)
export interface Transaction {
  id: string
  created_at: string
  date: string
  description: string
  amount: number
  type: 'income' | 'expense'
  category: string
  gst_rate: number | null
  gst_type: 'cgst_sgst' | 'igst' | null
  tds_section: string | null
  tds_rate: number | null
  party_name: string | null
  party_gstin: string | null
  user_id: string
}

export interface GSTSummary {
  id: string
  period: string
  output_cgst: number
  output_sgst: number
  output_igst: number
  input_cgst: number
  input_sgst: number
  input_igst: number
  net_liability: number
  user_id: string
}
