-- Database schema for Lunch Registration System
-- Execute these scripts in the Supabase SQL editor

-- 1. Create departments table
CREATE TABLE IF NOT EXISTS departments (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 2. Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users PRIMARY KEY,
  full_name text,
  department_id uuid REFERENCES departments,
  role text CHECK (role IN ('admin', 'rrhh', 'recepcion', 'user')) DEFAULT 'user',
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 3. Create lunch_records table
CREATE TABLE IF NOT EXISTS lunch_records (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  date date DEFAULT current_date,
  time time DEFAULT current_time,
  comments text,
  created_by uuid REFERENCES auth.users NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  -- Ensure one record per user per day
  UNIQUE(user_id, date)
);

-- 4. Enable Row Level Security
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lunch_records ENABLE ROW LEVEL SECURITY;

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lunch_records_date ON lunch_records(date);
CREATE INDEX IF NOT EXISTS idx_lunch_records_user_id ON lunch_records(user_id);
CREATE INDEX IF NOT EXISTS idx_lunch_records_created_by ON lunch_records(created_by);
CREATE INDEX IF NOT EXISTS idx_profiles_department_id ON profiles(department_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- 6. Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Create triggers for updated_at
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_lunch_records_updated_at BEFORE UPDATE ON lunch_records FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 8. Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'user');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 10. Insert default departments
INSERT INTO departments (name) VALUES 
  ('Administración'),
  ('Recursos Humanos'),
  ('Producción'),
  ('Ventas'),
  ('Logística'),
  ('Calidad'),
  ('Mantenimiento')
ON CONFLICT DO NOTHING;