import { createContext, useContext, useState, useCallback } from 'react';

export const ROLES = {
  BUYER: 'buyer',
};

export const ROLE_LABELS = {
  buyer: 'Buyer / Investor',
};

export const ROLE_COLORS = {
  buyer: '#1F56C4',
};

const RoleContext = createContext(null);

export function RoleProvider({ children }) {
  const [role, setRole] = useState(() => {
    // Only the Buyer / Investor role exists on the frontend now
    return ROLES.BUYER;
  });

  const switchRole = useCallback((newRole) => {
    setRole(newRole);
    localStorage.setItem('propOS_role', newRole);
  }, []);

  return (
    <RoleContext.Provider value={{ role, switchRole, ROLES, ROLE_LABELS, ROLE_COLORS }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used within RoleProvider');
  return ctx;
}
