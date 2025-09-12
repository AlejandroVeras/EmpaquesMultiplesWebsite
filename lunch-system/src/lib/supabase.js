import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dqebwnokccpdowakkmec.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxZWJ3bm9rY2NwZG93YWtrbWVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MzcxMjcsImV4cCI6MjA3MzIxMzEyN30.RT-W28-jBLvRgzCoc8fpJAs0Fk4JoKoQNmk1Naqvi48'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
