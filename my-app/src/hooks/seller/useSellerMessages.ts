// Custom hook for managing seller messages
import { onAuthStateChanged } from 'firebase/auth';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { SELLER_CONFIG } from '../../constants/seller/messages';
import { Buyer, FirebaseConversation, FirebaseMessage, UploadState } from '../../interface/seller/messages';
import {
    deleteConversation,
    markMessagesAsRead,
    searchBuyers,
    sendMessage,
    subscribeToConversations,
    subscribeToMessages
} from '../../services/seller/messageService';
import { auth } from '../../utils/lib/firebase';

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dat1ycsju';
const CLOUDINARY_UPLOAD_PRESET = 'profile_pictures';

// Custom hook for mobile detection
const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth <= 1024);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return isMobile;
};

export const useSellerMessages = () => {
  const searchParams = useSearchParams();
  const buyerId = searchParams.get('buyerId');
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [conversations, setConversations] = useState<FirebaseConversation[]>([]);
  const [messages, setMessages] = useState<FirebaseMessage[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<FirebaseConversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showBuyerSearch, setShowBuyerSearch] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [replyingTo, setReplyingTo] = useState<FirebaseMessage | null>(null);
  const [showConversations, setShowConversations] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [buyerAvatars, setBuyerAvatars] = useState<{[key: string]: string}>({});
  const [loading, setLoading] = useState(true);
  const [activeBuyerId, setActiveBuyerId] = useState<string | null>(null);
  const [userLoaded, setUserLoaded] = useState(false);

  const isMobile = useMobileDetection();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations when user is authenticated
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        setUserLoaded(true);
        
        // Subscribe to conversations
        const unsubscribeConversations = subscribeToConversations(user.uid, (conversationsData) => {
          setConversations(conversationsData);
          setLoading(false);
        });

        return () => unsubscribeConversations();
      } else {
        setLoading(false);
        setUserLoaded(true);
      }
    });

    return () => unsubscribe();
  }, []);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation && currentUser) {
      const unsubscribeMessages = subscribeToMessages(selectedConversation.id, (messagesData) => {
        setMessages(messagesData);
        
        // Mark messages as read
        if (currentUser) {
          markMessagesAsRead(selectedConversation.id, currentUser.uid);
        }
      });

      return () => unsubscribeMessages();
    }
  }, [selectedConversation, currentUser]);

  // Handle buyerId from URL
  useEffect(() => {
    if (buyerId && userLoaded && currentUser) {
      setActiveBuyerId(buyerId);
      handleBuyerMessage(buyerId);
    }
  }, [buyerId, currentUser, userLoaded]);

  const handleBuyerMessage = async (buyerUserId: string) => {
    if (!currentUser) return;

    const existingConv = conversations.find(conv => 
      conv.participants.buyerId === buyerUserId
    );

    if (existingConv) {
      setSelectedConversation(existingConv);
      if (isMobile) setShowConversations(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !currentUser) return;

    try {
      await sendMessage(
        selectedConversation.id,
        currentUser.uid,
        currentUser.displayName || 'Seller',
        'seller',
        newMessage
      );
      setNewMessage("");
      setReplyingTo(null);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      await deleteConversation(conversationId);
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null);
        setMessages([]);
      }
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(conversationId);
        return newSet;
      });
    } catch (error) {
      console.error("Error deleting conversation:", error);
    }
  };

  const handleSearchBuyers = async (query: string) => {
    if (!query.trim()) {
      setBuyers([]);
      return;
    }

    try {
      const results = await searchBuyers(query);
      setBuyers(results);
    } catch (error) {
      console.error("Error searching buyers:", error);
    }
  };

  // Cloudinary upload function
  const uploadToCloudinary = async (file: File, folder: string = 'messages'): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', folder);
    
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const uniqueFileName = `${folder}_${timestamp}_${randomString}`;
    formData.append('public_id', uniqueFileName);

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error('❌ Cloudinary upload error:', error);
      throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return {
    currentUser,
    conversations,
    messages,
    selectedConversation,
    setSelectedConversation,
    newMessage,
    setNewMessage,
    searchQuery,
    setSearchQuery,
    showBuyerSearch,
    setShowBuyerSearch,
    uploadState,
    setUploadState,
    isRecording,
    setIsRecording,
    recordingTime,
    setRecordingTime,
    replyingTo,
    setReplyingTo,
    showConversations,
    setShowConversations,
    isSelecting,
    setIsSelecting,
    isSelectionMode,
    setIsSelectionMode,
    selectedIds,
    setSelectedIds,
    showDeleteModal,
    setShowDeleteModal,
    buyers,
    setBuyers,
    buyerAvatars,
    setBuyerAvatars,
    loading,
    activeBuyerId,
    setActiveBuyerId,
    userLoaded,
    isMobile,
    fileInputRef,
    recordingIntervalRef,
    mediaRecorderRef,
    messagesEndRef,
    sellerConfig: SELLER_CONFIG,
    handleSendMessage,
    handleDeleteConversation,
    handleSearchBuyers,
    uploadToCloudinary,
    handleBuyerMessage
  };
};

