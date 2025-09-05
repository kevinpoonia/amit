const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '../backend/.env' });

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_API_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createAdminUser() {
  try {
    // Check if admin user already exists
    const { data: existingAdmin, error: fetchError } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'admin@investpro.com')
      .single();

    if (existingAdmin) {
      console.log('Admin user already exists. Updating admin status...');
      
      // Update existing user to be admin
      const { error: updateError } = await supabase
        .from('users')
        .update({ is_admin: true })
        .eq('email', 'admin@investpro.com');

      if (updateError) {
        console.error('Error updating admin status:', updateError);
        return;
      }

      console.log('Admin user updated successfully!');
      return;
    }

    // Create new admin user
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          name: 'Admin User',
          email: 'admin@investpro.com',
          password: 'Admin123!', // In a real app, this should be hashed
          mobile: '9999999999',
          balance: 0,
          is_admin: true,
          created_at: new Date()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating admin user:', error);
      return;
    }

    console.log('Admin user created successfully!');
    console.log('Login credentials:');
    console.log('Email: admin@investpro.com');
    console.log('Password: Admin123!');
  } catch (error) {
    console.error('Error:', error);
  }
}

createAdminUser();