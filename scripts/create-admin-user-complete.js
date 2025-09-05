// Script to create admin user
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');

// Load environment variables
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_API_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createAdminUser() {
  try {
    // Admin user details
    const adminUser = {
      name: 'Admin User',
      email: 'admin@investpro.com',
      password: 'Admin123!',
      mobile: '9999999999',
      balance: 0,
      is_admin: true
    };

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(adminUser.password, saltRounds);

    // Check if admin user already exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', adminUser.email)
      .single();

    if (existingUser) {
      // Update existing user to be admin
      const { data, error: updateError } = await supabase
        .from('users')
        .update({ 
          is_admin: true,
          name: adminUser.name,
          mobile: adminUser.mobile
        })
        .eq('id', existingUser.id);

      if (updateError) {
        console.error('Error updating admin user:', updateError);
        return;
      }

      console.log('Admin user updated successfully');
      return;
    }

    // Create new admin user
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          name: adminUser.name,
          email: adminUser.email,
          password: hashedPassword,
          mobile: adminUser.mobile,
          balance: adminUser.balance,
          is_admin: adminUser.is_admin
        }
      ]);

    if (error) {
      console.error('Error creating admin user:', error);
      return;
    }

    console.log('Admin user created successfully');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the function
createAdminUser();