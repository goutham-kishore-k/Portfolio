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
            from <span className="purple"> Arlington, TX.</span>
            <br />
            Data Science grad student at UT Arlington with 2.5 years of IT experience, 
            combining analytics expertise with cybersecurity passion. 
             
            
            <br />
            I excel at implementing end-to-end solutions, 
            from ETL to cloud deployment. Known for my execution focus, collaborative spirit, 
            and enthusiasm for coding.
            <br />
            Seeking to leverage data-driven insights to enhance security postures and 
            drive strategic decisions.
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
