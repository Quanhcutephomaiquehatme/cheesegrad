import { createClient } from "npm:@supabase/supabase-js@2";
import { handle } from "./handler.js";

Deno.serve((request: Request) => {
  return handle(request, Deno.env, createClient);
});
