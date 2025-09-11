-- Database enhancements for lunch registration system
-- Add menu field and status to lunch_records table

-- 1. Add menu and status fields to lunch_records table
ALTER TABLE lunch_records 
ADD COLUMN IF NOT EXISTS menu text,
ADD COLUMN IF NOT EXISTS status text CHECK (status IN ('active', 'cancelled')) DEFAULT 'active';

-- 2. Create index for status field
CREATE INDEX IF NOT EXISTS idx_lunch_records_status ON lunch_records(status);

-- 3. Create menu_types table for predefined menu options
CREATE TABLE IF NOT EXISTS menu_types (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  description text,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 4. Enable Row Level Security for menu_types
ALTER TABLE menu_types ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policy for menu_types (read-only for all authenticated users)
CREATE POLICY "menu_types_select_policy" ON menu_types
  FOR SELECT USING (auth.role() = 'authenticated');

-- 6. Create trigger for updated_at on menu_types
CREATE TRIGGER update_menu_types_updated_at 
  BEFORE UPDATE ON menu_types 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 7. Insert default menu types
INSERT INTO menu_types (name, description) VALUES 
  ('Menú Ejecutivo', 'Menú completo con plato principal, acompañamiento y bebida'),
  ('Menú Económico', 'Menú básico con plato principal y bebida'),
  ('Menú Vegetariano', 'Opciones vegetarianas disponibles'),
  ('Menú Especial', 'Menú del día o promociones especiales'),
  ('Almuerzo Ligero', 'Opciones ligeras como ensaladas o sopas'),
  ('Otro', 'Otras opciones de almuerzo')
ON CONFLICT DO NOTHING;