-- Create role enum
CREATE TYPE public.app_role AS ENUM ('engineer', 'project_manager', 'admin');

-- Create inventory status enum
CREATE TYPE public.inventory_status AS ENUM ('available', 'reserved', 'out_of_stock', 'maintenance');

-- Create request status enum  
CREATE TYPE public.request_status AS ENUM ('pending', 'approved', 'rejected', 'completed');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role app_role NOT NULL DEFAULT 'engineer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create inventory items table
CREATE TABLE public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT UNIQUE NOT NULL,
  category TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  unit_price DECIMAL(10,2),
  location TEXT,
  status inventory_status DEFAULT 'available',
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create inventory requests table
CREATE TABLE public.inventory_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.inventory_items(id),
  requested_by UUID NOT NULL REFERENCES public.profiles(id),
  approved_by UUID REFERENCES public.profiles(id),
  quantity_requested INTEGER NOT NULL,
  purpose TEXT,
  status request_status DEFAULT 'pending',
  request_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  approved_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create audit logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for inventory items
CREATE POLICY "Everyone can view inventory items" ON public.inventory_items
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage inventory items" ON public.inventory_items
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for inventory requests
CREATE POLICY "Users can view their own requests" ON public.inventory_requests
  FOR SELECT TO authenticated
  USING (
    requested_by IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'project_manager')
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Engineers can create requests" ON public.inventory_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    requested_by IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Project managers and admins can update requests" ON public.inventory_requests
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'project_manager')
    OR public.has_role(auth.uid(), 'admin')
  );

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING (
    user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE TO authenticated
  USING (
    user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

-- RLS Policies for audit logs
CREATE POLICY "Users can view audit logs based on role" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (
    user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE((NEW.raw_user_meta_data ->> 'role')::app_role, 'engineer')
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventory_requests_updated_at
  BEFORE UPDATE ON public.inventory_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();