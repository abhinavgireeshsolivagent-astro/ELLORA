import React, { useState } from 'react';
import { generateImage } from '../../services/geminiService';
import { ImageIcon, Wand2, Loader2, Download } from 'lucide-react';

interface ImageGenerationModeProps {
    onInteraction: () => void;
    isPro: boolean;
}

const SIZES = ["1:1", "16:9", "9:16", "4:3", "3:4"];

const ImageGenerationMode: React.FC<ImageGenerationModeProps> = ({ onInteraction, isPro }) => {
    const [prompt, setPrompt] = useState('');
    const [size, setSize] = useState('1:1');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('Please enter a prompt.');
            return;
        }
        setIsLoading(true);
        setError('');
        setGeneratedImage(null);
        onInteraction();

        const imageUrl = await generateImage(prompt, size);
        if (imageUrl) {
            setGeneratedImage(imageUrl);
        } else {
            if (!process.env.API_KEY || process.env.API_KEY === "YOUR_GEMINI_API_KEY_HERE" || process.env.API_KEY === "") {
                setError("The Vision Forge is offline. The application's API Key is not configured in the environment variables. Please ensure process.env.API_KEY is set.");
            } else {
                setError('Could not generate the image. Please try a different prompt.');
            }
        }
        setIsLoading(false);
    };
    
    const proAccent = 'purple-400'; // Using direct color for consistency
    const baseAccent = 'blue-500'; // Using direct color for consistency
    const accentColor = isPro ? proAccent : baseAccent;
    const ringColor = isPro ? 'border-purple-500/50' : 'border-blue-500/50';
    const bgColor = isPro ? 'bg-purple-900/50' : 'bg-black/30';

    return (
        <div className="flex flex-col h-full w-full p-6 md:p-8 animate-subtle-fade-in-up">
            <div className="flex items-center mb-6">
                <ImageIcon className={`w-8 h-8 mr-3 text-${accentColor}`} />
                <h2 className="mode-title">Vision Forge</h2>
            </div>
            
            <div className="flex-1 grid md:grid-cols-2 gap-8 overflow-hidden">
                <div className="flex flex-col space-y-6">
                    <div>
                        <label className="block text-lg font-semibold mb-2" htmlFor="prompt">Your Vision</label>
                        <textarea
                            id="prompt"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g., A majestic lion wearing a crown, sitting on a throne in a futuristic city"
                            className={`w-full h-32 bg-white/5 border-2 border-white/20 rounded-lg p-4 text-white placeholder-gray-400 focus:outline-none transition-all duration-300 interactive-glow ${ringColor}`}
                        />
                    </div>
                    <div>
                        <label className="block text-lg font-semibold mb-2">Aspect Ratio</label>
                        <div className="flex flex-wrap gap-3">
                            {SIZES.map(s => (
                                <button key={s} onClick={() => setSize(s)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 interactive-glow ${
                                        size === s ? `bg-${accentColor} text-white` : 'bg-white/10 hover:bg-white/20'
                                    }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                     <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className={`w-full flex items-center justify-center py-3 px-6 rounded-lg text-lg font-bold transition-transform duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed bg-${accentColor} interactive-glow`}
                    >
                        {isLoading ? <Loader2 className="mr-2 animate-spin" /> : <Wand2 className="mr-2" />}
                        {isLoading ? 'Conjuring...' : 'Generate'}
                    </button>
                    {error && <p className="text-red-400 text-center">{error}</p>}
                </div>
                
                <div className={`w-full h-full ${bgColor} rounded-xl flex items-center justify-center relative overflow-hidden border-2 border-dashed border-white/20`}>
                    {isLoading && (
                        <div className="flex flex-col items-center text-white/50">
                            <Loader2 className={`w-16 h-16 text-${accentColor} animate-spin`} />
                            <p className="mt-4">Creating your masterpiece...</p>
                        </div>
                    )}
                    {!isLoading && !generatedImage && <ImageIcon className="w-24 h-24 text-white/20" />}
                    {generatedImage && (
                        <>
                            <img src={generatedImage} alt="Generated art" className="object-contain w-full h-full animate-subtle-fade-in" />
                            <a href={generatedImage} download="nihara-art.jpg" className={`absolute bottom-4 right-4 p-3 rounded-full bg-${accentColor} text-white hover:scale-110 transition-transform duration-200 interactive-glow`}>
                                <Download />
                            </a>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImageGenerationMode;