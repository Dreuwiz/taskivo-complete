const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

console.log("SUPABASE URL:", process.env.SUPABASE_URL);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY   // service role key — bypasses RLS
);

module.exports = supabase;  
