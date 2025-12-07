import React, { useState, useEffect } from 'react';
import { Personality } from '../types';
import { PERSONALITIES, VOICE_TONES } from '../constants';
import { X, Heart, Sparkles, Image as ImageIcon, UploadCloud } from 'lucide-react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    isPro: boolean;
    currentPersonality: Personality;
    onPersonalityChange: (p: Personality) => void;
    currentVoiceTone: string;
    onVoiceToneChange: (v: string) => void;
    commitmentLevel: number;
    niharaCustomInstruction: string;
    onNiharaCustomInstructionChange: (instruction: string) => void;
    niharaProfileImage: string | null;
    onNiharaProfileImageChange: (imageUrl: string | null) => void;
}

const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });

const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen,
    onClose,
    isPro,
    currentPersonality,
    onPersonalityChange,
    currentVoiceTone,
    onVoiceToneChange,
    commitmentLevel,
    niharaCustomInstruction,
    onNiharaCustomInstructionChange,
    niharaProfileImage,
    onNiharaProfileImageChange,
}) => {
    const [tempNiharaInstruction, setTempNiharaInstruction] = useState(niharaCustomInstruction);
    const [tempNiharaProfileImageFile, setTempNiharaProfileImageFile] = useState<File | null>(null);
    const [tempNiharaProfileImagePreview, setTempNiharaProfileImagePreview] = useState<string | null>(niharaProfileImage);
    const [isDragOver, setIsDragOver] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setTempInstruction(niharaCustomInstruction);
            setTempNiharaProfileImagePreview(niharaProfileImage);
            setTempNiharaProfileImageFile(null); // Clear file input on modal open
        }
    }, [isOpen, niharaCustomInstruction, niharaProfileImage]);

    // Helper to update instruction state if needed, though strictly we save on individual actions in this modal design or passing props.
    // In this specific component, instructions are handled by a separate modal (NiharaInstructionsModal) or passed props?
    // Looking at App.tsx, SettingsModal also receives `niharaCustomInstruction`. We will keep it but focus on the image.
    
    // Quick fix for the setTempInstruction function name typo in useEffect above if I copied it wrong,
    // but looking at previous file content, it was `setTempNiharaInstruction`.
    const setTempInstruction = setTempNiharaInstruction; 

    if (!isOpen) return null;

    // Use direct Tailwind classes for accent colors
    const accentColorClass = isPro ? 'purple-500' : 'blue-500'; 
    const accentColorTextClass = isPro ? 'text-purple-400' : 'text-blue-500';
    const accentBgClass = isPro ? 'bg-purple-600' : 'bg-blue-500';
    const accentHoverBgClass = isPro ? 'hover:bg-purple-700' : 'hover:bg-blue-600';


    const handleProfileImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        processFile(file);
    };

    const processFile = (file: File | undefined) => {
        if (file) {
            // Updated limit to 100MB as requested by user
            if (file.size > 100 * 1024 * 1024) { 
                alert("Image size must be less than 100MB.");
                setTempNiharaProfileImageFile(null);
                setTempNiharaProfileImagePreview(niharaProfileImage);
                return;
            }
            setTempNiharaProfileImageFile(file);
            const preview = URL.createObjectURL(file);
            setTempNiharaProfileImagePreview(preview);
        } else {
            setTempNiharaProfileImageFile(null);
            setTempNiharaProfileImagePreview(niharaProfileImage); 
        }
    };

    const handleSaveProfileImage = async () => {
        if (tempNiharaProfileImageFile) {
            try {
                const base64Image = await fileToBase64(tempNiharaProfileImageFile);
                onNiharaProfileImageChange(base64Image);
                alert("Nihara's profile image saved! Note: Very large images may not persist after a page reload due to browser storage limits.");
            } catch (error) {
                console.error("Error converting file to base64:", error);
                alert("Failed to save image.");
            }
        } else {
            // If they just want to clear it or didn't change anything but hit save (if they had a preview)
            if (tempNiharaProfileImagePreview && !tempNiharaProfileImageFile) {
                // Keep existing
            } else {
                onNiharaProfileImageChange(null);
                alert("Nihara's profile image cleared!");
            }
        }
    };
    
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files[0];
        processFile(file);
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-subtle-fade-in p-4">
            <div className="glassmorphic rounded-2xl shadow-2xl p-6 md:p-8 w-full max-w-2xl relative overflow-y-auto max-h-[90vh]">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition">
                    <X />
                </button>
                <h2 className="text-3xl font-bold mb-6 text-center">Settings</h2>

                {/* Commitment Level */}
                <div className="mb-8">
                    <h3 className="text-xl font-semibold mb-3 flex items-center">
                        <Heart className={`mr-2 ${accentColorTextClass}`} /> Commitment Level
                    </h3>
                    <div className="w-full bg-white/10 rounded-full h-4">
                        <div
                            className={`${accentBgClass} h-4 rounded-full transition-all duration-500`}
                            style={{ width: `${commitmentLevel}%` }}
                        ></div>
                    </div>
                    <p className="text-sm text-gray-400 mt-2 text-center">{commitmentLevel}% - Our bond grows with every interaction!</p>
                </div>

                {/* Personality Selector */}
                <div className="mb-8">
                    <h3 className="text-xl font-semibold mb-4">AI Personality</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {Object.values(PERSONALITIES).map((p) => (
                            <button
                                key={p.id}
                                onClick={() => onPersonalityChange(p)}
                                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                                    currentPersonality.id === p.id
                                        ? `border-${accentColorClass} bg-white/10 scale-105`
                                        : 'border-transparent bg-white/5 hover:border-white/50'
                                }`}
                            >
                                <div className={`w-10 h-10 rounded-full ${p.avatarColor} mx-auto mb-2 flex items-center justify-center text-xl font-bold`}>{p.name.charAt(0)}</div>
                                <h4 className="font-bold text-lg">{p.name}</h4>
                                <p className="text-sm text-gray-400">{p.description}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Voice Tone Selector */}
                <div className="mb-8">
                    <h3 className="text-xl font-semibold mb-4">Live Mode Voice</h3>
                    <div className="flex flex-wrap gap-3">
                        {VOICE_TONES.map(voice => (
                            <button key={voice.id} onClick={() => onVoiceToneChange(voice.id)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                                    currentVoiceTone === voice.id ? `${accentBgClass} text-white` : 'bg-white/10 hover:bg-white/20'
                                }`}
                            >
                                {voice.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Nihara Profile Image (Pro Only) */}
                {isPro && (
                    <div className="mb-8">
                        <h3 className="text-xl font-semibold mb-3 flex items-center">
                            <ImageIcon className={`mr-2 ${accentColorTextClass}`} /> Nihara's Profile Image
                        </h3>
                        
                        <div 
                            className={`border-2 border-dashed rounded-xl p-6 transition-all duration-300 ${isDragOver ? `border-${accentColorClass} bg-white/10` : 'border-white/20 bg-white/5'}`}
                            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                            onDragLeave={() => setIsDragOver(false)}
                            onDrop={handleDrop}
                        >
                            <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
                                <div className="w-28 h-28 rounded-full bg-black/40 flex items-center justify-center overflow-hidden border-2 border-white/20 flex-shrink-0 shadow-lg relative group">
                                    {tempNiharaProfileImagePreview ? (
                                        <img src={tempNiharaProfileImagePreview} alt="Nihara Profile Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <ImageIcon className="w-12 h-12 text-white/30" />
                                    )}
                                </div>
                                
                                <div className="flex-grow w-full">
                                    <div className="text-center md:text-left mb-4">
                                        <p className="font-semibold text-lg">Select a photo from gallery</p>
                                        <p className="text-sm text-gray-400">Supported formats: JPG, PNG. Max size: 100MB</p>
                                    </div>
                                    
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <label htmlFor="profileImageUpload" className={`flex-1 flex items-center justify-center py-2.5 px-4 rounded-lg font-bold transition-all duration-200 cursor-pointer ${accentBgClass} ${accentHoverBgClass} interactive-glow text-white shadow-lg`}>
                                            <UploadCloud className="mr-2" size={18}/> {tempNiharaProfileImageFile ? "Change Photo" : "Select Photo"}
                                        </label>
                                        <input
                                            id="profileImageUpload"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleProfileImageChange}
                                            className="hidden"
                                        />
                                        
                                        <button onClick={handleSaveProfileImage} className={`flex-1 py-2.5 px-4 rounded-lg font-bold transition-all duration-200 bg-green-600 hover:bg-green-700 interactive-glow text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`} disabled={!tempNiharaProfileImageFile && !tempNiharaProfileImagePreview}>
                                            Save
                                        </button>
                                        
                                        <button onClick={() => { setTempNiharaProfileImageFile(null); onNiharaProfileImageChange(null); setTempNiharaProfileImagePreview(null); }} className={`py-2.5 px-4 rounded-lg font-bold transition-all duration-200 bg-red-600 hover:bg-red-700 interactive-glow text-white shadow-lg`}>
                                            Clear
                                        </button>
                                    </div>
                                    {tempNiharaProfileImageFile && (
                                        <p className="text-xs text-green-400 mt-2 text-center md:text-left">Selected: {tempNiharaProfileImageFile.name} ({(tempNiharaProfileImageFile.size / (1024 * 1024)).toFixed(2)} MB)</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SettingsModal;