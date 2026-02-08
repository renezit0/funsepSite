  const handleLogout = async () => {
    await adminAuth.logout();
    navigate('/');
  }; // original
