import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://grkqbppgimklpyhrvqob.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is missing!');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

async function main() {
  console.log('Querying current buckets configuration...');
  const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
  if (listError) {
    console.error('Error listing buckets:', listError);
  } else {
    console.log('Current buckets info:', JSON.stringify(buckets, null, 2));
  }

  console.log('Attempting to update media bucket file size limit to 5GB (5368709120 bytes)...');
  const { data: updateData, error: updateError } = await supabaseAdmin.storage.updateBucket('media', {
    public: true,
    fileSizeLimit: 5368709120, // 5GB limit
    allowedMimeTypes: ['video/*', 'image/*', 'audio/*']
  });

  if (updateError) {
    console.error('Error updating bucket:', updateError);
  } else {
    console.log('Successfully updated media bucket limit:', updateData);
  }

  // Double check configuration
  const { data: verifyData, error: verifyError } = await supabaseAdmin.storage.getBucket('media');
  if (verifyError) {
    console.error('Error verifying bucket:', verifyError);
  } else {
    console.log('Verified bucket config:', verifyData);
  }
}

main();
