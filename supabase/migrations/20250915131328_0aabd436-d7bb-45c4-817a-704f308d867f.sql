-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  notification_settings JSONB DEFAULT '{"email": true, "push": true}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create properties table
CREATE TABLE public.properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  property_type TEXT NOT NULL CHECK (property_type IN ('apartment', 'house', 'villa', 'penthouse', 'studio')),
  price DECIMAL(15,2) NOT NULL,
  area_sqft INTEGER NOT NULL,
  bedrooms INTEGER NOT NULL,
  bathrooms INTEGER NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zipcode TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  images JSONB DEFAULT '[]',
  amenities JSONB DEFAULT '[]',
  features JSONB DEFAULT '{}',
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'sold', 'pending')),
  agent_name TEXT,
  agent_contact TEXT,
  year_built INTEGER,
  parking_spaces INTEGER DEFAULT 0,
  furnished BOOLEAN DEFAULT false,
  pet_friendly BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user favorites table
CREATE TABLE public.user_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, property_id)
);

-- Create property views table for tracking user interactions
CREATE TABLE public.property_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  session_id TEXT
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('property_match', 'price_change', 'new_listing', 'general')),
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for properties (public read access)
CREATE POLICY "Anyone can view properties" 
ON public.properties 
FOR SELECT 
USING (true);

-- Create RLS policies for user favorites
CREATE POLICY "Users can view their own favorites" 
ON public.user_favorites 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can add their own favorites" 
ON public.user_favorites 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own favorites" 
ON public.user_favorites 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for property views
CREATE POLICY "Users can view their own property views" 
ON public.property_views 
FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Anyone can insert property views" 
ON public.property_views 
FOR INSERT 
WITH CHECK (true);

-- Create RLS policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX idx_properties_location ON public.properties (latitude, longitude);
CREATE INDEX idx_properties_price ON public.properties (price);
CREATE INDEX idx_properties_bedrooms ON public.properties (bedrooms);
CREATE INDEX idx_properties_city ON public.properties (city);
CREATE INDEX idx_user_favorites_user ON public.user_favorites (user_id);
CREATE INDEX idx_property_views_user ON public.property_views (user_id);
CREATE INDEX idx_property_views_property ON public.property_views (property_id);
CREATE INDEX idx_notifications_user ON public.notifications (user_id, read);

-- Insert sample properties data for demo
INSERT INTO public.properties (
  title, description, property_type, price, area_sqft, bedrooms, bathrooms,
  address, city, state, zipcode, latitude, longitude, images, amenities,
  agent_name, agent_contact, year_built, parking_spaces, furnished, pet_friendly
) VALUES
(
  'Modern Downtown Apartment',
  'Stunning 2BHK apartment in the heart of downtown with city views and modern amenities.',
  'apartment',
  750000.00,
  1200,
  2,
  2,
  '123 Main Street',
  'New York',
  'NY',
  '10001',
  40.7505,
  -73.9934,
  '["https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800", "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800"]',
  '["Swimming Pool", "Gym", "Parking", "Security", "Elevator", "Balcony"]',
  'Sarah Johnson',
  '+1-555-0123',
  2020,
  1,
  true,
  false
),
(
  'Luxury Villa with Garden',
  'Beautiful 4BHK villa with private garden, swimming pool, and premium finishes.',
  'villa',
  1250000.00,
  2500,
  4,
  3,
  '456 Oak Avenue',
  'Los Angeles',
  'CA',
  '90210',
  34.0522,
  -118.2437,
  '["https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800", "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800"]',
  '["Swimming Pool", "Garden", "Garage", "Security System", "Fireplace", "Walk-in Closet"]',
  'Michael Chen',
  '+1-555-0456',
  2018,
  2,
  false,
  true
),
(
  'Cozy Studio Near University',
  'Perfect studio apartment for students, close to campus with all amenities.',
  'studio',
  180000.00,
  450,
  0,
  1,
  '789 College Road',
  'Boston',
  'MA',
  '02115',
  42.3601,
  -71.0589,
  '["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800"]',
  '["WiFi", "Laundry", "Study Area", "Near Campus"]',
  'Emma Davis',
  '+1-555-0789',
  2019,
  0,
  true,
  false
),
(
  'Spacious Family House',
  'Large 5BHK family home with backyard, perfect for growing families.',
  'house',
  850000.00,
  3200,
  5,
  4,
  '321 Maple Drive',
  'Austin',
  'TX',
  '73301',
  30.2672,
  -97.7431,
  '["https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800", "https://images.unsplash.com/photo-1505843513577-22bb7d21e455?w=800"]',
  '["Backyard", "Garage", "Fireplace", "Hardwood Floors", "Updated Kitchen"]',
  'Robert Wilson',
  '+1-555-0321',
  2015,
  2,
  false,
  true
),
(
  'Luxury Penthouse Suite',
  'Exclusive penthouse with panoramic city views, rooftop terrace, and premium amenities.',
  'penthouse',
  2500000.00,
  2800,
  3,
  3,
  '100 Skyline Boulevard',
  'Miami',
  'FL',
  '33101',
  25.7617,
  -80.1918,
  '["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800", "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800"]',
  '["Rooftop Terrace", "City Views", "Concierge", "Spa", "Wine Cellar", "Smart Home"]',
  'Lisa Rodriguez',
  '+1-555-0654',
  2022,
  2,
  true,
  false
);