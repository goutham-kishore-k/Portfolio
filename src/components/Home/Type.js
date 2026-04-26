import React, { useContext } from "react";
import Typewriter from "typewriter-effect";
import { PortfolioContext } from "../../context/PortfolioContext";

function Type() {
  const { activeProfile } = useContext(PortfolioContext);
  const roles = activeProfile?.roles?.length ? activeProfile.roles : [
    "Data Scientist",
    "ETL Developer",
    "Python Developer",
    "Machine Learning Engineer",
    "ETL Pipeline Builder",
  ];

  return (
    <Typewriter
      options={{
        strings: roles,
        autoStart: true,
        loop: true,
        deleteSpeed: 50,
      }}
    />
  );
}

export default Type;
