'use client';

import { useState, useCallback, useRef } from 'react';
import { useDeepgram } from '../lib/contexts/DeepgramContext';
import { addNote } from '../lib/firebase/firebaseUtils';
import { Mic, MicOff } from 'lucide-react';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function VoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { connectToDeepgram, disconnectFromDeepgram, realtimeTranscript } = useDeepgram();
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const handleStartRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      
      await connectToDeepgram();
      
      setIsRecording(true);
      setError(null);
    } catch (error) {
      setError(`Failed to start recording: ${(error as Error).message}`);
    }
  }, [connectToDeepgram]);

  const handleStopRecording = useCallback(async () => {
    disconnectFromDeepgram();
    setIsRecording(false);
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    if (realtimeTranscript.trim()) {
      try {
        await addNote({
          content: realtimeTranscript.trim(),
          createdAt: new Date(),
        });
      } catch (error) {
        setError(`Failed to save the note: ${(error as Error).message}`);
      }
    } else {
      setError("No transcript was generated. Please try again.");
    }
  }, [disconnectFromDeepgram, realtimeTranscript]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md bg-gray-800 text-white border-none shadow-xl">
        <CardHeader>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            className={`w-full ${
              isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
            size="lg"
            onClick={isRecording ? handleStopRecording : handleStartRecording}
          >
            {isRecording ? (
              <>
                <MicOff className="mr-2 h-4 w-4" /> Stop Recording
              </>
            ) : (
              <>
                <Mic className="mr-2 h-4 w-4" /> Start Recording
              </>
            )}
          </Button>
          <div className="bg-gray-700 p-4 rounded-md min-h-[200px] overflow-y-auto">
            <p className="text-gray-200 whitespace-pre-wrap font-mono">
              {isRecording ? realtimeTranscript || 'Listening...' : 'Transcript will appear here...'}
            </p>
          </div>
          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}