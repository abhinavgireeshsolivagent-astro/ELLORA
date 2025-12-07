import React, { useState, useRef, useEffect } from 'react';
import { Personality, ChatMessage } from '../../types';
import { getChatResponse } from '../../services/geminiService';
import { SendHorizontal, Square, Paperclip, X, MessageSquare, Copy, Check } from 'lucide-react';

interface ChatModeProps {
    userName: string;
    personality: Personality;
    chatHistory: ChatMessage[];
    setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
    onInteraction: () => void;
    isPro: boolean;
    systemInstruction: string; // New prop for combined system instruction
    niharaProfileImage: string | null; // New prop for Nihara's profile image
}

const MAX_CHARS = 2000;

const TypingIndicator: React.FC<{ isPro: boolean }> = ({ isPro }) => (
    <div className={`flex items-center space-x-2 h-10 px-4 rounded-2xl ${isPro ? 'bg-purple-900/50' : 'bg-slate-700'}`}>
        <div className="w-2 h-2 bg-current rounded-full animate-typing-dots"></div>
        <div className="w-2 h-2 bg-current rounded-full animate-typing-dots [animation-delay:0.25s]"></div>
        <div className="w-2 h-2 bg-current rounded-full animate-typing-dots [animation-delay:0.5s]"></div>
    </div>
);

const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = (error) => reject(error);
    });

const isSameDay = (d1: Date, d2: Date): boolean => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
};

const formatDateDivider = (date: Date): string => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (isSameDay(date, today)) return 'Today';
    if (isSameDay(date, yesterday)) return 'Yesterday';
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
};

const ChatMode: React.FC<ChatModeProps> = ({ userName, personality, chatHistory, setChatHistory, onInteraction, isPro, systemInstruction, niharaProfileImage }) => {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const isGenerationCancelled = useRef(false);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [chatHistory]);
    
    const handleSend = async () => {
        if ((input.trim() === '' && !imageFile) || isLoading) return;

        isGenerationCancelled.current = false;
        
        const userMessage: ChatMessage = { 
            sender: 'user', 
            text: input, 
            timestamp: new Date(),
            imageUrl: imagePreview ?? undefined,
        };
        const typingIndicator: ChatMessage = { sender: 'ai', text: '', timestamp: new Date(), isTyping: true };
        
        setChatHistory(prev => [...prev, userMessage, typingIndicator]);
        setInput('');
        
        const currentImageFile = imageFile;
        setImageFile(null);
        setImagePreview(null);

        setIsLoading(true);
        onInteraction();

        const geminiHistory = chatHistory
            .filter(m => !m.isTyping)
            .map(m => ({
                role: m.sender === 'user' ? 'user' : 'model',
                parts: [{ text: m.text }],
            }));
        
        let imagePayload;
        if (currentImageFile) {
            const base64Data = await fileToBase64(currentImageFile);
            imagePayload = { mimeType: currentImageFile.type, data: base64Data };
        }

        const responseText = await getChatResponse(geminiHistory, input, systemInstruction, imagePayload); // Pass systemInstruction directly
        
        if (isGenerationCancelled.current) {
            setChatHistory(prev => prev.filter(m => !m.isTyping));
            setIsLoading(false);
            return;
        }

        const aiResponse: ChatMessage = { sender: 'ai', text: responseText, timestamp: new Date() };
        
        setChatHistory(prev => [...prev.slice(0, -1), aiResponse]);
        setIsLoading(false);
    };

    const handleStop = () => {
        isGenerationCancelled.current = true;
        setIsLoading(false);
        setChatHistory(prev => prev.filter(m => !m.isTyping));
    };
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        if(imagePreview) {
            URL.revokeObjectURL(imagePreview);
        }
        setImagePreview(null);
        if(fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }

    const handleCopy = (textToCopy: string, id: string) => {
        if (!textToCopy) return;
        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopiedMessageId(id);
            setTimeout(() => setCopiedMessageId(null), 2000);
        });
    };
    
    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };
    
    const proInputClass = "border-purple-500/50";
    const baseInputClass = "border-blue-500/50";

    const proSendButton = "bg-pro-accent hover:bg-pro-accent/80";
    const baseSendButton = "bg-blue-500 hover:bg-blue-600"; // Changed to a specific blue color for consistency
    
    const charCountColor = input.length > MAX_CHARS * 0.95 ? 'text-red-400' : input.length > MAX_CHARS * 0.8 ? 'text-yellow-400' : 'text-gray-500';

    const formatTime = (date: Date | string) => {
        if (!date) return '';
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    };

    const renderMessage = (msg: ChatMessage, index: number, messageId: string) => {
        const isUser = msg.sender === 'user';
        const avatarInitial = isUser ? userName.charAt(0).toUpperCase() : personality.name.charAt(0).toUpperCase();
        const avatarColor = isUser ? 'bg-green-500' : (isPro ? 'bg-purple-500' : personality.avatarColor); // Specific purple color for pro AI avatar
        const animationClass = isUser ? 'animate-message-in-right' : 'animate-message-in-left';
        
        if (msg.isTyping) {
            return (
                 <div key="typing" className={`flex items-end gap-3 self-start ${animationClass}`}>
                    {isPro && niharaProfileImage ? (
                        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                            <img src={niharaProfileImage} alt="Nihara Profile" className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-lg font-bold ${avatarColor}`}>{avatarInitial}</div>
                    )}
                    <TypingIndicator isPro={isPro} />
                 </div>
            );
        }

        const userBubbleStyles = `rounded-tr-lg ${isPro ? "bg-gradient-to-br from-blue-500 to-purple-600" : "bg-blue-600"}`;
        const aiBubbleStyles = `rounded-tl-lg ${isPro ? "bg-purple-900/50" : "bg-slate-700"}`;

        return (
            <div key={index} className={`group flex items-end gap-2.5 max-w-2xl w-full ${isUser ? 'flex-row-reverse self-end' : 'self-start'} ${animationClass}`}>
                {isUser ? (
                     <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-lg font-bold ${avatarColor}`}>{avatarInitial}</div>
                ) : (
                    isPro && niharaProfileImage ? (
                        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                            <img src={niharaProfileImage} alt="Nihara Profile" className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-lg font-bold ${avatarColor}`}>{avatarInitial}</div>
                    )
                )}
                 <button onClick={() => handleCopy(msg.text, messageId)} className="p-2 rounded-full text-gray-500 hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Copy message">
                    {copiedMessageId === messageId ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                </button>
                <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                    <div className={`px-4 py-3 rounded-2xl ${isUser ? userBubbleStyles : aiBubbleStyles} flex flex-col gap-2 transition-transform duration-300 group-hover:-translate-y-1`}>
                        {msg.imageUrl && (
                            <img src={msg.imageUrl} alt="User upload" className="max-w-xs rounded-lg" />
                        )}
                        {msg.text && <p className="text-white whitespace-pre-wrap break-words">{msg.text}</p>}
                    </div>
                    <p className="text-xs text-gray-500 mt-1 px-1">{formatTime(msg.timestamp)}</p>
                </div>
            </div>
        )
    };
    
    return (
        <div className="flex flex-col h-full w-full animate-subtle-fade-in-up">
            <div className={`flex items-center gap-3 px-6 pt-6 pb-4 shrink-0 border-b border-white/10`}>
                <MessageSquare className={`w-8 h-8 text-${isPro ? 'purple-400' : 'blue-400'}`} />
                <div>
                    <h2 className="mode-title">Chat Verse</h2>
                    <p className="text-gray-400 -mt-2">A dynamic conversation with {personality.name}</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 flex flex-col gap-y-1 pt-6">
                {chatHistory.map((msg, index) => {
                    const prevMsg = chatHistory[index - 1];
                    const showDateDivider = !prevMsg || !isSameDay(new Date(prevMsg.timestamp), new Date(msg.timestamp));
                    const messageId = msg.timestamp.toString() + index;

                    return (
                        <React.Fragment key={messageId}>
                            {showDateDivider && (
                                <div className="date-divider">
                                    <span>{formatDateDivider(new Date(msg.timestamp))}</span>
                                </div>
                            )}
                            {renderMessage(msg, index, messageId)}
                        </React.Fragment>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <div className="shrink-0 mt-auto pt-4 border-t border-white/10 px-6 pb-4">
                {imagePreview && (
                    <div className="relative w-24 h-24 mb-2 rounded-lg overflow-hidden">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover"/>
                        <button onClick={handleRemoveImage} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/80 interactive-glow">
                            <X size={16}/>
                        </button>
                    </div>
                )}
                <div className={`flex items-start space-x-2 bg-white/5 border-2 rounded-xl p-2 transition-all duration-300 interactive-glow ${isPro ? proInputClass : baseInputClass}`}>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} className="p-3 text-gray-400 hover:text-white transition-colors duration-300 rounded-lg interactive-glow-text" aria-label="Attach file">
                        <Paperclip size={20} />
                    </button>
                    <textarea
                        rows={1}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={`Message ${personality.name}...`}
                        className="flex-grow bg-transparent py-2.5 px-2 text-white placeholder-gray-400 focus:outline-none resize-none max-h-40"
                        disabled={isLoading}
                        maxLength={MAX_CHARS}
                    />
                     <div className={`self-end text-xs p-2 transition-colors ${charCountColor}`}>
                        {input.length}/{MAX_CHARS}
                    </div>
                    <button
                        onClick={isLoading ? handleStop : handleSend}
                        className={`self-end p-3 rounded-lg text-white transition-colors duration-300 flex-shrink-0 interactive-glow ${isLoading ? 'bg-red-500 hover:bg-red-600' : (isPro ? proSendButton : baseSendButton)} disabled:opacity-50 disabled:cursor-not-allowed`}
                        disabled={!isLoading && !input.trim() && !imageFile}
                        aria-label={isLoading ? "Stop generating" : "Send message"}
                    >
                        {isLoading ? <Square size={20} /> : <SendHorizontal size={20} />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatMode;