import { createClient } from '@supabase/supabase-js';

const projectId = "wievhaxedotrhktkjupg";
const publicAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpZXZoYXhlZG90cmhrdGtqdXBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNTQ5NDYsImV4cCI6MjA3OTczMDk0Nn0.HVRvaWulgF-qWIHL2yQ4Wcwk-7SufNYgVb97STj_9Ok";

const supabase = createClient(
    `https://${projectId}.supabase.co`,
    publicAnonKey
);

async function checkOffers() {
    const { data, error } = await supabase
        .from('offers')
        .select('id, title, image_url')
        .eq('is_active', true)
        .limit(1);

    if (error) {
        console.error('Error:', error.message);
    } else if (data && data.length > 0) {
        console.log('Title:', data[0].title);
        console.log('Image URL:', data[0].image_url);
    } else {
        console.log('No active offers found');
    }
}

checkOffers();
