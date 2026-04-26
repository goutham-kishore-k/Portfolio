import React, { useState, useContext } from "react";
import Navbar from "react-bootstrap/Navbar";
import Nav from "react-bootstrap/Nav";
import Container from "react-bootstrap/Container";
import { PortfolioContext } from "../context/PortfolioContext";
import logo from "../Assets/logo.png";
//import Button from "react-bootstrap/Button";
import { Link } from "react-router-dom";
//import { CgGitFork } from "react-icons/cg";
//import { ImBlog } from "react-icons/im";
import {
  AiOutlineHome,
  AiOutlineFundProjectionScreen,
  AiOutlineUser,
} from "react-icons/ai";

import { BsSun, BsMoon } from "react-icons/bs";

import { CgFileDocument } from "react-icons/cg";

function NavBar({ theme = "dark", onToggleTheme }) {
  const [expand, updateExpanded] = useState(false);
  const [navColour, updateNavbar] = useState(false);
  const { data } = useContext(PortfolioContext);
  const isLight = theme === "light";

  React.useEffect(() => {
    function scrollHandler() {
      if (window.scrollY >= 20) {
        updateNavbar(true);
      } else {
        updateNavbar(false);
      }
    }

    window.addEventListener("scroll", scrollHandler);
    return () => window.removeEventListener("scroll", scrollHandler);
  }, []);

  return (
    <Navbar
      expanded={expand}
      fixed="top"
      expand="md"
      className={navColour ? "sticky" : "navbar"}
    >
      <Container>
        <Navbar.Brand href="/" className="d-flex">
          <img src={logo} className="img-fluid logo" alt="brand" />
        </Navbar.Brand>
        <Navbar.Toggle
          aria-controls="responsive-navbar-nav"
          onClick={() => {
            updateExpanded(expand ? false : "expanded");
          }}
        >
          <span></span>
          <span></span>
          <span></span>
        </Navbar.Toggle>
        <Navbar.Collapse id="responsive-navbar-nav">
          <Nav className="ms-auto" defaultActiveKey="#home">
            {data?.menuVisibility?.Home !== false && (
              <Nav.Item>
                <Nav.Link as={Link} to="/" onClick={() => updateExpanded(false)}>
                  <AiOutlineHome style={{ marginBottom: "2px" }} /> Home
                </Nav.Link>
              </Nav.Item>
            )}

            {data?.menuVisibility?.About !== false && (
              <Nav.Item>
                <Nav.Link as={Link} to="/about" onClick={() => updateExpanded(false)}>
                  <AiOutlineUser style={{ marginBottom: "2px" }} /> About
                </Nav.Link>
              </Nav.Item>
            )}

            {data?.menuVisibility?.Projects !== false && (
              <Nav.Item>
                <Nav.Link as={Link} to="/project" onClick={() => updateExpanded(false)}>
                  <AiOutlineFundProjectionScreen style={{ marginBottom: "2px" }} />{" "}
                  Projects
                </Nav.Link>
              </Nav.Item>
            )}

            {data?.menuVisibility?.Resume !== false && (
              <Nav.Item>
                <Nav.Link as={Link} to="/resume" onClick={() => updateExpanded(false)}>
                  <CgFileDocument style={{ marginBottom: "2px" }} /> Resume
                </Nav.Link>
              </Nav.Item>
            )}
            
            {/* Added an Admin Link visible only when logged in or just unconditionally as a small link, or hide it. 
                Usually admin dashboards are accessed by directly going to /admin. We'll leave it out of main nav for public viewers. */}
          </Nav>
          <div className="theme-toggle-container">
            <button
              type="button"
              className="theme-toggle-btn"
              onClick={() => {
                onToggleTheme?.();
                updateExpanded(false);
              }}
              aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
            >
              {isLight ? <BsMoon /> : <BsSun />}
              <span className="theme-toggle-label">{isLight ? "Dark" : "Light"}</span>
            </button>
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavBar;
