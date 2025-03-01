import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = 
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const PDFViewer = ({ pdfUrl, onShapeClick, onSelectionBoxDraw }) => {
  const canvasRef = useRef(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [scale, setScale] = useState(1.0);
  const [pageNum, setPageNum] = useState(1);
  const [originalDimensions, setOriginalDimensions] = useState({ width: 800, height: 600 });
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState(null);
  const [enableSelection, setEnableSelection] = useState(false);
  const [enableClick, setEnableClick] = useState(true);
  const startPoint = useRef(null);

  useEffect(() => {
    const loadPDF = async () => {
      if (!pdfUrl) return;

      try {
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);
        renderPage(pdf, 1, scale);
      } catch (error) {
        console.error("Error loading PDF:", error);
      }
    };

    loadPDF();
  }, [pdfUrl]);

  useEffect(() => {
    if (pdfDoc) {
      renderPage(pdfDoc, pageNum, scale);
    }
  }, [pdfDoc, pageNum, scale]);

  const renderPage = async (pdf, num, scale) => {
    try {
      const page = await pdf.getPage(num);
      const viewport = page.getViewport({ scale: 1 });
  
      setOriginalDimensions({ width: viewport.width, height: viewport.height });
  
      const scaledViewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
  
      // Ensure previous render is cancelled
      if (canvas.renderTask) {
        canvas.renderTask.cancel();
      }
  
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.width = scaledViewport.width;
      canvas.height = scaledViewport.height;
  
      const renderContext = { canvasContext: ctx, viewport: scaledViewport };
      const renderTask = page.render(renderContext);
      
      // Store render task reference to cancel if needed
      canvas.renderTask = renderTask;
  
      await renderTask.promise;
    } catch (error) {
      if (error.name !== "RenderingCancelledException") {
        console.error("Error rendering page:", error);
      }
    }
  };
  

  const drawSelectionBox = () => {
    if (!selectionBox || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    renderPage(pdfDoc, pageNum, scale).then(() => {
      ctx.strokeStyle = "blue";
      ctx.lineWidth = 2;
      ctx.strokeRect(selectionBox.x, selectionBox.y, selectionBox.width, selectionBox.height);
    });
  };

  const handleCanvasClick = (event) => {
    if (!originalDimensions || enableSelection || !enableClick) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    
    const x = (clickX / rect.width) * originalDimensions.width;
    const y = originalDimensions.height - (clickY / rect.height) * originalDimensions.height;
    
    const calX = (x / originalDimensions.width) * 8.26388889;
    const calY = (y / originalDimensions.height) * 11.68055556;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    
    renderPage(pdfDoc, pageNum, scale).then(() => {
      const rectSize = 10 / scale;
      ctx.strokeStyle = "red";
      ctx.lineWidth = 2;
      ctx.strokeRect(clickX - rectSize / 2, clickY - rectSize / 2, rectSize, rectSize);
    });
    
    onShapeClick({ x: calX, y: calY, pagenum: pageNum });
  };

  const handleMouseDown = (event) => {
    if (!enableSelection) return;
    setIsSelecting(true);
    const rect = canvasRef.current.getBoundingClientRect();
    startPoint.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    setSelectionBox({ x: startPoint.current.x, y: startPoint.current.y, width: 0, height: 0 });
  };

  const handleMouseMove = (event) => {
    if (!isSelecting || !startPoint.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const currentX = event.clientX - rect.left;
    const currentY = event.clientY - rect.top;
    setSelectionBox({
      x: startPoint.current.x,
      y: startPoint.current.y,
      width: currentX - startPoint.current.x,
      height: currentY - startPoint.current.y,
    });
    drawSelectionBox();
  };

  const handleMouseUp = () => {
    if (!selectionBox) return;
    setIsSelecting(false);
    setEnableSelection(false);

    const { x, y, width, height } = selectionBox;
    const calX = (x / canvasRef.current.width) * originalDimensions.width;
    const calY = originalDimensions.height-(y / canvasRef.current.height) * originalDimensions.height;
    const calWidth = (width / canvasRef.current.width) * originalDimensions.width;
    const calHeight = (height / canvasRef.current.height) * originalDimensions.height;

    
    const newX = (calX / originalDimensions.width) * 8.26388889;
    const newY = (calY / originalDimensions.height) * 11.68055556;

    onSelectionBoxDraw({ x: newX, y: newY, width: calWidth/72, height: calHeight/72 });
    setSelectionBox(null);
    drawSelectionBox();
  };

  return (
    <div className="flex flex-col items-center">
      <div className="mb-2 flex space-x-2">
        <button onClick={() => setScale(scale + 0.2)}>Zoom In</button>
        <button onClick={() => setScale(Math.max(0.5, scale - 0.2))}>Zoom Out</button>
        <button onClick={() => setPageNum(Math.max(1, pageNum - 1))}>Prev Page</button>
        <button onClick={() => setPageNum(Math.min(pdfDoc?.numPages || 1, pageNum + 1))}>Next Page</button>
        <button onClick={() => { setEnableSelection(true); setEnableClick(false); }}>Enable Selection</button>
        <button onClick={() => { setEnableSelection(false); setEnableClick(true); }}>Enable Click</button>
      </div>
      <canvas 
        ref={canvasRef} 
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
      <p>Dimensions: {originalDimensions.width} × {originalDimensions.height}</p>
    </div>
  );
};

export default PDFViewer;
