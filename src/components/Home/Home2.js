import React, { useContext } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { PortfolioContext } from "../../context/PortfolioContext";
import myImg from "../../Assets/avatar.png";
import Tilt from "react-parallax-tilt";
import {
  AiFillGithub,
//  AiOutlineTwitter,
  AiFillInstagram,
} from "react-icons/ai";
import { FaLinkedinIn } from "react-icons/fa";

const DEFAULT_KEYWORDS = [
  "Data Engineering",
  "Python",
  "SQL",
  "Scala",
  "Java",
  "Apache NiFi",
  "Kafka",
  "ETL",
  "ELT",
  "Oracle",
  "PostgreSQL",
  "Tableau",
  "Power BI",
  "Apache Superset",
  "ML",
  "Analytics",
  "AWS",
];

const stripHtml = (value = "") => value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

const highlightKeywords = (text, keywords) => {
  const uniqueKeywords = [...new Set(keywords.filter(Boolean))].sort((a, b) => b.length - a.length);
  if (!text || uniqueKeywords.length === 0) return text;

  const keywordLookup = new Set(uniqueKeywords.map((keyword) => keyword.toLowerCase()));
  const escapedKeywords = uniqueKeywords.map((keyword) => keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex = new RegExp(`(${escapedKeywords.join("|")})`, "gi");

  return text.split(regex).map((segment, index) => {
    if (keywordLookup.has(segment.toLowerCase())) {
      return (
        <span key={`${segment}-${index}`} className="purple" style={{ fontWeight: 700 }}>
          {segment}
        </span>
      );
    }
    return segment;
  });
};

function Home2() {
  const { activeProfile } = useContext(PortfolioContext);
  const introBio = activeProfile?.experienceBio?.trim();
  const projects = activeProfile?.projects || [];
  const summaryText = introBio
    ? stripHtml(introBio)
    : "I love transforming raw data into actionable insights. I build production-grade pipelines, ETL/ELT workflows, and analytics solutions that turn data into decisions.";
  // Create a short version (max 200 chars) for the home page
  const shortSummary = summaryText.length > 200 ? `${summaryText.slice(0, 200).trim()}...` : summaryText;
  const highlightedSummary = highlightKeywords(shortSummary, [
    ...DEFAULT_KEYWORDS,
    ...(activeProfile?.roles || []),
  ]);

  return (
    <Container fluid className="home-about-section" id="about">
      <Container>
        <Row>
          <Col md={8} className="home-about-description">
            <h1 style={{ fontSize: "2.6em" }}>
              LET ME <span className="purple"> INTRODUCE </span> MYSELF
            </h1>
            <p className="home-about-body" style={{ lineHeight: 1.8 }}>
              {highlightedSummary}
            </p>
            {/* <p className="home-about-body" style={{ marginTop: "18px", opacity: 0.95 }}>
              Focus areas: <b className="purple">{(activeProfile?.roles || ["Data Engineer"]).join(" · ")}</b>
            </p> */}
          </Col>
          <Col md={4} className="myAvtar">
            <Tilt>
              <img
                src={activeProfile?.avatarUrl || myImg}
                className="img-fluid"
                alt="avatar"
                style={activeProfile?.avatarUrl ? { maxHeight: "400px", borderRadius: "50%", marginTop: "-40px" } : { marginTop: "-88px" }}
              />
            </Tilt>
          </Col>
        </Row>
        <Row className="mb-5">
        <Col md={10} className="home-about-description">
          {/* <p className="home-about-body">
            Curious to learn more about me and the tools I've worked with? Check out my <a href="/about" className="purple">About</a> page.
            <br />
            Want to explore what I'm currently working on? Visit my <a href="/project" className="purple">Projects</a>.
            <br />
            Looking for my professional details? Download my <a href="/resume" className="purple">Resume</a>.
          </p> */}
        </Col>
        </Row>

        {projects.length > 0 && (
          <Row className="mb-5">
            <Col md={12} className="home-about-description">
              <h2 style={{ fontSize: "2.1em", marginBottom: "20px" }}>
                Featured <span className="purple">Projects</span>
              </h2>
              <div className="d-flex flex-column gap-3">
                {projects.slice(0, 3).map((project, index) => (
                  <div
                    key={project.title || index}
                    style={{
                      padding: "18px 22px",
                      borderRadius: "16px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <h4 style={{ color: "white", marginBottom: "8px" }}>{project.title}</h4>
                    <p style={{ color: "#c9d1d9", marginBottom: 0, textAlign: "justify" }}>
                      {project.description}
                    </p>
                  </div>
                ))}
              </div>
            </Col>
          </Row>
        )}

        <Row>
          <Col md={12} className="home-about-social">
            <h1>FIND ME ON</h1>
            <p>
              Feel free to <span className="purple">connect </span>with me
            </p>
            <ul className="home-about-social-links">
              <li className="social-icons">
                <a
                  href="https://github.com/goutham-kishore-k"
                  target="_blank"
                  rel="noreferrer"
                  className="icon-colour  home-social-icons"
                >
                  <AiFillGithub />
                </a>
              </li>
              <li className="social-icons">
                <a
                  href="https://www.linkedin.com/in/goutham-kishore-k"
                  target="_blank"
                  rel="noreferrer"
                  className="icon-colour  home-social-icons"
                >
                  <FaLinkedinIn />
                </a>
              </li>
              <li className="social-icons">
                <a
                  href="https://www.instagram.com/gouthamkishore/"
                  target="_blank"
                  rel="noreferrer"
                  className="icon-colour home-social-icons"
                >
                  <AiFillInstagram />
                </a>
              </li>
            </ul>
          </Col>
        </Row>
      </Container>
    </Container>
  );
}
export default Home2;
