using Corel.Interop.VGCore;
using Microsoft.AspNetCore.Mvc;
using System;
using System.IO;

[Route("api/corel")]
[ApiController]
public class CorelController : ControllerBase
{
    [HttpPost("get-shapes")]
    public IActionResult GetShapes([FromBody] FilePathRequest request)
    {
        try
        {
            Application corelApp = new Application();
            Document doc = corelApp.OpenDocument(request.FilePath);
            Page activePage = doc.ActivePage;

            var shapesList = new List<object>();

            foreach (Shape shape in activePage.Shapes.All())
            {
                // Check if shape has a valid position and properties
                var shapeDetail = new Dictionary<string, object>
            {
                { "Name", string.IsNullOrEmpty(shape.Name) ? "Unnamed" : shape.Name },
                { "Type", shape.Type.ToString() },
                { "PositionX", shape.PositionX },
                { "PositionY", shape.PositionY }
            };

                // Handle fill color
                if (shape.Fill.Type != cdrFillType.cdrNoFill)
                {
                    Color fillColor = shape.Fill.UniformColor;

                    if (fillColor.Type != cdrColorType.cdrColorRGB)
                    {
                        fillColor.ConvertToRGB();
                    }

                    shapeDetail["FillColor"] = new
                    {
                        R = fillColor.RGBRed,
                        G = fillColor.RGBGreen,
                        B = fillColor.RGBBlue
                    };
                }
                else
                {
                    shapeDetail["FillColor"] = null; // No Fill
                }

                shapesList.Add(shapeDetail);
            }

            doc.Close();
            //  corelApp.Quit();

            return Ok(shapesList);
        }
        catch (Exception ex)
        {
            return BadRequest($"Error: {ex.Message}");
        }
    }

    // Model for file path request
    public class FilePathRequest
    {
        public string FilePath { get; set; }
    }


    [HttpPost("replace-color")]
    public IActionResult ReplaceColor([FromBody] ColorReplaceRequest request)
    {
        try
        {
            Application corelApp = new Application();
            Document doc = corelApp.OpenDocument(request.FilePath);
            Page activePage = doc.ActivePage;

            foreach (Shape shape in activePage.Shapes.All())
            {
                if (shape.Fill.Type != cdrFillType.cdrNoFill && shape.Type != cdrShapeType.cdrTextShape)
                {
                    Color fillColor = shape.Fill.UniformColor;
                    if (fillColor.Type != cdrColorType.cdrColorRGB)
                    {
                        fillColor.ConvertToRGB();
                    }

                    if (fillColor.RGBRed == request.ExistingFillR &&
                        fillColor.RGBGreen == request.ExistingFillG &&
                        fillColor.RGBBlue == request.ExistingFillB)
                    {
                        fillColor.RGBAssign(request.NewFillR, request.NewFillG, request.NewFillB);
                    }
                }
            }

            doc.Save();
            /// doc.Close();
            //  corelApp.Quit();

            return Ok("Color replacement completed successfully!");
        }
        catch (Exception ex)
        {
            return BadRequest($"Error: {ex.Message}");
        }

    }

    [HttpPost("replace-text")]
    public IActionResult ReplaceText([FromBody] TextReplaceRequest request)
    {
        try
        {
            Application corelApp = new Application();
            Document doc = corelApp.OpenDocument(request.FilePath);
            Page activePage = doc.ActivePage;
            bool found = false;

            foreach (Shape shape in activePage.Shapes.All())
            {
                if (shape.Type == cdrShapeType.cdrTextShape)
                {
                    IVGText text = shape.Text;
                    TextRange textRange = text.Story;

                    if (textRange.Text.Contains(request.SearchText))
                    {
                        found = true;
                        textRange.Text = textRange.Text.Replace(request.SearchText, request.ReplaceText);
                    }
                }
            }

            if (!found)
                return Ok("Text not found in the document.check");

            doc.Save();
            //doc.Close();
            //  corelApp.Quit();

            return Ok("Text replacement completed successfully!");
        }
        catch (Exception ex)
        {
            return BadRequest($"Error: {ex.Message}");
        }
    }
    public class ColorReplaceRequest
    {
        public string FilePath { get; set; }
        public int ExistingFillR { get; set; }
        public int ExistingFillG { get; set; }
        public int ExistingFillB { get; set; }
        public int NewFillR { get; set; }
        public int NewFillG { get; set; }
        public int NewFillB { get; set; }
    }

    public class TextReplaceRequest
    {
        public string FilePath { get; set; }
        public string SearchText { get; set; }
        public string ReplaceText { get; set; }
    }

    [HttpPost("convert-to-pdf")]
    public IActionResult ConvertCdrToPdf([FromBody] FileRequest request)
    {
        try
        {
            Application corelApp = new Application();
            Document doc = corelApp.OpenDocument(request.FilePath);

            // Extract page dimensions (in inches)
            double pageWidth = doc.ActivePage.SizeWidth; // center of shape in inches
            double pageHeight = doc.ActivePage.SizeHeight;



            // Define the React public folder path
            string reactPublicFolder = @"F:\web\corel-frontend\public"; // Update with your actual React project path
            string pdfFileName = Path.GetFileNameWithoutExtension(request.FilePath) + ".pdf";
            string pdfFilePath = Path.Combine(reactPublicFolder, pdfFileName);

            // Export to PDF
            doc.PublishToPDF(pdfFilePath);
            doc.Close();

            // Return PDF path and dimensions
            return Ok(new { pdfUrl = $"{pdfFileName}.pdf", width = pageWidth, height = pageHeight });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error: {ex.Message}");
        }
    }

    // Request Model
    public class FileRequest
    {
        public string FilePath { get; set; }
    }



    [HttpPost("get-shape-by-position")]
    public IActionResult GetShapeByPosition([FromBody] ShapePositionRequest request)
    {
        try
        {
            Application corelApp = new Application();
            Document doc = corelApp.OpenDocument(request.FilePath);
            Page activePage = doc.ActivePage;

            foreach (Shape shape in activePage.Shapes.All())
            {
                if ((request.X >= shape.PositionX && request.X <= shape.PositionX + shape.SizeWidth) &&
     (request.Y <= shape.PositionY && request.Y >= shape.PositionY - shape.SizeHeight))


                {


                    
                        if (shape != null && shape.Type == cdrShapeType.cdrTextShape)
                    {
                        IVGText text = shape.Text;
                        TextRange textRange = text.Story;
                        return Ok(new
                        {
                            Name = shape.Name,
                            Type = shape.Type.ToString(),
                            PositionX = shape.PositionX,
                            PositionY = shape.PositionY,
                            Width = shape.SizeWidth,
                            Height = shape.SizeHeight,
                            Text=textRange.Text.ToString()

                        });
                    }
                    else if (shape.Fill.Type != cdrFillType.cdrNoFill)
                    {
                        Color fillColor = shape.Fill.UniformColor;

                        if (fillColor.Type != cdrColorType.cdrColorRGB)
                        {
                            fillColor.ConvertToRGB();
                        }
                        return Ok(new
                        {
                            Name = shape.Name,
                            Type = shape.Type.ToString(),
                            PositionX = shape.PositionX,
                            PositionY = shape.PositionY,
                            Width = shape.SizeWidth,
                            Height = shape.SizeHeight,
                            R = fillColor.RGBRed,
                            G = fillColor.RGBGreen,
                            B = fillColor.RGBBlue
                        });

                    }

                    else
                    {
                        return Ok(new
                        {
                            Name = shape.Name,
                            Type = shape.Type.ToString(),
                            PositionX = shape.PositionX,
                            PositionY = shape.PositionY,
                            Width = shape.SizeWidth,
                            Height = shape.SizeHeight,
                        });
                    }
                }
            }
            //  doc.Close();

            return Ok("No shape found at the clicked position.");
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error: {ex.Message}");
        }
    }

    // Request Model
    public class ShapePositionRequest
    {
        public string FilePath { get; set; }
        public double X { get; set; }
        public double Y { get; set; }
    }


    // Resize a shape in CorelDRAW
    [HttpPost("resize-shape")]
    public IActionResult ResizeShape([FromBody] ResizeRequest request)
    {
        try
        {
            Application corelApp = new Application();
            Document doc = corelApp.OpenDocument(request.FilePath);
            Page activePage = doc.ActivePage;
            Shape shape = FindShapeByPosition(activePage.Shapes, request.X, request.Y);

            if (shape == null)
                return NotFound("Shape not found.");

            shape.SetSize(request.NewWidth, request.NewHeight);
            doc.Save();
            // doc.Close();

            return Ok("resized successfully");
        }
        catch (Exception ex)
        {
            return BadRequest($"Error: {ex.Message}");
        }
    }

    private Shape FindShapeByPosition(Shapes shapes, double x, double y)
    {
        foreach (Shape shape in shapes.All())
        {
            if ((x >= shape.PositionX && x<= shape.PositionX + shape.SizeWidth) &&
       (y <= shape.PositionY && y >= shape.PositionY - shape.SizeHeight))


            {
                return shape;
            }
        }
        return null;
    }


    public class ResizeRequest
    {
        public string FilePath { get; set; }
        public double X { get; set; }
        public double Y { get; set; }
        public double NewWidth { get; set; }
        public double NewHeight { get; set; }
    }
    [HttpPost("replace-logo")]
    public IActionResult ReplaceLogo([FromBody] LogoReplaceRequest request)
    {
        try
        {
            Application corelApp = new Application();
            Document doc = corelApp.OpenDocument(request.FilePath);
            Page activePage = doc.ActivePage;

            // Find the shape at the given position
            Shape logoShape = FindShapeByPosition(activePage.Shapes, request.TargetX, request.TargetY);
            if (logoShape != null)
            {
                Console.WriteLine($"LogoShape found at position ({request.TargetX}, {request.TargetY}) with Name: {logoShape.Name}");

                // Count the shapes before importing the new logo
                int initialShapeCount = activePage.Shapes.Count;

                // Import the new logo
                activePage.ActiveLayer.Import(request.NewLogoPath);

                // Identify the new shape by comparing the count
                Shape importedLogo = null;
                foreach (Shape shape in activePage.Shapes.All())
                {
                    if (shape.Type == cdrShapeType.cdrBitmapShape && shape.Name == Path.GetFileName(request.NewLogoPath))
                    {
                        importedLogo = shape;
                        break;
                    }
                }

                if (importedLogo != null)
                {
                    // Set desired dimensions for the new logo
                    importedLogo.SetSize(logoShape.SizeWidth, logoShape.SizeHeight);

                    // Position the new logo where the old logo was
                    importedLogo.SetPosition(request.TargetX, request.TargetY);

                    // Delete the old logo
                    logoShape.Delete();

                    Console.WriteLine("Logo resized and replaced successfully!");
                    doc.Save();
                    return Ok("Logo replacement completed successfully!");
                }
                else
                {
                    return Ok("Failed to find the imported logo.");
                }
            }
            else
            {
                return Ok($"No logo shape found at position ({request.TargetX}, {request.TargetY}).");
            }
        }
        catch (Exception ex)
        {
            return Ok($"Error: {ex.Message}");
        }
    }

    public class LogoReplaceRequest
    {
        public string FilePath { get; set; }
        public string NewLogoPath { get; set; }
        public double TargetX { get; set; }
        public double TargetY { get; set; }
    }
    [HttpPost("move-shape")]
    public IActionResult MoveShape([FromBody] MoveShapeRequest request)
    {
        try
        {
            Application corelApp = new Application();
            Document doc = corelApp.OpenDocument(request.FilePath);
            Page activePage = doc.ActivePage;

            // Find the shape at the given position
            Shape shapeToMove = FindShapeByPosition(activePage.Shapes, request.CurrentX, request.CurrentY);
            if (shapeToMove != null)
            {
                // Move the shape to the new position
                shapeToMove.SetPosition(request.NewX, request.NewY);
                doc.Save();
                return Ok($"Shape moved from ({request.CurrentX}, {request.CurrentY}) to ({request.NewX}, {request.NewY}) successfully!");
            }
            else
            {
                return Ok($"No shape found at position ({request.CurrentX}, {request.CurrentY}).");
            }
        }
        catch (Exception ex)
        {
            return Ok($"Error: {ex.Message}");
        }
    }

    // Model for Move Shape request
    public class MoveShapeRequest
    {
        public string FilePath { get; set; }
        public double CurrentX { get; set; }
        public double CurrentY { get; set; }
        public double NewX { get; set; }
        public double NewY { get; set; }
    }
    [HttpPost("replace-text-by-position")]
    public IActionResult ReplaceTextByPosition([FromBody] TexteditRequest request)
    {
        try
        {
            Application corelApp = new Application();
            Document doc = corelApp.OpenDocument(request.FilePath);
            Page activePage = doc.ActivePage;
            bool found = false;

            Shape shape = FindShapeByPosition(activePage.Shapes, request.X, request.Y);
            if (shape != null && shape.Type == cdrShapeType.cdrTextShape)
            {
                IVGText text = shape.Text;
                TextRange textRange = text.Story;

             
                    found = true;
                    textRange.Text = textRange.Text.Replace(textRange.Text, request.ReplaceText);
                
            }

            else 
                return Ok("No Shape text found.");

            doc.Save();
            // doc.Close();
            // corelApp.Quit();

            return Ok("Text replacement completed successfully!");
        }
        catch (Exception ex)
        {
            return BadRequest($"Error: {ex.Message}");
        }
    }


    public class TexteditRequest
    {
        public string FilePath { get; set; }
        public double X { get; set; }
        public double Y { get; set; }
        public string ReplaceText { get; set; }
    }
    [HttpPost("replace-color-by-position")]
    public IActionResult ReplaceColorByPosition([FromBody] ColoreditRequest request)
    {
        try
        {
            Application corelApp = new Application();
            Document doc = corelApp.OpenDocument(request.FilePath);
            Page activePage = doc.ActivePage;

            Shape shape = FindShapeByPosition(activePage.Shapes, request.X, request.Y);
            if (shape != null && shape.Fill.Type != cdrFillType.cdrNoFill && shape.Type != cdrShapeType.cdrTextShape)
            {
                shape.Fill.UniformColor.RGBAssign(request.NewFillR, request.NewFillG, request.NewFillB);
            }

            doc.Save();
            /// doc.Close();
            //  corelApp.Quit();

            return Ok("Color replacement completed successfully!");
        }
        catch (Exception ex)
        {
            return BadRequest($"Error: {ex.Message}");
        }
    }

    public class ColoreditRequest
    {
        public string FilePath { get; set; }
        public double X { get; set; }
        public double Y { get; set; }
        public int NewFillR { get; set; }
        public int NewFillG { get; set; }
        public int NewFillB { get; set; }
    }


    [HttpPost("delete-shape")]
    public IActionResult ReplaceTextByPosition([FromBody] DeleteRequest request)
    {
        try
        {
            Application corelApp = new Application();
            Document doc = corelApp.OpenDocument(request.FilePath);
            Page activePage = doc.ActivePage;

            Shape shape = FindShapeByPosition(activePage.Shapes, request.X, request.Y);
            if (shape != null)
            {
                shape.Delete();
            }
            else
                return Ok("No Shape text found.");

            doc.Save();
            // doc.Close();
            // corelApp.Quit();

            return Ok("Shape Deleted successfully!");
        }
        catch (Exception ex)
        {
            return BadRequest($"Error: {ex.Message}");
        }
    }
          public class DeleteRequest
    {
        public string FilePath { get; set; }
        public double X { get; set; }
        public double Y { get; set; }
    }
    [HttpPost("delete-shapes-in-box")]
    public IActionResult DeleteShapesInBox([FromBody] DeleteShapesRequest request)
    {
        try
        {
            Application corelApp = new Application();
            Document doc = corelApp.OpenDocument(request.FilePath);
            Page activePage = doc.ActivePage;

            // Find and delete shapes inside the selection box
            foreach (Shape shape in activePage.Shapes)
            {
                if (shape.PositionX <= request.X + request.Width &&
                    request.X <= shape.PositionX + shape.SizeWidth &&
                    shape.PositionY <= request.Y + shape.SizeHeight &&
                    request.Y <= shape.PositionY + request.Height)
                {
                    shape.Delete();
                }
            }

            doc.Save();
            return Ok("Shapes deleted successfully!");
        }
        catch (Exception ex)
        {
            return BadRequest($"Error: {ex.Message}");
        }
    }

    public class DeleteShapesRequest
    {
        public string FilePath { get; set; }
        public double X { get; set; }
        public double Y { get; set; }
        public double Width { get; set; }
        public double Height { get; set; }
    }

}



