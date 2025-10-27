import React from "react";

const LoadingAnimation = ({ message = "Generating dashboard..." }) => {
  return (
    <div className="loading-animation">
      <div className="loading-dots">
        <div className="dot"></div>
        <div className="dot"></div>
        <div className="dot"></div>
      </div>
      <div className="loading-message">{message}</div>
    </div>
  );
};

export default LoadingAnimation;
