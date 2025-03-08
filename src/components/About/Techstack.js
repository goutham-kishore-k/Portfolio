import React from "react";
import { Col, Row } from "react-bootstrap";
import { FaMicrosoft, FaJira } from "react-icons/fa";
import {
  SiApachenifi,
  SiApachekafka,
  SiSupabase,
  SiKubernetes,
  SiDocker,
  SiJupyter,
  SiAnaconda,
  SiRstudio,
  SiApacheairflow,
  SiDatabricks,
  SiApachehadoop,
} from "react-icons/si";

function Toolstack() {
  return (
    <Row style={{ justifyContent: "center", paddingBottom: "50px" }}>
      {/* Data Science IDEs and Environments */}
      <Col xs={4} md={2} className="tech-icons">
        <SiJupyter />
      </Col>
      <Col xs={4} md={2} className="tech-icons">
        <SiAnaconda />
      </Col>
      <Col xs={4} md={2} className="tech-icons">
        <SiRstudio />
      </Col>

      {/* Data Tools */}
      <Col xs={4} md={2} className="tech-icons">
        <SiApachenifi />
      </Col>
      <Col xs={4} md={2} className="tech-icons">
        <SiApachekafka />
      </Col>
      <Col xs={4} md={2} className="tech-icons">
        <SiSupabase /> {/* Representing Apache Superset */}
      </Col>
      <Col xs={4} md={2} className="tech-icons">
        <SiApacheairflow />
      </Col>
      <Col xs={4} md={2} className="tech-icons">
        <SiDatabricks />
      </Col>
      <Col xs={4} md={2} className="tech-icons">
        <SiApachehadoop />
      </Col>

      {/* DevOps and CI/CD Tools */}
      <Col xs={4} md={2} className="tech-icons">
        <SiKubernetes />
      </Col>
      <Col xs={4} md={2} className="tech-icons">
        <SiDocker />
      </Col>

      {/* Collaboration and Version Control */}
      <Col xs={4} md={2} className="tech-icons">
        <FaJira /> {/* Representing JIRA */}
      </Col>

      {/* Office Tools */}
      <Col xs={4} md={2} className="tech-icons">
        <FaMicrosoft /> {/* Representing Microsoft Office/Excel */}
      </Col>
    </Row>
  );
}

export default Toolstack;
