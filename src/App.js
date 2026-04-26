import React, { useState, useEffect } from "react";
import Preloader from "../src/components/Pre";
import Navbar from "./components/Navbar";
import Home from "./components/Home/Home";
import About from "./components/About/About";
import Projects from "./components/Projects/Projects";
import Footer from "./components/Footer";
import Resume from "./components/Resume/ResumeNew";
import ChatBot from "./components/chatBot";
import AIChat from "./components/AIChat";
import { ThemeProvider } from "./context/ThemeContext";
import { PortfolioProvider } from "./context/PortfolioContext";
import { Auth0ProviderWithNavigate } from "./context/Auth0ProviderWithNavigate";
import AdminDashboard from "./components/Admin/AdminDashboard";

import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate
} from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import "./style.css";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  const [load, updateLoad] = useState(true);
  const [theme, setTheme] = useState(() =>
    localStorage.getItem("theme") === "light" ? "light" : "dark"
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      updateLoad(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const nextClass = theme === "light" ? "theme-light" : "theme-dark";
    document.body.classList.remove("theme-light", "theme-dark");
    document.body.classList.add(nextClass);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <Router>
      <Auth0ProviderWithNavigate>
        <PortfolioProvider>
          <ThemeProvider theme={theme}>
            <Preloader load={load} />
        <div className="App" id={load ? "no-scroll" : "scroll"}>
          <Navbar theme={theme} onToggleTheme={toggleTheme} />
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/project" element={<Projects />} />
            <Route path="/about" element={<About />} />
            <Route path="/resume" element={<Resume />} />
            <Route path="/chatBot" element={<ChatBot />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/callback" element={<div style={{ paddingTop: '100px', textAlign: 'center', color: 'white' }}>Authenticating...</div>} />
            <Route path="*" element={<Navigate to="/"/>} />
          </Routes>
          <AIChat />
          <Footer />
        </div>
      </ThemeProvider>
        </PortfolioProvider>
      </Auth0ProviderWithNavigate>
    </Router>
  );
}

export default App;
