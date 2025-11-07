
import { GoogleGenAI, GenerateContentResponse, Chat, Modality } from "@google/genai";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Text & Chat ---

export const createChat = (systemInstruction: string): Chat => {
  const ai = getAI();
  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: { systemInstruction },
  });
};

export const runQuickResponse = async (prompt: string): Promise<string> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error with quick response:", error);
    return "Sorry, I couldn't process that request.";
  }
};

export const runDeepDive = async (prompt: string): Promise<string> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 32768 },
      }
    });
    return response.text;
  } catch (error) {
    console.error("Error with deep dive:", error);
    return "An error occurred during the deep dive analysis.";
  }
};

// --- Grounding ---

export const runGroundedSearch = async (prompt: string): Promise<GenerateContentResponse> => {
  const ai = getAI();
  return await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });
};

export const runGroundedMapsSearch = async (prompt: string, latitude: number, longitude: number): Promise<GenerateContentResponse> => {
  const ai = getAI();
  return await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      tools: [{ googleMaps: {} }],
      toolConfig: {
        retrievalConfig: {
          latLng: { latitude, longitude },
        },
      },
    },
  });
};


// --- Image ---

export const generateImage = async (prompt: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateImages({
    model: 'imagen-4.0-generate-001',
    prompt: prompt,
    config: {
      numberOfImages: 1,
      outputMimeType: 'image/jpeg',
      aspectRatio: '1:1',
    },
  });
  return response.generatedImages[0].image.imageBytes;
};

export const editImage = async (prompt: string, imageBase64: string, mimeType: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: imageBase64, mimeType } },
        { text: prompt },
      ],
    },
    config: {
      responseModalities: [Modality.IMAGE],
    },
  });

  const part = response.candidates?.[0]?.content?.parts?.[0];
  if (part?.inlineData) {
    return part.inlineData.data;
  }
  throw new Error("No edited image found in response.");
};


export const analyzeImage = async (prompt: string, imageBase64: string, mimeType: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        { inlineData: { data: imageBase64, mimeType } },
        { text: prompt },
      ],
    }
  });
  return response.text;
};

// --- Video ---

export const analyzeVideo = async (prompt: string, videoFile: File): Promise<string> => {
  // NOTE: Direct video file analysis via `generateContent` is not supported by the client SDK.
  // This is a placeholder to demonstrate UI flow. In a real-world scenario, you would
  // use a backend service to process the video (e.g., extract frames) and send them to the API.
  console.log("Simulating video analysis for:", videoFile.name, "with prompt:", prompt);
  await new Promise(resolve => setTimeout(resolve, 2000));
  return `This is a simulated analysis for the video "${videoFile.name}". Gemini 2.5 Pro is ideal for this task, but client-side video upload for analysis is not directly supported. The prompt was: "${prompt}".`;
};

// --- Audio ---

export const transcribeAudio = async (audioBase64: string, mimeType: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        { inlineData: { data: audioBase64, mimeType } },
        { text: "Transcribe this audio." },
      ],
    },
  });
  return response.text;
};

export const textToSpeech = async (text: string): Promise<string> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
            },
        },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
        throw new Error("No audio data received from TTS API.");
    }
    return base64Audio;
};
