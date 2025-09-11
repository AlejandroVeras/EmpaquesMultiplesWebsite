// Supabase Edge Function for Monthly Data Backup
// Deploy with: supabase functions deploy monthly-backup

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

    // Get current month and year
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()
    const monthStart = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`
    
    // Get last day of current month
    const nextMonth = new Date(currentYear, currentMonth, 0)
    const monthEnd = nextMonth.toISOString().split('T')[0]

    // Fetch all data for the current month
    const { data: monthlyRecords, error: recordsError } = await supabaseClient
      .from('lunch_records')
      .select(`
        *,
        profiles!lunch_records_user_id_fkey (
          full_name,
          departments (
            name
          )
        ),
        created_by_profile:profiles!lunch_records_created_by_fkey (
          full_name
        )
      `)
      .gte('date', monthStart)
      .lte('date', monthEnd)
      .order('date')

    if (recordsError) {
      throw recordsError
    }

    // Fetch departments and profiles for complete backup
    const { data: departments, error: deptError } = await supabaseClient
      .from('departments')
      .select('*')

    const { data: profiles, error: profilesError } = await supabaseClient
      .from('profiles')
      .select(`
        *,
        departments (
          name
        )
      `)

    if (deptError) throw deptError
    if (profilesError) throw profilesError

    // Create backup data structure
    const backupData = {
      backup_date: now.toISOString(),
      period: `${currentYear}-${currentMonth.toString().padStart(2, '0')}`,
      summary: {
        total_records: monthlyRecords.length,
        total_users: profiles.filter(p => p.active).length,
        total_departments: departments.filter(d => d.active).length
      },
      data: {
        lunch_records: monthlyRecords,
        departments: departments,
        profiles: profiles
      },
      statistics: {
        daily_averages: {},
        department_breakdown: {},
        most_active_users: {}
      }
    }

    // Calculate statistics
    const dailyRecords = {}
    const departmentCounts = {}
    const userCounts = {}

    monthlyRecords.forEach(record => {
      // Daily stats
      if (!dailyRecords[record.date]) {
        dailyRecords[record.date] = 0
      }
      dailyRecords[record.date]++

      // Department stats
      const dept = record.profiles?.departments?.name || 'Sin departamento'
      departmentCounts[dept] = (departmentCounts[dept] || 0) + 1

      // User stats
      const user = record.profiles?.full_name || 'Usuario desconocido'
      userCounts[user] = (userCounts[user] || 0) + 1
    })

    backupData.statistics.daily_averages = dailyRecords
    backupData.statistics.department_breakdown = departmentCounts
    backupData.statistics.most_active_users = Object.entries(userCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .reduce((obj, [user, count]) => {
        obj[user] = count
        return obj
      }, {})

    // Store backup in Supabase Storage (optional)
    const fileName = `backup-${currentYear}-${currentMonth.toString().padStart(2, '0')}.json`
    
    const { error: storageError } = await supabaseClient.storage
      .from('backups')
      .upload(fileName, JSON.stringify(backupData, null, 2), {
        contentType: 'application/json',
        upsert: true
      })

    if (storageError) {
      console.warn('Storage error (bucket may not exist):', storageError.message)
    }

    console.log('Monthly backup completed:', {
      period: backupData.period,
      records: backupData.summary.total_records,
      fileName
    })

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Monthly backup completed successfully',
        backup_info: {
          period: backupData.period,
          total_records: backupData.summary.total_records,
          file_name: fileName
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error creating monthly backup:', error)
    
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