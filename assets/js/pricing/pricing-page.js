(() => {
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const profiles=window.CHEESE_PROFILES||{};
  const teamWrap=$('#teamPriceList');
  const provinceSelect=$('#provinceSelectCalc');
  const countSelect=$('#photographerCountCalc');
  const tableWrap=$('#provinceTableWrap');
  const countLabel=$('#provinceCountLabel');
  const summaryName=$('#provinceSummaryName');
  const summaryNote=$('#provinceSummaryNote');
  const summaryPrice=$('#provinceSummaryPrice');

  const formatMoney=n=>`${Number(n||0).toLocaleString('vi-VN')}đ`;
  const parseFeeRange=(text='')=>{
    const nums=(String(text).match(/\d[\d.]*/g)||[]).map(v=>Number(v.replace(/\./g,''))).filter(Boolean);
    if(!nums.length)return null;
    return {min:nums[0],max:nums[nums.length-1]||nums[0]};
  };
  const profileList=()=>Object.values(profiles||{});
  const countTeams=(teams=[])=>profileList().filter(p=>teams.includes(p.team)).length;

  async function init(){
    if(window.CHEESE_PHOTOGRAPHERS_READY){try{await window.CHEESE_PHOTOGRAPHERS_READY}catch(_){}}
    if(window.CHEESE_PRICING_READY){try{await window.CHEESE_PRICING_READY}catch(_){}}
    const pricing=window.CHEESE_BOOKING_PRICES||{};
    const provinceGroups=pricing.provinceGroups||[];
    const provinceDetails=pricing.provinceDetails||{};
    const teamBasePrices=pricing.teamBasePrices||[];

    const reference=Number(pricing.referencePriceFrom||1500000);
    const heroPrice=$('#heroReferencePrice');
    if(heroPrice)heroPrice.textContent=formatMoney(reference);

    teamWrap.innerHTML=teamBasePrices.map((item,index)=>{
      const count=item.teams?.length?countTeams(item.teams):0;
      return `
        <article class="team-price-row">
          <div>
            <span class="team-index">${String(index+1).padStart(2,'0')} · ${String(item.id||'ekip').toUpperCase()}</span>
            <h3>${item.label||'Ekip'}</h3>
            <p>${item.description||''}</p>
          </div>
          <div class="team-price-side">
            <div><small>Giá từ</small><strong>${formatMoney(item.priceFrom)}</strong></div>
            <span>${count} thợ</span>
          </div>
        </article>`;
    }).join('');

    const flat=provinceGroups.flatMap(group => (group.items||[]).map(([name,fee]) => ({group:group.label,name,fee,note:provinceDetails[name]||'Tính theo 1 thợ.'})));
    countLabel.textContent=`${flat.length} địa điểm`;
    const heroCount=$('#heroProvinceCount');if(heroCount)heroCount.textContent=flat.length;
    tableWrap.innerHTML=provinceGroups.map(group=>`
      <section class="province-group">
        <div class="province-group-head">${group.label}</div>
        ${(group.items||[]).map(([name,fee])=>`
          <article class="province-row">
            <div><b>${name}</b><p>${provinceDetails[name]||'Tính theo 1 thợ.'}</p></div>
            <div class="province-fee">${fee} / 1 thợ</div>
          </article>`).join('')}
      </section>`).join('');

    provinceSelect.innerHTML='<option value="">Chọn nơi chụp...</option>';
    provinceGroups.forEach(group=>{
      const og=document.createElement('optgroup');og.label=group.label;
      (group.items||[]).forEach(([name,fee])=>{
        const option=document.createElement('option');option.value=name;option.dataset.fee=fee;option.textContent=`${name} · ${fee}`;og.appendChild(option);
      });
      provinceSelect.appendChild(og);
    });

    function updateProvinceSummary(){
      const option=provinceSelect.selectedOptions[0],name=option?.value||'',people=Number(countSelect.value||1);
      if(!name){summaryName.textContent='Chưa chọn nơi chụp';summaryNote.textContent='Vui lòng chọn địa điểm để xem ghi chú chi tiết.';summaryPrice.textContent='—';return;}
      const feeText=option.dataset.fee||'',fee=parseFeeRange(feeText);
      summaryName.textContent=`${name} · ${people} thợ`;summaryNote.textContent=provinceDetails[name]||'Tính theo 1 thợ.';
      if(!fee){summaryPrice.textContent=feeText||'Liên hệ';return;}
      const min=fee.min*people,max=fee.max*people;summaryPrice.textContent=min===max?formatMoney(min):`${formatMoney(min)} - ${formatMoney(max)}`;
    }
    updateProvinceSummary();
    provinceSelect.addEventListener('change',updateProvinceSummary);
    countSelect.addEventListener('change',updateProvinceSummary);
  }
  init();
})();
