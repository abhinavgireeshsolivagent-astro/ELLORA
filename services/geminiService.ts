import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";

const getAiClient = () => {
    if (!process.env.API_KEY || process.env.API_KEY === "YOUR_GEMINI_API_KEY_HERE" || process.env.API_KEY === "") {
        console.error("Gemini API key not found or is a placeholder. Please ensure process.env.API_KEY is configured.");
        return null;
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
}

export const getChatResponse = async (
    history: { role: string; parts: { text: string }[] }[], 
    newMessage: string, 
    systemInstruction: string, // Now accepts combined instruction directly
    image?: { mimeType: string; data: string }
    ): Promise<string> => {
    try {
        const ai = getAiClient();
        if (!ai) {
          return "I'm sorry, but I can't connect right now. The application is missing its API Key configuration. Please contact the administrator.";
        }
        
        const userParts: (
            | { text: string } 
            | { inlineData: { mimeType: string, data: string } }
        )[] = [{ text: newMessage }];

        if (image) {
            userParts.unshift({
                inlineData: {
                    mimeType: image.mimeType,
                    data: image.data,
                },
            });
        }

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [...history, { role: 'user', parts: userParts }],
            config: {
                systemInstruction: systemInstruction, // Use the provided system instruction
                temperature: 0.8,
                topP: 0.9,
            }
        });
        
        return response.text;
    } catch (error) {
        console.error("Error getting chat response:", error);
        return "I'm sorry, I'm having a little trouble connecting right now. Please try again later.";
    }
};

export const getAstroPrediction = async (userInfo: string, systemInstruction: string): Promise<string> => {
    try {
        const ai = getAiClient();
        if (!ai) {
            return "The stars are misaligned because the application is missing its API Key. Please contact the administrator to fix the cosmic connection.";
        }

        const prompt = `Based on the following user information, provide a mystical, positive, and engaging horoscope or future prediction. Keep it around 150 words. User info: ${userInfo}.`;
        
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: systemInstruction, // Use the provided system instruction
            }
        });

        return response.text;
    } catch (error) {
        console.error("Error getting astro prediction:", error);
        return "The stars are a bit cloudy at the moment. Please try again when the cosmic energies have cleared.";
    }
};

export const generateImage = async (prompt: string, size: string): Promise<string | null> => {
    try {
        const ai = getAiClient();
        if (!ai) {
            return null;
        }

        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: `cinematic, high detail, 8k, photorealistic: ${prompt}`,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/jpeg',
              aspectRatio: size as "1:1" | "3:4" | "4:3" | "9:16" | "16:9",
            },
        });
        
        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            return `data:image/jpeg;base64,${base64ImageBytes}`;
        }
        return null;

    } catch (error) {
        console.error("Error generating image:", error);
        return null;
    }
};