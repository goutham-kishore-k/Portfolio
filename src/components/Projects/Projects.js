import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import ProjectCard from "./ProjectCards";
import Particle from "../Particle";
import creditCollections from "../../Assets/Projects/creditCollections.png";
import iotCrowdAnalyzer from "../../Assets/Projects/iotCrowdAnalyzer.png";
import Stock from "../../Assets/Projects/stock.png";

function Projects() {
  return (
    <Container fluid className="project-section">
      <Particle />
      <Container>
        <h1 className="project-heading">
          My Recent <strong className="purple">Works </strong>
        </h1>
        <p style={{ color: "white" }}>
          Here are a few projects I've worked on recently.
        </p>

        <h2 className="project-subheading">Work Projects</h2>
        <Row style={{ justifyContent: "center", paddingBottom: "10px" }}>
          <Col md={6} className="project-card">
            <ProjectCard
              imgPath={creditCollections}
              isBlog={false}
              title="Credit Collections Product, CGI"
              description="Developed a comprehensive ETL system to streamline data processing for business intelligence reporting, significantly improving data accuracy and report generation speed."
             // ghLink="https://github.com/yourusername/credit-collections-project"
              // demoLink="https://demo-link-if-available.com/"
            />
          </Col>
        </Row>

        <h2 className="project-subheading">Academic Projects</h2>
        <Row style={{ justifyContent: "center", paddingBottom: "10px" }}>
          <Col md={6} className="project-card">
            <ProjectCard
              imgPath={iotCrowdAnalyzer}
              isBlog={false}
              title="IOT Based Crowd Analyzer Using Raspberry Pi (2021)"
              description="This project utilizes the technique of passive Wi-Fi sensing using Tshark to determine the number of people present at the location where Raspberry Pi is placed. All such Raspberry Pi devices update their estimated crowd at their location to a MySQL database, which is retrieved by a webpage created using Flask to display the live crowd present at various locations to its users."
            //  ghLink="https://github.com/yourusername/iot-crowd-analyzer"
              // demoLink="https://demo-link-if-available.com/"
            />
          </Col>
        </Row>

        <h2 className="project-subheading">Personal Projects</h2>
        <Row style={{ justifyContent: "center", paddingBottom: "10px" }}>
          <Col md={6} className="project-card">
            <ProjectCard
              imgPath={Stock}
              isBlog={false}
              title="Stock Market Prediction/Classification"
              description="This project uses Reddit data and global news to generate sentiment scores, predicting whether a stock's price will rise or fall. It combines machine learning models with pattern recognition to analyze trends and provide informed investment insights."
            //  ghLink="https://github.com/yourusername/iot-crowd-analyzer"
              // demoLink="https://demo-link-if-available.com/"
            />
          </Col>
        </Row>
      </Container>
    </Container>
  );
}

export default Projects;