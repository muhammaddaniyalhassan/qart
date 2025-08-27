'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface CustomerData {
  _id: string;
  name: string;
  phone: string;
  email: string;
  tableNumber: string;
  createdAt: string;
}

interface CustomerSessionContextType {
  customer: CustomerData | null;
  setCustomer: (customer: CustomerData | null) => void;
  clearCustomer: () => void;
  isCustomerSessionActive: boolean;
}

const CustomerSessionContext = createContext<CustomerSessionContextType | undefined>(undefined);

export function CustomerSessionProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomerState] = useState<CustomerData | null>(null);
  const [isCustomerSessionActive, setIsCustomerSessionActive] = useState(false);

  // Load customer data from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCustomer = localStorage.getItem('qart-customer');
      console.log('CustomerSessionContext: Loading from localStorage:', savedCustomer);
      if (savedCustomer) {
        try {
          const customerData = JSON.parse(savedCustomer);
          console.log('CustomerSessionContext: Setting customer data:', customerData);
          setCustomerState(customerData);
          setIsCustomerSessionActive(true);
        } catch (error) {
          console.error('CustomerSessionContext: Error parsing customer data from localStorage:', error);
          localStorage.removeItem('qart-customer');
        }
      } else {
        console.log('CustomerSessionContext: No saved customer data found');
      }
    }
  }, []);

  const setCustomer = (customerData: CustomerData | null) => {
    console.log('CustomerSessionContext: setCustomer called with:', customerData);
    setCustomerState(customerData);
    setIsCustomerSessionActive(!!customerData);
    
    if (customerData) {
      localStorage.setItem('qart-customer', JSON.stringify(customerData));
      console.log('CustomerSessionContext: Customer data saved to localStorage');
    } else {
      localStorage.removeItem('qart-customer');
      console.log('CustomerSessionContext: Customer data removed from localStorage');
    }
  };

  const clearCustomer = () => {
    setCustomerState(null);
    setIsCustomerSessionActive(false);
    localStorage.removeItem('qart-customer');
  };

  const value: CustomerSessionContextType = {
    customer,
    setCustomer,
    clearCustomer,
    isCustomerSessionActive,
  };

  return (
    <CustomerSessionContext.Provider value={value}>
      {children}
    </CustomerSessionContext.Provider>
  );
}

export function useCustomerSession() {
  const context = useContext(CustomerSessionContext);
  if (context === undefined) {
    throw new Error('useCustomerSession must be used within a CustomerSessionProvider');
  }
  return context;
}
