import React, { useState } from "react";
import axios from "axios";

const LogoReplacement = ({ filePath, handleConvert, selectedCoords }) => {
  const [newLogoPath, setNewLogoPath] = useState("");
  const [responseMessage, setResponseMessage] = useState("");

  const handleReplaceLogo = async (e) => {
    e.preventDefault();
    setResponseMessage("Processing logo replacement...");

    if (!selectedCoords || selectedCoords.x === undefined || selectedCoords.y === undefined) {
        setResponseMessage("Click on a shape to set the target position.");
      }

    try {
      const response = await axios.post("https://localhost:7134/api/corel/replace-logo", {
        filePath,
        newLogoPath,
        targetX: selectedCoords.x,
        targetY: selectedCoords.y,
      });

      setResponseMessage(response.data);
      handleConvert();
    } catch (error) {
    
            setResponseMessage(error.response?.data?.message || "Error replacing logo.");
          
          
    }
  };

  return (
    <div className="container p-4">
      <h2 className="text-2xl font-bold mb-4">Replace Logo in CorelDRAW</h2>

      <input
        type="text"
        placeholder="Enter new logo file path"
        value={newLogoPath}
        onChange={(e) => setNewLogoPath(e.target.value)}
        className="border p-2 w-full mb-4"
      />

      <button
        onClick={handleReplaceLogo}
        className="bg-blue-500 text-white p-2 mt-2 rounded"
      >
        Replace Logo
      </button>

      {responseMessage && <p className="mt-4">{responseMessage}</p>}
    </div>
  );
};

export default LogoReplacement;
