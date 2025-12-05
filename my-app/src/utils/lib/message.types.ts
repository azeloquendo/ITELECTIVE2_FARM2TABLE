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

export interface User {
  id: string;
  name: string;
  farmName?: string;
  email: string;
  role: 'buyer' | 'seller';
  avatar?: string;
}

export interface Seller {
  id: string;
  name: string;
  farmName: string;
  email: string;
}

export interface UploadState {
  file: File;
  type: 'image' | 'file' | 'audio';
  uploadUrl?: string;
  uploading?: boolean;
  uploadProgress?: number;
}

export interface MessagesConfig {
  userRole: 'buyer' | 'seller';
  emptyState: {
    title: string;
    description: string;
    buttonText: string;
  };
  searchPlaceholder: string;
}

export interface SelectionState {
  isSelecting: boolean;
  selectedIds: Set<string>;
  showDeleteModal: boolean;
}
