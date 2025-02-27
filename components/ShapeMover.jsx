import React, { useState, useEffect } from "react";
import axios from "axios";

const ShapeMover = ({ filePath, selectedCoords, handleConvert }) => {
  const [currentPosition, setCurrentPosition] = useState({ x: 0, y: 0 });
  const [newPosition, setNewPosition] = useState({ x: "", y: "" });
  const [responseMessage, setResponseMessage] = useState("");

  useEffect(() => {
    if (selectedCoords) {
      setCurrentPosition({ x: selectedCoords.x, y: selectedCoords.y });
    }
  }, [selectedCoords]);

  const moveShape = async (dx, dy) => {
    if (!filePath || !selectedCoords) {
      setResponseMessage("Please select a shape first.");
      return;
    }
    console.log(`CurrentX=${currentPosition.x}, currentY=${currentPosition.y}`);
    const updatedX = currentPosition.x + dx;
    const updatedY = currentPosition.y + dy;

    await sendMoveRequest(updatedX, updatedY);
  };

  const moveShapeManually = async () => {
    const updatedX = parseFloat(newPosition.x);
    const updatedY = parseFloat(newPosition.y);

    if (isNaN(updatedX) || isNaN(updatedY)) {
      setResponseMessage("Please enter valid numerical values.");
      return;
    }

    await sendMoveRequest(updatedX, updatedY);
  };

  const sendMoveRequest = async (updatedX, updatedY) => {
    try {
      const response = await axios.post("https://localhost:7134/api/corel/move-shape", {
        filePath,
        currentX: currentPosition.x,
        currentY: currentPosition.y,
        newX: updatedX,
        newY: updatedY,
      });
      setCurrentPosition({ x: updatedX, y: updatedY });
      setResponseMessage(response.data);
      handleConvert(); // Refresh PDF after moving shape
    } catch (error) {
      console.error("Error moving shape:", error);
      setResponseMessage("Failed to move shape. Please try again.");
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3>Move Shape</h3>
      <p>Current Position: X={currentPosition.x}, Y={currentPosition.y}</p>
      <div className="flex flex-col items-center gap-2">
        <button onClick={() => moveShape(0, +1)} className="p-2 bg-gray-300 rounded">⬆️</button>
        <div className="flex gap-2">
          <button onClick={() => moveShape(-1, 0)} className="p-2 bg-gray-300 rounded">⬅️</button>
          <button onClick={() => moveShape(1, 0)} className="p-2 bg-gray-300 rounded">➡️</button>
        </div>
        <button onClick={() => moveShape(0, -1)} className="p-2 bg-gray-300 rounded">⬇️</button>
      </div>

      <div className="mt-4">
        <h4>Move to Specific Coordinates</h4>
        <input
          type="text"
          placeholder="New X"
          value={newPosition.x}
          onChange={(e) => setNewPosition({ ...newPosition, x: e.target.value })}
          className="p-2 border rounded mr-2"
        />
        <input
          type="text"
          placeholder="New Y"
          value={newPosition.y}
          onChange={(e) => setNewPosition({ ...newPosition, y: e.target.value })}
          className="p-2 border rounded"
        />
        <button onClick={moveShapeManually} className="p-2 bg-blue-500 text-white rounded ml-2">Move</button>
      </div>

      {responseMessage && <p className="mt-2 text-sm text-gray-600">{responseMessage}</p>}
    </div>
  );
};

export default ShapeMover;
