import { NextApiRequest, NextApiResponse } from 'next';
import { getProducts } from '@/utils/lib/productService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const products = await getProducts();
    res.status(200).json(products);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}