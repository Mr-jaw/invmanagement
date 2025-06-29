/*
  # Initial Schema for LuxeShowcase

  1. New Tables
    - `categories`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `description` (text)
      - `image_url` (text)
      - `created_at` (timestamp)
    
    - `products`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `price` (numeric)
      - `category_id` (uuid, foreign key)
      - `images` (text array)
      - `specifications` (jsonb)
      - `featured` (boolean, default false)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `contacts`
      - `id` (uuid, primary key)
      - `name` (text)
      - `email` (text)
      - `subject` (text)
      - `message` (text)
      - `read` (boolean, default false)
      - `created_at` (timestamp)
    
    - `reviews`
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key)
      - `author_name` (text)
      - `author_email` (text)
      - `rating` (integer, 1-5)
      - `comment` (text)
      - `verified` (boolean, default false)
      - `created_at` (timestamp)
    
    - `subscriptions`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `active` (boolean, default true)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for public read access on products, categories, and reviews
    - Add policies for authenticated admin access on all tables
    - Add policies for public insert on contacts and subscriptions
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  price numeric NOT NULL DEFAULT 0,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  images text[] DEFAULT '{}',
  specifications jsonb DEFAULT '{}',
  featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  author_email text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL DEFAULT '',
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for categories
CREATE POLICY "Categories are viewable by everyone"
  ON categories
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage categories"
  ON categories
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for products
CREATE POLICY "Products are viewable by everyone"
  ON products
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage products"
  ON products
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for contacts
CREATE POLICY "Anyone can submit contacts"
  ON contacts
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read contacts"
  ON contacts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update contacts"
  ON contacts
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for reviews
CREATE POLICY "Reviews are viewable by everyone"
  ON reviews
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can submit reviews"
  ON reviews
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage reviews"
  ON reviews
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for subscriptions
CREATE POLICY "Anyone can subscribe"
  ON subscriptions
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage subscriptions"
  ON subscriptions
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger for products
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample categories
INSERT INTO categories (name, description, image_url) VALUES
  ('Audio', 'Premium audio equipment and accessories', 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg'),
  ('Wearables', 'Smart watches and wearable technology', 'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg'),
  ('Photography', 'Professional cameras and photography equipment', 'https://images.pexels.com/photos/51383/photo-camera-subject-photographer-51383.jpeg'),
  ('Fashion', 'Luxury fashion accessories and apparel', 'https://images.pexels.com/photos/46710/pexels-photo-46710.jpeg'),
  ('Accessories', 'Premium lifestyle accessories', 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg')
ON CONFLICT (name) DO NOTHING;

-- Get category IDs for sample products
DO $$
DECLARE
  audio_id uuid;
  wearables_id uuid;
  photography_id uuid;
  fashion_id uuid;
  accessories_id uuid;
BEGIN
  SELECT id INTO audio_id FROM categories WHERE name = 'Audio';
  SELECT id INTO wearables_id FROM categories WHERE name = 'Wearables';
  SELECT id INTO photography_id FROM categories WHERE name = 'Photography';
  SELECT id INTO fashion_id FROM categories WHERE name = 'Fashion';
  SELECT id INTO accessories_id FROM categories WHERE name = 'Accessories';

  -- Insert sample products
  INSERT INTO products (name, description, price, category_id, images, specifications, featured) VALUES
    ('Premium Wireless Headphones', 'Experience crystal-clear audio with our flagship headphones featuring active noise cancellation and 30-hour battery life.', 299, audio_id, ARRAY['https://images.pexels.com/photos/3945667/pexels-photo-3945667.jpeg'], '{"battery": "30 hours", "driver": "40mm", "frequency": "20Hz-20kHz", "weight": "250g"}', true),
    ('Luxury Smart Watch', 'Elegance meets technology in this premium timepiece with health monitoring, GPS, and premium materials.', 599, wearables_id, ARRAY['https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg'], '{"display": "1.4 inch OLED", "battery": "7 days", "waterproof": "50m", "materials": "Titanium, Sapphire"}', true),
    ('Professional Camera', 'Capture moments with professional-grade precision featuring full-frame sensor and advanced autofocus system.', 1299, photography_id, ARRAY['https://images.pexels.com/photos/51383/photo-camera-subject-photographer-51383.jpeg'], '{"sensor": "Full Frame", "resolution": "45MP", "iso": "100-51200", "video": "4K 60fps"}', true),
    ('Designer Sunglasses', 'Premium UV protection with sophisticated styling crafted from Italian acetate and German engineering.', 199, fashion_id, ARRAY['https://images.pexels.com/photos/46710/pexels-photo-46710.jpeg'], '{"material": "Italian Acetate", "lenses": "Polarized", "uv": "100% UV400", "warranty": "2 years"}', false),
    ('Leather Business Bag', 'Handcrafted Italian leather briefcase perfect for the modern professional with laptop compartment.', 399, accessories_id, ARRAY['https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg'], '{"material": "Full Grain Leather", "laptop": "15 inch", "compartments": "3", "warranty": "Lifetime"}', false),
    ('Wireless Speaker', 'Premium sound quality in a compact, portable design with 360-degree audio and long battery life.', 149, audio_id, ARRAY['https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg'], '{"battery": "20 hours", "bluetooth": "5.0", "waterproof": "IPX7", "power": "40W"}', true);
END $$;