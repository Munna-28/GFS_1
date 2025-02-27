import React, { useState } from "react";
import LogoReplacement from "./LogoReplacement"; // Import it at the top
import axios from "axios";

const CdrEditor = ({filePath, handleConvert,selectedCoords,parameters}) => {
  // const [filePath, setFilePath] = useState("");
  const [searchText, setSearchText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [responseMessage, setResponseMessage] = useState("");
  const [shapes, setShapes] = useState([]);
 
  // State for color replacementconst [selectedCoords, setSelectedCoords] = useState(null);
  const [resizeData, setResizeData] = useState({ newWidth: 2, newHeight: 2 });

  const [existingColor, setExistingColor] = useState({ r: 0, g: 0, b: 0 });
  const [newColor, setNewColor] = useState({ r: 0, g: 0, b: 0 });


  //Shape Details
  const handleFetchShapes = async () => {
    setResponseMessage("Fetching shape details...");

    try {
      const response = await axios.post("https://localhost:7134/api/corel/get-shapes", { filePath });
      
      // Ensure the response is an array before updating state
      if (Array.isArray(response.data)) {
        setShapes(response.data);
      } else {
        setShapes([]);
        setResponseMessage("No shapes found in the file.");
      }
    } catch (error) {
      setResponseMessage(error.response?.data || "Error fetching shapes.");
    }
  };
  const handleReplaceText = async (e) => {
    e.preventDefault();
    setResponseMessage("Processing text replacement...");

    try {
      const response = await axios.post("https://localhost:7134/api/corel/replace-text", {
        filePath,
        searchText,
        replaceText,
      });

      setResponseMessage(response.data); // Show success message
      handleConvert();
    } catch (error) {
      setResponseMessage(error.response?.data || "Error replacing text.");
    }

  };

  const handleReplaceColor = async (e) => {
    e.preventDefault();
    setResponseMessage("Processing color replacement...");

    try {
      const response = await axios.post("https://localhost:7134/api/corel/replace-color", {
        filePath,
        existingFillR: existingColor.r,
        existingFillG: existingColor.g,
        existingFillB: existingColor.b,
        newFillR: newColor.r,
        newFillG: newColor.g,
        newFillB: newColor.b,
      });

      setResponseMessage(response.data); // Show success message
      handleConvert();
    } catch (error) {
      setResponseMessage(error.response?.data || "Error replacing color.");
    }
  };

  const handleResize = async (e) => {
    e.preventDefault();

    setResponseMessage("Processing  resizing...");
    if (!selectedCoords) {
    setResponseMessage("Click a shape first!");
    return;
  }


    try {

      const response= await axios.post("https://localhost:7134/api/corel/resize-shape", {
        filePath,
        x: selectedCoords.x,
        y: selectedCoords.y,
        newWidth: resizeData.newWidth,
        newHeight: resizeData.newHeight,
      });

      setResponseMessage(response.data);
      handleConvert();
 
    } catch (error) {
      setResponseMessage(error.response?.data || "Error resizing shape.");
    }
  };
  const handleDelete = async (e) => {
    e.preventDefault();
  
    setResponseMessage("Processing deletion...");
    
    if (!selectedCoords) {
      setResponseMessage("Click a shape first!");
      return;
    }
  
    try {
      const response = await axios.post("https://localhost:7134/api/corel/delete-shape", {
        filePath,
        x: selectedCoords.x,
        y: selectedCoords.y,
      });
  
      setResponseMessage(response.data);
      handleConvert();
  
    } catch (error) {
      setResponseMessage(error.response?.data || "Error deleting shape.");
    }
  };
  


  return (
    <div className="container p-4">
      <h2 className="text-2xl font-bold mb-4">Replace Text & Color in CorelDRAW</h2>



{/* Fetch Shapes Button */}
<button onClick={handleFetchShapes} className="bg-blue-500 text-white p-2 mt-2 rounded">
        Get Shape Details
      </button>
      <LogoReplacement filePath={filePath} handleConvert={handleConvert} selectedCoords={selectedCoords} />

      {/* Text Replacement */}
      <div className="mb-4">
        <h3 className="font-bold">Replace Text</h3>
        <input
          type="text"
          placeholder="Search Text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          required
          className="border p-2 w-full"
        />
        <input
          type="text"
          placeholder="Replace With"
          value={replaceText}
          onChange={(e) => setReplaceText(e.target.value)}
          required
          className="border p-2 w-full mt-2"
        />
        <button onClick={handleReplaceText} className="bg-blue-500 text-white p-2 mt-2 rounded">
          Replace Text
        </button>
      </div>

      {/* Color Replacement */}
      <div className="mb-4">
        <h3 className="font-bold">Replace Fill Color</h3>
        <div className="flex space-x-2">
          {["r", "g", "b"].map((color) => (
            <input
              key={color}
              type="number"
              min="0"
              max="255"
              value={existingColor[color]}
              onChange={(e) => setExistingColor({ ...existingColor, [color]: parseInt(e.target.value) })}
              className="border p-2 w-20"
              placeholder={`${color.toUpperCase()} (Old)`}
            />
          ))}
        </div>
        <div className="flex space-x-2 mt-2">
          {["r", "g", "b"].map((color) => (
            <input
              key={color}
              type="number"
              min="0"
              max="255"
              value={newColor[color]}
              onChange={(e) => setNewColor({ ...newColor, [color]: parseInt(e.target.value) })}
              className="border p-2 w-20"
              placeholder={`${color.toUpperCase()} (New)`}
            />
          ))}
        </div>
        <button onClick={handleReplaceColor} className="bg-green-500 text-white p-2 mt-2 rounded">
          Replace Color
        </button>
      </div>

      {/* Display Shapes */}
      {shapes.length > 0 && (
        <div className="mt-4">
          <h3 className="font-bold">Shape Details</h3>
          <ul className="border p-2 rounded">
            {shapes.map((shape, index) => (
              <li key={index} className="p-2 border-b">
                <p><strong>Name:</strong> {shape.Name || "Unnamed"}</p>
                <p><strong>Type:</strong> {shape.Type}</p>
                <p><strong>Position:</strong> X: {shape.PositionX}, Y: {shape.PositionY}</p>
                {shape.FillColor ? (
                  <p><strong>Fill Color:</strong> RGB({shape.FillColor.R}, {shape.FillColor.G}, {shape.FillColor.B})</p>
                ) : (
                  <p><strong>Fill Color:</strong> No Fill</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      <h3>Resize Shape</h3>
      <input
        type="number"
        placeholder="New Width"
        value={resizeData.newWidth}
        onChange={(e) => setResizeData({ ...resizeData, newWidth: parseFloat(e.target.value) })}
      />
      <input
        type="number"
        placeholder="New Height"
        value={resizeData.newHeight}
        onChange={(e) => setResizeData({ ...resizeData, newHeight: parseFloat(e.target.value) })}
      />
      <button onClick={handleResize}>Resize</button>

<div>
      <button onClick={handleDelete}>Delete Shape</button>
      </div>
  
  
      {/* Response Message */}
      {responseMessage && <p className="mt-4">{responseMessage}</p>}
    </div>
  );
};

export default CdrEditor;
