import { useState, useCallback } from "react";
import { Navigation } from "@/components/ui/navigation";
import { WaveformRecorder } from "@/components/waveform-recorder";
import { ConsoleLog, LogEntry } from "@/components/console-log";
import { TranscriptionDisplay, TranscriptionEntry } from "@/components/transcription-display";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Brain, AlertCircle, Settings as SettingsIcon } from "lucide-react";
import { ReplicateService, GeminiService, TextToSpeechService, WebSpeechService } from "@/lib/api-services";
import { loadSettings, validateSettings } from "@/lib/settings";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const Index = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [transcriptions, setTranscriptions] = useState<TranscriptionEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const settings = loadSettings();
  const settingsValid = validateSettings(settings).length === 0;
  const ttsService = new TextToSpeechService();

  const addLog = useCallback((step: string, message: string, type: LogEntry["type"] = "info", duration?: number) => {
    const newLog: LogEntry = {
      id: Date.now().toString(),
      timestamp: new Date(),
      step,
      message,
      type,
      duration
    };
    setLogs(prev => [...prev, newLog]);
  }, []);

  const handleRecordingComplete = async (audioBlob: Blob) => {
    if (!settingsValid) {
      toast.error("Please configure API keys in Settings first");
      return;
    }

    setIsProcessing(true);
    const startTime = Date.now();
    
    try {
      addLog("Recording", "Audio recording completed", "success");
      
      // Step 1: Transcribe audio with fallback to Web Speech API
      let transcriptionResult;
      const transcriptionStart = Date.now();
      
      try {
        addLog("Transcription", "Attempting Replicate API transcription...", "info");
        const replicateService = new ReplicateService({
          apiKey: settings.replicateApiKey,
          model: settings.replicateModel
        });
        transcriptionResult = await replicateService.transcribeAudio(audioBlob);
      } catch (replicateError) {
        console.error("Replicate API transcription failed:", replicateError);
        const errorMessage = replicateError instanceof Error ? replicateError.message : "Unknown error";
        addLog("Transcription", `Replicate API failed: ${errorMessage}`, "error");
        addLog("Transcription", "Falling back to Web Speech API...", "warning");
        
        const webSpeechService = new WebSpeechService();
        if (!webSpeechService.isSupported()) {
          console.error("Web Speech API not supported - no transcription methods available");
          throw new Error("Neither Replicate API nor Web Speech API are available");
        }
        
        try {
          transcriptionResult = await webSpeechService.transcribeAudioBlob(audioBlob);
        } catch (webSpeechError) {
          console.error("Web Speech API fallback also failed:", webSpeechError);
          throw webSpeechError;
        }
      }
      
      const transcriptionDuration = Date.now() - transcriptionStart;
      addLog("Transcription", `Audio transcribed successfully`, "success", transcriptionDuration);
      addLog("Transcription", `Text: "${transcriptionResult.transcription}"`, "info");

      if (!transcriptionResult.transcription.trim()) {
        addLog("Transcription", "No speech detected in audio", "warning");
        toast.warning("No speech detected. Please try again.");
        return;
      }

      // Step 2: Generate AI response with Gemini
      addLog("AI Processing", "Sending transcription to Gemini AI...", "info");
      const aiStart = Date.now();
      
      const geminiService = new GeminiService({
        apiKey: settings.geminiApiKey,
        model: settings.geminiModel
      });
      
      const aiResult = await geminiService.generateResponse(transcriptionResult.transcription);
      const aiDuration = Date.now() - aiStart;
      
      addLog("AI Processing", "AI response generated successfully", "success", aiDuration);
      addLog("AI Processing", `Response: "${aiResult.response.substring(0, 100)}..."`, "info");

      // Step 3: Play back the response
      addLog("Playback", "Starting text-to-speech playback...", "info");
      const playbackStart = Date.now();
      
      setIsPlaying(true);
      await ttsService.speak(aiResult.response);
      const playbackDuration = Date.now() - playbackStart;
      
      addLog("Playback", "Playback completed", "success", playbackDuration);

      // Add to transcription history
      const newTranscription: TranscriptionEntry = {
        id: Date.now().toString(),
        timestamp: new Date(),
        userInput: transcriptionResult.transcription,
        aiResponse: aiResult.response,
        language: transcriptionResult.language
      };
      setTranscriptions(prev => [newTranscription, ...prev]);

      const totalDuration = Date.now() - startTime;
      addLog("Complete", `Total process completed`, "success", totalDuration);
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

  const handlePlayResponse = async (text: string) => {
    if (isPlaying) return;
    
    try {
      setIsPlaying(true);
      addLog("Playback", "Replaying AI response...", "info");
      await ttsService.speak(text);
      addLog("Playback", "Replay completed", "success");
    } catch (error) {
      console.error("Playback error:", error);
      addLog("Playback", "Playback failed", "error");
      toast.error("Failed to play response");
    } finally {
      setIsPlaying(false);
    }
  };

  if (!settingsValid) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-12 max-w-2xl">
          <div className="text-center space-y-6">
            <div className="space-y-2">
              <Brain className="w-16 h-16 mx-auto text-ai-glow" />
              <h1 className="text-3xl font-bold text-foreground">WorkingEdge ATLAS</h1>
              <p className="text-muted-foreground">AI Multi Lingual Assistant</p>
            </div>
            
            <Alert className="border-ai-warning/50 bg-ai-warning/5">
              <AlertCircle className="h-4 w-4 text-ai-warning" />
              <AlertDescription className="text-ai-warning">
                <div className="space-y-2">
                  <p className="font-medium">Setup Required</p>
                  <p>Please configure your API keys in Settings to start using the AI assistant.</p>
                </div>
              </AlertDescription>
            </Alert>

            <Link to="/settings">
              <Button size="lg" className="flex items-center space-x-2">
                <SettingsIcon className="w-5 h-5" />
                <span>Go to Settings</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center space-x-2">
              <Brain className="w-8 h-8 text-ai-glow" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-ai-glow to-accent bg-clip-text text-transparent">
                WorkingEdge ATLAS
              </h1>
            </div>
            <p className="text-muted-foreground">
              AI Multi Lingual Assistant - Record, Transcribe, Respond
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Voice Recorder */}
            <div className="lg:col-span-1">
              <WaveformRecorder 
                onRecordingComplete={handleRecordingComplete}
                isProcessing={isProcessing}
              />
            </div>

            {/* Console Log */}
            <div className="lg:col-span-2">
              <ConsoleLog logs={logs} />
            </div>
          </div>

          {/* Transcription Display */}
          <div className="w-full">
            <TranscriptionDisplay 
              transcriptions={transcriptions}
              isPlaying={isPlaying}
              onPlayResponse={handlePlayResponse}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
