

export enum AppMode {
    CHAT = 'Chat Verse',
    IMAGE_GEN = 'Vision Forge',
    ASTRO_GUIDE = 'Cosmic Oracle',
    AI_DIARY = 'Mind Vault',
    LIVE = 'Aura Sync',
}

export interface Personality {
    id: 'nihara' | 'niru' | 'luna';
    name: string;
    description: string;
    systemInstruction: string;
    avatarColor: string;
}

export interface ChatMessage {
    sender: 'user' | 'ai';
    text: string;
    timestamp: Date;
    isTyping?: boolean;
    imageUrl?: string;
}

export interface AiDiaryEntry {
    id: string;
    date: Date;
    content: string;
}