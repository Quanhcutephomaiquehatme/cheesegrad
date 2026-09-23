const cheeseDirectoryMode = new URLSearchParams(location.search).get('trang') === 'tho';

if (cheeseDirectoryMode) {
  document.documentElement.classList.add('directory-mode');

  document.addEventListener('DOMContentLoaded', () => {
    const section = document.querySelector('#photographers');
    if (!section) return;

    // Remove the home-only intro from the dedicated photographer directory.
    section.querySelector(':scope > .section-head')?.remove();
    section.querySelector(':scope > .photographers-bg-word')?.remove();

    const shell = section.querySelector('.directory-shell');
    const sidebar = section.querySelector('.directory-sidebar');
    const main = section.querySelector('.directory-main');
    const heading = main?.querySelector('.directory-heading');
    const browseTop = main?.querySelector('.browse-top');
    const tools = main?.querySelector('.directory-tools');
    const searchInput = section.querySelector('#photographerSearch');
    const searchLabel = searchInput?.closest('label');
    const sortSelect = section.querySelector('#photographerSort');
    const sortLabel = sortSelect?.closest('label');
    const styleFilters = main?.querySelector('.filters');
    const railToolbar = main?.querySelector('.rail-toolbar');
    const grid = main?.querySelector('.cheese-photographer-grid');

    if (!shell || !main || !grid) return;

    // Full-width page heading above the filtering/results area.
    if (heading && heading.parentElement === main) {
      heading.classList.add('directory-page-heading');
      section.insertBefore(heading, shell);
    }
    browseTop?.remove();
    if(heading){
      heading.querySelector('h1').innerHTML='Cả một đội ngũ<br><em>Chọn đúng chất của mình</em>';
      heading.querySelector('p').textContent='Khám phá phong cách, lưu người bạn thích và mở hồ sơ để xem thêm ảnh.';
    }


    // Build responsive filters using the existing controls.
    const filterPanel = document.createElement('div');
    filterPanel.className = 'directory-filter-panel';

    const topRow = document.createElement('div');
    topRow.className = 'directory-filter-top';

    if (searchLabel) {
      searchLabel.classList.remove('directory-sidebar-search');
      searchLabel.classList.add('directory-search-field');
      searchInput.placeholder='Tên hoặc phong cách';
      topRow.append(searchLabel);
    }

    if (sortLabel) {
      sortLabel.classList.add('directory-sort-field');
      topRow.append(sortLabel);
    }

    const resetButton = document.createElement('button');
    resetButton.type = 'button';
    resetButton.className = 'directory-reset-filters';
    resetButton.innerHTML = 'Xóa bộ lọc <span aria-hidden="true">↺</span>';
    topRow.append(resetButton);
    filterPanel.append(topRow);

    const createAccordion = ({ title, note = '', contentNode, extraClass = '' }) => {
      const item = document.createElement('details');
      item.className = `directory-filter-accordion ${extraClass}`.trim();

      const summary = document.createElement('summary');
      summary.className = 'directory-filter-summary';
      summary.innerHTML = `
        <span class="directory-filter-summary-copy">
          <strong>${title}</strong>
          ${note ? `<small>${note}</small>` : ''}
        </span>
        <span class="directory-filter-summary-icon" aria-hidden="true"></span>
      `;

      const body = document.createElement('div');
      body.className = 'directory-filter-body';
      if (contentNode) body.append(contentNode);

      item.append(summary, body);
      item.addEventListener('toggle', () => {
        if (matchMedia('(min-width:1000px)').matches || !item.open) return;
        filterPanel.querySelectorAll('.directory-filter-accordion[open]').forEach(other => {
          if (other !== item) other.open = false;
        });
      });
      return item;
    };

    const optionsRow = document.createElement('div');
    optionsRow.className = 'directory-filter-options-row';

    if (styleFilters) {
      const styleWrap = document.createElement('div');
      styleWrap.className = 'directory-style-wrap';
      styleWrap.append(styleFilters);
      optionsRow.append(createAccordion({
        title: 'Phong cách',
        note: 'Lọc nhanh',
        contentNode: styleWrap,
        extraClass: 'directory-filter-accordion--style'
      }));
    }

    if (sidebar) {
      const cards = [...sidebar.querySelectorAll('.directory-sidebar-card')];
      cards.forEach(card => {
        if (card.classList.contains('sidebar-intro-card') || card.querySelector('input[name="locationFilter"]')) return;
        const titleRow = card.querySelector('.sidebar-title-row');
        const title = titleRow?.querySelector('h3')?.textContent?.trim() || 'Bộ lọc';
        const note = titleRow?.querySelector('span')?.textContent?.trim() || '';
        const bodyWrap = document.createElement('div');
        bodyWrap.className = 'directory-filter-group';

        [...card.childNodes].forEach(node => {
          if (node === titleRow) return;
          bodyWrap.append(node);
        });

        optionsRow.append(createAccordion({
          title,
          note,
          contentNode: bodyWrap
        }));
      });
    }

    if (optionsRow.children.length) filterPanel.append(optionsRow);

    // Place the complete filter system before the results.
    main.insertBefore(filterPanel, grid);

    const resultsBar = document.createElement('div');
    resultsBar.className = 'directory-results-bar';
    if (railToolbar) {
      railToolbar.classList.add('directory-result-count');
      resultsBar.append(railToolbar);
    }
    grid.insertAdjacentElement('beforebegin', resultsBar);

    // Remove obsolete wrappers after their controls have been moved.
    sidebar?.remove();
    if (tools && !tools.children.length) tools.remove();
    else if (tools) tools.remove();

    // Reset all filters in one click while preserving the existing filtering logic.
    resetButton.addEventListener('click', () => {
      if (searchInput) {
        searchInput.value = '';
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      if (sortSelect) {
        sortSelect.value = 'default';
        sortSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }

      section.querySelectorAll('input[type="checkbox"]').forEach(input => {
        input.checked = input.id === 'directoryAvailableSoon';
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });

      section.querySelectorAll('input[type="radio"]:not([name="directoryTimeSlot"])').forEach(input => {
        input.checked = input.value === 'all';
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
      document.dispatchEvent(new CustomEvent('cheese:directory-reset-schedule'));

      const allStyle = section.querySelector('.filter[data-filter="all"]');
      allStyle?.click();
    });

    // v40: top-layer dropdowns escape the horizontal toolbar and card stacking.
    const groups=[...filterPanel.querySelectorAll('details')];
    let openGroup=null;
    function positionGroup(item){
      const summary=item.querySelector('summary'),body=item.querySelector('.directory-filter-body');
      const rect=summary.getBoundingClientRect();
      const width=Math.min(item.classList.contains('directory-filter-accordion--style')?370:310,innerWidth-24);
      const left=Math.max(12,Math.min(rect.left,innerWidth-width-12));
      const below=innerHeight-rect.bottom-20,above=rect.top-20;
      const useAbove=below<210&&above>below;
      body.style.setProperty('width',width+'px','important');
      body.style.setProperty('left',left+'px','important');
      body.style.setProperty('max-height',Math.max(120,useAbove?above:below)+'px','important');
      body.style.setProperty('top',useAbove?'auto':(rect.bottom+9)+'px','important');
      body.style.setProperty('bottom',useAbove?(innerHeight-rect.top+9)+'px':'auto','important');
    }
    function closeGroup(restore=false){
      if(!openGroup)return;
      const item=openGroup;openGroup=null;
      const body=item.querySelector('.directory-filter-body');
      if(body.matches(':popover-open'))body.hidePopover();
      item.open=false;item.querySelector('summary').setAttribute('aria-expanded','false');
      if(restore)item.querySelector('summary').focus();
    }
    groups.forEach((item,index)=>{
      const summary=item.querySelector('summary'),body=item.querySelector('.directory-filter-body');
      const label=summary.querySelector('strong');
      const labels={'Ưu tiên hiển thị':'Ưu tiên','Dịch vụ nổi bật':'Dịch vụ','Khoảng giá':'Ngân sách','Team':'Ekip'};
      label.textContent=labels[label.textContent]||label.textContent;
      body.id='directory-options-'+index;
      summary.setAttribute('aria-controls',body.id);summary.setAttribute('aria-expanded','false');
      if('showPopover' in body)body.setAttribute('popover','manual');
      const count=document.createElement('span');count.className='directory-choice-count';count.hidden=true;summary.querySelector('.directory-filter-summary-copy').append(count);
      const done=document.createElement('button');done.type='button';done.className='directory-filter-done';done.textContent='Xong';done.addEventListener('click',()=>closeGroup(true));body.append(done);
      summary.addEventListener('click',event=>{
        if(matchMedia('(min-width:1000px)').matches)return;
        event.preventDefault();const wasOpen=item===openGroup;closeGroup();if(wasOpen)return;
        item.open=true;openGroup=item;summary.setAttribute('aria-expanded','true');
        positionGroup(item);if(body.showPopover)body.showPopover();
      });
    });
    document.addEventListener('pointerdown',event=>{if(openGroup&&!openGroup.contains(event.target))closeGroup();});
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&openGroup){event.preventDefault();closeGroup(true);}});
    document.addEventListener('focusin',event=>{if(openGroup&&!openGroup.contains(event.target))closeGroup();});
    let positionFrame=0;
    const reposition=()=>{if(openGroup&&!positionFrame)positionFrame=requestAnimationFrame(()=>{positionFrame=0;if(openGroup)positionGroup(openGroup);});};
    addEventListener('resize',reposition);document.addEventListener('scroll',reposition,true);
    function updateCounts(){
      let total=0;
      groups.forEach(item=>{
        const selected=[...item.querySelectorAll('input:checked')].filter(input=>input.value!=='all'&&input.id!=='directoryAvailableSoon').length;
        const style=item.querySelector('.filter.active:not([data-filter="all"])')?1:0;
        const count=selected+style;total+=count;
        const badge=item.querySelector('.directory-choice-count');badge.textContent=String(count);badge.hidden=!count;item.classList.toggle('has-selection',count>0);
      });
      resetButton.classList.toggle('has-selection',total>0||!!searchInput?.value||sortSelect?.value!=='default');
    }
    filterPanel.addEventListener('change',()=>queueMicrotask(updateCounts));filterPanel.addEventListener('input',updateCounts);
    filterPanel.addEventListener('click',()=>queueMicrotask(updateCounts));
    resetButton.addEventListener('click',()=>{closeGroup();queueMicrotask(updateCounts);});
    updateCounts();
    // Wide screens use a conventional left filter column, as in the reference.
    const sidebarLayout=matchMedia('(min-width:1000px)');
    const sideTitle=document.createElement('div');sideTitle.className='directory-side-title';sideTitle.textContent='Tìm người chụp';filterPanel.prepend(sideTitle);
    const priority=document.createElement('div');priority.className='directory-selection-note';priority.innerHTML='<span>Góc nhìn của bạn</span><strong>Chọn thợ phù hợp với phong cách của mình</strong>';
    main.insertBefore(priority,main.firstChild);
    function syncLayout(){
      closeGroup();
      if(sidebarLayout.matches){shell.insertBefore(filterPanel,main);resultsBar.append(sortLabel);}
      else{main.insertBefore(filterPanel,priority);topRow.insertBefore(sortLabel,resetButton);}
      groups.forEach(item=>{
        const body=item.querySelector('.directory-filter-body');
        ['width','left','max-height','top','bottom'].forEach(key=>body.style.removeProperty(key));
        if(sidebarLayout.matches){body.removeAttribute('popover');item.open=true;}
        else{if(body.showPopover)body.setAttribute('popover','manual');item.open=false;}
        item.querySelector('summary').setAttribute('aria-expanded',String(item.open));
      });
    }
    groups.forEach(item=>item.addEventListener('toggle',()=>item.querySelector('summary').setAttribute('aria-expanded',String(item.open))));
    sidebarLayout.addEventListener('change',syncLayout);syncLayout();

    const watermark=document.createElement('span');
    watermark.className='directory-brand-watermark';
    watermark.textContent='cheese.graduation';
    watermark.setAttribute('aria-hidden','true');
    section.prepend(watermark);

    // Directory always starts with every available photographer visible.
    section.querySelectorAll('.photographer-card').forEach(card => {
      card.classList.remove('hidden', 'is-leaving');
      card.classList.add('visible');
    });
  }, { once: true });
}
