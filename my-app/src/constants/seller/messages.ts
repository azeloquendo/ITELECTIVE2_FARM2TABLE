// Messages related constants

export const SELLER_CONFIG = {
  userRole: 'seller' as const,
  searchPlaceholder: "Search conversations...",
  emptyStateMessage: "No conversations yet. Start chatting with your customers!",
  emptyStateSubtext: "When customers message you, conversations will appear here.",
  emptyState: {
    title: "Your Customer Messages",
    description: "Select a conversation or manage your customer communications",
    buttonText: "View All Conversations"
  }
};

export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  FILE: 'file',
  AUDIO: 'audio'
} as const;

