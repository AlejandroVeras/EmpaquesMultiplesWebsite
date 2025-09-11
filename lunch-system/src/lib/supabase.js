import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hvhroguawvsztdhvkxpv.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2aHJvZ3Vhd3ZzenRkaHZreHB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1OTgyNTcsImV4cCI6MjA3MzE3NDI1N30.D_UdP-7b43JUweoYuzfT2OOKy2g2VvigKuJeeeUgVgg'

export const supabase = createClient(supabaseUrl, supabaseKey)