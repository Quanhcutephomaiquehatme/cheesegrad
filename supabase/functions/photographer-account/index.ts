import { createClient } from 'npm:@supabase/supabase-js@2';
import { handle } from './handler.js';
Deno.serve((request: Request) => handle(request, Deno.env, createClient));
