from supabase import create_client, Client
from app.config.settings import settings

# Anon client — respects Row Level Security
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)

# Admin client — bypasses RLS (never expose to frontend)
supabase_admin: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
