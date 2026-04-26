import React, { useEffect, useMemo, useRef, useState, useContext } from "react";
import {
  AiOutlineMessage,
  AiOutlineSend,
  AiOutlineRobot,
  AiOutlineClose,
  AiOutlineDownload,
  AiOutlineLink,
  AiOutlineFileText,
} from "react-icons/ai";
import { FiGithub } from "react-icons/fi";
import { PortfolioContext } from "../context/PortfolioContext";
import pdfOnePage from "../Assets/GOUTHAM_RESUME.pdf";
import pdfTwoPage from "../Assets/GOUTHAM_RESUME_2.pdf";

const AIChat = () => {
  const { data, activeProfile } = useContext(PortfolioContext);
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([
    {
      id: "ai-1",
      type: "ai",
      content:
        "Hi, I am Goutham's AI assistant. I can talk through his experience, data engineering projects, skills, and share his resume.",
      suggestions: [
        "Summarize his experience",
        "Show recent projects",
        "What impact has he delivered?",
        "Download 1-page resume",
      ],
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    const openFromEvent = () => setIsOpen(true);
    window.addEventListener("openAIChat", openFromEvent);
    return () => window.removeEventListener("openAIChat", openFromEvent);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    // Start a fresh chat session when profile changes to avoid persona crossover.
    setSessionId(null);
    setMessages([
      {
        id: "ai-1",
        type: "ai",
        content: `Hi, I am ${activeProfile?.name || "Goutham"}'s AI assistant. Ask me about this profile's experience, skills, and projects.`,
        suggestions: [
          "Summarize his experience",
          "Show recent projects",
          "What impact has he delivered?",
          "Download 1-page resume",
        ],
      },
    ]);
  }, [activeProfile?.id]);

  const quickActions = useMemo(
    () => [
      { key: "resume1", label: "1-Page Resume", icon: <AiOutlineDownload /> },
      { key: "resume2", label: "2-Page Resume", icon: <AiOutlineFileText /> },
      { key: "linkedin", label: "LinkedIn", icon: <AiOutlineLink /> },
      { key: "github", label: "GitHub", icon: <FiGithub /> },
    ],
    []
  );

  const handleSend = async (text) => {
    const content = text.trim();
    if (!content || isTyping) return;

    const userMessage = {
      id: `u-${Date.now()}`,
      type: "user",
      content,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

      const apiBase = process.env.NODE_ENV === "development" ? "http://localhost:5000" : "";
      const response = await fetch(`${apiBase}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          message: content,
          activeProfileId: activeProfile?.id || data?.activeProfileId,
          sessionId,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const responseData = await response.json();

      if (!responseData.reply) {
        throw new Error("No reply in response: " + JSON.stringify(responseData));
      }

      if (responseData.sessionId) {
        setSessionId(responseData.sessionId);
      }

      const aiMessage = {
        id: `ai-${Date.now()}`,
        type: "ai",
        content: responseData.reply,
        suggestions: [
          "Tell me more about your experience",
          "Show recent projects",
          "What are your key skills?",
        ],
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage = {
        id: `ai-${Date.now()}`,
        type: "ai",
        content: `Sorry, I encountered an error: ${error.message}. Please try again.`,
        suggestions: [
          "Summarize his experience",
          "Show recent projects",
          "Download 1-page resume",
        ],
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestion = (suggestion) => {
    const lower = suggestion.toLowerCase();
    if (lower.includes("1-page resume")) {
      triggerDownload(pdfOnePage, "Goutham_Kishore_Resume.pdf");
      return;
    }
    if (lower.includes("2-page resume")) {
      triggerDownload(pdfTwoPage, "Goutham_Kishore_Resume_2pg.pdf");
      return;
    }
    if (lower.includes("linkedin")) {
      window.open("https://www.linkedin.com/in/goutham-kishore-k", "_blank");
      return;
    }
    if (lower.includes("github")) {
      window.open("https://github.com/goutham-kishore-k", "_blank");
      return;
    }
    handleSend(suggestion);
  };

  const handleQuickAction = (key) => {
    switch (key) {
      case "resume1":
        triggerDownload(pdfOnePage, "Goutham_Kishore_Resume.pdf");
        break;
      case "resume2":
        triggerDownload(pdfTwoPage, "Goutham_Kishore_Resume_2pg.pdf");
        break;
      case "linkedin":
        window.open("https://www.linkedin.com/in/goutham-kishore-k", "_blank");
        break;
      case "github":
        window.open("https://github.com/goutham-kishore-k", "_blank");
        break;
      default:
        break;
    }
  };

  const triggerDownload = (href, filename) => {
    const link = document.createElement("a");
    link.href = href;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderInlineMarkdown = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={idx}>{part.slice(2, -2)}</strong>;
      }
      return <React.Fragment key={idx}>{part}</React.Fragment>;
    });
  };

  const renderMarkdownLite = (content) => {
    const lines = content.split("\n");

    return lines.map((line, idx) => {
      const trimmed = line.trim();

      if (!trimmed) {
        return <br key={`br-${idx}`} />;
      }

      if (trimmed.startsWith("### ")) {
        return <h3 key={idx}>{renderInlineMarkdown(trimmed.slice(4))}</h3>;
      }

      if (trimmed.startsWith("## ")) {
        return <h2 key={idx}>{renderInlineMarkdown(trimmed.slice(3))}</h2>;
      }

      if (trimmed.startsWith("# ")) {
        return <h1 key={idx}>{renderInlineMarkdown(trimmed.slice(2))}</h1>;
      }

      return <p key={idx}>{renderInlineMarkdown(line)}</p>;
    });
  };

  return (
    <div className="ai-chat-shell">
      <button
        className="ai-chat-toggle"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Open AI chat"
      >
        {isOpen ? <AiOutlineClose size={20} /> : <AiOutlineMessage size={22} />}
      </button>

      {isOpen && (
        <div className="ai-chat-panel">
          <div className="ai-chat-header">
            <div className="ai-chat-title">
              <span className="ai-chat-avatar">
                <AiOutlineRobot />
              </span>
              <div>
                <div className="ai-chat-name">Goutham's AI Assistant</div>
                <div className="ai-chat-status">Online • instant answers</div>
              </div>
            </div>
            <div className="ai-chat-actions">
              {quickActions.map((action) => (
                <button
                  key={action.key}
                  className="ai-chat-action"
                  onClick={() => handleQuickAction(action.key)}
                >
                  {action.icon}
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="ai-chat-messages" ref={scrollRef}>
            {messages.map((msg) => (
              <div key={msg.id} className={`ai-chat-row ${msg.type}`}>
                <div className="ai-chat-bubble">
                  {msg.type === "ai" ? (
                    <div className="ai-chat-markdown">{renderMarkdownLite(msg.content)}</div>
                  ) : (
                    msg.content
                  )}
                </div>
                {msg.type === "ai" && msg.suggestions && (
                  <div className="ai-chat-suggestions">
                    {msg.suggestions.map((s, idx) => (
                      <button
                        key={idx}
                        className="ai-chat-suggestion"
                        onClick={() => handleSuggestion(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="ai-chat-row ai">
                <div className="ai-chat-bubble typing">
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                </div>
              </div>
            )}
          </div>

          <div className="ai-chat-input">
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about experience, projects, or skills"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(inputValue);
                }
              }}
            />
            <button
              className="ai-chat-send"
              onClick={() => handleSend(inputValue)}
              disabled={!inputValue.trim() || isTyping}
            >
              <AiOutlineSend />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIChat;
