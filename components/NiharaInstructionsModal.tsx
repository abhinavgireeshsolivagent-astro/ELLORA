import React, { useState, useEffect } from 'react';
import { X, Save, Eraser, Sparkles } from 'lucide-react';

interface NiharaInstructionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentInstruction: string;
    onSave: (instruction: string) => void;
    onClear: () => void;
}

const NiharaInstructionsModal: React.FC<NiharaInstructionsModalProps> = ({
    isOpen,
    onClose,
    currentInstruction,
    onSave,
    onClear,
}) => {
    const [tempInstruction, setTempInstruction] = useState(currentInstruction);

    useEffect(() => {
        if (isOpen) {
            setTempInstruction(currentInstruction);
        }
    }, [isOpen, currentInstruction]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-subtle-fade-in">
            <div className="glassmorphic rounded-2xl shadow-2xl p-8 w-full max-w-xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition">
                    <X />
                </button>
                
                <h2 className="text-3xl font-bold text-center mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                    <Sparkles className="inline-block mr-2" /> Nihara's Instructions
                </h2>
                <p className="text-center text-gray-400 mb-6">
                    As a Mega Pro member, you can give Nihara custom system-level instructions to shape her behavior across all modes.
                </p>

                <div className="flex flex-col space-y-4">
                    <textarea
                        value={tempInstruction}
                        onChange={(e) => setTempInstruction(e.target.value)}
                        placeholder="e.g., 'Always use emojis in your responses.' or 'Prioritize concise answers.' This will override some aspects of her default personality."
                        rows={6}
                        className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-y"
                    />
                    <div className="flex justify-end space-x-3">
                        {currentInstruction && (
                            <button
                                onClick={onClear}
                                className="flex items-center py-2 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition-transform duration-200 hover:scale-105"
                            >
                                <Eraser className="mr-2" size={18} /> Clear
                            </button>
                        )}
                        <button
                            onClick={() => onSave(tempInstruction)}
                            className="flex items-center py-2 px-4 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold transition-transform duration-200 hover:scale-105"
                        >
                            <Save className="mr-2" size={18} /> Save Instructions
                        </button>
                    </div>
                </div>
                {currentInstruction && (
                    <p className="text-sm text-gray-500 mt-4 text-center">
                        Nihara is currently operating with custom instructions.
                    </p>
                )}
            </div>
        </div>
    );
};

export default NiharaInstructionsModal;