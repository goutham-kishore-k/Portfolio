import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const PortfolioContext = createContext();

export const PortfolioProvider = ({ children }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : '';
  const PORTFOLIO_REQUEST_TIMEOUT_MS = 4000;

  const fallbackData = {
    activeProfileId: "fallback-profile",
    profiles: [
      {
        id: "fallback-profile",
        name: "Portfolio Admin",
        roles: ["Full Stack Developer"],
        avatarUrl: "",
        resumeUrl: "",
        experienceBio: "Fallback portfolio data loaded while the API is unavailable.",
        projects: [],
        systemPrompt: "You are an AI assistant for this portfolio.",
        resumeText: "",
      },
    ],
    menuVisibility: {
      Home: true,
      About: true,
      Projects: true,
      Resume: true,
    },
    chatbot: {
      model: "nvidia/nemotron-3-super-120b-a12b:free",
    },
  };

  const isValidPortfolioData = (value) => Boolean(
    value &&
    Array.isArray(value.profiles) &&
    value.profiles.length > 0
  );

  const fetchData = async (forceRefresh = false) => {
    try {
      const requestConfig = {
        timeout: PORTFOLIO_REQUEST_TIMEOUT_MS,
        headers: {
          'Cache-Control': forceRefresh ? 'no-cache' : 'max-age=0',
          Pragma: forceRefresh ? 'no-cache' : 'max-age=0',
        },
      };

      if (forceRefresh) {
        requestConfig.params = { _t: Date.now() };
      }

      const response = await axios.get(`${API_BASE_URL}/api/portfolio`, requestConfig);

      if (isValidPortfolioData(response.data)) {
        setData(response.data);
      } else if (!data) {
        setData(fallbackData);
      }
    } catch (error) {
      console.error("Failed to fetch portfolio data:", error);
      if (!data) {
        setData(fallbackData);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const updateData = (newData) => {
    setData(newData);
    setLoading(false);
  };

  const refreshData = (forceRefresh = false) => {
    setLoading(true);
    fetchData(forceRefresh);
  };

  const activeProfile = data?.profiles?.find(p => p.id === data.activeProfileId) || data?.profiles?.[0] || null;

  return (
    <PortfolioContext.Provider value={{ data, loading, refreshData, updateData, activeProfile }}>
      {children}
    </PortfolioContext.Provider>
  );
};
