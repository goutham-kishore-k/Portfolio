import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const PortfolioContext = createContext();

export const PortfolioProvider = ({ children }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : '';

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/portfolio`);
      setData(response.data);
    } catch (error) {
      console.error("Failed to fetch portfolio data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const refreshData = () => {
    setLoading(true);
    fetchData();
  };

  const activeProfile = data?.profiles?.find(p => p.id === data.activeProfileId) || data?.profiles?.[0] || null;

  return (
    <PortfolioContext.Provider value={{ data, loading, refreshData, activeProfile }}>
      {children}
    </PortfolioContext.Provider>
  );
};
