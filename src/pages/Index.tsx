import { useState, useCallback } from "react";
import { TVNavigation } from "@/components/tv-navigation";
import { AIOverlay } from "@/components/ai-overlay";
import { HeroCarousel } from "@/components/hero-carousel";
import { AppGrid } from "@/components/app-grid";
import { ContentRow } from "@/components/content-row";
import { ReplicateService, GeminiService, TextToSpeechService, WebSpeechService } from "@/lib/api-services";
import { loadSettings, validateSettings } from "@/lib/settings";
import { toast } from "sonner";

const Index = () => {
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTranscription, setCurrentTranscription] = useState<string>("");
  const [currentAIResponse, setCurrentAIResponse] = useState<string>("");

  const settings = loadSettings();
  const settingsValid = validateSettings(settings).length === 0;
  const ttsService = new TextToSpeechService();

  const addLog = useCallback((step: string, message: string, type: "info" | "success" | "error" | "warning" = "info", duration?: number) => {
    // For TV interface, we'll just log to console instead of showing in UI
    console.log(`[${step}] ${message}`, { type, duration });
  }, []);

  const handleRecordingComplete = async (audioBlob: Blob) => {
    if (!settingsValid) {
      toast.error("API configuration error");
      return;
    }

    setIsProcessing(true);
    setCurrentTranscription("");
    setCurrentAIResponse("");
    
    try {
      addLog("Recording", "Audio recording completed", "success");
      
      // Step 1: Transcribe audio with fallback to Web Speech API
      let transcriptionResult;
      
      try {
        addLog("Transcription", "Attempting Replicate API transcription...", "info");
        const replicateService = new ReplicateService({
          apiKey: settings.replicateApiKey,
          model: settings.replicateModel
        });
        transcriptionResult = await replicateService.transcribeAudio(audioBlob);
      } catch (replicateError) {
        console.error("Replicate API transcription failed:", replicateError);
        addLog("Transcription", "Falling back to Web Speech API...", "warning");
        
        const webSpeechService = new WebSpeechService();
        if (!webSpeechService.isSupported()) {
          throw new Error("Neither Replicate API nor Web Speech API are available");
        }
        
        try {
          transcriptionResult = await webSpeechService.transcribeAudioBlob(audioBlob);
        } catch (webSpeechError) {
          throw webSpeechError;
        }
      }
      
      addLog("Transcription", "Audio transcribed successfully", "success");
      setCurrentTranscription(transcriptionResult.transcription);

      if (!transcriptionResult.transcription.trim()) {
        toast.warning("No speech detected. Please try again.");
        return;
      }

      // Step 2: Generate AI response with Gemini
      addLog("AI Processing", "Sending transcription to Gemini AI...", "info");
      
      const geminiService = new GeminiService({
        apiKey: settings.geminiApiKey,
        model: settings.geminiModel
      });
      
      const aiResult = await geminiService.generateResponse(transcriptionResult.transcription);
      addLog("AI Processing", "AI response generated successfully", "success");
      setCurrentAIResponse(aiResult.response);

      // Step 3: Play back the response (only output, not input)
      addLog("Playback", "Starting text-to-speech playback...", "info");
      setIsPlaying(true);
      await ttsService.speak(aiResult.response);
      addLog("Playback", "Playback completed", "success");

      toast.success("Conversation completed successfully!");

    } catch (error) {
      console.error("Processing error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      addLog("Error", `Process failed: ${errorMessage}`, "error");
      toast.error(`Process failed: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
      setIsPlaying(false);
    }
  };



  return (
    <div className="min-h-screen bg-background">
      <TVNavigation onAIClick={() => setIsAIOpen(true)} />
      
      <div className="px-8 py-6 space-y-8">
        {/* Hero Carousel */}
        <HeroCarousel />
        
        {/* App Grid */}
        <AppGrid />
        
        {/* Content Rows */}
        <ContentRow title="Recommended Movies" />
        <ContentRow title="Popular Shows" />
        <ContentRow title="Recently Watched" />
      </div>

      {/* AI Overlay */}
      <AIOverlay
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
        onRecordingComplete={handleRecordingComplete}
        isProcessing={isProcessing}
        transcription={currentTranscription}
        aiResponse={currentAIResponse}
      />
    </div>
  );
};

export default Index;
