import React, { useState } from 'react';
import { Personality } from '../types';
import { ArrowRight } from 'lucide-react';

interface WelcomeScreenProps {
    onNameSet: (name: string) => void;
    personality: Personality;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onNameSet, personality }) => {
    const [name, setName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onNameSet(name.trim());
        }
    };

    return (
        <div className="flex flex-col items-center justify-center text-center p-8 glassmorphic rounded-2xl max-w-lg">
            <div className={`w-32 h-32 rounded-full flex items-center justify-center text-6xl font-bold text-white mb-6 ${personality.avatarColor} shadow-2xl`}>
                {personality.name.charAt(0)}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                Hello, I'm <span className="text-blue-400">{personality.name}</span>
            </h1>
            <p className="text-lg text-gray-300 mb-8 max-w-md">Your personal AI companion. It's a pleasure to meet you. What should I call you?</p>

            <form onSubmit={handleSubmit} className="w-full max-w-sm flex items-center">
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name..."
                    className="flex-grow bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-l-full py-3 px-6 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-300"
                    autoFocus
                />
                <button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold p-4 rounded-r-full transition-colors duration-300 disabled:bg-gray-500"
                    disabled={!name.trim()}
                >
                    <ArrowRight size={24} />
                </button>
            </form>
             <div className="mt-8 text-sm text-white/50">
                You can change my personality in the settings later.
            </div>
        </div>
    );
};

export default WelcomeScreen;
