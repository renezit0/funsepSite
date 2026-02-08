const handleLogout = async () => {
  await adminAuth.logout();
  window.location.hash = '#/';
  window.location.reload();
}; // backup com reload
