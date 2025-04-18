
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TableColumn {
  name: string;
  type: string;
  isPrimary?: boolean;
  isNullable?: boolean;
  references?: string;
}

interface Table {
  name: string;
  columns: TableColumn[];
}

// Function to ensure guest user has the necessary permissions and structure
const setupGuestUser = async () => {
  try {
    // Create a guest user in the public.users table if needed
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'guest@example.com')
      .maybeSingle();

    if (checkError) {
      console.error('Error checking for guest user:', checkError);
    }

    // If guest user doesn't exist, create it
    if (!existingUser) {
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: 'guest-user',
          user_id: 'guest-user',
          email: 'guest@example.com',
          name: 'Guest User',
          full_name: 'Guest User',
          token_identifier: 'guest@example.com',
        });

      if (insertError) {
        console.error('Error creating guest user:', insertError);
      }
    }
  } catch (error) {
    console.error('Error setting up guest user:', error);
  }
};

export const setupDatabase = async () => {
  try {
    // Check database connection
    const { error: healthCheckError } = await supabase.from('users').select('count').limit(1);
    
    if (healthCheckError) {
      console.error('Database health check failed:', healthCheckError);
      toast.error('Failed to connect to the database');
      return false;
    }
    
    // Set up guest user
    await setupGuestUser();
    
    console.log('Database setup completed');
    return true;
  } catch (error) {
    console.error('Error during database setup:', error);
    return false;
  }
};
