import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('TEST API ROUTE HIT!');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Request body:', req.body);
    
    // Simulate successful upload
    res.status(200).json({ 
      success: true, 
      imageUrls: ['https://example.com/test-image.jpg'] 
    });

  } catch (error: any) {
    console.error('Test upload error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}