import React, { useState, useEffect } from 'react';
import { AiDiaryEntry } from '../../types';
import { BookLock, Lock, Unlock, PlusCircle, Trash2, Edit } from 'lucide-react';

interface AiDiaryModeProps {
    entries: AiDiaryEntry[];
    setEntries: React.Dispatch<React.SetStateAction<AiDiaryEntry[]>>;
    onInteraction: () => void;
    isPro: boolean;
}

const AiDiaryMode: React.FC<AiDiaryModeProps> = ({ entries, setEntries, onInteraction, isPro }) => {
    const [password, setPassword] = useState<string | null>(null);
    const [isLocked, setIsLocked] = useState(true);
    const [currentPassword, setCurrentPassword] = useState('');
    const [error, setError] = useState('');
    const [newEntry, setNewEntry] = useState('');
    const [editingEntry, setEditingEntry] = useState<AiDiaryEntry | null>(null);

    useEffect(() => {
        const storedPassword = localStorage.getItem('diaryPassword');
        if (storedPassword) {
            setPassword(storedPassword);
        } else {
            setIsLocked(false);
        }
    }, []);

    const handleUnlock = () => {
        if (password === null) {
            setPassword(currentPassword);
            localStorage.setItem('diaryPassword', currentPassword);
            setIsLocked(false);
            setError('');
            setCurrentPassword('');
            onInteraction();
            return;
        }
        if (currentPassword === password) {
            setIsLocked(false);
            setError('');
            setCurrentPassword('');
            onInteraction();
        } else {
            setError('Incorrect password.');
        }
    };

    const handleLock = () => {
        setIsLocked(true);
        setEditingEntry(null);
    };

    const handleSaveEntry = () => {
        if (!newEntry.trim()) return;
        if(editingEntry) {
            setEntries(entries.map(e => e.id === editingEntry.id ? {...e, content: newEntry} : e));
            setEditingEntry(null);
        } else {
            const entry: AiDiaryEntry = {
                id: Date.now().toString(),
                date: new Date(),
                content: newEntry,
            };
            setEntries([entry, ...entries]);
        }
        setNewEntry('');
        onInteraction();
    };
    
    const handleDeleteEntry = (id: string) => {
        setEntries(entries.filter(e => e.id !== id));
    }
    
    const startEditing = (entry: AiDiaryEntry) => {
        setEditingEntry(entry);
        setNewEntry(entry.content);
    }

    const proAccent = 'pro-accent';
    const baseAccent = 'base-accent';
    const accentColor = isPro ? proAccent : baseAccent;
    const ringColor = isPro ? 'border-purple-500/50' : 'border-blue-500/50';

    const lockedScreen = (
        <div className="flex flex-col items-center justify-center h-full w-full animate-subtle-fade-in-up">
            <Lock className={`w-24 h-24 mb-6 text-${accentColor}`} />
            <h2 className="text-3xl font-bold mb-2">AI Diary Locked</h2>
            <p className="text-gray-400 mb-6">{password ? 'Enter your password to unlock.' : 'Set a password for your private diary.'}</p>
            <div className="w-full max-w-sm flex items-center space-x-2">
                <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleUnlock()}
                    placeholder="Password..."
                    className={`flex-grow bg-white/5 border-2 border-transparent rounded-full py-3 px-6 text-white placeholder-gray-400 focus:outline-none transition-all duration-300 interactive-glow ${ringColor}`}
                />
                <button onClick={handleUnlock} className={`p-3 rounded-full text-white bg-${accentColor} hover:bg-${accentColor}/80 interactive-glow`}>
                    <Unlock />
                </button>
            </div>
            {error && <p className="text-red-400 mt-4">{error}</p>}
        </div>
    );

    if (isLocked) {
        return lockedScreen;
    }

    return (
        <div className="flex flex-col h-full w-full p-6 md:p-8 animate-subtle-fade-in-up">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <BookLock className={`w-8 h-8 mr-3 text-${accentColor}`} />
                    <h2 className="mode-title">Mind Vault</h2>
                </div>
                <button onClick={handleLock} className={`flex items-center px-4 py-2 rounded-full text-white bg-${accentColor} hover:bg-${accentColor}/80 interactive-glow`}>
                    <Lock className="mr-2" size={16}/> Lock
                </button>
            </div>
            
            <div className="flex flex-col md:flex-row gap-8 h-full overflow-hidden">
                <div className="md:w-1/2 flex flex-col">
                    <h3 className="text-xl font-semibold mb-2">{editingEntry ? 'Edit Entry' : 'New Entry'}</h3>
                    <textarea
                        value={newEntry}
                        onChange={(e) => setNewEntry(e.target.value)}
                        placeholder="Pour your heart out... your secrets are safe here."
                        className={`flex-1 w-full bg-white/5 border-2 border-white/20 rounded-lg p-4 text-white placeholder-gray-400 focus:outline-none transition-all duration-300 interactive-glow ${ringColor}`}
                    />
                    <button onClick={handleSaveEntry} className={`mt-4 w-full flex items-center justify-center py-2 px-4 rounded-lg text-lg font-bold transition-transform duration-200 hover:scale-105 bg-${accentColor} interactive-glow`}>
                        <PlusCircle className="mr-2"/> {editingEntry ? 'Update Entry' : 'Save Entry'}
                    </button>
                </div>

                <div className="md:w-1/2 flex flex-col">
                    <h3 className="text-xl font-semibold mb-2">Past Entries</h3>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                        {entries.length === 0 ? (
                            <p className="text-gray-400 text-center mt-8">Your diary is empty. Write your first entry!</p>
                        ) : (
                            entries.map(entry => (
                                <div key={entry.id} className="bg-white/5 p-4 rounded-lg transition-all duration-200 interactive-glow">
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="text-sm font-semibold text-gray-300">{new Date(entry.date).toLocaleString()}</p>
                                        <div className="space-x-2">
                                            <button onClick={() => startEditing(entry)} className="text-gray-400 hover:text-blue-400 interactive-glow-text"><Edit size={16}/></button>
                                            <button onClick={() => handleDeleteEntry(entry.id)} className="text-gray-400 hover:text-red-400 interactive-glow-text"><Trash2 size={16}/></button>
                                        </div>
                                    </div>
                                    <p className="text-gray-200 truncate">{entry.content}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AiDiaryMode;