import React, { useState, useEffect, useContext } from "react";
import { PortfolioContext } from "../../context/PortfolioContext";
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
  const [numPages, setNumPages] = useState(null);
  const isMobile = width <= 786;

  const { activeProfile } = useContext(PortfolioContext);

  useEffect(() => {
    setWidth(window.innerWidth);
  }, []);

  const currentPdf = activeProfile?.resumeUrl || (isTwoPage ? pdfTwoPage : pdfOnePage);
  const singlePageWidth = Math.min(width - 40, 900); // gutter so text isn't clipped
  const twoPageWidth = Math.min(width - 40, isMobile ? 520 : 600);

  const handleDocumentLoadSuccess = ({ numPages: totalPages }) => {
    setNumPages(totalPages);
  };

  const pagesToRender = activeProfile?.resumeUrl
    ? Array.from({ length: numPages || 1 }, (_, index) => index + 1)
    : isTwoPage
      ? [1, 2]
      : [1];

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
          <div className="resume-toggle-container">
            {!activeProfile?.resumeUrl && (
              <>
                <span className="resume-toggle-label">1-Page</span>
                <input
                  type="checkbox"
                  id="resume-toggle"
                  className="resume-toggle-switch"
                  checked={isTwoPage}
                  onChange={() => setIsTwoPage((prev) => !prev)}
                />
                <label htmlFor="resume-toggle" className="resume-toggle-slider"></label>
                <span className="resume-toggle-label">2-Page</span>
              </>
            )}
          </div>
        </Row>

        <Row className="resume">
          <Document file={currentPdf} onLoadSuccess={handleDocumentLoadSuccess} className="d-flex justify-content-center">
            <div
              style={{
                display: "flex",
                gap: "16px",
                justifyContent: "center",
                flexDirection: activeProfile?.resumeUrl ? "column" : isMobile ? "column" : "row",
                alignItems: "center",
                padding: "12px",
                flexWrap: "wrap",
              }}
            >
              {pagesToRender.map((pageNumber) => (
                <Page
                  key={pageNumber}
                  pageNumber={pageNumber}
                  width={activeProfile?.resumeUrl ? singlePageWidth : isTwoPage ? twoPageWidth : singlePageWidth}
                />
              ))}
            </div>
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
