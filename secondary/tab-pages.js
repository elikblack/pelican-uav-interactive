(() => {
  const display = document.getElementById('secondary-display');
  const tabs = [...document.querySelectorAll('.secondary-tab[data-tab]')];
  const statusPage = display && display.querySelector('.secondary-grid');
  if (!display || !statusPage || !tabs.length) return;

  statusPage.classList.add('secondary-page');
  statusPage.dataset.page = 'status';
  statusPage.id = 'secondary-page-status';

  const pageTitles = {
    mission: 'MISSION',
    payload: 'PAYLOAD',
    maintenance: 'MAINTENANCE',
    settings: 'SETTINGS'
  };

  Object.entries(pageTitles).forEach(([name, title]) => {
    const page = document.createElement('section');
    page.className = 'secondary-page secondary-placeholder-page';
    page.dataset.page = name;
    page.id = `secondary-page-${name}`;
    page.hidden = true;
    page.setAttribute('aria-label', `${title} display`);
    page.innerHTML = `
      <div class="secondary-access-message">
        ACCESS RESTRICTED TO <strong>${title}</strong>. CONTACT SYSTEM ADMINISTRATOR.
      </div>
    `;
    display.appendChild(page);
  });

  const pages = [...display.querySelectorAll('.secondary-page[data-page]')];

  function activatePage(name) {
    tabs.forEach(tab => {
      const active = tab.dataset.tab === name;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
    });

    pages.forEach(page => {
      const active = page.dataset.page === name;
      page.hidden = !active;
      page.setAttribute('aria-hidden', String(!active));
    });
  }

  tabs.forEach(tab => {
    const page = display.querySelector(`#secondary-page-${tab.dataset.tab}`);
    if (page) tab.setAttribute('aria-controls', page.id);
    tab.setAttribute('role', 'tab');
    tab.addEventListener('click', () => activatePage(tab.dataset.tab));
  });

  const nav = display.querySelector('.secondary-tabs');
  if (nav) nav.setAttribute('role', 'tablist');

  const maintenanceStatus = display.querySelector('.status-maintenance');
  if (maintenanceStatus) {
    maintenanceStatus.addEventListener('click', () => activatePage('maintenance'));
  }

  activatePage('status');
})();
