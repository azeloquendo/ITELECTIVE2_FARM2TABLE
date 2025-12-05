import { NextApiRequest, NextApiResponse } from 'next';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: 'dat1ycsju',
  api_key: '421112953636687',
  api_secret: 'CH-K_O7TDdWFEEQfAxnc-7CYxhE',
});

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('📨 UPLOAD-CLOUDINARY API ROUTE HIT!');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { images } = req.body;
    console.log('Received upload request for', images?.length, 'images');

    if (!images || !Array.isArray(images)) {
      return res.status(400).json({ error: 'No images provided' });
    }

    const uploadedUrls: string[] = [];

    for (const imageData of images) {
      const { base64Data, fileName } = imageData;
      
      // Convert base64 to buffer for Cloudinary
      const base64Image = base64Data.split(';base64,').pop();
      if (!base64Image) {
        throw new Error('Invalid base64 image data');
      }

      console.log('📤 Uploading to Cloudinary:', fileName);
      
      // Upload to Cloudinary directly from base64
      const result = await cloudinary.uploader.upload(`data:image/jpeg;base64,${base64Image}`, {
        folder: 'farm2table/products',
        resource_type: 'image',
        transformation: [
          { width: 800, height: 600, crop: 'limit' },
          { quality: 'auto' },
          { format: 'auto' }
        ]
      });

      console.log('✅ Cloudinary upload successful:', result.secure_url);
      uploadedUrls.push(result.secure_url);
    }

    res.status(200).json({ 
      success: true, 
      imageUrls: uploadedUrls 
    });

  } catch (error: any) {
    console.error('❌ Cloudinary upload error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}