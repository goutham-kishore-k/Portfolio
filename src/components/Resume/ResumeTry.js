import React, { useState, useEffect } from "react";
import { Container, Row, Col } from "react-bootstrap";
import Button from "react-bootstrap/Button";
import Particle from "../Particle";
import pdf from "../../Assets/GOUTHAM_RESUME.pdf";
import { AiOutlineDownload } from "react-icons/ai";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import Latex from "react-latex-next";
import 'katex/dist/katex.min.css';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

function ResumeTry() {
  const [width, setWidth] = useState(1200);
  const [numPages, setNumPages] = useState(null);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  const latexContent = `
    \\section{Summary}
    Results-oriented Data Science Master's student with 2.5 years of IT experience specializing in data analysis, ETL processes, and cloud technologies. Demonstrated expertise in developing and implementing business technology solutions with a focus on data-driven decision-making. Strong background in analytics, problem-solving, and technical leadership.

    \\section{Education}
    2024 - present: Master's in Data Science at \\textbf{University of Texas at Arlington} (GPA: 3.83/4.0)
    Relevant Coursework: Business Intelligence, Data Mining, Predictive Modeling, Machine Learning, Data Visualization, Big Data Analytics, Probability & Statistics, BioInformatics, Pattern Recognition, Operations Research

    2017 - 2021: B.Tech in Computer Science Engineering at \\textbf{Vel Tech High Tech} (Affiliated to Anna University) (GPA: 7.7/10.0)

    \\section{Work Experience}
    \\textbf{Software Engineer, CGI} (Oct 2021 - Nov 2022)
    \\begin{itemize}
      \\item Developed ETL system and data mart for BI reporting.
      \\item Worked on cloud deployment, CI/CD pipelines, and DevOps tasks.
      \\item Mentored team members and resolved technical issues.
      \\item Implemented user security and customized NiFi and Superset applications.
    \\end{itemize}

    \\section{Projects}
    \\textbf{Credit Collections Product, CGI}
    Developed a comprehensive ETL system to streamline data processing for business intelligence reporting, significantly improving data accuracy and report generation speed.

    \\section{Training and Certifications}
    \\textbf{Scala Certification} - Coursera
    \\textbf{PySpark Essentials} - Udemy

    \\section{Skills}
    \\textbf{Data Ingestion/ETL Tools:} Apache NiFi
    \\textbf{BI Reporting Tools:} Apache Superset
    \\textbf{Databases:} MongoDB (NoSQL), PostgreSQL, Oracle
    \\textbf{Data Streaming:} Apache Kafka/Confluent Kafka
    \\textbf{DevOps Tools:} Kubernetes, Docker, Helm chart
    \\textbf{CI/CD Tools:} Concourse
    \\textbf{Frameworks:} AngularJS, Spring Boot
    \\textbf{Office Tools:} Microsoft Excel, Microsoft Office Tools
    \\textbf{Collaboration Tools:} JIRA
    \\textbf{Version Control:} GIT
    \\textbf{Programming Languages:} Scala, Python, Java, SQL
    \\textbf{Web Technologies:} HTML, CSS, JavaScript, Bootstrap
  `;

  return (
    <div>
      <Container fluid className="resume-section">
        <Particle />
        <Row style={{ justifyContent: "center", position: "relative" }}>
          <Button
            variant="primary"
            href={pdf}
            target="_blank"
            style={{ maxWidth: "250px" }}
          >
            <AiOutlineDownload />
            &nbsp;Download CV
          </Button>
        </Row>

        <Row className="resume">
          <Col md={6}>
            <Document 
              file={pdf} 
              className="d-flex justify-content-center"
              onLoadSuccess={onDocumentLoadSuccess}
            >
              {Array.from(new Array(numPages), (el, index) => (
                <Page 
                  key={`page_${index + 1}`}
                  pageNumber={index + 1} 
                  scale={width > 786 ? 1.7 : 0.6}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              ))}
            </Document>
          </Col>
          <Col md={6}>
            <div className="latex-content">
              <Latex>{latexContent}</Latex>
            </div>
          </Col>
        </Row>

        <Row style={{ justifyContent: "center", position: "relative" }}>
          <Button
            variant="primary"
            href={pdf}
            target="_blank"
            style={{ maxWidth: "250px" }}
          >
            <AiOutlineDownload />
            &nbsp;Download CV
          </Button>
        </Row>
      </Container>
    </div>
  );
}

export default ResumeTry;
