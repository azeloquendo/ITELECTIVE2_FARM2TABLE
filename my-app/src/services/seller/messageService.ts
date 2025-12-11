// Messages related service functions
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    where
} from 'firebase/firestore';
import { Buyer, FirebaseConversation, FirebaseMessage } from '../../interface/seller/messages';
import { db } from '../../utils/lib/firebase';

export const subscribeToConversations = (
  sellerId: string,
  callback: (conversations: FirebaseConversation[]) => void
): (() => void) => {
  let unsubscribeFn: (() => void) | null = null;
  
  const setupSubscription = (useOrderBy: boolean = true) => {
    try {
      // Note: Firestore requires a composite index for queries with where + orderBy
      // To avoid index errors, we'll query without orderBy and sort manually
      // This works without requiring an index to be created
      const q = query(
        collection(db, "conversations"),
        where("participants.sellerId", "==", sellerId)
      );

      unsubscribeFn = onSnapshot(
        q,
        (snapshot) => {
          const conversations: FirebaseConversation[] = [];
          snapshot.forEach((doc) => {
            conversations.push({
              id: doc.id,
              ...doc.data()
            } as FirebaseConversation);
          });
          
          // Always sort manually to avoid index requirement
          // This ensures the query works without needing a composite index
          conversations.sort((a, b) => {
            const timeA = a.lastMessageTime?.toDate?.() || a.lastMessageTime || new Date(0);
            const timeB = b.lastMessageTime?.toDate?.() || b.lastMessageTime || new Date(0);
            const dateA = timeA instanceof Date ? timeA : (typeof timeA === 'string' ? new Date(timeA) : new Date(0));
            const dateB = timeB instanceof Date ? timeB : (typeof timeB === 'string' ? new Date(timeB) : new Date(0));
            return dateB.getTime() - dateA.getTime();
          });
          
          callback(conversations);
        },
        (error) => {
          console.error('Error fetching conversations:', error);
          callback([]);
          console.error("❌ Error in conversations subscription:", error);
          // If orderBy fails due to missing index, try without it
          if (useOrderBy && (error.code === 'failed-precondition' || error.message?.includes('index'))) {
            console.log("⚠️ Index missing, trying query without orderBy...");
            if (unsubscribeFn) {
              unsubscribeFn();
            }
            setupSubscription(false);
          } else {
            // Return empty array on other errors
            callback([]);
          }
        }
      );
    } catch (error: any) {
      console.error("❌ Error setting up conversations subscription:", error);
      callback([]);
    }
  };

  setupSubscription(true);

  return () => {
    if (unsubscribeFn) {
      unsubscribeFn();
    }
  };
};

export const subscribeToMessages = (
  conversationId: string,
  callback: (messages: FirebaseMessage[]) => void
): (() => void) => {
  const q = query(
    collection(db, "messages"),
    where("conversationId", "==", conversationId),
    orderBy("timestamp", "asc")
  );

  return onSnapshot(q, (snapshot) => {
    const messages: FirebaseMessage[] = [];
    snapshot.forEach((doc) => {
      messages.push({
        id: doc.id,
        ...doc.data()
      } as FirebaseMessage);
    });
    callback(messages);
  });
};

export const sendMessage = async (
  conversationId: string,
  senderId: string,
  senderName: string,
  senderRole: 'buyer' | 'seller',
  content: string,
  type: 'text' | 'image' | 'file' | 'audio' = 'text',
  fileUrl?: string,
  fileName?: string
): Promise<string> => {
  try {
    const messageData = {
      conversationId,
      senderId,
      senderName,
      senderRole,
      content,
      timestamp: serverTimestamp(),
      read: false,
      type,
      ...(fileUrl && { fileUrl }),
      ...(fileName && { fileName })
    };

    const docRef = await addDoc(collection(db, "messages"), messageData);
    
    // Update conversation last message
    await updateDoc(doc(db, "conversations", conversationId), {
      lastMessage: content,
      lastMessageTime: serverTimestamp()
    });

    return docRef.id;
  } catch (error: any) {
    console.error("❌ Error sending message:", error);
    throw new Error(`Failed to send message: ${error.message}`);
  }
};

export const markMessagesAsRead = async (
  conversationId: string,
  userId: string
): Promise<void> => {
  try {
    const messagesQuery = query(
      collection(db, "messages"),
      where("conversationId", "==", conversationId),
      where("read", "==", false),
      where("senderId", "!=", userId)
    );

    const snapshot = await getDocs(messagesQuery);
    const updatePromises = snapshot.docs.map(doc => 
      updateDoc(doc.ref, { read: true })
    );

    await Promise.all(updatePromises);

    // Update conversation unread count
    const conversationDoc = await getDoc(doc(db, "conversations", conversationId));
    if (conversationDoc.exists()) {
      const unreadQuery = query(
        collection(db, "messages"),
        where("conversationId", "==", conversationId),
        where("read", "==", false),
        where("senderId", "!=", userId)
      );
      const unreadSnapshot = await getDocs(unreadQuery);
      await updateDoc(doc(db, "conversations", conversationId), {
        unreadCount: unreadSnapshot.size
      });
    }
  } catch (error: any) {
    console.error("❌ Error marking messages as read:", error);
    throw new Error(`Failed to mark messages as read: ${error.message}`);
  }
};

export const deleteConversation = async (conversationId: string): Promise<void> => {
  try {
    // Delete all messages in the conversation
    const messagesQuery = query(
      collection(db, "messages"),
      where("conversationId", "==", conversationId)
    );
    const messagesSnapshot = await getDocs(messagesQuery);
    const deletePromises = messagesSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);

    // Delete the conversation
    await deleteDoc(doc(db, "conversations", conversationId));
  } catch (error: any) {
    console.error("❌ Error deleting conversation:", error);
    throw new Error(`Failed to delete conversation: ${error.message}`);
  }
};

export const searchBuyers = async (searchQuery: string): Promise<Buyer[]> => {
  try {
    const buyersQuery = query(
      collection(db, "buyers"),
      where("name", ">=", searchQuery),
      where("name", "<=", searchQuery + "\uf8ff")
    );
    
    const snapshot = await getDocs(buyersQuery);
    const buyers: Buyer[] = [];
    snapshot.forEach((doc) => {
      buyers.push({
        id: doc.id,
        ...doc.data()
      } as Buyer);
    });
    
    return buyers;
  } catch (error: any) {
    console.error("❌ Error searching buyers:", error);
    return [];
  }
};

