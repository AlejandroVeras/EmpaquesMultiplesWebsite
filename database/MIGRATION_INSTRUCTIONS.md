# Database Migration Instructions

To complete the lunch registration system implementation, you need to run the database migration in your Supabase instance.

## Migration Steps

1. **Login to your Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Navigate to your project

2. **Execute the Database Migration**
   - Go to the SQL Editor in your Supabase dashboard
   - Copy and paste the contents of `database/03_lunch_enhancements.sql`
   - Click "Run" to execute the migration

## What the Migration Does

The migration adds the following enhancements to support menu selection and record management:

### Database Changes
- **Adds `menu` field** to `lunch_records` table for storing meal type/menu selection
- **Adds `status` field** to `lunch_records` table with values 'active' or 'cancelled'
- **Creates `menu_types` table** with predefined menu options
- **Adds appropriate indexes** for performance
- **Sets up RLS policies** for menu_types table

### Default Menu Types
The migration includes these predefined menu options:
- Menú Ejecutivo - Menú completo con plato principal, acompañamiento y bebida
- Menú Económico - Menú básico con plato principal y bebida
- Menú Vegetariano - Opciones vegetarianas disponibles
- Menú Especial - Menú del día o promociones especiales
- Almuerzo Ligero - Opciones ligeras como ensaladas o sopas
- Otro - Otras opciones de almuerzo

## Verifying the Migration

After running the migration, you can verify it worked by:

1. Checking the `lunch_records` table has the new `menu` and `status` columns
2. Checking the `menu_types` table exists and has the predefined options
3. Testing the application to ensure:
   - Menu selection dropdown works
   - Edit functionality works for existing records
   - Cancel functionality works
   - Dashboard shows menu and status columns

## Features Now Available

After the migration, users will be able to:

- **Select menu type** when registering lunch (required field)
- **Edit existing lunch records** (date, time, menu, comments)
- **Cancel lunch records** (sets status to 'cancelled')
- **View enhanced dashboard** with menu and status information
- **Export enhanced Excel reports** with menu and status data

The system maintains backward compatibility - existing records without menu data will show as empty in the menu column.