import React from "react";
import Typewriter from "typewriter-effect";

function Type() {
  return (
    <Typewriter
      options={{
        strings: [
          "Data Scientist",
          "ETL Developer",
          "Python Developer",
          "Machine Learning Engineer",
          "ETL Pipeline Builder",
        ],    
        autoStart: true,
        loop: true,
        deleteSpeed: 50,
      }}
    />
  );
}

export default Type;
