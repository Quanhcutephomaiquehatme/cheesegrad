(() => {
  'use strict';
  const cfg=window.CHEESE_CONFIG||{};
  const pricing=window.CHEESE_BOOKING_PRICES||(window.CHEESE_BOOKING_PRICES={});
  const usable=/^https:\/\/.+\.supabase\.co$/i.test(String(cfg.supabaseUrl||'').trim()) &&
    !String(cfg.supabaseAnonKey||'').includes('PASTE_') && String(cfg.supabaseAnonKey||'').length>20 && window.supabase;

  const ready=(async()=>{
    if(!usable)return pricing;
    try{
      const db=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey);
      const {data,error}=await db.from('site_pricing').select('reference_price_from,team_prices,province_groups,province_details').eq('id','main').maybeSingle();
      if(error)throw error;
      if(!data)return pricing;
      if(Number(data.reference_price_from)>0)pricing.referencePriceFrom=Number(data.reference_price_from);
      if(Array.isArray(data.team_prices))pricing.teamBasePrices=data.team_prices;
      if(Array.isArray(data.province_groups))pricing.provinceGroups=data.province_groups;
      if(data.province_details && typeof data.province_details==='object')pricing.provinceDetails=data.province_details;
      return pricing;
    }catch(err){
      console.warn('Pricing sync:',err.message);
      return pricing;
    }
  })();
  window.CHEESE_PRICING_READY=ready;
})();
