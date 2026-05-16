import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const PortfolioContext = createContext();

export const PortfolioProvider = ({ children }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : '';
  const PORTFOLIO_REQUEST_TIMEOUT_MS = 4000;

  const fallbackData = {
    activeProfileId: "default-1",
    profiles: [
      {
        id: "default-1",
        name: "Data Engineer",
        roles: [
          "Data Scientist",
          "Data Engineer",
          "Full Stack Developer"
        ],
        avatarUrl: "",
        resumeUrl: "",
        experienceBio: "",
        projects: [],
        systemPrompt: "You are Goutham's AI assistant. Answer questions about his experience, projects, skills. Be professional, concise, and default to 80-120 words unless the user asks for more detail.",
        resumeText: ""
      }
    ],
    menuVisibility: {
      Home: true,
      About: true,
      Projects: true,
      Resume: true,
    },
    chatbot: {
      model: "nvidia/nemotron-3-super-120b-a12b:free",
      systemPrompt: "You are Goutham's AI assistant. Answer questions about his 4+ years of data engineering experience, projects, skills in Apache NiFi, Kafka, Python, SQL, Power BI, and Tableau. Be professional, concise, and default to 80-120 words unless the user asks for more detail."
    },
    imageGeneration: {
      provider: "openrouter",
      model: "openai/gpt-image-1",
      stylePrompt: "Create a polished portfolio project cover image with a modern UI/tech aesthetic, subtle gradients, clean composition, and no text or logos."
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
          'Cache-Control': forceRefresh ? 'no-cache, no-store, must-revalidate' : 'max-age=0',
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
    fetchData(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const updateData = (newData) => {
    setData(newData);
    setLoading(false);
  };

  const refreshData = (forceRefresh = true) => {
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
