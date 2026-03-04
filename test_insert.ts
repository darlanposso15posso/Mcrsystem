import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function test() {
  const payload = {
    client_id: 1, // ou um client existente
    status: 'IN_PROGRESS',
    inspection_start_time: new Date().toISOString(),
    pre_cleaning_checklist: JSON.stringify({"sec_electrical":true})
  };
  const { data, error } = await supabase.from('services').insert([payload]);
  console.log('Result:', error || 'Success', data);
}
test();
