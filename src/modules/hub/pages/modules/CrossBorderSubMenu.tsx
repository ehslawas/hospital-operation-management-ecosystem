// src/modules/hub/pages/modules/CrossBorderSubMenu.tsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const CrossBorderSubMenu: React.FC = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate('/transporter/dashboard', { replace: true });
  }, [navigate]);

  return <div className="p-8 text-center text-slate-500 text-sm">Loading...</div>;
};

export default CrossBorderSubMenu;
