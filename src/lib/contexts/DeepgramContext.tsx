"use client";

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { createClient, LiveTranscriptionEvents, LiveTranscriptionEvent } from '@deepgram/sdk';

interface DeepgramContextType {
  connectToDeepgram: () => Promise<void>;
  disconnectFromDeepgram: () => void;
  realtimeTranscript: string;
  isRecording: boolean;
}

const DeepgramContext = createContext<DeepgramContextType | undefined>(undefined);

export const DeepgramProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deepgramConnection, setDeepgramConnection] = useState<any>(null);
  const [realtimeTranscript, setRealtimeTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const keepAliveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const connectToDeepgram = useCallback(async () => {
    try {
      const response = await fetch('/api/deepgram');
      const data = await response.json();
      const apiKey = data.key;

      if (!apiKey) {
        throw new Error('Failed to retrieve Deepgram API key');
      }

      const deepgram = createClient(apiKey);

      const connection = deepgram.listen.live({ model: "nova" });

      connection.addListener(LiveTranscriptionEvents.Open, () => {
        connection.keepAlive();
        keepAliveIntervalRef.current = setInterval(() => {
          connection.keepAlive();
        }, 10000);
      });

      connection.addListener(LiveTranscriptionEvents.Transcript, (data: LiveTranscriptionEvent) => {
        const { is_final, speech_final } = data;
        let transcript = data.channel.alternatives[0].transcript;
        
        if (transcript !== '') {
          setRealtimeTranscript((prev) => {
            const newTranscript = prev + (prev ? ' ' : '') + transcript;
            return is_final || speech_final ? newTranscript + '\n' : newTranscript;
          });
        }
      });

      connection.addListener('error', (error) => {
        // Consider handling this error in a way that doesn't use console.error
      });

      setDeepgramConnection(connection);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      mediaRecorderRef.current.addEventListener('dataavailable', (event: BlobEvent) => {
        if (event.data.size > 0 && connection.getReadyState() === 1) {
          connection.send(event.data);
        }
      });

      mediaRecorderRef.current.start(250);
      setIsRecording(true);

    } catch (error) {
      // Consider handling this error in a way that doesn't use console.error
      throw error;
    }
  }, []);

  const disconnectFromDeepgram = useCallback(() => {
    if (deepgramConnection) {
      deepgramConnection.finish();
      setDeepgramConnection(null);
      setRealtimeTranscript('');
    }

    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }

    if (keepAliveIntervalRef.current) {
      clearInterval(keepAliveIntervalRef.current);
    }

    setIsRecording(false);
  }, [deepgramConnection, realtimeTranscript]);

  return (
    <DeepgramContext.Provider value={{ connectToDeepgram, disconnectFromDeepgram, realtimeTranscript, isRecording }}>
      {children}
    </DeepgramContext.Provider>
  );
};

export const useDeepgram = () => {
  const context = useContext(DeepgramContext);
  if (context === undefined) {
    throw new Error('useDeepgram must be used within a DeepgramProvider');
  }
  return context;
};
