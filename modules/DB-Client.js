// Init and Export Supabase
const Configs = require("../configs")
const { createClient } = require('@supabase/supabase-js');

module.exports = createClient(Configs.SUPABASE_URL, Configs.SUPABASE_KEY);
