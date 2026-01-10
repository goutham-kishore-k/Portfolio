import React from "react";
import Card from "react-bootstrap/Card";
import { ImPointRight } from "react-icons/im";

function AboutCard() {
  return (
    <Card className="quote-card-view">
      <Card.Body>
        <blockquote className="blockquote mb-0">
          <p style={{ textAlign: "justify" }}>
            Hi Everyone, I am <span className="purple">Goutham Kishore Krishnamoorthy </span>
            from <span className="purple"> Dallas, TX.</span>
            <br />
            I'm a <span className="purple">Data Engineer</span> with 4+ years of experience designing, building, 
            and maintaining production-grade data pipelines, ETL/ELT workflows, and business intelligence solutions. 
            Recently completed my <span className="purple"> Master's in Data Science from UT Arlington</span> (GPA: 3.8/4.0).
            <br />
            <br />
            With experience at <span className="purple">Compass Group USA</span> and <span className="purple">CGI</span>, 
            I specialize in Apache NiFi, SQL (Oracle, PostgreSQL), Python, and cloud platforms. I've delivered 
            measurable impact including 15% reduction in stockouts through demand forecasting and 40% reduction 
            in manual processing through pipeline automation.
            <br />
            <br />
            I'm passionate about translating complex business requirements into analytics-ready datasets, 
            supporting ML initiatives, and delivering data-driven insights that enable strategic decision-making.
            <br />
            <br />
            other interests 😋:
          </p>
          <ul>
            <li className="about-activity">
              <ImPointRight /> Playing Outdoor Games
            </li>
            <li className="about-activity">
              <ImPointRight />TO-DO: Writing Tech Blogs
            </li>
            <li className="about-activity">
              <ImPointRight /> Travelling
            </li>
          </ul>

          <p style={{ color: "rgb(155 126 172)" }}>
            "It is always IMpossible until it's DONE!"{" "}
          </p>
          <footer className="blockquote-footer">Goutham</footer>
        </blockquote>
      </Card.Body>
    </Card>
  );
}

export default AboutCard;
