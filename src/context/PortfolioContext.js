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

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/portfolio`, {
        timeout: PORTFOLIO_REQUEST_TIMEOUT_MS,
        params: { _t: Date.now() },
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      });

      if (response.data?.profiles && Array.isArray(response.data.profiles)) {
        setData(response.data);
      } else {
        setData(fallbackData);
      }
    } catch (error) {
      console.error("Failed to fetch portfolio data:", error);
      setData(fallbackData);
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

  const refreshData = () => {
    setLoading(true);
    fetchData();
  };

  const activeProfile = data?.profiles?.find(p => p.id === data.activeProfileId) || data?.profiles?.[0] || null;

  return (
    <PortfolioContext.Provider value={{ data, loading, refreshData, updateData, activeProfile }}>
      {children}
    </PortfolioContext.Provider>
  );
};
