// pages/api/verify-id.js
import { createWorker } from 'tesseract.js';
import sharp from 'sharp';

// Set timeout for OCR process (30 seconds max)
const OCR_TIMEOUT = 30000;

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      status: 'failed', 
      reason: 'Method not allowed' 
    });
  }

  let worker;
  
  try {
    console.log("🖼️ Starting ID verification process...");

    // Get the file from the request
    const { file, fullName, birthdate } = req.body;
    
    if (!file) {
      return res.status(400).json({
        status: 'failed', 
        reason: 'No image file uploaded.' 
      });
    }

    // Convert base64 to buffer if needed
    const buffer = Buffer.from(file.split(',')[1], 'base64');

    console.log("📸 Processing image with Sharp...");

    // SIMPLIFIED image processing - just basic enhancements
    const processedBuffer = await sharp(buffer)
      .greyscale() // Convert to grayscale
      .normalise() // Normalize contrast
      .linear(1.2, 0) // Slight contrast increase
      .jpeg({ quality: 85 })
      .toBuffer();

    console.log("✅ Image processing completed");

    // Extract text with Tesseract with timeout
    console.log("🔍 Starting OCR with Tesseract...");
    
    worker = await createWorker('eng');
    
    // SIMPLIFIED Tesseract configuration
    await worker.setParameters({
      tessedit_pageseg_mode: '6', // Uniform block of text
      tessedit_ocr_engine_mode: '1' // Default engine (faster)
    });

    // Create a promise with timeout
    const ocrPromise = worker.recognize(processedBuffer);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('OCR timeout')), OCR_TIMEOUT);
    });

    const { data: { text } } = await Promise.race([ocrPromise, timeoutPromise]);
    
    console.log("✅ OCR completed successfully");
    console.log("📝 Extracted text length:", text.length);

    // Extract data from text
    const extractedData = extractDataFromText(text);
    console.log("📊 Extracted data:", extractedData);

    const validationResult = validateExtractedData(extractedData, { 
      fullName, 
      birthdate 
    });

    // Prepare response based on validation
    let response;
    if (validationResult.isValid) {
      response = {
        status: "verified",
        confidence: 85,
        extracted: extractedData
      };
      console.log("🎉 ID Verified Successfully");
    } else {
      response = {
        status: "manual_review",
        confidence: 60,
        reason: validationResult.errors.join(' ') || "Requires manual verification",
        extracted: extractedData
      };
      console.log("⚠️ ID requires manual review");
    }

    return res.status(200).json(response);

  } catch (error) {
    console.error("❌ ID Verification error:", error.message);
    
    // Return manual review for any errors
    return res.status(200).json({ 
      status: "manual_review", 
      reason: "Automatic verification unavailable. Your ID has been submitted for manual review.",
      confidence: 0
    });
  } finally {
    // Always terminate worker if it exists
    if (worker) {
      try {
        await worker.terminate();
        console.log("🧹 Worker terminated");
      } catch (e) {
        console.log("Worker termination error:", e.message);
      }
    }
  }
}

// SIMPLIFIED helper functions
function extractDataFromText(text) {
  const data = {
    name: null,
    birthdate: null,
    idNumber: null
  };

  // Basic name extraction - look for any text that looks like a name
  const nameMatch = text.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/);
  if (nameMatch) {
    data.name = nameMatch[1].trim();
  }

  // Basic date extraction
  const dateMatch = text.match(/\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})\b/);
  if (dateMatch) {
    data.birthdate = dateMatch[1];
  }

  // Basic ID number extraction
  const idMatch = text.match(/(\d{2,3}[\-\s]?\d{3,4}[\-\s]?\d{3,4})/);
  if (idMatch) {
    data.idNumber = idMatch[1];
  }

  return data;
}

function validateExtractedData(extractedData, userData) {
  const errors = [];

  // Basic name check
  if (extractedData.name && userData.fullName) {
    const extractedName = extractedData.name.toLowerCase();
    const userName = userData.fullName.toLowerCase();
    
    if (!extractedName.includes(userName) && !userName.includes(extractedName)) {
      errors.push("Name doesn't match");
    }
  } else {
    errors.push("Name not found");
  }

  // Basic birthdate check
  if (!extractedData.birthdate) {
    errors.push("Birthdate not found");
  }

  // Basic ID number check
  if (!extractedData.idNumber) {
    errors.push("ID number not found");
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

// Health check endpoint
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};