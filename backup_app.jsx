import React, { useState } from "react";
import { useEffect } from "react";
import PdfViewer from "./components/PdfViewer";
import axios from "axios";
import CdrEditor from "./components/CdrEditor";
import ColorReplacer from "./components/ColorReplacer";
import TextReplacer from "./components/TextReplacer";
import ShapeMover from "./components/ShapeMover";
import "./App.css";

const App = () => {
  const [pdfUrl, setPdfUrl] = useState(""); // Store PDF file URL
  const [filePath, setFilePath] = useState("F:\\web\\corel-frontend\\public\\main.cdr");
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [responseMessage, setResponseMessage] = useState("");
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const[parameters,setParameters]=useState({Shapename:"" ,Shapetype:"",X:null,Y:null,Shapewidth:null,Shapeheight:null,ShapeText:"",R:null,G:null,B:null});
  // Fetch the PDF file from backend
  const handleConvert = async () => {
    setResponseMessage("Converting to PDF...");

    try {
      const response = await axios.post("https://localhost:7134/api/corel/convert-to-pdf", { filePath, });
      setDimensions({ width: response.data.width, height: response.data.height });
      const fileName = filePath.split("\\").pop().replace(".cdr", ".pdf");
      const pdfUrl = `/${fileName}?t=${new Date().getTime()}`;
      setPdfUrl(pdfUrl);

      setResponseMessage(`PDF generated: ${response.data.PdfPath}`); // Corrected response message
    } catch (error) {
      console.error("Conversion failed:", error);
      setResponseMessage("Conversion failed. Please try again.");
    }
  };

  // Send clicked coordinates to backend to find the shape
  const handleShapeClick = async (coords) => {
    setSelectedCoords(coords);

    try {
      const response = await axios.post("https://localhost:7134/api/corel/get-shape-by-position", {
        filePath,
        x: coords.x,
        y: coords.y,
      });

      
      setResponseMessage(`Shape found: ${JSON.stringify(response.data)}`);
  
      setParameters((prevParams) => ({
        ...prevParams,
        Shapename: response.data.name || "",
        Shapetype: response.data.type || "",
        X: response.data.positionX ?? null,
        Y: response.data.positionY ?? null,
        Shapewidth: response.data.width ?? null,
        Shapeheight: response.data.height ?? null,
        ShapeText: response.data.text || "",
        R: response.data.r ?? null,
        G: response.data.g ?? null,
        B: response.data.b ?? null,
      }));
      if(response.data.text)console.log('The text is :',parameters.ShapeText);     

    } catch (error) {
      console.error("Error finding shape:", error);
      setResponseMessage("Error finding shape. Please try again.");
    }
  };

  return (
    <div>
      <h2>Convert & Click Inside PDF</h2>
      <input
        type="text"
        placeholder="Enter CDR File Path"
        value={filePath}
        onChange={(e) => setFilePath(e.target.value)}
        className="border p-2 w-full mb-4"
      />
      <button onClick={handleConvert}>Convert CDR to PDF</button>

      {pdfUrl && <PdfViewer pdfUrl={pdfUrl} onShapeClick={handleShapeClick}  cdrwidth={(dimensions.width)}
          cdrheight={(dimensions.height)} />}
        <ShapeMover filePath={filePath} selectedCoords={selectedCoords} handleConvert={handleConvert} />
        {responseMessage && (
  <p className="absolute top-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg">
    {responseMessage}
  </p>
)}
      {selectedCoords && <p>Clicked  at: X={selectedCoords.x}, Y={selectedCoords.y}</p>}
      <TextReplacer filePath={filePath} selectedCoords={selectedCoords} handleConvert={handleConvert} parameters={parameters} />

      <ColorReplacer filePath={filePath} selectedCoords={selectedCoords} handleConvert={handleConvert} />
      <CdrEditor filePath={filePath}  handleConvert={handleConvert} selectedCoords={selectedCoords} parameters={parameters}/>


      <p>x={parameters.X} type={parameters.Shapetype} height={parameters.Shapeheight}</p>
    </div>
  );
};

export default App;
