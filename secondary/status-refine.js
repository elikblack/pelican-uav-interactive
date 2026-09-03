(() => {
  const maintenanceStatus = document.querySelector('.status-maintenance');
  const maintenanceTab = document.querySelector('.secondary-tab[data-tab="maintenance"]');
  if (!maintenanceStatus || !maintenanceTab) return;

  maintenanceStatus.addEventListener('click', () => {
    maintenanceTab.click();
  });
})();
