import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, FunctionDeclaration, Type } from '@google/genai';
import { LiveServerMessage, Modality, Blob as GenAiBlob } from '@google/genai';
import { Mic, PhoneOff, Loader2, AudioWaveform, Camera, CameraOff } from 'lucide-react';

interface LiveModeProps {
    userName: string;
    voiceTone: string;
    onInteraction: () => void;
    isPro: boolean;
    systemInstruction: string;
    niharaProfileImage: string | null;
}

const FRAME_RATE = 1; 
const JPEG_QUALITY = 0.7;

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64data = reader.result as string;
            resolve(base64data.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};


const LiveMode: React.FC<LiveModeProps> = ({ userName, voiceTone, onInteraction, isPro, systemInstruction, niharaProfileImage }) => {
    const [isConnecting, setIsConnecting] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [isAiSpeaking, setIsAiSpeaking] = useState(false);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [status, setStatus] = useState('Tap to speak');
    const [transcription, setTranscription] = useState<{ user: string, ai: string }[]>([]);
    const [currentTurn, setCurrentTurn] = useState({ user: '', ai: '' });
    
    const sessionRef = useRef<any | null>(null);
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const videoStreamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const frameIntervalRef = useRef<number | null>(null);
    const transcriptionEndRef = useRef<HTMLDivElement>(null);
    
    const nextStartTimeRef = useRef(0);
    const outputSourcesRef = useRef(new Set<AudioBufferSourceNode>());

    const proAccent = 'purple-400'; 
    const baseAccent = 'blue-500'; 
    const accentColor = isPro ? proAccent : baseAccent;
    
    useEffect(() => {
        transcriptionEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcription, currentTurn]);

    const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> => {
        const dataInt16 = new Int16Array(data.buffer);
        const frameCount = dataInt16.length / numChannels;
        const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
        for (let channel = 0; channel < numChannels; channel++) {
            const channelData = buffer.getChannelData(channel);
            for (let i = 0; i < frameCount; i++) {
                channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
            }
        }
        return buffer;
    };
    
    const stopAudioPlayback = () => {
        outputSourcesRef.current.forEach(source => {
            source.stop();
        });
        outputSourcesRef.current.clear();
        nextStartTimeRef.current = 0;
        setIsAiSpeaking(false);
    };

    const stopCamera = () => {
        if (frameIntervalRef.current) {
            clearInterval(frameIntervalRef.current);
            frameIntervalRef.current = null;
        }
        if (videoStreamRef.current) {
            videoStreamRef.current.getTracks().forEach(track => track.stop());
            videoStreamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsCameraOn(false);
    };

    const startConversation = async () => {
        if (isActive || isConnecting) return;
        
        if (!process.env.API_KEY || process.env.API_KEY === "YOUR_GEMINI_API_KEY_HERE" || process.env.API_KEY === "") {
            setStatus("API Key not configured. Please contact the administrator.");
            return;
        }

        setIsConnecting(true);
        setStatus('Initializing...');
        onInteraction();
        
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });

            const openAppFunctionDeclaration: FunctionDeclaration = {
                name: 'openApp',
                parameters: {
                    type: Type.OBJECT,
                    description: 'Opens a specified application or website when the user asks.',
                    properties: {
                        appName: {
                            type: Type.STRING,
                            description: 'The name of the application or website to open. Supported: WhatsApp, Instagram, Facebook, YouTube, Twitter, Google, Spotify, Netflix, Gmail, Maps.',
                            enum: ['WhatsApp', 'Instagram', 'Facebook', 'YouTube', 'Twitter', 'Google', 'Spotify', 'Netflix', 'Gmail', 'Maps'],
                        },
                    },
                    required: ['appName'],
                },
            };

            let liveSystemInstruction = systemInstruction;
            if (isCameraOn) {
                liveSystemInstruction += ` CRITICAL: You are receiving a live video feed. Actively observe and comment on it.`;
            }

            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceTone }}},
                    systemInstruction: liveSystemInstruction,
                    outputAudioTranscription: {},
                    inputAudioTranscription: {},
                    tools: [{ functionDeclarations: [openAppFunctionDeclaration] }],
                },
                callbacks: {
                    onopen: () => {
                        setStatus('Connection live. Listening...');
                        setIsConnecting(false);
                        setIsActive(true);

                        if (streamRef.current && audioContextRef.current) {
                            const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
                            mediaStreamSourceRef.current = source;
                            const scriptProcessor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
                            scriptProcessorRef.current = scriptProcessor;

                            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                                const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                                const l = inputData.length;
                                const int16 = new Int16Array(l);
                                for (let i = 0; i < l; i++) {
                                    int16[i] = inputData[i] * 32768;
                                }
                                const pcmBlob: GenAiBlob = {
                                    data: encode(new Uint8Array(int16.buffer)),
                                    mimeType: 'audio/pcm;rate=16000',
                                };
                                sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
                            };
                            source.connect(scriptProcessor);
                            scriptProcessor.connect(audioContextRef.current.destination);
                        } else {
                            setStatus("Failed to access microphone.");
                            stopConversation();
                        }
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent?.inputTranscription) {
                            setCurrentTurn(prev => ({...prev, user: prev.user + message.serverContent.inputTranscription.text}));
                        }
                        if (message.serverContent?.outputTranscription) {
                            if(!isAiSpeaking) setIsAiSpeaking(true);
                            setStatus('Nihara is speaking...');
                            setCurrentTurn(prev => ({...prev, ai: prev.ai + message.serverContent.outputTranscription.text}));
                        }
                        if (message.serverContent?.turnComplete) {
                            const finalTurn = {...currentTurn};
                            if (finalTurn.user || finalTurn.ai) {
                                setTranscription(prev => [...prev, finalTurn]);
                            }
                            setCurrentTurn({ user: '', ai: '' });
                            if (isActive) setStatus('Listening...');
                        }
                        if (message.toolCall) {
                            for (const fc of message.toolCall.functionCalls) {
                                if (fc.name === 'openApp') {
                                    const appName = fc.args.appName as string;
                                    let result = "ok";
                                    let url = '';
                                    
                                    switch(appName) {
                                        case 'WhatsApp': url = 'https://web.whatsapp.com/'; break;
                                        case 'Instagram': url = 'https://www.instagram.com/'; break;
                                        case 'Facebook': url = 'https://www.facebook.com/'; break;
                                        case 'YouTube': url = 'https://www.youtube.com/'; break;
                                        case 'Twitter': url = 'https://twitter.com/'; break;
                                        case 'Google': url = 'https://www.google.com/'; break;
                                        case 'Spotify': url = 'https://open.spotify.com/'; break;
                                        case 'Netflix': url = 'https://www.netflix.com/'; break;
                                        case 'Gmail': url = 'https://mail.google.com/'; break;
                                        case 'Maps': url = 'https://maps.google.com/'; break;
                                        default: result = `Unknown app: ${appName}`;
                                    }

                                    if (url) {
                                        // Open in new tab
                                        window.open(url, '_blank');
                                        console.log(`Opened ${appName}`);
                                    }

                                    sessionPromise.then((session) => {
                                        session.sendToolResponse({
                                            functionResponses: {
                                                id : fc.id,
                                                name: fc.name,
                                                response: { result: result },
                                            }
                                        });
                                    });
                                }
                            }
                        }
                        if (message.serverContent?.interrupted) {
                            stopAudioPlayback();
                        }
                        const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (audioData && outputAudioContextRef.current) {
                            setIsAiSpeaking(true);
                            const decodedData = Uint8Array.from(atob(audioData), c => c.charCodeAt(0));
                            const audioBuffer = await decodeAudioData(decodedData, outputAudioContextRef.current, 24000, 1);
                            
                            const sourceNode = outputAudioContextRef.current.createBufferSource();
                            sourceNode.buffer = audioBuffer;
                            sourceNode.connect(outputAudioContextRef.current.destination);

                            const currentTime = outputAudioContextRef.current.currentTime;
                            const startTime = Math.max(currentTime, nextStartTimeRef.current);
                            sourceNode.start(startTime);

                            nextStartTimeRef.current = startTime + audioBuffer.duration;
                            outputSourcesRef.current.add(sourceNode);
                            sourceNode.onended = () => {
                                outputSourcesRef.current.delete(sourceNode);
                                if(outputSourcesRef.current.size === 0) {
                                    setIsAiSpeaking(false);
                                    if(isActive) setStatus('Listening...');
                                }
                            };
                        }
                    },
                    onerror: (e) => {
                        console.error('Live session error:', e);
                        setStatus('Connection interrupted. Retrying...');
                        stopConversation();
                    },
                    onclose: () => {
                        setStatus('Connection closed.');
                        setIsActive(false);
                        setIsConnecting(false);
                    },
                }
            });
            sessionPromiseRef.current = sessionPromise;
            sessionRef.current = await sessionPromise;
        } catch (error) {
            console.error('Failed to start conversation:', error);
            setStatus('Failed to start. Check mic permissions.');
            setIsConnecting(false);
        }
    };

    const stopConversation = () => {
        if (sessionRef.current) {
            sessionRef.current.close();
            sessionRef.current = null;
        }
        sessionPromiseRef.current = null;
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if(scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if(mediaStreamSourceRef.current) {
            mediaStreamSourceRef.current.disconnect();
            mediaStreamSourceRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
        }
        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
            outputAudioContextRef.current.close();
        }
        stopCamera();
        setIsActive(false);
        setIsConnecting(false);
        setIsAiSpeaking(false);
        setStatus('Tap to speak');
        setTranscription([]);
        setCurrentTurn({ user: '', ai: '' });
        stopAudioPlayback();
    };
    
    const toggleCamera = async () => {
        if (!isActive) {
            setStatus("Start conversation first to use camera.");
            return;
        }
        if (isCameraOn) {
            stopCamera();
            stopConversation();
            startConversation();
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                videoStreamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
                setIsCameraOn(true);
                stopConversation();
                await startConversation();

                frameIntervalRef.current = window.setInterval(() => {
                    if (videoRef.current && canvasRef.current && sessionPromiseRef.current) {
                        const videoEl = videoRef.current;
                        const canvasEl = canvasRef.current;
                        const ctx = canvasEl.getContext('2d');
                        if (!ctx) return;

                        canvasEl.width = videoEl.videoWidth;
                        canvasEl.height = videoEl.videoHeight;
                        ctx.drawImage(videoEl, 0, 0, videoEl.videoWidth, videoEl.videoHeight);
                        
                        canvasEl.toBlob(async (blob) => {
                            if (blob && sessionPromiseRef.current) {
                                const base64Data = await blobToBase64(blob);
                                sessionPromiseRef.current.then((session) => {
                                    session.sendRealtimeInput({
                                        media: { data: base64Data, mimeType: 'image/jpeg' }
                                    });
                                });
                            }
                        }, 'image/jpeg', JPEG_QUALITY);
                    }
                }, 1000 / FRAME_RATE);
            } catch (err) {
                console.error("Error accessing camera:", err);
                setStatus("Couldn't access camera.");
            }
        }
    };

    useEffect(() => {
        return () => {
            stopConversation();
        };
    }, []);

    const getCircleClasses = () => {
        if (isAiSpeaking) return `bg-${accentColor}/30 text-${accentColor} animate-speaking-wave`;
        if (isActive) return `bg-green-500/30 text-green-300 ${isPro ? 'animate-pro-glow-ring' : 'animate-pulse-glow'}`;
        if (isConnecting) return 'bg-gray-500/20 text-white';
        return 'bg-gray-500/20 text-white cursor-pointer hover:bg-gray-500/30';
    };

    return (
        <div className="flex flex-col h-full w-full animate-subtle-fade-in-up relative overflow-hidden">
             {/* 
                Automatic Aspect Ratio Container: 
                - Mobile: Fullscreen inset-0, covering everything behind the controls.
                - Desktop: Floating preview in top-right.
             */}
             {isCameraOn && (
                <div className={`
                    absolute z-0 transition-all duration-500 ease-in-out
                    md:top-6 md:right-6 md:w-48 md:h-48 md:rounded-2xl md:border-2 md:border-white/20 md:shadow-2xl md:inset-auto
                    inset-0 w-full h-full rounded-none
                `}>
                     <video 
                        ref={videoRef} 
                        autoPlay 
                        muted 
                        className="w-full h-full object-cover md:rounded-2xl transform scale-x-[-1]"
                    />
                </div>
            )}

            <div className={`relative z-10 flex flex-col h-full w-full p-6 md:p-8 ${isCameraOn ? 'bg-black/40 backdrop-blur-sm md:bg-transparent md:backdrop-blur-none' : ''}`}>
                <div className="flex items-center flex-shrink-0">
                    <Mic className={`w-8 h-8 mr-3 text-${accentColor}`} />
                    <h2 className="mode-title">Aura Sync</h2>
                </div>
                
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div
                        className={`w-48 h-48 md:w-60 md:h-60 rounded-full flex items-center justify-center relative transition-all duration-300 ease-in-out shadow-2xl ${getCircleClasses()}`}
                        onClick={isActive ? undefined : startConversation}
                        role="button"
                    >
                         {/* Centered Profile Image inside the interaction circle */}
                         {isPro && niharaProfileImage ? (
                             <div className={`absolute inset-0 rounded-full overflow-hidden opacity-90 ${isAiSpeaking ? 'scale-110' : 'scale-100'} transition-transform duration-500`}>
                                 <img src={niharaProfileImage} alt="Nihara" className="w-full h-full object-cover" />
                                 <div className={`absolute inset-0 bg-${accentColor}/20 mix-blend-overlay`}></div>
                             </div>
                         ) : null}

                        <div className="relative z-10">
                            {isConnecting && <Loader2 className="w-20 h-20 animate-spin text-white drop-shadow-md" />}
                            {!isConnecting && (isActive ? (isAiSpeaking ? <AudioWaveform className="w-24 h-24 text-white drop-shadow-md" /> : <Mic className="w-24 h-24 text-white drop-shadow-md" />) : <Mic className="w-24 h-24" />)}
                        </div>
                    </div>

                    <p className={`mt-6 text-xl h-7 font-medium tracking-wide drop-shadow-md ${isCameraOn ? 'text-white' : 'text-gray-300'}`}>{status}</p>
                    
                    {isActive && (
                        <div className="flex flex-wrap justify-center gap-4 mt-8">
                            <button
                                onClick={toggleCamera}
                                className={`flex items-center justify-center px-6 py-3 rounded-full font-bold transition-transform duration-200 hover:scale-105 ${isCameraOn ? `bg-blue-600 hover:bg-blue-700` : `bg-white/10 hover:bg-white/20 backdrop-blur-md`} text-white border border-white/10`}
                            >
                                {isCameraOn ? <CameraOff className="mr-2" /> : <Camera className="mr-2" />}
                                Camera
                            </button>
                            <button
                                onClick={stopConversation}
                                className="flex items-center justify-center px-8 py-3 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold transition-transform duration-200 hover:scale-105 shadow-lg"
                            >
                                <PhoneOff className="mr-3" />
                                End
                            </button>
                        </div>
                    )}
                </div>

                <canvas ref={canvasRef} className="hidden"></canvas>
                
                {/* Responsive Transcription Box */}
                <div className={`w-full max-w-4xl mx-auto h-40 md:h-48 rounded-2xl mt-auto p-4 overflow-y-auto space-y-4 text-sm scrollbar-thin scrollbar-thumb-white/20 ${isCameraOn ? 'bg-black/60 backdrop-blur-md' : 'bg-black/20'}`}>
                     {transcription.length === 0 && currentTurn.user === '' && currentTurn.ai === '' && (
                        <p className="text-gray-400 text-center pt-12">Conversation will appear here...</p>
                    )}
                    {[...transcription, currentTurn].map((turn, index) => (
                        (turn.user || turn.ai) && (
                            <div key={index}>
                                {turn.user && (
                                    <div className="flex justify-end animate-subtle-fade-in"><p className="max-w-[85%] bg-green-600/80 backdrop-blur-sm p-2 px-4 rounded-2xl rounded-tr-none text-white shadow-sm">{turn.user}</p></div>
                                )}
                                {turn.ai && (
                                    <div className="flex justify-start animate-subtle-fade-in mt-2"><p className={`max-w-[85%] p-2 px-4 rounded-2xl rounded-tl-none text-white shadow-sm backdrop-blur-sm ${isPro ? 'bg-purple-600/80' : 'bg-blue-600/80'}`}>{turn.ai}</p></div>
                                )}
                            </div>
                        )
                    ))}
                     <div ref={transcriptionEndRef} />
                </div>
            </div>
        </div>
    );
};

export default LiveMode;