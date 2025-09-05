-- Add days_left column to investments table
ALTER TABLE investments 
ADD COLUMN IF NOT EXISTS days_left INTEGER;

-- Update existing investments to set days_left based on plan duration
-- This will set days_left to the duration_days of the corresponding plan
UPDATE investments 
SET days_left = product_plans.duration_days
FROM product_plans
WHERE investments.plan_id = product_plans.id 
AND investments.days_left IS NULL;