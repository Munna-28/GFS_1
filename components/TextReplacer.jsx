import React, { useState, useEffect } from "react";
import axios from "axios";

const TextReplacer = ({ filePath, selectedCoords, handleConvert, parameters }) => {
  const [newText, setNewText] = useState(parameters.ShapeText || "");
  const [responseMessage, setResponseMessage] = useState("");

 // Update the text field when parameters.ShapeText changes
//   useEffect(() => {
//     setNewText(parameters.ShapeText || "");
//   }, [parameters.ShapeText]);

  const handleTextChange = async () => {
    if (!filePath || !selectedCoords) {
      setResponseMessage("Please select a shape first.");
      return;
    }

    try {
      await axios.post("https://localhost:7134/api/corel/replace-text-by-position", {
        filePath,
        x: selectedCoords.x,
        y: selectedCoords.y,
        replaceText: newText,
      });
      setResponseMessage("Text replaced successfully.");
      handleConvert(); // Refresh PDF after text change
    } catch (error) {
      console.error("Error replacing text:", error);
      setResponseMessage("Failed to replace text. Please try again.");
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3>Replace Text by Position</h3>
      <input
        type="text"
        value={newText}
        onChange={(e) => setNewText(e.target.value)}
        className="p-2 border rounded w-full"
      />
      <button onClick={handleTextChange} className="mt-2 p-2 bg-blue-500 text-white rounded">
        Apply Text
      </button>
      {responseMessage && <p className="mt-2 text-sm text-gray-600">{responseMessage}</p>}
    </div>
  );
};

export default TextReplacer;
