import React from 'react';
import { AppMode } from '../types';
import { MessageSquare, Image, Star, BookLock, Mic, Zap, ArrowUpCircle } from 'lucide-react';

interface SidebarProps {
    currentMode: AppMode;
    setMode: (mode: AppMode) => void;
    isPro: boolean;
    userName: string;
    personalityName: string;
    niharaProfileImage: string | null;
}

const NavItem: React.FC<{ icon: React.ReactNode; label: AppMode; currentMode: AppMode; setMode: (mode: AppMode) => void; isPro: boolean }> = ({ icon, label, currentMode, setMode, isPro }) => {
    const isActive = currentMode === label;
    const proClass = 'text-pro-text hover:bg-pro-accent/20';
    const baseClass = 'text-base-text hover:bg-base-accent/20';
    const activeProClass = 'bg-pro-accent/30 text-white shadow-lg border-l-4 border-purple-400';
    const activeBaseClass = 'bg-base-accent/30 text-white shadow-lg border-l-4 border-blue-400';
    
    const colors = isPro ? { base: proClass, active: activeProClass } : { base: baseClass, active: activeBaseClass };

    return (
        <button
            onClick={() => setMode(label)}
            className={`flex items-center w-full px-4 py-3 my-1.5 rounded-r-lg transition-all duration-200 ${colors.base} ${isActive ? colors.active : 'opacity-70 hover:opacity-100'} interactive-glow`}
        >
            {icon}
            <span className="ml-4 font-semibold tracking-wide">{label}</span>
        </button>
    );
};


const Sidebar: React.FC<SidebarProps> = ({ currentMode, setMode, isPro, userName, personalityName, niharaProfileImage }) => {
    const avatarInitial = personalityName.charAt(0).toUpperCase();

    return (
        <aside className="h-full flex flex-col glassmorphic rounded-2xl overflow-hidden shadow-2xl border border-white/10">
            <div className={`p-6 pb-8 ${isPro ? 'bg-gradient-to-br from-purple-900/40 to-black/40' : 'bg-gradient-to-br from-blue-900/40 to-black/40'}`}>
                <div className="flex items-center">
                    {isPro && niharaProfileImage ? (
                        <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 border-2 border-white/20 shadow-lg">
                            <img src={niharaProfileImage} alt="Nihara Profile" className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg ${isPro ? 'bg-purple-600' : 'bg-blue-600'}`}>
                            {avatarInitial}
                        </div>
                    )}
                    <div className="ml-4 overflow-hidden">
                        <h1 className={`text-xl font-bold truncate ${isPro ? 'text-purple-300' : 'text-blue-300'}`}>{personalityName}</h1>
                        {userName && <p className="text-xs text-gray-400 uppercase tracking-wider font-medium truncate">User: {userName}</p>}
                    </div>
                </div>
            </div>

            <nav className="flex-1 py-4 pr-2 overflow-y-auto">
                <NavItem icon={<MessageSquare size={20} />} label={AppMode.CHAT} currentMode={currentMode} setMode={setMode} isPro={isPro} />
                <NavItem icon={<Image size={20} />} label={AppMode.IMAGE_GEN} currentMode={currentMode} setMode={setMode} isPro={isPro} />
                <NavItem icon={<Star size={20} />} label={AppMode.ASTRO_GUIDE} currentMode={currentMode} setMode={setMode} isPro={isPro} />
                <NavItem icon={<BookLock size={20} />} label={AppMode.AI_DIARY} currentMode={currentMode} setMode={setMode} isPro={isPro} />
                <NavItem icon={<Mic size={20} />} label={AppMode.LIVE} currentMode={currentMode} setMode={setMode} isPro={isPro} />
            </nav>

            <div className="mt-auto p-4">
                {isPro ? (
                     <div className="w-full flex items-center justify-center px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold shadow-lg text-sm">
                       <ArrowUpCircle className="mr-2 animate-pulse w-4 h-4"/>
                        Mega Pro Active
                    </div>
                ) : (
                    <div className="text-center text-xs text-gray-500">
                        Standard Edition
                    </div>
                )}
            </div>
        </aside>
    );
};

export default Sidebar;