import React, { useState, useEffect } from "react";
import { Container, Row } from "react-bootstrap";
import Button from "react-bootstrap/Button";
import Particle from "../Particle";
import pdfOnePage from "../../Assets/GOUTHAM_RESUME.pdf";
import pdfTwoPage from "../../Assets/GOUTHAM_RESUME_2.pdf";
import { AiOutlineDownload } from "react-icons/ai";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

function ResumeNew() {
  const [width, setWidth] = useState(1200);
  const [isTwoPage, setIsTwoPage] = useState(false);
  const isMobile = width <= 786;

  useEffect(() => {
    setWidth(window.innerWidth);
  }, []);

  const currentPdf = isTwoPage ? pdfTwoPage : pdfOnePage;
  const singlePageWidth = Math.min(width - 40, 900); // gutter so text isn't clipped
  const twoPageWidth = Math.min(width - 40, isMobile ? 520 : 600);

  return (
    <div>
      <Container fluid className="resume-section">
        <Particle />
        <Row style={{ justifyContent: "center", position: "relative", gap: "12px" }}>
          <Button
            variant="primary"
            href={currentPdf}
            target="_blank"
            style={{ maxWidth: "250px" }}
          >
            <AiOutlineDownload />
            &nbsp;Download CV
          </Button>
          <Button
            variant="outline-danger"
            onClick={() => setIsTwoPage((prev) => !prev)}
            style={{ maxWidth: "250px" }}
          >
            {isTwoPage ? "1-Page Resume" : "2-Page Resume"}
          </Button>
        </Row>

        <Row className="resume">
          <Document file={currentPdf} className="d-flex justify-content-center">
            {isTwoPage ? (
              <div
                style={{
                  display: "flex",
                  gap: "16px",
                  justifyContent: "center",
                  flexDirection: isMobile ? "column" : "row",
                  alignItems: "center",
                  padding: "12px",
                }}
              >
                <Page pageNumber={1} width={twoPageWidth} />
                <Page pageNumber={2} width={twoPageWidth} />
              </div>
            ) : (
              <Page pageNumber={1} width={singlePageWidth} />
            )}
          </Document>
        </Row>

        <Row style={{ justifyContent: "center", position: "relative" }}>
          <Button
            variant="primary"
            href={currentPdf}
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

export default ResumeNew;
