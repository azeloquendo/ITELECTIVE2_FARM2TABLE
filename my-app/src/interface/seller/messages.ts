// Messages related type definitions

export interface FirebaseConversation {
  id: string;
  participants: {
    buyerId: string;
    buyerName: string;
    sellerId: string;
    sellerName: string;
    sellerFarmName: string;
    sellerAvatar?: string;
    buyerAvatar?: string;
  };
  lastMessage: string;
  lastMessageTime: any;
  unreadCount: number;
  createdAt?: any;
}

export interface FirebaseMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: 'buyer' | 'seller';
  content: string;
  timestamp: any;
  read: boolean;
  type?: 'text' | 'image' | 'file' | 'audio';
  fileUrl?: string;
  fileName?: string;
}

export interface Buyer {
  id: string;
  name: string;
  email: string;
  profilePic?: string;
  avatar?: string;
  contact?: string;
}

export interface UploadState {
  file: File;
  type: 'image' | 'file' | 'audio';
  uploading?: boolean;
  uploadUrl?: string;
  uploadProgress?: number;
}

