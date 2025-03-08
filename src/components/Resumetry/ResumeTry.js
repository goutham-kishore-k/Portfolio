import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import Button from "react-bootstrap/Button";
import Particle from "../Particle";
import { AiOutlineDownload } from "react-icons/ai";
import { Document, Page, Text, View, StyleSheet, PDFViewer, Link, Font } from "@react-pdf/renderer";

// Register custom fonts if needed
Font.register({
  family: 'Roboto',
  src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf'
});

// Create styles for PDF
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Roboto',
    fontSize: 11,
    paddingTop: 30,
    paddingLeft: 60,
    paddingRight: 60,
    paddingBottom: 30,
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 10,
  },
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    marginBottom: 5,
    fontWeight: 'bold',
  },
  text: {
    marginBottom: 5,
  },
  link: {
    color: 'blue',
    textDecoration: 'underline',
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  bullet: {
    width: 10,
  },
  skills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillItem: {
    width: '50%',
    marginBottom: 5,
  },
});

function ResumeTry() {
  // PDF Document component
  const MyDocument = () => (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Goutham Kishore Krishnamoorthy</Text>
        <Text style={styles.subtitle}>
          <Link src="https://linkedin.com/in/goutham-kishore-k" style={styles.link}>LinkedIn</Link> | 
          <Link src="https://github.com/gouthamkishorek" style={styles.link}>GitHub</Link> | 
          <Link src="mailto:gouthamkishore.k@gmail.com" style={styles.link}>gouthamkishore.k@gmail.com</Link> | 
          <Link src="tel:+16823768423" style={styles.link}>+16823768423</Link>
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <Text style={styles.text}>Results-oriented Data Science Master's student with 2.5 years of IT experience specializing in data analysis, ETL processes, and cloud technologies. Demonstrated expertise in developing and implementing business technology solutions with a focus on data-driven decision-making. Strong background in analytics, problem-solving, and technical leadership.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Education</Text>
          <Text style={styles.text}>2024 - present: Master's in Data Science at University of Texas at Arlington (GPA: 3.83/4.0)</Text>
          <Text style={styles.text}>Relevant Coursework: Business Intelligence, Data Mining, Predictive Modeling, Machine Learning, Data Visualization, Big Data Analytics, Probability & Statistics, BioInformatics, Pattern Recognition, Operations Research</Text>
          <Text style={styles.text}>2017 - 2021: B.Tech in Computer Science Engineering at Vel Tech High Tech (Affiliated to Anna University) (GPA: 7.7/10.0)</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Work Experience</Text>
          <Text style={styles.text}>Software Engineer, CGI (Oct 2021 - Nov 2022)</Text>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.text}>Developed ETL system and data mart for BI reporting.</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.text}>Worked on cloud deployment, CI/CD pipelines, and DevOps tasks.</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.text}>Mentored team members and resolved technical issues.</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.text}>Implemented user security and customized NiFi and Superset applications.</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Projects</Text>
          <Text style={styles.text}>Credit Collections Product, CGI</Text>
          <Text style={styles.text}>Developed a comprehensive ETL system to streamline data processing for business intelligence reporting, significantly improving data accuracy and report generation speed.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Training and Certifications</Text>
          <Text style={styles.text}>Scala Certification - Coursera</Text>
          <Text style={styles.text}>PySpark Essentials - Udemy</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skills</Text>
          <View style={styles.skills}>
            <View style={styles.skillItem}>
              <Text style={styles.text}>Data Ingestion/ETL Tools: Apache NiFi</Text>
            </View>
            <View style={styles.skillItem}>
              <Text style={styles.text}>BI Reporting Tools: Apache Superset</Text>
            </View>
            <View style={styles.skillItem}>
              <Text style={styles.text}>Databases: MongoDB, PostgreSQL, Oracle</Text>
            </View>
            <View style={styles.skillItem}>
              <Text style={styles.text}>Data Streaming: Apache Kafka</Text>
            </View>
            <View style={styles.skillItem}>
              <Text style={styles.text}>DevOps Tools: Kubernetes, Docker, Helm</Text>
            </View>
            <View style={styles.skillItem}>
              <Text style={styles.text}>CI/CD Tools: Concourse</Text>
            </View>
            <View style={styles.skillItem}>
              <Text style={styles.text}>Frameworks: AngularJS, Spring Boot</Text>
            </View>
            <View style={styles.skillItem}>
              <Text style={styles.text}>Office Tools: Microsoft Office</Text>
            </View>
            <View style={styles.skillItem}>
              <Text style={styles.text}>Collaboration Tools: JIRA</Text>
            </View>
            <View style={styles.skillItem}>
              <Text style={styles.text}>Version Control: GIT</Text>
            </View>
            <View style={styles.skillItem}>
              <Text style={styles.text}>Programming: Scala, Python, Java, SQL</Text>
            </View>
            <View style={styles.skillItem}>
              <Text style={styles.text}>Web: HTML, CSS, JavaScript, Bootstrap</Text>
            </View>
          </View>
        </View>

        <Text style={[styles.text, { position: 'absolute', bottom: 30, left: 0, right: 0, textAlign: 'center' }]}>
          Last updated: {new Date().toLocaleDateString()}
        </Text>
      </Page>
    </Document>
  );

  return (
    <div>
      <Container fluid className="resume-section">
        <Particle />
        <Row style={{ justifyContent: "center", position: "relative" }}>
          <Button
            variant="primary"
            onClick={() => window.print()}
            style={{ maxWidth: "250px" }}
          >
            <AiOutlineDownload />
            &nbsp;Download CV
          </Button>
        </Row>

        <Row className="resume">
          <Col md={12}>
            <PDFViewer style={{ width: '100%', height: '80vh' }}>
              <MyDocument />
            </PDFViewer>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default ResumeTry;
