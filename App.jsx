import React, { useState } from "react";
import { useEffect } from "react";
import PdfViewer from "./components/PdfViewer";
import axios from "axios";
import CdrEditor from "./components/CdrEditor";
import ColorReplacer from "./components/ColorReplacer";
import TextReplacer from "./components/TextReplacer";
import ShapeMover from "./components/ShapeMover";
import LogoReplacement from "./components/LogoReplacement";
import "./App.css";

const App = () => {
  const [pdfUrl, setPdfUrl] = useState("./main.pdf"); // Store PDF file URL
  const [filePath, setFilePath] = useState("F:\\web\\corel-frontend\\public\\main.cdr");
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [responseMessage, setResponseMessage] = useState("");
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const[parameters,setParameters]=useState({Shapename:"" ,Shapetype:"",X:null,Y:null,Shapewidth:null,Shapeheight:null,ShapeText:"",R:null,G:null,B:null});
  const [showTextEdit, setShowTextEdit] = useState(false);
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
    <div className="container">
      <h2> Cdr Editor</h2>
      <div className="Input">
      <input
        type="text"
        placeholder="Enter CDR File Path"
        value={filePath}
        onChange={(e) => setFilePath(e.target.value)}
      />
      <button onClick={handleConvert}>Preview</button>
      </div>
  
      <div className="main-content">
        {/* Left-side tools */}
        <div className="left-tools">
          <div className="text-edit">
            <TextReplacer filePath={filePath} selectedCoords={selectedCoords} handleConvert={handleConvert} parameters={parameters} />
          </div>
          <div className="color-edit">
            <ColorReplacer filePath={filePath} selectedCoords={selectedCoords} handleConvert={handleConvert} />
          </div>
          <div className="shape-move">
            <ShapeMover filePath={filePath} selectedCoords={selectedCoords} handleConvert={handleConvert} />
          </div>
          <div>
          <LogoReplacement filePath={filePath} handleConvert={handleConvert} selectedCoords={selectedCoords} />
          </div>
        </div>
  
        {/* Center PDF Viewer */}
        {pdfUrl && (
          <div className="pdf-container">
            <PdfViewer pdfUrl={pdfUrl} onShapeClick={handleShapeClick} cdrwidth={dimensions.width} cdrheight={dimensions.height} />
          </div>
        )}
  
        {/* Right-side messages */}
        <div className="right-tools">
          {responseMessage && <p className="response-message"> {responseMessage} </p>}
          {selectedCoords && <p className="shape-coordinates">Clicked at: X={selectedCoords.x}, Y={selectedCoords.y}</p>}
          <div className="cdr-editor">
            <CdrEditor filePath={filePath} handleConvert={handleConvert} selectedCoords={selectedCoords} parameters={parameters}/>
          </div>
        </div>
      </div>
  
      {/* <p>x={parameters.X} type={parameters.Shapetype} height={parameters.Shapeheight}</p> */}
    </div>
  );
  
};

export default App;
