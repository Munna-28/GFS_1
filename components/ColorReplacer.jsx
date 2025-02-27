import React, { useState } from "react";
import axios from "axios";

const ColorReplacer = ({ filePath, selectedCoords, handleConvert }) => {
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [responseMessage, setResponseMessage] = useState("");

  // Convert hex to RGB
  const hexToRgb = (hex) => {
    let r = parseInt(hex.substring(1, 3), 16);
    let g = parseInt(hex.substring(3, 5), 16);
    let b = parseInt(hex.substring(5, 7), 16);
    return { r, g, b };
  };

  const handleColorChange = async () => {
    setResponseMessage("Color change processing...");
    if (!filePath || !selectedCoords) {
      setResponseMessage("Please select a shape first.");
      return;
    }

    const { r, g, b } = hexToRgb(selectedColor);

    try {
      const response = await axios.post("https://localhost:7134/api/corel/replace-color-by-position", {
        filePath,
        x: selectedCoords.x,
        y: selectedCoords.y,
        newFillR :r,
        NewFillG :g,
        NewFillB:b,
      });
      setResponseMessage("Color replaced successfully.");
      handleConvert(); // Refresh PDF after color change
    } catch (error) {
      console.error("Error replacing color:", error);
      setResponseMessage("Failed to replace color. Please try again.");
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3>Replace Color by Position</h3>
      <input
        type="color"
        value={selectedColor}
        onChange={(e) => setSelectedColor(e.target.value)}
        className="w-16 h-10 cursor-pointer"
      />
      <button onClick={handleColorChange} className="ml-4 p-2 bg-blue-500 text-white rounded">
        Apply Color
      </button>
      {responseMessage && <p className="mt-2 text-sm text-gray-600">{responseMessage}</p>}
    </div>
  );
};

export default ColorReplacer;
