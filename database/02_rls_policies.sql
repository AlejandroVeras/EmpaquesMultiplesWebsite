-- Row Level Security Policies for Lunch Registration System
-- Execute these scripts in the Supabase SQL editor after creating the schema

-- DEPARTMENTS TABLE POLICIES
-- Allow everyone to read active departments (for dropdown lists)
CREATE POLICY "Allow read active departments" ON departments
  FOR SELECT USING (active = true);

-- Only admins can manage departments
CREATE POLICY "Allow admins to manage departments" ON departments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
      AND profiles.active = true
    )
  );

-- PROFILES TABLE POLICIES
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
      AND profiles.active = true
    )
  );

-- RRHH and recepcion can view all active profiles
CREATE POLICY "RRHH and recepcion can view active profiles" ON profiles
  FOR SELECT USING (
    active = true AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('rrhh', 'recepcion')
      AND profiles.active = true
    )
  );

-- Users can update their own profile (limited fields)
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can update any profile
CREATE POLICY "Admins can update any profile" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
      AND profiles.active = true
    )
  );

-- LUNCH_RECORDS TABLE POLICIES
-- Users can view their own lunch records
CREATE POLICY "Users can view own lunch records" ON lunch_records
  FOR SELECT USING (
    user_id = auth.uid() OR created_by = auth.uid()
  );

-- RRHH and recepcion can view records from last 60 days
CREATE POLICY "RRHH and recepcion can view recent records" ON lunch_records
  FOR SELECT USING (
    date >= (CURRENT_DATE - INTERVAL '60 days') AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('rrhh', 'recepcion')
      AND profiles.active = true
    )
  );

-- Admins can view all lunch records
CREATE POLICY "Admins can view all lunch records" ON lunch_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
      AND profiles.active = true
    )
  );

-- Users can create lunch records for themselves
CREATE POLICY "Users can create own lunch records" ON lunch_records
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND 
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.active = true
    )
  );

-- RRHH, recepcion, and admins can create lunch records for others
CREATE POLICY "Staff can create lunch records for others" ON lunch_records
  FOR INSERT WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'rrhh', 'recepcion')
      AND profiles.active = true
    ) AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = lunch_records.user_id 
      AND profiles.active = true
    )
  );

-- Only allow updates to comments and time (no changing user or date after creation)
CREATE POLICY "Allow limited updates to lunch records" ON lunch_records
  FOR UPDATE USING (
    -- Can update if you created the record
    created_by = auth.uid() OR
    -- Or if you're the user and updating your own record
    (user_id = auth.uid()) OR
    -- Or if you're admin/rrhh/recepcion
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'rrhh', 'recepcion')
      AND profiles.active = true
    )
  )
  WITH CHECK (
    -- Ensure critical fields don't change
    user_id = OLD.user_id AND 
    date = OLD.date AND
    created_by = OLD.created_by
  );

-- Only admins can delete lunch records
CREATE POLICY "Only admins can delete lunch records" ON lunch_records
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
      AND profiles.active = true
    )
  );