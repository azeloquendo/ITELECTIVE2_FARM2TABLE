"use client";

import { onAuthStateChanged } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  where
} from "firebase/firestore";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SELLER_CONFIG } from "../../../../constants/seller/messages";
import { Buyer, FirebaseConversation, FirebaseMessage, UploadState } from "../../../../interface/seller/messages";
import {
  deleteConversation as deleteConversationService,
  markMessagesAsRead,
  sendMessage as sendMessageService,
  subscribeToConversations,
  subscribeToMessages
} from "../../../../services/seller/messageService";
import { auth, db } from "../../../../utils/lib/firebase";
import styles from "./messages.module.css";

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

export default function SellerMessagesPage() {
  const searchParams = useSearchParams();
  const buyerId = searchParams?.get('buyerId') || null;
  
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
  const conversationUnsubscribeRef = useRef<(() => void) | null>(null);

  const sellerConfig = SELLER_CONFIG;

  // Enhanced function to load buyer data with multiple collection checks
  const loadBuyerData = async (buyerId: string): Promise<Buyer | null> => {
    console.log('🔄 Loading buyer data for:', buyerId);
    
    try {
      // Try buyers collection first
      const buyerDoc = await getDoc(doc(db, "buyers", buyerId));
      if (buyerDoc.exists()) {
        const buyerData = buyerDoc.data();
        console.log('✅ Found buyer in buyers collection:', {
          id: buyerId,
          name: buyerData.fullName || buyerData.name,
          email: buyerData.email,
          hasProfilePic: !!buyerData.profilePic
        });
        
        return {
          id: buyerId,
          name: buyerData.fullName || buyerData.name || "Customer",
          email: buyerData.email || "",
          profilePic: buyerData.profilePic || "",
          avatar: buyerData.avatar || buyerData.profilePic || "",
          contact: buyerData.contact || ""
        };
      }

      // Try users collection
      const userDoc = await getDoc(doc(db, "users", buyerId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role === 'buyer') {
          console.log('✅ Found buyer in users collection:', {
            id: buyerId,
            name: userData.fullName,
            email: userData.email,
            hasProfilePic: !!userData.profilePic
          });
          
          return {
            id: buyerId,
            name: userData.fullName || "Customer",
            email: userData.email || "",
            profilePic: userData.profilePic || "",
            avatar: userData.avatar || userData.profilePic || "",
            contact: userData.contact || ""
          };
        }
      }

      console.log('❌ Buyer not found in any collection:', buyerId);
      return null;

    } catch (error) {
      console.error('❌ Error loading buyer data:', error);
      return null;
    }
  };

  // Get optimized image URL for Cloudinary
  const getOptimizedImageUrl = (url: string, width: number = 200, height: number = 200): string => {
    if (!url) return '';
    
    if (url.includes('cloudinary.com') && !url.includes('/upload/')) {
      const uploadIndex = url.indexOf('/upload/') + 8;
      const transformation = `c_fill,w_${width},h_${height},f_auto,q_auto/`;
      return url.slice(0, uploadIndex) + transformation + url.slice(uploadIndex);
    }
    
    if (url.includes('cloudinary.com') && url.includes('/upload/')) {
      const parts = url.split('/upload/');
      if (parts.length === 2) {
        return `${parts[0]}/upload/c_fill,w_${width},h_${height},f_auto,q_auto/${parts[1]}`;
      }
    }
    
    return url;
  };

  // Get buyer avatar for conversation with optimized image
  const getBuyerAvatar = (conversation: FirebaseConversation): string => {
    const avatarUrl = buyerAvatars[conversation.participants.buyerId] || 
                     conversation.participants.buyerAvatar || 
                     '';
    
    return getOptimizedImageUrl(avatarUrl, 200, 200);
  };

  // Render avatar with fallback to initial
  const renderAvatar = (conversation: FirebaseConversation, size: 'small' | 'large' = 'small') => {
    const avatarUrl = getBuyerAvatar(conversation);
    const initial = getContactInitial(conversation);
    
    if (avatarUrl) {
      return (
        <img 
          src={avatarUrl} 
          alt={getContactName(conversation)}
          className={size === 'small' ? styles.avatarImage : styles.chatAvatarImage}
          onError={(e) => {
            console.log('❌ Avatar image failed to load:', avatarUrl);
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
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

  // Render buyer avatar in search results
  const renderBuyerAvatar = (buyer: Buyer, size: 'small' | 'large' = 'small') => {
    const avatarUrl = buyerAvatars[buyer.id] || 
                     buyer.profilePic || 
                     buyer.avatar || 
                     '';
    
    const optimizedUrl = getOptimizedImageUrl(avatarUrl, 200, 200);
    const initial = buyer.name?.charAt(0) || 'B';
    
    if (optimizedUrl) {
      return (
        <img 
          src={optimizedUrl} 
          alt={buyer.name}
          className={size === 'small' ? styles.avatarImage : styles.chatAvatarImage}
          onError={(e) => {
            console.log('❌ Buyer avatar failed to load:', optimizedUrl);
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
          onLoad={() => {
            console.log('✅ Buyer avatar loaded successfully:', optimizedUrl);
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

  // Cloudinary upload function
  const uploadToCloudinary = async (file: File, folder: string = 'messages'): Promise<string> => {
    console.log('☁️ Starting Cloudinary upload:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      folder: folder,
      preset: CLOUDINARY_UPLOAD_PRESET
    });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', folder);
    
    // Generate unique filename to avoid conflicts
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const uniqueFileName = `${folder}_${timestamp}_${randomString}`;
    formData.append('public_id', uniqueFileName);

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`, {
        method: 'POST',
        body: formData,
      });

      console.log('☁️ Cloudinary response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Cloudinary upload failed:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText
        });
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Cloudinary upload successful:', {
        url: data.secure_url,
        public_id: data.public_id,
        format: data.format
      });

      return data.secure_url;

    } catch (error) {
      console.error('❌ Cloudinary upload error:', error);
      throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log('🔐 User authenticated:', user.uid);
        
        try {
          // Try to load from users collection first
          let userDoc = await getDoc(doc(db, "users", user.uid));
          let userData = userDoc.exists() ? userDoc.data() : null;
          
          // If not found in users, try sellers collection
          if (!userData) {
            console.log('⚠️ User not found in users collection, checking sellers collection...');
            const sellerDoc = await getDoc(doc(db, "sellers", user.uid));
            if (sellerDoc.exists()) {
              userData = sellerDoc.data();
              console.log('✅ Found seller in sellers collection');
            }
          }
          
          // Create user profile with available data
          const userProfile = {
            id: user.uid,
            name: user.displayName || userData?.fullName || userData?.farmName || "Seller",
            email: user.email || userData?.email || "",
            farmName: userData?.farm?.farmName || userData?.farmName || "My Farm",
            role: 'seller'
          };
          
          console.log('👨‍🌾 Seller profile loaded:', userProfile);
          setCurrentUser(userProfile);
          setUserLoaded(true);
          
          // Clean up any existing subscription
          if (conversationUnsubscribeRef.current) {
            conversationUnsubscribeRef.current();
            conversationUnsubscribeRef.current = null;
          }
          
          // Load conversations and buyers after user is set
          const unsubscribe = loadSellerConversations(user.uid);
          if (unsubscribe) {
            conversationUnsubscribeRef.current = unsubscribe;
          }
          loadBuyers(user.uid);
          
        } catch (error) {
          console.error('❌ Error loading user profile:', error);
          // Still set user profile with minimal data to allow conversations to load
          const userProfile = {
            id: user.uid,
            name: user.displayName || "Seller",
            email: user.email || "",
            farmName: "My Farm",
            role: 'seller' as const
          };
          setCurrentUser(userProfile);
          setUserLoaded(true);
          
          // Clean up any existing subscription
          if (conversationUnsubscribeRef.current) {
            conversationUnsubscribeRef.current();
            conversationUnsubscribeRef.current = null;
          }
          
          // Load conversations and buyers after user is set
          const unsubscribe = loadSellerConversations(user.uid);
          if (unsubscribe) {
            conversationUnsubscribeRef.current = unsubscribe;
          }
          loadBuyers(user.uid);
        }
      } else {
        console.log('❌ No user authenticated');
        setUserLoaded(true);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      // Clean up conversation subscription
      if (conversationUnsubscribeRef.current) {
        conversationUnsubscribeRef.current();
        conversationUnsubscribeRef.current = null;
      }
    };
  }, []);

  // Handle buyerId from URL parameters
  useEffect(() => {
    if (buyerId && userLoaded && currentUser) {
      setActiveBuyerId(buyerId);
      console.log('🎯 Buyer ID from URL:', buyerId);
      handleBuyerMessage(buyerId);
    }
  }, [buyerId, currentUser, userLoaded]);

  // Handle buyer messaging when arriving via Message button
  const handleBuyerMessage = async (buyerUserId: string) => {
    if (!currentUser) {
      console.log('❌ No current user for buyer message');
      return;
    }

    console.log('💬 Handling buyer message for:', buyerUserId);

    try {
      // Load buyer data
      const buyerData = await loadBuyerData(buyerUserId);
      
      if (buyerData) {
        // Update buyer avatars
        setBuyerAvatars(prev => ({
          ...prev,
          [buyerUserId]: buyerData.profilePic || buyerData.avatar || ''
        }));
      }
      
      // Check if conversation already exists
      const existingConv = conversations.find(conv => 
        conv.participants.buyerId === buyerUserId
      );

      if (existingConv) {
        console.log('✅ Existing conversation found:', existingConv.id);
        setSelectedConversation(existingConv);
        loadMessages(existingConv.id);
        if (isMobile) setShowConversations(false);
        return;
      }

      // For sellers, we don't auto-create conversations - they should only respond to existing ones
      console.log('ℹ️ No existing conversation found with this buyer');

    } catch (error) {
      console.error('❌ Error handling buyer message:', error);
    }
  };

  // Enhanced function to load all buyers
  const loadBuyers = async (sellerId: string) => {
    if (!sellerId) {
      console.error('❌ No seller ID provided for loadBuyers');
      return;
    }

    try {
      console.log('🔄 Loading all buyers for seller:', sellerId);
      
      let buyersData: Buyer[] = [];

      // 1. Load buyers from existing conversations
      const conversationsQuery = query(
        collection(db, "conversations"),
        where("participants.sellerId", "==", sellerId)
      );
      
      const conversationsSnapshot = await getDocs(conversationsQuery);
      console.log(`📊 Found ${conversationsSnapshot.size} conversations`);
      
      const uniqueBuyerIds = new Set<string>();
      
      conversationsSnapshot.forEach((doc) => {
        const data = doc.data();
        const buyerId = data.participants.buyerId;
        
        if (buyerId && !uniqueBuyerIds.has(buyerId)) {
          uniqueBuyerIds.add(buyerId);
          buyersData.push({
            id: buyerId,
            name: data.participants.buyerName || "Customer",
            email: "",
            profilePic: "",
            avatar: ""
          });
        }
      });

      // 2. Load all buyers from the buyers collection
      try {
        const allBuyersQuery = query(collection(db, "buyers"));
        const allBuyersSnapshot = await getDocs(allBuyersQuery);
        console.log(`👥 Found ${allBuyersSnapshot.size} total buyers in system`);
        
        allBuyersSnapshot.forEach((doc) => {
          const buyerData = doc.data();
          const buyerId = doc.id;
          
          if (!uniqueBuyerIds.has(buyerId)) {
            uniqueBuyerIds.add(buyerId);
            buyersData.push({
              id: buyerId,
              name: buyerData.fullName || buyerData.name || "Customer",
              email: buyerData.email || "",
              profilePic: buyerData.profilePic || "",
              avatar: buyerData.avatar || ""
            });
          }
        });
      } catch (error) {
        console.log('⚠️ Could not load from buyers collection, trying users collection');
        
        // 3. Fallback: Load buyers from users collection
        const usersQuery = query(
          collection(db, "users"),
          where("role", "==", "buyer")
        );
        
        const usersSnapshot = await getDocs(usersQuery);
        console.log(`👥 Found ${usersSnapshot.size} buyers in users collection`);
        
        usersSnapshot.forEach((doc) => {
          const userData = doc.data();
          const buyerId = doc.id;
          
          if (!uniqueBuyerIds.has(buyerId)) {
            uniqueBuyerIds.add(buyerId);
            buyersData.push({
              id: buyerId,
              name: userData.fullName || "Customer",
              email: userData.email || "",
              profilePic: userData.profilePic || "",
              avatar: userData.avatar || ""
            });
          }
        });
      }

      console.log(`✅ Total buyers loaded: ${buyersData.length}`);
      setBuyers(buyersData);

      // Pre-load buyer data and avatars for all buyers
      const avatars: {[key: string]: string} = {};
      for (const buyer of buyersData) {
        if (buyer.id && !avatars[buyer.id]) {
          console.log(`🔄 Loading complete data for buyer: ${buyer.id}`);
          const buyerData = await loadBuyerData(buyer.id);
          if (buyerData) {
            // Update the buyer in the list with complete data
            const buyerIndex = buyersData.findIndex(b => b.id === buyer.id);
            if (buyerIndex !== -1) {
              buyersData[buyerIndex] = buyerData;
            }
            
            // Set avatar
            avatars[buyer.id] = buyerData.profilePic || buyerData.avatar || '';
            console.log(`✅ Complete data loaded for buyer ${buyer.id}:`, buyerData);
          } else {
            console.log(`❌ No complete data found for buyer ${buyer.id}`);
          }
        }
      }
      
      // Update buyers with complete data
      setBuyers(buyersData);
      setBuyerAvatars(avatars);

    } catch (error) {
      console.error("❌ Error loading buyers:", error);
    }
  };

  // Load seller conversations from Firebase using service
  const loadSellerConversations = (sellerId: string) => {
    if (!sellerId) {
      console.error('❌ No seller ID provided for loadSellerConversations');
      return;
    }

    console.log('🔄 Loading conversations for seller:', sellerId);
    
    const unsubscribe = subscribeToConversations(sellerId, async (conversationsData) => {
      console.log(`📨 Conversations snapshot received: ${conversationsData.length} conversations`);
      
      // Sort conversations by last message time (already sorted in service if orderBy works)
      conversationsData.sort((a, b) => {
        const timeA = a.lastMessageTime?.toDate?.() || new Date(0);
        const timeB = b.lastMessageTime?.toDate?.() || new Date(0);
        return timeB.getTime() - timeA.getTime();
      });
      
      setConversations(conversationsData);
      console.log('✅ Conversations loaded:', conversationsData.length);
      
      // Load avatars for all conversations
      const avatars: {[key: string]: string} = {};
      for (const conversation of conversationsData) {
        const buyerId = conversation.participants.buyerId;
        if (buyerId && !avatars[buyerId]) {
          try {
            const buyerData = await loadBuyerData(buyerId);
            if (buyerData) {
              avatars[buyerId] = buyerData.profilePic || buyerData.avatar || '';
            }
          } catch (error) {
            console.error(`Error loading buyer data for ${buyerId}:`, error);
          }
        }
      }
      setBuyerAvatars(avatars);
      
      setLoading(false);

      // After loading conversations, check if we need to handle buyer message
      if (activeBuyerId && currentUser) {
        handleBuyerMessage(activeBuyerId);
      }
    });

    // Store unsubscribe function to clean up later
    return unsubscribe;
  };

  // Function to start new conversation with a buyer
  const startNewConversation = async (buyer: Buyer) => {
    if (!currentUser) {
      console.log('❌ No current user for starting conversation');
      return;
    }

    console.log('💬 Starting new conversation with buyer:', buyer);

    try {
      // Check if conversation already exists
      const existingConvQuery = query(
        collection(db, "conversations"),
        where("participants.sellerId", "==", currentUser.id),
        where("participants.buyerId", "==", buyer.id)
      );
      
      const existingConvSnapshot = await getDocs(existingConvQuery);
      
      if (!existingConvSnapshot.empty) {
        // Use existing conversation
        const existingConv = existingConvSnapshot.docs[0];
        const conversationData = {
          id: existingConv.id,
          ...existingConv.data()
        } as FirebaseConversation;
        
        console.log('✅ Using existing conversation:', existingConv.id);
        setSelectedConversation(conversationData);
        loadMessages(existingConv.id);
        if (isMobile) setShowConversations(false);
        return;
      }

      // Create new conversation
      const conversationData = {
        participants: {
          buyerId: buyer.id,
          buyerName: buyer.name,
          sellerId: currentUser.id,
          sellerName: currentUser.name,
          sellerFarmName: currentUser.farmName || "My Farm",
          sellerAvatar: "",
          buyerAvatar: buyerAvatars[buyer.id] || buyer.profilePic || buyer.avatar || ""
        },
        lastMessage: "Conversation started",
        lastMessageTime: serverTimestamp(),
        unreadCount: 0,
        createdAt: serverTimestamp()
      };

      console.log('➕ Creating new conversation:', conversationData);
      
      const docRef = await addDoc(collection(db, "conversations"), conversationData);
      
      const newConversation: FirebaseConversation = {
        id: docRef.id,
        ...conversationData
      };

      setSelectedConversation(newConversation);
      loadMessages(docRef.id);
      if (isMobile) setShowConversations(false);
      
      // Add the new conversation to the local state
      setConversations(prev => [newConversation, ...prev]);

    } catch (error) {
      console.error('❌ Error starting new conversation:', error);
      alert('Failed to start conversation. Please try again.');
    }
  };

  // Scroll to bottom of messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, uploadState]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Load messages for selected conversation
  // Load messages for a conversation using service
  const loadMessages = (conversationId: string) => {
    if (!conversationId) {
      console.error('❌ No conversation ID provided for loadMessages');
      return;
    }

    console.log('🔄 Loading messages for conversation:', conversationId);
    
    const unsubscribe = subscribeToMessages(conversationId, (messagesData) => {
      console.log(`💬 Messages snapshot received: ${messagesData.length} messages`);
      setMessages(messagesData);
      
      if (selectedConversation && selectedConversation.id === conversationId && currentUser) {
        markMessagesAsRead(conversationId, currentUser.uid).catch(error => {
          console.error('Error marking messages as read:', error);
        });
      }
    });

    return unsubscribe;
  };

  // Handle file selection with Cloudinary upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedConversation || !currentUser) {
      console.log('❌ File upload conditions not met:', {
        hasFile: !!file,
        hasConversation: !!selectedConversation,
        hasUser: !!currentUser
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("File size too large. Please select a file smaller than 10MB.");
      return;
    }

    const fileType = file.type.startsWith('image/') ? 'image' : 
                    file.type.startsWith('audio/') ? 'audio' : 'file';

    console.log('📁 Starting file upload:', {
      name: file.name,
      type: fileType,
      size: file.size
    });

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
    
    if ((!newMessage.trim() && !uploadState?.uploadUrl) || !selectedConversation || !currentUser) {
      console.log('❌ Send message conditions not met:', {
        hasMessage: !!newMessage.trim(),
        hasUpload: !!uploadState?.uploadUrl,
        hasConversation: !!selectedConversation,
        hasUser: !!currentUser
      });
      return;
    }

    try {
      let content: string;
      let messageType: 'text' | 'image' | 'file' | 'audio' = 'text';
      let fileUrl: string | undefined;
      let fileName: string | undefined;

      if (uploadState?.uploadUrl) {
        content = uploadState.type === 'image' ? '📷 Sent an image' : 
                  uploadState.type === 'audio' ? '🎵 Sent an audio message' : 
                  '📎 Sent a file';
        messageType = uploadState.type;
        fileUrl = uploadState.uploadUrl;
        fileName = uploadState.file.name;
      } else {
        content = newMessage.trim();
      }

      await sendMessageService(
        selectedConversation.id,
        currentUser.id,
        currentUser.name || 'Seller',
        'seller',
        content,
        messageType,
        fileUrl,
        fileName
      );

      setNewMessage("");
      setUploadState(null);
      setReplyingTo(null);

    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
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

  const handleDeleteSelected = async (conversationIds: string[]) => {
    try {
      const wasSelectedConversation = selectedConversation;
      
      // Delete conversations using service
      for (const conversationId of conversationIds) {
        await deleteConversationService(conversationId);
      }
      
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
    return conversation.participants.buyerName;
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

  const filteredBuyers = buyers.filter(buyer =>
    buyer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    buyer.email.toLowerCase().includes(searchQuery.toLowerCase())
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
            <h2>Customer Messages</h2>
          </div>
          <div className={styles.searchContainerWithDelete}>
            <div className={styles.searchWrapper}>
              <input 
                type="text" 
                placeholder={sellerConfig.searchPlaceholder}
                className={styles.searchInput}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowBuyerSearch(e.target.value.length > 0);
                }}
                onFocus={() => setShowBuyerSearch(true)}
              />
              {!showBuyerSearch && (
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

        {/* Buyer Search Results */}
        {showBuyerSearch && (
          <div className={styles.buyerSearchResults}>
            <div className={styles.searchHeader}>
              <h4>All Buyers</h4>
              <button 
                onClick={() => {
                  setShowBuyerSearch(false);
                  setSearchQuery("");
                }}
                className={styles.closeSearch}
              >
                ✕
              </button>
            </div>
            {filteredBuyers.map((buyer) => {
              const hasExistingConversation = conversations.some(c => c.participants.buyerId === buyer.id);
              
              return (
                <div
                  key={buyer.id}
                  className={`${styles.buyerItem} ${hasExistingConversation ? styles.hasConversation : ''}`}
                  onClick={() => {
                    if (hasExistingConversation) {
                      const conversation = conversations.find(c => c.participants.buyerId === buyer.id);
                      if (conversation) {
                        handleConversationSelect(conversation);
                      }
                    } else {
                      startNewConversation(buyer);
                    }
                  }}
                >
                  <div className={styles.buyerAvatar}>
                    {renderBuyerAvatar(buyer, 'small')}
                  </div>
                  <div className={styles.buyerInfo}>
                    <h4>{buyer.name}</h4>
                    <p className={styles.buyerEmail}>{buyer.email}</p>
                    {buyer.contact && <p className={styles.buyerContact}>📞 {buyer.contact}</p>}
                    {hasExistingConversation ? (
                      <span className={styles.conversationStatus}>Existing conversation</span>
                    ) : (
                      <span className={styles.newConversationStatus}>Start new conversation</span>
                    )}
                  </div>
                </div>
              );
            })}
            {filteredBuyers.length === 0 && searchQuery && (
              <div className={styles.noBuyersFound}>
                <p>No buyers found matching "{searchQuery}"</p>
              </div>
            )}
          </div>
        )}

        {/* Conversations List */}
        {!showBuyerSearch && (
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
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.noConversations}>
                <div className={styles.noConversationsContent}>
                  <h3>No customer conversations yet</h3>
                  <p>Your customer messages will appear here</p>
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
              <h3>{sellerConfig.emptyState.title}</h3>
              <p>{sellerConfig.emptyState.description}</p>
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
                      Customer
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