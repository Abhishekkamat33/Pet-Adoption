// OwnerContext.js
import React, { createContext, useContext, useState } from 'react';

const OwnerContext = createContext();

export const OwnerProvider = ({ children }) => {
  const [ownerID, setOwnerID] = useState(null);

  return (
    <OwnerContext.Provider value={{ ownerID, setOwnerID }}>
      {children}
    </OwnerContext.Provider>
  );
};

export const useOwner = () => {
  return useContext(OwnerContext);
};