// Products-related type definitions

import { Product } from "./index";

export interface CreateProductFormProps {
  onClose: () => void;
  onCreate: (product: any) => void;
  sellerId?: string;
}

export interface UpdateProductFormProps {
  onClose: () => void;
  product: Product;
  onUpdate: (updatedProduct: Product) => void;
}

export interface SellerData {
  farmName?: string;
  location?: string;
  address?: {
    region?: string;
    province?: string;
    city?: string;
    barangay?: string;
  };
  idVerification?: {
    status?: string;
  };
}

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export interface ProductFormData {
  name: string;
  description: string;
  price: string;
  stock: number;
  minStock: number;
  category: string;
  unit: string;
  location: string;
  farmName: string;
  tags: string[];
  requiresColdChain: boolean;
  images: File[];
}

