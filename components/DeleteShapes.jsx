import React, { useState } from "react";
import axios from "axios";

const DeleteShapes = ({ filePath, handleConvert, selectionBox }) => {
  const [responseMessage, setResponseMessage] = useState("");

  const handleDelete = async () => {
    if (!selectionBox) {
      setResponseMessage("No selection box drawn.");
      return;
    }

    try {
      const response = await axios.post("https://localhost:7134/api/corel/delete-shapes-in-box", {
        filePath,
        x: selectionBox.x,
        y: selectionBox.y,
        width: selectionBox.width,
        height: selectionBox.height,
      });

      setResponseMessage(response.data.message || "Shapes deleted successfully.");
      handleConvert(); // Refresh preview after deletion
    } catch (error) {
      console.error("Error deleting shapes:", error);
      setResponseMessage("Failed to delete shapes.");
    }
  };

  return (
    <div className="delete-section">
      <h3>Delete Shapes</h3>
      <button onClick={handleDelete} disabled={!selectionBox}>
        Delete in Selected Area
      </button>
      {responseMessage && <p>{responseMessage}</p>}
    </div>
  );
};

export default DeleteShapes;
