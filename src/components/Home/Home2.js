import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import myImg from "../../Assets/avatar.png";
import Tilt from "react-parallax-tilt";
import {
  AiFillGithub,
//  AiOutlineTwitter,
  AiFillInstagram,
} from "react-icons/ai";
import { FaLinkedinIn } from "react-icons/fa";

function Home2() {
  return (
    <Container fluid className="home-about-section" id="about">
      <Container>
        <Row>
          <Col md={8} className="home-about-description">
            <h1 style={{ fontSize: "2.6em" }}>
              LET ME <span className="purple"> INTRODUCE </span> MYSELF
            </h1>
            <p className="home-about-body">
            I fell in love with Data and have been on an exciting learning journey ever since... 🚀
            <br />
            <br />I am proficient in modern technologies like
            <i>
              <b className="purple"> Python, JavaScript, and SQL </b>
            </i>
            <br />
            <br />
            My fields of interest are developing 
            <i>
              <b className="purple">Data-Driven Applications </b> and
              exploring areas related to{" "}
              <b className="purple">
                Cybersecurity and Cloud Solutions
              </b>
            </i>
            <br />
            <br />
            I'm passionate about creating end-to-end solutions using <b className="purple">ETL pipelines</b> and
            <i>
              <b className="purple">
                {" "}
                Analytics and Visualization tools
              </b>
            </i>
            &nbsp; including
            <i>
              <b className="purple"> Tableau, Power BI, and custom React.js dashboards</b>
            </i>
          </p>
          </Col>
          <Col md={4} className="myAvtar">
            <Tilt>
              <img src={myImg} className="img-fluid" alt="avatar" />
            </Tilt>
          </Col>
        </Row>
        <Row className="mb-5">
          <Col md={12} className="d-flex justify-content-center gap-4">
            Get to know more about me and the tools I worked on<a href="/about" className="purple-link">About</a>
            <br />
            See the i'm working on<a href="/projects" className="purple-link">Projects</a>
            <br />
            Find my Resume here!!!<a href="/resume" className="purple-link">Resume</a>
          </Col>
        </Row>
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
