const SUPABASE_URL = 'https://shpluovyxuengcsqnryi.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNocGx1b3Z5eHVlbmdjc3FucnlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1OTY4ODksImV4cCI6MjA5MjE3Mjg4OX0.mnPJji5kn5cyzvcPwZd-VZLxxcJQpoA8xWMOdVkxjH4';

async function supabaseFetch(table, options = {}) {
  let url = `${SUPABASE_URL}/rest/v1/${table}?`;
  if (options.filter) url += `${options.filter}&`;
  url += 'order=created_at.asc';

  const res = await fetch(url, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  return res.json();
}

async function supabaseUpdate(table, id, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(data)
  });
  return res.ok;
}
