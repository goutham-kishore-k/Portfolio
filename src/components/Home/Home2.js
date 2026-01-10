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
            I fell in love with Data Engineering and transforming raw data into actionable insights... 🚀
            <br />
            <br />I am proficient in technologies like
            <i>
              <b className="purple"> Python, SQL, Scala, and Java </b>
            </i>
            <br />
            <br />
            My expertise includes building 
            <i>
              <b className="purple">Production-Grade Data Pipelines </b>
              with{" "}
              <b className="purple">
                Apache NiFi and Kafka, 
              </b>
              engineering{" "}
              <b className="purple">
                ETL/ELT workflows across Oracle & PostgreSQL
              </b>
            </i>
            <br />
            <br />
            I deliver <b className="purple">Business Intelligence Solutions</b> using
            <i>
              <b className="purple">
                {" "}
                Tableau, Power BI, and Apache Superset
              </b>
            </i>
            , with hands-on experience in
            <i>
              <b className="purple"> ML/Analytics (scikit-learn, XGBoost, NLP) and AWS Cloud</b>
            </i>
          </p>
          </Col>
          <Col md={4} className="myAvtar">
            <Tilt>
              <img
                src={myImg}
                className="img-fluid"
                alt="avatar"
                style={{ marginTop: "-68px" }}
              />
            </Tilt>
          </Col>
        </Row>
        <Row className="mb-5">
        <Col md={12} className="home-about-description">
          <p className="home-about-body">
            Curious to learn more about me and the tools I've worked with? Check out my <a href="/about" className="purple">About</a> page.
            <br />
            Want to explore what I'm currently working on? Visit my <a href="/project" className="purple">Projects</a>.
            <br />
            Looking for my professional details? Download my <a href="/resume" className="purple">Resume</a>.
          </p>
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
