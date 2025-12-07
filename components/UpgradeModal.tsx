import React, { useState } from 'react';
import { X, CheckCircle, AlertTriangle } from 'lucide-react';

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpgrade: (code: string) => boolean;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, onUpgrade }) => {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleUpgradeClick = () => {
        setError('');
        const result = onUpgrade(code);
        if (result) {
            setSuccess(true);
            setTimeout(() => {
                onClose();
                setSuccess(false);
                setCode('');
            }, 1500);
        } else {
            setError('Invalid code. Please try again.');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-subtle-fade-in">
            <div className="glassmorphic rounded-2xl shadow-2xl p-8 w-full max-w-md relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition">
                    <X />
                </button>
                
                <h2 className="text-3xl font-bold text-center mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400">
                    Upgrade to Mega Pro!
                </h2>
                <p className="text-center text-gray-400 mb-6">Unlock an enhanced UI and attractive new interfaces.</p>

                {success ? (
                    <div className="text-center py-8">
                        <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4 animate-bounce" />
                        <p className="text-xl text-white">Upgrade Successful!</p>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col space-y-4">
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder="Enter upgrade code"
                                className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            />
                            <button
                                onClick={handleUpgradeClick}
                                className="w-full py-3 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold transition-transform duration-200 hover:scale-105"
                            >
                                Activate
                            </button>
                        </div>
                        {error && (
                            <p className="text-red-400 text-center mt-4 flex items-center justify-center">
                                <AlertTriangle className="mr-2" size={16}/> {error}
                            </p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default UpgradeModal;
