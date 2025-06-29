/*
  # Add Inventory Management System

  1. Schema Updates
    - Add inventory fields to products table
    - Create inventory_logs table for tracking stock changes
    - Add low_stock_alerts table for notifications

  2. New Tables
    - `inventory_logs`
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key)
      - `change_type` (text: 'restock', 'sale', 'adjustment', 'return')
      - `quantity_change` (integer)
      - `previous_stock` (integer)
      - `new_stock` (integer)
      - `reason` (text)
      - `created_by` (uuid, optional admin user)
      - `created_at` (timestamp)
    
    - `low_stock_alerts`
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key)
      - `threshold` (integer)
      - `current_stock` (integer)
      - `alert_sent` (boolean)
      - `resolved` (boolean)
      - `created_at` (timestamp)

  3. Security
    - Enable RLS on new tables
    - Add policies for authenticated users
*/

-- Add inventory fields to products table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'stock_quantity'
  ) THEN
    ALTER TABLE products ADD COLUMN stock_quantity integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'low_stock_threshold'
  ) THEN
    ALTER TABLE products ADD COLUMN low_stock_threshold integer DEFAULT 10;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'track_inventory'
  ) THEN
    ALTER TABLE products ADD COLUMN track_inventory boolean DEFAULT true;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'sku'
  ) THEN
    ALTER TABLE products ADD COLUMN sku text UNIQUE;
  END IF;
END $$;

-- Create inventory_logs table
CREATE TABLE IF NOT EXISTS inventory_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  change_type text NOT NULL CHECK (change_type IN ('restock', 'sale', 'adjustment', 'return')),
  quantity_change integer NOT NULL,
  previous_stock integer NOT NULL,
  new_stock integer NOT NULL,
  reason text DEFAULT '',
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

-- Create low_stock_alerts table
CREATE TABLE IF NOT EXISTS low_stock_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  threshold integer NOT NULL,
  current_stock integer NOT NULL,
  alert_sent boolean DEFAULT false,
  resolved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE low_stock_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for inventory_logs
CREATE POLICY "Authenticated users can view inventory logs"
  ON inventory_logs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert inventory logs"
  ON inventory_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for low_stock_alerts
CREATE POLICY "Authenticated users can manage low stock alerts"
  ON low_stock_alerts
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Function to automatically create low stock alerts
CREATE OR REPLACE FUNCTION check_low_stock()
RETURNS TRIGGER AS $$
BEGIN
  -- Only check if inventory tracking is enabled
  IF NEW.track_inventory = true THEN
    -- Check if stock is below threshold
    IF NEW.stock_quantity <= NEW.low_stock_threshold THEN
      -- Insert or update low stock alert
      INSERT INTO low_stock_alerts (product_id, threshold, current_stock, alert_sent, resolved)
      VALUES (NEW.id, NEW.low_stock_threshold, NEW.stock_quantity, false, false)
      ON CONFLICT (product_id) 
      DO UPDATE SET 
        threshold = EXCLUDED.threshold,
        current_stock = EXCLUDED.current_stock,
        resolved = false,
        created_at = now()
      WHERE low_stock_alerts.resolved = true;
    ELSE
      -- Mark existing alerts as resolved if stock is above threshold
      UPDATE low_stock_alerts 
      SET resolved = true 
      WHERE product_id = NEW.id AND resolved = false;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for low stock checking
DROP TRIGGER IF EXISTS trigger_check_low_stock ON products;
CREATE TRIGGER trigger_check_low_stock
  AFTER UPDATE OF stock_quantity ON products
  FOR EACH ROW
  EXECUTE FUNCTION check_low_stock();

-- Function to log inventory changes
CREATE OR REPLACE FUNCTION log_inventory_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if stock quantity changed and inventory tracking is enabled
  IF OLD.stock_quantity != NEW.stock_quantity AND NEW.track_inventory = true THEN
    INSERT INTO inventory_logs (
      product_id,
      change_type,
      quantity_change,
      previous_stock,
      new_stock,
      reason
    ) VALUES (
      NEW.id,
      CASE 
        WHEN NEW.stock_quantity > OLD.stock_quantity THEN 'restock'
        ELSE 'adjustment'
      END,
      NEW.stock_quantity - OLD.stock_quantity,
      OLD.stock_quantity,
      NEW.stock_quantity,
      'Stock updated via admin'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for inventory logging
DROP TRIGGER IF EXISTS trigger_log_inventory_change ON products;
CREATE TRIGGER trigger_log_inventory_change
  AFTER UPDATE OF stock_quantity ON products
  FOR EACH ROW
  EXECUTE FUNCTION log_inventory_change();

-- Add unique constraint for low_stock_alerts to prevent duplicates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'low_stock_alerts_product_id_key'
  ) THEN
    ALTER TABLE low_stock_alerts ADD CONSTRAINT low_stock_alerts_product_id_key UNIQUE (product_id);
  END IF;
END $$;