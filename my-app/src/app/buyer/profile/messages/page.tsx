"use client";

import { useState, useRef, useEffect } from "react";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  getDocs,
  deleteDoc
} from "firebase/firestore";
import { auth, db } from "../../../../utils/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useSearchParams } from "next/navigation";
import styles from "./messages.module.css";

// Firebase data interfaces
interface FirebaseConversation {
  id: string;
  participants: {
    buyerId: string;
    buyerName: string;
    sellerId: string;
    sellerName: string;
    sellerFarmName: string;
    sellerAvatar?: string;
  };
  lastMessage: string;
  lastMessageTime: any;
  unreadCount: number;
  createdAt?: any;
}

interface FirebaseMessage {
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
  replyTo?: any;
}

interface Seller {
  id: string;
  name: string;
  farmName: string;
  email: string;
  profilePic?: string;
  logo?: string;
  avatar?: string;
}

interface UploadState {
  file: File;
  type: 'image' | 'file' | 'audio';
  uploading?: boolean;
  uploadUrl?: string;
  uploadProgress?: number;
}

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dat1ycsju';
const CLOUDINARY_UPLOAD_PRESET = 'farm2table_messages';

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

export default function BuyerMessagesPage() {
  const searchParams = useSearchParams();
  const farmId = searchParams.get('farmId');
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [conversations, setConversations] = useState<FirebaseConversation[]>([]);
  const [messages, setMessages] = useState<FirebaseMessage[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<FirebaseConversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSellerSearch, setShowSellerSearch] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [replyingTo, setReplyingTo] = useState<FirebaseMessage | null>(null);
  const [showConversations, setShowConversations] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [sellerAvatars, setSellerAvatars] = useState<{[key: string]: string}>({});
  const [loading, setLoading] = useState(true);
  const [activeFarmId, setActiveFarmId] = useState<string | null>(null);

  const isMobile = useMobileDetection();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const buyerConfig = {
    userRole: 'buyer' as const,
    emptyState: {
      title: "Welcome to Messages",
      description: "Select a conversation or search for sellers to start messaging",
      buttonText: "Find Sellers to Message"
    },
    searchPlaceholder: "Search sellers to message..."
  };

  // Enhanced function to load seller avatar from your data structure
  const loadSellerAvatar = async (sellerId: string): Promise<string> => {
    console.log('🔄 Loading seller avatar for:', sellerId);
    
    try {
      // Try users collection first (where seller profiles are stored)
      try {
        const userDoc = await getDoc(doc(db, "users", sellerId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log('📁 Found seller in users collection:', {
            id: sellerId,
            farmName: userData.farm?.farmName,
            hasLogo: !!userData.farm?.logo,
            logo: userData.farm?.logo,
            hasProfilePic: !!userData.profilePic,
            profilePic: userData.profilePic
          });
          
          // Check the exact fields from your data structure
          const avatarUrl = userData.farm?.logo || 
                           userData.profilePic || 
                           userData.logo || 
                           userData.avatar || 
                           userData.coverPhoto || 
                           '';
          
          if (avatarUrl) {
            console.log('✅ Found seller avatar:', avatarUrl);
            return avatarUrl;
          }
        }
      } catch (error) {
        console.log('❌ Not found in users collection:', error);
      }

      // Try sellers collection as fallback
      try {
        const sellerDoc = await getDoc(doc(db, "sellers", sellerId));
        if (sellerDoc.exists()) {
          const sellerData = sellerDoc.data();
          console.log('📁 Found in sellers collection:', sellerData);
          
          const avatarUrl = sellerData.farm?.logo || 
                           sellerData.profilePic || 
                           sellerData.logo || 
                           sellerData.avatar || 
                           '';
          
          if (avatarUrl) {
            console.log('✅ Found avatar in sellers:', avatarUrl);
            return avatarUrl;
          }
        }
      } catch (error) {
        console.log('❌ Not found in sellers collection:', error);
      }

      console.log('❌ No avatar found for seller:', sellerId);
      return ''; // No avatar found

    } catch (error) {
      console.error('❌ Error loading seller avatar:', error);
      return '';
    }
  };

  // Get optimized image URL for Cloudinary
  const getOptimizedImageUrl = (url: string, width: number = 200, height: number = 200): string => {
    if (!url) return '';
    
    // If it's already a Cloudinary URL, optimize it
    if (url.includes('cloudinary.com') && !url.includes('/upload/')) {
      const uploadIndex = url.indexOf('/upload/') + 8;
      const transformation = `c_fill,w_${width},h_${height},f_auto,q_auto/`;
      return url.slice(0, uploadIndex) + transformation + url.slice(uploadIndex);
    }
    
    // If it's a Cloudinary URL with existing transformations, add ours
    if (url.includes('cloudinary.com') && url.includes('/upload/')) {
      const parts = url.split('/upload/');
      if (parts.length === 2) {
        return `${parts[0]}/upload/c_fill,w_${width},h_${height},f_auto,q_auto/${parts[1]}`;
      }
    }
    
    // For non-Cloudinary URLs, return as is
    return url;
  };

  // Get seller avatar for conversation with optimized image
  const getSellerAvatar = (conversation: FirebaseConversation): string => {
    const avatarUrl = sellerAvatars[conversation.participants.sellerId] || 
                     conversation.participants.sellerAvatar || 
                     '';
    
    return getOptimizedImageUrl(avatarUrl, 200, 200);
  };

  // Render avatar with fallback to initial
  const renderAvatar = (conversation: FirebaseConversation, size: 'small' | 'large' = 'small') => {
    const avatarUrl = getSellerAvatar(conversation);
    const initial = getContactInitial(conversation);
    
    if (avatarUrl) {
      return (
        <img 
          src={avatarUrl} 
          alt={getContactName(conversation)}
          className={size === 'small' ? styles.avatarImage : styles.chatAvatarImage}
          onError={(e) => {
            // If image fails to load, show initial
            console.log('❌ Avatar image failed to load:', avatarUrl);
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            // The fallback initial will show since the image is hidden
          }}
          onLoad={() => {
            console.log('✅ Avatar image loaded successfully:', avatarUrl);
          }}
        />
      );
    }
    
    return (
      <div className={size === 'small' ? styles.avatarPlaceholder : styles.chatAvatarPlaceholder}>
        {initial}
      </div>
    );
  };

  // Render seller avatar in search results
  const renderSellerAvatar = (seller: Seller, size: 'small' | 'large' = 'small') => {
    const avatarUrl = sellerAvatars[seller.id] || 
                     seller.profilePic || 
                     seller.logo || 
                     seller.avatar || 
                     '';
    
    const optimizedUrl = getOptimizedImageUrl(avatarUrl, 200, 200);
    const initial = seller.farmName?.charAt(0) || 'S';
    
    if (optimizedUrl) {
      return (
        <img 
          src={optimizedUrl} 
          alt={seller.farmName}
          className={size === 'small' ? styles.avatarImage : styles.chatAvatarImage}
          onError={(e) => {
            console.log('❌ Seller avatar failed to load:', optimizedUrl);
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
          onLoad={() => {
            console.log('✅ Seller avatar loaded successfully:', optimizedUrl);
          }}
        />
      );
    }
    
    return (
      <div className={size === 'small' ? styles.avatarPlaceholder : styles.chatAvatarPlaceholder}>
        {initial}
      </div>
    );
  };

  // Handle farmId from URL parameters
  useEffect(() => {
    if (farmId) {
      setActiveFarmId(farmId);
      console.log('🎯 Farm ID from URL:', farmId);
      
      // If we have current user, handle the farm messaging
      if (currentUser) {
        handleFarmMessage(farmId);
      }
    }
  }, [farmId, currentUser]);

  // Handle farm messaging when arriving via Message button
  const handleFarmMessage = async (farmSellerId: string) => {
    if (!currentUser) return;

    console.log('💬 Handling farm message for:', farmSellerId);

    try {
      // Load seller data and avatar
      const sellerAvatar = await loadSellerAvatar(farmSellerId);
      
      // Check if conversation already exists
      const existingConv = conversations.find(conv => 
        conv.participants.sellerId === farmSellerId
      );

      if (existingConv) {
        console.log('✅ Existing conversation found:', existingConv.id);
        setSelectedConversation(existingConv);
        loadMessages(existingConv.id);
        if (isMobile) setShowConversations(false);
        return;
      }

      // Create new conversation
      console.log('🆕 Creating new conversation with farm');
      await startNewConversationWithAvatar(farmSellerId, sellerAvatar);

    } catch (error) {
      console.error('❌ Error handling farm message:', error);
    }
  };

  // Start a new conversation with avatar
  const startNewConversationWithAvatar = async (sellerId: string, sellerAvatar?: string) => {
    if (!currentUser) return;

    // Find seller data
    const seller = sellers.find(s => s.id === sellerId);
    if (!seller) {
      console.error('Seller not found:', sellerId);
      return;
    }

    const existingConv = conversations.find(conv => 
      conv.participants.sellerId === sellerId
    );

    if (existingConv) {
      setSelectedConversation(existingConv);
      loadMessages(existingConv.id);
      if (isMobile) setShowConversations(false);
      setShowSellerSearch(false);
      setSearchQuery("");
      return;
    }

    try {
      const newConversation = {
        participants: {
          buyerId: currentUser.id,
          buyerName: currentUser.name,
          sellerId: seller.id,
          sellerName: seller.name,
          sellerFarmName: seller.farmName,
          sellerAvatar: sellerAvatar
        },
        lastMessage: "Conversation started",
        lastMessageTime: serverTimestamp(),
        unreadCount: 0,
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, "conversations"), newConversation);
      
      // Store avatar for this seller
      if (sellerAvatar) {
        setSellerAvatars(prev => ({
          ...prev,
          [sellerId]: sellerAvatar
        }));
      }

      const firstMessage = {
        conversationId: docRef.id,
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderRole: 'buyer' as const,
        content: "Hello! I'd like to know more about your products.",
        timestamp: serverTimestamp(),
        read: false,
        type: 'text'
      };

      await addDoc(collection(db, "messages"), firstMessage);

      await updateDoc(docRef, {
        lastMessage: firstMessage.content,
        lastMessageTime: serverTimestamp()
      });

      setShowSellerSearch(false);
      setSearchQuery("");

    } catch (error) {
      console.error("Error starting conversation:", error);
    }
  };

  // Handle seller selection from search
  const handleSellerSelect = async (seller: Seller) => {
    const sellerAvatar = await loadSellerAvatar(seller.id);
    await startNewConversationWithAvatar(seller.id, sellerAvatar);
  };

  // Cloudinary upload function
  const uploadToCloudinary = async (file: File, folder: string = 'messages'): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', folder);
    
    const timestamp = Date.now();
    formData.append('public_id', `${folder}_${timestamp}_${Math.random().toString(36).substring(7)}`);

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Upload failed: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      return data.secure_url;

    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser({
          id: user.uid,
          name: user.displayName || "Buyer",
          email: user.email || "",
          role: 'buyer'
        });
        loadBuyerConversations(user.uid);
        loadSellers();
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Scroll to bottom of messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, uploadState]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Enhanced function to load sellers with their profile pictures
  const loadSellers = async () => {
    try {
      console.log('🔄 Loading sellers from users collection...');
      
      let sellersData: Seller[] = [];

      // Load from users collection where role is "seller"
      try {
        const usersQuery = query(
          collection(db, "users"),
          where("role", "==", "seller")
        );
        
        const usersSnapshot = await getDocs(usersQuery);
        console.log(`📊 Found ${usersSnapshot.size} sellers in users collection`);
        
        usersSnapshot.forEach((doc) => {
          const data = doc.data();
          console.log('👨‍🌾 Seller from users:', {
            id: doc.id,
            name: data.fullName,
            farmName: data.farm?.farmName,
            email: data.email,
            hasLogo: !!data.farm?.logo,
            logo: data.farm?.logo
          });
          
          sellersData.push({
            id: doc.id,
            name: data.fullName || "Seller",
            farmName: data.farm?.farmName || data.farmName || "Farm",
            email: data.email || "",
            profilePic: data.farm?.logo || data.profilePic || data.logo,
            logo: data.farm?.logo,
            avatar: data.profilePic
          });
        });
      } catch (error) {
        console.error('❌ Error loading from users collection:', error);
      }

      // If no sellers found in users, try sellers collection as fallback
      if (sellersData.length === 0) {
        try {
          const sellersSnapshot = await getDocs(collection(db, "sellers"));
          console.log(`📊 Found ${sellersSnapshot.size} sellers in sellers collection`);
          
          sellersSnapshot.forEach((doc) => {
            const data = doc.data();
            sellersData.push({
              id: doc.id,
              name: data.fullName || "Seller",
              farmName: data.farm?.farmName || data.farmName || "Farm",
              email: data.email || "",
              profilePic: data.farm?.logo || data.profilePic || data.logo,
              logo: data.farm?.logo,
              avatar: data.profilePic
            });
          });
        } catch (error) {
          console.error('❌ Error loading from sellers collection:', error);
        }
      }

      console.log(`✅ Total sellers loaded: ${sellersData.length}`);
      setSellers(sellersData);

      // Pre-load avatars for all sellers
      const avatars: {[key: string]: string} = {};
      for (const seller of sellersData) {
        if (seller.id && !avatars[seller.id]) {
          const avatar = await loadSellerAvatar(seller.id);
          if (avatar) {
            avatars[seller.id] = avatar;
          }
        }
      }
      setSellerAvatars(avatars);

    } catch (error) {
      console.error("❌ Error loading sellers:", error);
    }
  };

  // Load buyer conversations from Firebase
  const loadBuyerConversations = (buyerId: string) => {
    const q = query(
      collection(db, "conversations"),
      where("participants.buyerId", "==", buyerId)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const conversationsData: FirebaseConversation[] = [];
      snapshot.forEach((doc) => {
        conversationsData.push({
          id: doc.id,
          ...doc.data()
        } as FirebaseConversation);
      });
      
      conversationsData.sort((a, b) => {
        const timeA = a.lastMessageTime?.toDate?.() || new Date(0);
        const timeB = b.lastMessageTime?.toDate?.() || new Date(0);
        return timeB.getTime() - timeA.getTime();
      });
      
      setConversations(conversationsData);
      
      // Load avatars for all conversations
      const avatars: {[key: string]: string} = {};
      for (const conversation of conversationsData) {
        const sellerId = conversation.participants.sellerId;
        if (!avatars[sellerId]) {
          const avatar = await loadSellerAvatar(sellerId);
          if (avatar) {
            avatars[sellerId] = avatar;
          }
        }
      }
      setSellerAvatars(avatars);
      
      setLoading(false);

      // After loading conversations, check if we need to handle farm message
      if (activeFarmId && currentUser) {
        handleFarmMessage(activeFarmId);
      }
    });

    return unsubscribe;
  };

  // Load messages for selected conversation with error handling
  const loadMessages = (conversationId: string) => {
    const q = query(
      collection(db, "messages"),
      where("conversationId", "==", conversationId),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const messagesData: FirebaseMessage[] = [];
        snapshot.forEach((doc) => {
          messagesData.push({
            id: doc.id,
            ...doc.data()
          } as FirebaseMessage);
        });
        setMessages(messagesData);
        
        // Only mark as read if the conversation still exists and is selected
        if (selectedConversation && selectedConversation.id === conversationId) {
          markMessagesAsRead(conversationId);
        }
      },
      (error) => {
        // Handle case where conversation was deleted
        if (error.code === 'permission-denied' || error.message.includes('No document to update')) {
          console.log('Conversation no longer accessible, clearing selection');
          setSelectedConversation(null);
          setMessages([]);
        } else {
          console.error('Error loading messages:', error);
        }
      }
    );

    return unsubscribe;
  };

  // Mark messages as read with error handling
  const markMessagesAsRead = async (conversationId: string) => {
    if (!currentUser || !conversationId) return;

    try {
      // Check if conversation still exists before trying to update
      const conversationDoc = await getDoc(doc(db, "conversations", conversationId));
      if (!conversationDoc.exists()) {
        console.log('Conversation no longer exists, skipping mark as read');
        return;
      }

      const unreadMessages = messages.filter(
        msg => !msg.read && msg.senderId !== currentUser.id
      );

      for (const message of unreadMessages) {
        await updateDoc(doc(db, "messages", message.id), {
          read: true
        });
      }

      await updateDoc(doc(db, "conversations", conversationId), {
        unreadCount: 0
      });
    } catch (error) {
      // If the conversation was deleted during this operation, just log it
      if (error instanceof Error && error.message.includes('No document to update')) {
        console.log('Conversation was deleted during mark as read operation');
        return;
      }
      console.error('Error marking messages as read:', error);
    }
  };

  // Start a new conversation with a seller
  const startNewConversation = async (seller: Seller) => {
    if (!currentUser) return;

    const existingConv = conversations.find(conv => 
      conv.participants.sellerId === seller.id
    );

    if (existingConv) {
      setSelectedConversation(existingConv);
      loadMessages(existingConv.id);
      if (isMobile) setShowConversations(false);
      setShowSellerSearch(false);
      setSearchQuery("");
      return;
    }

    try {
      const newConversation = {
        participants: {
          buyerId: currentUser.id,
          buyerName: currentUser.name,
          sellerId: seller.id,
          sellerName: seller.name,
          sellerFarmName: seller.farmName
        },
        lastMessage: "Conversation started",
        lastMessageTime: serverTimestamp(),
        unreadCount: 0,
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, "conversations"), newConversation);
      
      const firstMessage = {
        conversationId: docRef.id,
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderRole: 'buyer' as const,
        content: "Hello! I'd like to know more about your products.",
        timestamp: serverTimestamp(),
        read: false,
        type: 'text'
      };

      await addDoc(collection(db, "messages"), firstMessage);

      await updateDoc(docRef, {
        lastMessage: firstMessage.content,
        lastMessageTime: serverTimestamp()
      });

      setShowSellerSearch(false);
      setSearchQuery("");

    } catch (error) {
      console.error("Error starting conversation:", error);
    }
  };

  // Handle file selection with Cloudinary upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedConversation || !currentUser) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("File size too large. Please select a file smaller than 10MB.");
      return;
    }

    const fileType = file.type.startsWith('image/') ? 'image' : 
                    file.type.startsWith('audio/') ? 'audio' : 'file';

    setUploadState({
      file,
      type: fileType,
      uploading: true,
      uploadProgress: 0
    });

    try {
      const folder = `messages/${selectedConversation.id}`;
      const downloadURL = await uploadToCloudinary(file, folder);

      setUploadState({
        file,
        type: fileType,
        uploadUrl: downloadURL,
        uploading: false,
        uploadProgress: 100
      });

    } catch (error: any) {
      console.error("Upload failed:", error);
      setUploadState({
        file,
        type: fileType,
        uploading: false,
        uploadProgress: 0
      });
      
      alert(`Upload failed: ${error?.message || "Unknown error"}`);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Send message function
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((!newMessage.trim() && !uploadState?.uploadUrl) || !selectedConversation || !currentUser) return;

    try {
      let messageData: any;

      if (uploadState?.uploadUrl) {
        // Handle file message
        const content = uploadState.type === 'image' ? '📷 Sent an image' : 
                       uploadState.type === 'audio' ? '🎵 Sent an audio message' : 
                       '📎 Sent a file';

        messageData = {
          conversationId: selectedConversation.id,
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderRole: 'buyer' as const,
          content: content,
          timestamp: serverTimestamp(),
          read: false,
          type: uploadState.type,
          fileUrl: uploadState.uploadUrl,
          fileName: uploadState.file.name
        };
      } else {
        // Handle text message
        messageData = {
          conversationId: selectedConversation.id,
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderRole: 'buyer' as const,
          content: newMessage.trim(),
          timestamp: serverTimestamp(),
          read: false,
          type: 'text'
        };
      }

      // Add reply data if replying
      if (replyingTo) {
        messageData.replyTo = {
          messageId: replyingTo.id,
          senderName: replyingTo.senderName,
          content: getReplyContent(),
          type: replyingTo.type
        };
      }

      await addDoc(collection(db, "messages"), messageData);

      const lastMessageText = uploadState?.uploadUrl 
        ? (uploadState.type === 'image' ? '📷 Image' : 
           uploadState.type === 'audio' ? '🎵 Audio message' : 
           '📎 File')
        : newMessage.trim();

      await updateDoc(doc(db, "conversations", selectedConversation.id), {
        lastMessage: lastMessageText,
        lastMessageTime: serverTimestamp(),
        unreadCount: 1
      });

      setNewMessage("");
      setUploadState(null);
      setReplyingTo(null);

    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Voice recording functions
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        await sendAudioMessage(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingTime(0);
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 59) {
            stopVoiceRecording();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Microphone access is required for voice messages. Please allow microphone permissions.");
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current = null;
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const sendAudioMessage = async (audioBlob: Blob) => {
    if (!selectedConversation || !currentUser) return;

    try {
      const audioFile = new File([audioBlob], `voice-message-${Date.now()}.webm`, { 
        type: 'audio/webm' 
      });

      setUploadState({
        file: audioFile,
        type: 'audio',
        uploading: true,
        uploadProgress: 0
      });

      const folder = `messages/${selectedConversation.id}`;
      const downloadURL = await uploadToCloudinary(audioFile, folder);

      setUploadState({
        file: audioFile,
        type: 'audio',
        uploadUrl: downloadURL,
        uploading: false,
        uploadProgress: 100
      });

    } catch (error) {
      console.error("Error preparing audio message:", error);
      setUploadState(null);
      alert("Failed to prepare voice message. Please try again.");
    }
  };

  const handleVoiceMessage = async () => {
    if (isRecording) {
      stopVoiceRecording();
    } else {
      await startVoiceRecording();
    }
  };

  // UI Helper functions
  const handleCancelUpload = () => {
    if (isRecording) {
      stopVoiceRecording();
    }
    setUploadState(null);
  };

  const handleReply = (message: FirebaseMessage) => {
    setReplyingTo(message);
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  const getReplyContent = (): string => {
    if (!replyingTo) return "";
    
    if (replyingTo.type === 'text') {
      return replyingTo.content;
    } else if (replyingTo.type === 'image') {
      return "🖼️ Image";
    } else if (replyingTo.type === 'audio') {
      return "🎵 Voice message";
    } else if (replyingTo.type === 'file') {
      return `📎 ${replyingTo.fileName || 'File'}`;
    }
    return "";
  };

  const startSelection = () => {
    setIsSelecting(true);
    setIsSelectionMode(true);
    setSelectedIds(new Set());
  };

  const cancelSelection = () => {
    setIsSelecting(false);
    setIsSelectionMode(false);
    setSelectedIds(new Set());
    setShowDeleteModal(false);
  };

  const toggleSelection = (id: string) => {
    const newSelectedIds = new Set(selectedIds);
    if (newSelectedIds.has(id)) {
      newSelectedIds.delete(id);
    } else {
      newSelectedIds.add(id);
    }
    setSelectedIds(newSelectedIds);
  };

  // Fixed: Handle delete conversations with proper error handling
  const handleDeleteSelected = async (conversationIds: string[]) => {
    try {
      // Store the current selected conversation before deletion
      const wasSelectedConversation = selectedConversation;
      
      for (const conversationId of conversationIds) {
        // First, delete associated messages
        const messagesQuery = query(
          collection(db, "messages"),
          where("conversationId", "==", conversationId)
        );
        
        const messagesSnapshot = await getDocs(messagesQuery);
        const deletePromises = messagesSnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
        
        // Then delete the conversation
        await deleteDoc(doc(db, "conversations", conversationId));
      }
      
      // If the deleted conversation was the selected one, clear it
      if (wasSelectedConversation && conversationIds.includes(wasSelectedConversation.id)) {
        setSelectedConversation(null);
        setMessages([]);
      }
      
      cancelSelection();
      setShowDeleteModal(false);
      
    } catch (error) {
      console.error("Error deleting conversations:", error);
      alert("Failed to delete conversations. Please try again.");
    }
  };

  const formatTime = (timestamp: any): string => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return "Now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
  };

  const formatRecordingTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleConversationSelect = (conversation: FirebaseConversation) => {
    if (isSelecting) {
      toggleSelection(conversation.id);
    } else {
      if (isSelectionMode) {
        cancelSelection();
      }
      setSelectedConversation(conversation);
      loadMessages(conversation.id);
      if (isMobile) {
        setShowConversations(false);
      }
    }
  };

  const toggleConversations = () => {
    setShowConversations(!showConversations);
  };

  const getContactName = (conversation: FirebaseConversation) => {
    return conversation.participants.sellerFarmName;
  };

  const getContactInitial = (conversation: FirebaseConversation) => {
    const name = getContactName(conversation);
    return name.charAt(0).toUpperCase();
  };

  const getLastMessageText = (conversation: FirebaseConversation) => {
    const lastMessage = conversation.lastMessage;
    const isLastMessageFromCurrentUser = lastMessage.includes('you:') || 
                                       lastMessage.includes('you sent an image') ||
                                       lastMessage.includes('you sent a voice message') ||
                                       lastMessage.includes('you sent a file');
    
    if (isLastMessageFromCurrentUser) {
      return lastMessage;
    }
    
    if (lastMessage.includes('📷')) {
      return `${getContactName(conversation)} sent an image.`;
    } else if (lastMessage.includes('🎵')) {
      return `${getContactName(conversation)} sent a voice message.`;
    } else if (lastMessage.includes('📎')) {
      return `${getContactName(conversation)} sent a file.`;
    }
    
    return lastMessage;
  };

  const renderMessageContent = (message: FirebaseMessage) => {
    if (message.type === 'image' && message.fileUrl) {
      return (
        <div className={styles.imageMessage}>
          <img 
            src={message.fileUrl} 
            alt="Shared image" 
            className={styles.messageImage}
            onClick={() => window.open(message.fileUrl, '_blank')}
          />
        </div>
      );
    } else if (message.type === 'audio' && message.fileUrl) {
      return (
        <div className={styles.audioMessage}>
          <audio 
            controls 
            className={styles.audioPlayer}
            preload="metadata"
          >
            <source src={message.fileUrl} type="audio/webm" />
            <source src={message.fileUrl} type="audio/mp3" />
            <source src={message.fileUrl} type="audio/wav" />
            Your browser does not support the audio element.
          </audio>
        </div>
      );
    } else if (message.type === 'file' && message.fileUrl) {
      return (
        <div className={styles.fileMessage}>
          <a 
            href={message.fileUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className={styles.fileLink}
            download={message.fileName}
          >
            📎 {message.fileName || 'Download file'}
          </a>
        </div>
      );
    } else {
      return <p>{message.content}</p>;
    }
  };

  const filteredSellers = sellers.filter(seller =>
    seller.farmName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    seller.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading messages...</p>
      </div>
    );
  }

  return (
    <div className={styles.messagesContainer}>
      {/* Conversations Sidebar */}
      <div className={`${styles.conversationsSidebar} ${isMobile && !showConversations ? styles.hidden : ''} ${isSelectionMode ? styles.selectionMode : ''}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.headerTop}>
            <h2>Messages</h2>
          </div>
          <div className={styles.searchContainerWithDelete}>
            <div className={styles.searchWrapper}>
              <input 
                type="text" 
                placeholder={buyerConfig.searchPlaceholder}
                className={styles.searchInput}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSellerSearch(e.target.value.length > 0);
                }}
                onFocus={() => setShowSellerSearch(true)}
              />
              {!showSellerSearch && (
                <button 
                  onClick={() => {
                    if (!isSelecting) {
                      startSelection();
                    } else if (selectedIds.size > 0) {
                      setShowDeleteModal(true);
                    } else {
                      cancelSelection();
                    }
                  }}
                  className={`${styles.circularDeleteButton} ${isSelecting ? styles.active : ''}`}
                  title={isSelecting ? "Delete selected conversations" : "Delete conversations"}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className={styles.deleteModalOverlay}>
            <div className={styles.deleteModal}>
              <div className={styles.deleteModalIconContainer}>
                <div className={styles.deleteModalIcon}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </div>
              </div>
              <div className={styles.deleteModalHeader}>
                <h3 className={styles.deleteModalTitle}>Delete Conversations</h3>
                <p className={styles.deleteModalSubtitle}>
                  Are you sure you want to delete <strong>{selectedIds.size}</strong> conversation{selectedIds.size > 1 ? 's' : ''}? This action cannot be undone.
                </p>
              </div>
              <div className={styles.deleteModalActions}>
                <button 
                  onClick={cancelSelection}
                  className={styles.deleteModalCancelButton}
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleDeleteSelected(Array.from(selectedIds))}
                  className={styles.deleteModalConfirmButton}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Seller Search Results - Only show farm name */}
        {showSellerSearch && (
          <div className={styles.sellerSearchResults}>
            <div className={styles.searchHeader}>
              <h4>Start New Conversation</h4>
              <button 
                onClick={() => {
                  setShowSellerSearch(false);
                  setSearchQuery("");
                }}
                className={styles.closeSearch}
              >
                ✕
              </button>
            </div>
            {filteredSellers.map((seller) => (
              <div
                key={seller.id}
                className={styles.sellerItem}
                onClick={() => handleSellerSelect(seller)}
              >
                <div className={styles.sellerAvatar}>
                  {renderSellerAvatar(seller, 'small')}
                </div>
                <div className={styles.sellerInfo}>
                  <h4>{seller.farmName}</h4>
                  {/* Removed seller name and email display */}
                </div>
                <button className={styles.messageButton}>
                  Message
                </button>
              </div>
            ))}
            {filteredSellers.length === 0 && searchQuery && (
              <div className={styles.noSellersFound}>
                <p>No sellers found matching "{searchQuery}"</p>
              </div>
            )}
          </div>
        )}

        {/* Conversations List - Removed seller name display */}
        {!showSellerSearch && (
          <div className={styles.conversationsList}>
            {conversations.length > 0 ? (
              conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`${styles.conversationItem} ${
                    selectedConversation?.id === conversation.id ? styles.active : ""
                  } ${isSelecting ? styles.selectable : ""}`}
                  onClick={() => {
                    handleConversationSelect(conversation);
                  }}
                >
                  {isSelecting && (
                    <div className={styles.checkboxContainer}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(conversation.id)}
                        onChange={() => toggleSelection(conversation.id)}
                        className={styles.selectionCheckbox}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  )}
                  <div className={styles.avatarContainer}>
                    {renderAvatar(conversation, 'small')}
                  </div>
                  
                  <div className={styles.conversationInfo}>
                    <div className={styles.conversationHeader}>
                      <h4 className={styles.contactName}>
                        {getContactName(conversation)}
                      </h4>
                      <span className={styles.timestamp}>
                        {formatTime(conversation.lastMessageTime)}
                      </span>
                    </div>
                    <p className={styles.lastMessage}>
                      {getLastMessageText(conversation)}
                    </p>
                    {/* Removed seller name display */}
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.noConversations}>
                <div className={styles.noConversationsContent}>
                  <h3>No conversations yet</h3>
                  <p>Search for sellers above to start chatting!</p>
                  <button 
                    onClick={() => setShowSellerSearch(true)}
                    className={styles.startChattingButton}
                  >
                    Start Chatting
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chat Area */}
      <div className={`${styles.chatArea} ${isMobile && showConversations ? styles.hidden : ''}`}>
        {!selectedConversation ? (
          <div className={styles.noConversationSelected}>
            <div className={styles.noConversationContent}>
              <h3>{buyerConfig.emptyState.title}</h3>
              <p>{buyerConfig.emptyState.description}</p>
              <button 
                onClick={() => setShowSellerSearch(true)}
                className={styles.startChattingButton}
              >
                {buyerConfig.emptyState.buttonText}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className={styles.chatHeader}>
              <div className={styles.chatHeaderLeft}>
                {isMobile && selectedConversation && (
                  <button 
                    onClick={toggleConversations}
                    className={styles.backToConversations}
                    aria-label="Back to conversations"
                  >
                    <svg 
                      width="20" 
                      height="20" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2"
                    >
                      <path d="M19 12H5" />
                      <path d="M12 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}
                <div className={styles.chatContact}>
                  <div className={styles.chatAvatarContainer}>
                    {renderAvatar(selectedConversation, 'large')}
                  </div>
                  <div className={styles.chatContactInfo}>
                    <h3>{getContactName(selectedConversation)}</h3>
                    <span className={styles.contactStatus}>
                      Online
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages Container */}
            <div className={styles.messagesContainerInner}>
              {messages.length > 0 ? (
                messages.map((message) => (
                  <div 
                    key={message.id}
                    className={`${styles.message} ${message.senderId === currentUser.id ? styles.sent : styles.received}`}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      handleReply(message);
                    }}
                  >
                    {message.type === 'text' ? (
                      <div className={styles.messageBubble}>
                        {renderMessageContent(message)}
                        <span className={styles.messageTime}>
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                    ) : (
                      <div className={styles.fileContent}>
                        {renderMessageContent(message)}
                        <span className={styles.fileTime}>
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className={styles.noMessages}>
                  <p>No messages yet. Start the conversation!</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className={styles.messageInputContainer}>
              {/* Reply Preview */}
              {replyingTo && (
                <div className={styles.replyPreview}>
                  <div className={styles.replyHeader}>
                    <span>Replying to {replyingTo.senderName}</span>
                    <button 
                      type="button" 
                      onClick={cancelReply}
                      className={styles.cancelReplyButton}
                    >
                      ✕
                    </button>
                  </div>
                  <div className={styles.replyContent}>
                    {getReplyContent()}
                  </div>
                </div>
              )}

              {/* Upload Preview */}
              {uploadState && !uploadState.uploading && uploadState.uploadUrl && (
                <div className={styles.uploadPreview}>
                  <div className={styles.previewHeader}>
                    {uploadState.type !== 'audio' && (
                      <button 
                        type="button" 
                        onClick={handleCancelUpload}
                        className={styles.cancelPreviewButton}
                        title="Cancel upload"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 6L6 18"></path>
                          <path d="M6 6l12 12"></path>
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  <div className={styles.previewContent}>
                    {uploadState.type === 'image' && (
                      <div className={styles.imagePreview}>
                        <img src={uploadState.uploadUrl} alt="Preview" />
                        <div className={styles.fileSize}>
                          {formatFileSize(uploadState.file.size)}
                        </div>
                      </div>
                    )}
                    
                    {uploadState.type === 'audio' && (
                      <div className={styles.audioPreview}>
                        <div className={styles.audioPreviewRow}>
                          <button 
                            type="button" 
                            onClick={handleCancelUpload}
                            className={styles.deleteIconButton}
                            title="Delete recording"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 6h18"></path>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                          </button>
                          <audio controls src={uploadState.uploadUrl} className={styles.audioPlayer} />
                        </div>
                        <div className={styles.fileSize}>
                          {formatFileSize(uploadState.file.size)}
                        </div>
                      </div>
                    )}
                    {uploadState.type === 'file' && (
                      <div className={styles.filePreview}>
                        <div className={styles.fileIcon}>
                          📎
                        </div>
                        <div className={styles.fileInfo}>
                          <h4>{uploadState.file.name}</h4>
                          <div className={styles.fileSize}>
                            {formatFileSize(uploadState.file.size)}
                          </div>
                        </div>
                        <button 
                          type="button" 
                          onClick={handleCancelUpload}
                          className={styles.cancelPreviewButton}
                          title="Cancel upload"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18"></path>
                            <path d="M6 6l12 12"></path>
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className={styles.inputWrapper}>
                <label htmlFor="file-upload" className={styles.fileUploadButton}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <input
                    id="file-upload"
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    className={styles.fileInput}
                    accept="image/*,audio/*,.pdf,.doc,.docx,.txt"
                    disabled={!!uploadState || isRecording}
                  />
                </label>

                <div className={styles.voiceButtonContainer}>
                  {isRecording && (
                    <div className={styles.recordingTimer}>
                      🔴 Recording: {formatRecordingTime(recordingTime)}
                    </div>
                  )}
                  <button 
                    type="button" 
                    onClick={handleVoiceMessage}
                    className={`${styles.voiceButton} ${isRecording ? styles.recording : ''}`}
                    disabled={!!uploadState}
                  >
                    {isRecording ? (
                      <div className={styles.recordingIndicator}>
                        <div className={styles.recordingDot}></div>
                      </div>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                        <line x1="12" y1="19" x2="12" y2="23" />
                        <line x1="8" y1="23" x2="16" y2="23" />
                      </svg>
                    )}
                  </button>
                </div>

                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message here..."
                  className={styles.messageInput}
                  disabled={!!uploadState?.uploading || isRecording}
                />

                <button 
                  type="submit" 
                  className={styles.sendButton}
                  disabled={(!newMessage.trim() && !uploadState?.uploadUrl) || !!uploadState?.uploading || isRecording}
                >
                  {uploadState?.uploadUrl ? 'Send' : 'Send'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}