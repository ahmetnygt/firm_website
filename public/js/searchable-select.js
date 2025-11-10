document.querySelectorAll('.searchable-select').forEach(wrapper => {
    const real = wrapper.querySelector('select');
    const items = Array.from(real.options).map(o => ({ value: o.value, text: o.textContent }));
    const ph = real.dataset.placeholder || 'Seçiniz...';

    // Görsel elemanlar
    const box = document.createElement('div');
    box.className = 'ss-main';
    box.innerHTML = `
      <button class="ss-toggle form-control text-start" aria-haspopup="listbox" aria-expanded="false">${ph}</button>
      <div class="ss-dropdown" role="listbox">
        <input class="ss-search form-control form-control-sm" type="text" placeholder="Ara..." autocomplete="off">
        <ul class="ss-list list-unstyled mb-0"></ul>
      </div>`;
    real.style.display = 'none';
    wrapper.appendChild(box);

    const toggle = box.querySelector('.ss-toggle');
    const drop = box.querySelector('.ss-dropdown');
    const search = box.querySelector('.ss-search');
    const list = box.querySelector('.ss-list');

    let selected = 0;
    let filtered = items.slice();

    function render() {
        list.innerHTML = '';
        if (!filtered.length) {
            list.innerHTML = '<li class="ss-no">Sonuç yok</li>';
            return;
        }
        filtered.forEach((it, idx) => {
            const li = document.createElement('li');
            li.className = 'ss-item';
            if (idx === selected) li.classList.add('active');
            li.textContent = it.text;
            li.setAttribute('role', 'option');
            li.setAttribute('tabindex', '-1');
            li.setAttribute('aria-selected', idx === selected);
            li.addEventListener('click', () => selectItem(it, idx));
            list.appendChild(li);
        });
    }

    function selectItem(it, idx) {
        real.value = it.value;
        toggle.textContent = it.text;
        selected = idx;
        close();
    }

    function open() {
        drop.classList.add('show');
        toggle.setAttribute('aria-expanded', 'true');
        search.focus();
        render();
    }

    function close() {
        drop.classList.remove('show');
        toggle.setAttribute('aria-expanded', 'false');
        search.value = '';
        filtered = items.slice();
        selected = 0;
    }

    toggle.addEventListener('click', () => drop.classList.contains('show') ? close() : open());

    // Arama
    search.addEventListener('input', e => {
        filtered = items.filter(it => it.text.toLowerCase().includes(e.target.value.toLowerCase()));
        selected = 0;
        render();
    });

    // Klavye
    toggle.addEventListener('keydown', e => {
        if (e.key === 'ArrowDown') { open(); e.preventDefault(); }
    });
    search.addEventListener('keydown', e => {
        const itemsEl = list.querySelectorAll('.ss-item');
        if (e.key === 'ArrowDown') {
            selected = Math.min(selected + 1, filtered.length - 1);
            render(); itemsEl[selected]?.scrollIntoView({ block: 'nearest' });
            e.preventDefault();
        } else if (e.key === 'ArrowUp') {
            selected = Math.max(selected - 1, 0);
            render(); itemsEl[selected]?.scrollIntoView({ block: 'nearest' });
            e.preventDefault();
        } else if (e.key === 'Enter') {
            if (filtered[selected]) selectItem(filtered[selected], selected);
            e.preventDefault();
        } else if (e.key === 'Escape') close();
    });

    // Dışarı tıklama
    document.addEventListener('click', e => { if (!box.contains(e.target)) close(); });
});