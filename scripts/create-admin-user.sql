-- Create admin user
INSERT INTO users (name, email, password, mobile, balance, is_admin, created_at)
VALUES ('Admin User', 'admin@investpro.com', 'Admin123!', '9999999999', 0, true, NOW())
ON CONFLICT (email) DO UPDATE SET is_admin = true;

-- Verify the admin user was created
SELECT id, name, email, is_admin FROM users WHERE email = 'admin@investpro.com';