import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, MicOff, X, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AIOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onRecordingComplete: (audioBlob: Blob) => void;
  isProcessing: boolean;
  transcription?: string;
  aiResponse?: string;
}

export const AIOverlay = ({ 
  isOpen, 
  onClose, 
  onRecordingComplete, 
  isProcessing,
  transcription,
  aiResponse 
}: AIOverlayProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      // Set up audio analysis
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      // Start audio level monitoring
      const updateAudioLevel = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / bufferLength;
          setAudioLevel(average / 255);
        }
        animationRef.current = requestAnimationFrame(updateAudioLevel);
      };
      updateAudioLevel();

      // Set up MediaRecorder
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      chunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        onRecordingComplete(audioBlob);
        
        // Cleanup
        stream.getTracks().forEach(track => track.stop());
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        setAudioLevel(0);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      toast.success("Recording started");
      
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Failed to start recording. Please check microphone permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.success("Recording stopped");
    }
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-background/95 backdrop-blur-sm border-border/50 shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-6 h-6 text-primary" />
            <span>AI Assistant</span>
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Recording Interface */}
          <div className="text-center space-y-4">
            {/* Audio Level Indicator */}
            {isRecording && (
              <div className="space-y-2">
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-75"
                    style={{ width: `${audioLevel * 100}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Audio Level: {Math.round(audioLevel * 100)}%
                </p>
              </div>
            )}

            {/* Record Button */}
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
              size="lg"
              className={cn(
                "w-16 h-16 rounded-full transition-all duration-300",
                isRecording
                  ? "bg-destructive hover:bg-destructive/90 animate-pulse"
                  : "bg-primary hover:bg-primary/90"
              )}
            >
              {isRecording ? (
                <MicOff className="w-6 h-6" />
              ) : (
                <Mic className="w-6 h-6" />
              )}
            </Button>

            <p className="text-sm text-muted-foreground">
              {isRecording ? "Click to stop recording" : "Click to start recording"}
            </p>
          </div>

          {/* Transcription Results */}
          {(transcription || aiResponse) && (
            <div className="space-y-4">
              {transcription && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground">Your Input:</h4>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-foreground">{transcription}</p>
                  </div>
                </div>
              )}

              {aiResponse && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground">AI Response:</h4>
                  <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <p className="text-sm text-foreground">{aiResponse}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {isProcessing && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Processing your request...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};