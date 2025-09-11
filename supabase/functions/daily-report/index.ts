// Supabase Edge Function for Daily Lunch Reports
// Deploy with: supabase functions deploy daily-report

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get today's date
    const today = new Date().toISOString().split('T')[0]
    
    // Fetch today's lunch records with user details
    const { data: records, error } = await supabaseClient
      .from('lunch_records')
      .select(`
        *,
        profiles!lunch_records_user_id_fkey (
          full_name,
          departments (
            name
          )
        )
      `)
      .eq('date', today)
      .order('time')

    if (error) {
      throw error
    }

    // Generate report
    const totalRecords = records.length
    const departmentStats = {}
    
    records.forEach(record => {
      const dept = record.profiles?.departments?.name || 'Sin departamento'
      departmentStats[dept] = (departmentStats[dept] || 0) + 1
    })

    const report = {
      date: today,
      total_registrations: totalRecords,
      department_breakdown: departmentStats,
      records: records.map(r => ({
        time: r.time,
        user: r.profiles?.full_name || 'Usuario desconocido',
        department: r.profiles?.departments?.name || 'Sin departamento',
        comments: r.comments || ''
      }))
    }

    // Here you would typically send an email with the report
    // For this example, we'll just return the report data
    console.log('Daily lunch report generated:', report)

    // You can integrate with email services like:
    // - SendGrid
    // - Resend
    // - AWS SES
    // - Mailgun
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Daily report generated successfully',
        report
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error generating daily report:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})