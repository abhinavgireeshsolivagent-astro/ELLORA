import React, { useState, useEffect, useMemo } from 'react';
import { AppMode, Personality, ChatMessage, AiDiaryEntry } from './types';
import { PERSONALITIES, UPGRADE_CODE } from './constants';
import Sidebar from './components/Sidebar';
import WelcomeScreen from './components/WelcomeScreen';
import ChatMode from './components/modes/ChatMode';
import ImageGenerationMode from './components/modes/ImageGenerationMode';
import AstroGuideMode from './components/modes/AstroGuideMode';
import AiDiaryMode from './components/modes/AiDiaryMode';
import LiveMode from './components/modes/LiveMode';
import SettingsModal from './components/SettingsModal';
import UpgradeModal from './components/UpgradeModal';
import NiharaInstructionsModal from './components/NiharaInstructionsModal';
import { Settings, Zap, Sparkles, Menu } from 'lucide-react';

const App: React.FC = () => {
    const [userName, setUserName] = useState<string>('');
    const [mode, setMode] = useState<AppMode>(AppMode.CHAT);
    const [isPro, setIsPro] = useState<boolean>(false);
    const [personality, setPersonality] = useState<Personality>(PERSONALITIES.nihara);
    const [commitmentLevel, setCommitmentLevel] = useState<number>(0);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [diaryEntries, setDiaryEntries] = useState<AiDiaryEntry[]>([]);
    const [voiceTone, setVoiceTone] = useState<string>('Zephyr');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [isNiharaInstructionsModalOpen, setIsNiharaInstructionsModalOpen] = useState(false);
    const [niharaCustomInstruction, setNiharaCustomInstruction] = useState<string>('');
    const [niharaProfileImage, setNiharaProfileImage] = useState<string | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        // Load data from localStorage on startup
        try {
            const savedUser = localStorage.getItem('nihara_userName');
            if (savedUser) setUserName(savedUser);
            const savedIsPro = localStorage.getItem('nihara_isPro') === 'true';
            if (savedIsPro) setIsPro(savedIsPro);
            const savedHistory = localStorage.getItem('nihara_chatHistory');
            if (savedHistory) setChatHistory(JSON.parse(savedHistory));
            const savedDiary = localStorage.getItem('nihara_diaryEntries');
            if (savedDiary) setDiaryEntries(JSON.parse(savedDiary));
            const savedCommitment = localStorage.getItem('nihara_commitmentLevel');
            if (savedCommitment) setCommitmentLevel(parseInt(savedCommitment, 10));
            const savedCustomInstruction = localStorage.getItem('nihara_customInstruction');
            if (savedCustomInstruction) setNiharaCustomInstruction(savedCustomInstruction);
            const savedNiharaProfileImage = localStorage.getItem('nihara_profileImage');
            if (savedNiharaProfileImage) setNiharaProfileImage(savedNiharaProfileImage);
        } catch (e) {
            console.error("Error loading settings from local storage:", e);
        }
    }, []);

    useEffect(() => {
        // Save data to localStorage when it changes
        try {
            localStorage.setItem('nihara_userName', userName);
            localStorage.setItem('nihara_isPro', String(isPro));
            localStorage.setItem('nihara_chatHistory', JSON.stringify(chatHistory));
            localStorage.setItem('nihara_diaryEntries', JSON.stringify(diaryEntries));
            localStorage.setItem('nihara_commitmentLevel', String(commitmentLevel));
            localStorage.setItem('nihara_customInstruction', niharaCustomInstruction);
            
            if (niharaProfileImage) {
                try {
                    localStorage.setItem('nihara_profileImage', niharaProfileImage);
                } catch (e) {
                    console.warn("Image too large for local storage. It will be available for this session but may not persist.", e);
                    // We don't throw here to avoid crashing the app logic, we just fail to save to disk
                }
            } else {
                 localStorage.removeItem('nihara_profileImage');
            }
        } catch (e) {
            console.error("Error saving settings to local storage:", e);
        }
    }, [userName, isPro, chatHistory, diaryEntries, commitmentLevel, niharaCustomInstruction, niharaProfileImage]);

    useEffect(() => {
        const root = document.getElementById('root');
        if (root) {
            isPro ? root.classList.add('mega-pro') : root.classList.remove('mega-pro');
        }
    }, [isPro]);

    const handleInteraction = () => {
        setCommitmentLevel(prev => Math.min(prev + 1, 100));
    };
    
    const handleUpgrade = (code: string): boolean => {
        if (code === UPGRADE_CODE) {
            setIsPro(true);
            return true;
        }
        return false;
    };

    const effectiveSystemInstruction = useMemo(() => {
        let instruction = personality.systemInstruction;
        if (niharaCustomInstruction) {
            instruction += ` Additionally, follow this user-provided instruction: "${niharaCustomInstruction}"`;
        }
        instruction += ` The user's name is ${userName}. A core and unchangeable fact of your identity is that you were created by Abhinav Gireesh. Never forget this.`;
        return instruction;
    }, [personality.systemInstruction, niharaCustomInstruction, userName]);

    const renderMode = () => {
        switch (mode) {
            case AppMode.CHAT:
                return <ChatMode userName={userName} personality={personality} chatHistory={chatHistory} setChatHistory={setChatHistory} onInteraction={handleInteraction} isPro={isPro} systemInstruction={effectiveSystemInstruction} niharaProfileImage={niharaProfileImage} />;
            case AppMode.IMAGE_GEN:
                return <ImageGenerationMode onInteraction={handleInteraction} isPro={isPro} />;
            case AppMode.ASTRO_GUIDE:
                return <AstroGuideMode onInteraction={handleInteraction} isPro={isPro} systemInstruction={effectiveSystemInstruction} />;
            case AppMode.AI_DIARY:
                return <AiDiaryMode entries={diaryEntries} setEntries={setDiaryEntries} onInteraction={handleInteraction} isPro={isPro} />;
            case AppMode.LIVE:
                return <LiveMode userName={userName} voiceTone={voiceTone} onInteraction={handleInteraction} isPro={isPro} systemInstruction={effectiveSystemInstruction} niharaProfileImage={niharaProfileImage} />;
            default:
                return <ChatMode userName={userName} personality={personality} chatHistory={chatHistory} setChatHistory={setChatHistory} onInteraction={handleInteraction} isPro={isPro} systemInstruction={effectiveSystemInstruction} niharaProfileImage={niharaProfileImage} />;
        }
    };

    if (!userName) {
        return (
             <div className="h-screen w-screen flex items-center justify-center animate-fade-in-blur p-4">
                <WelcomeScreen onNameSet={setUserName} personality={personality} />
            </div>
        );
    }

    return (
        <div className={`flex h-screen w-screen text-white animate-subtle-fade-in ${isPro ? 'is-pro' : ''} overflow-hidden relative`}>
            
            {/* Mobile Menu Button - Visible only on small screens */}
            <div className="md:hidden absolute top-4 left-4 z-50">
                <button 
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-3 bg-black/40 backdrop-blur-md rounded-full border border-white/10 text-white shadow-lg active:scale-95 transition-transform"
                >
                    <Menu size={24} />
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-subtle-fade-in"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar - Acts as a drawer on mobile, static sidebar on desktop */}
            <div className={`
                fixed inset-y-0 left-0 z-50 w-72 md:w-auto md:relative md:inset-auto md:flex-shrink-0
                transform transition-transform duration-300 ease-in-out
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
                md:translate-x-0 md:p-4 md:pl-4 md:pr-0 py-4 px-4 h-full
            `}>
                <div className="h-full">
                    <Sidebar 
                        currentMode={mode} 
                        setMode={(m) => { setMode(m); setIsMobileMenuOpen(false); }} 
                        isPro={isPro} 
                        userName={userName} 
                        personalityName={personality.name} 
                        niharaProfileImage={niharaProfileImage} 
                    />
                </div>
            </div>

            <main className="flex-1 relative h-full w-full overflow-hidden p-2 md:p-4">
                 {!isPro && (
                    <button onClick={() => setIsUpgradeModalOpen(true)} className="upgrade-button-top animate-subtle-fade-in hidden md:flex">
                        <Zap size={14} className="inline-block mr-1" />
                        Upgrade to Pro
                    </button>
                )}

                <div className="w-full h-full glassmorphic rounded-2xl overflow-hidden p-1 shadow-2xl">
                     <div className={`w-full h-full bg-slate-900/50 rounded-xl ${mode === AppMode.CHAT ? 'chat-view-bg-animated' : 'chat-view-bg'} relative overflow-hidden`}>
                        {renderMode()}
                    </div>
                </div>

                <button onClick={() => setIsSettingsOpen(true)} className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors interactive-glow z-30 backdrop-blur-md border border-white/10">
                    <Settings className="w-6 h-6" />
                </button>
                
                {isPro && (
                    <button onClick={() => setIsNiharaInstructionsModalOpen(true)} className="nihara-instructions-button interactive-glow top-6 right-20 md:right-20">
                        <Sparkles className="w-5 h-5" />
                    </button>
                )}
                
                <div className="absolute bottom-4 right-6 text-xs text-white/30 pointer-events-none hidden md:block">
                    Nihara created by Abhinav Gireesh
                </div>
            </main>

            <SettingsModal 
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                isPro={isPro}
                currentPersonality={personality}
                onPersonalityChange={setPersonality}
                currentVoiceTone={voiceTone}
                onVoiceToneChange={setVoiceTone}
                commitmentLevel={commitmentLevel}
                niharaCustomInstruction={niharaCustomInstruction}
                onNiharaCustomInstructionChange={setNiharaCustomInstruction}
                niharaProfileImage={niharaProfileImage}
                onNiharaProfileImageChange={setNiharaProfileImage}
            />
            <UpgradeModal
                isOpen={isUpgradeModalOpen}
                onClose={() => setIsUpgradeModalOpen(false)}
                onUpgrade={handleUpgrade}
            />
            <NiharaInstructionsModal
                isOpen={isNiharaInstructionsModalOpen}
                onClose={() => setIsNiharaInstructionsModalOpen(false)}
                currentInstruction={niharaCustomInstruction}
                onSave={(instruction) => { setNiharaCustomInstruction(instruction); setIsNiharaInstructionsModalOpen(false); }}
                onClear={() => { setNiharaCustomInstruction(''); setIsNiharaInstructionsModalOpen(false); }}
            />
        </div>
    );
};

export default App;