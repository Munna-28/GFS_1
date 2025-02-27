import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || "2.16.105"}/pdf.worker.min.js`;

const PDFViewer = ({ pdfUrl, onShapeClick, cdrwidth, cdrheight }) => {
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null); // Store active render task
  const [pdfDoc, setPdfDoc] = useState(null);
  const [scale, setScale] = useState(1.0);
  const [pageNum, setPageNum] = useState(1);
  const [originalDimensions, setOriginalDimensions] = useState(null);

  useEffect(() => {
    const loadPDF = async () => {
      if (!pdfUrl) return;

      try {
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);

        // Load the first page and set dimensions
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1 });
        setOriginalDimensions({ width: viewport.width, height: viewport.height });

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
      const viewport = page.getViewport({ scale });

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear previous render

      // Cancel any ongoing render task
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }

      // Start a new render task
      const renderTask = page.render({ canvasContext: ctx, viewport });
      renderTaskRef.current = renderTask;

      await renderTask.promise;
    } catch (error) {
      if (error.name !== "RenderingCancelledException") {
        console.error("Error rendering page:", error);
      }
    }
  };

  const handleCanvasClick = (event) => {
    if (!originalDimensions) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    const x = (clickX / rect.width) * originalDimensions.width;
    const y = originalDimensions.height - (clickY / rect.height) * originalDimensions.height;

    const calX = (x / originalDimensions.width) * cdrwidth;
    const calY = (y / originalDimensions.height) * cdrheight;

    onShapeClick({ x: calX, y: calY, pageNum });
  };

  return (
    <div className="flex flex-col items-center">
      <div className="mb-2 flex space-x-2">
        <button onClick={() => setScale(scale + 0.2)}>Zoom In</button>
        <button onClick={() => setScale(Math.max(0.5, scale - 0.2))}>Zoom Out</button>
        <button onClick={() => setPageNum((prev) => Math.max(1, prev - 1))} disabled={pageNum === 1}>
          Prev Page
        </button>
        <button
          onClick={() => setPageNum((prev) => Math.min(pdfDoc?.numPages || 1, prev + 1))}
          disabled={pageNum === (pdfDoc?.numPages || 1)}
        >
          Next Page
        </button>
      </div>
      <canvas ref={canvasRef} onClick={handleCanvasClick} />
      {originalDimensions && <p>Dimensions: {originalDimensions.width} × {originalDimensions.height}</p>}
    </div>
  );
};

export default PDFViewer;
