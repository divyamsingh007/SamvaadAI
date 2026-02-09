import { useState, useEffect, useCallback, useRef } from "react";
import Vapi from "@vapi-ai/web";
import type { CreateAssistantDTO } from "@vapi-ai/web/dist/api";
import { interviewerConfig } from "../constants/interview";
import type { Interview } from "../types";

const VAPI_PUBLIC_KEY = import.meta.env.VITE_VAPI_PUBLIC_KEY;

export interface TranscriptEntry {
  role: "assistant" | "user";
  text: string;
  isFinal: boolean;
  timestamp: number;
}

export interface UseVapiOptions {
  interview: Interview;
  onCallStart?: () => void;
  onCallEnd?: () => void;
  onMessage?: (message: any) => void;
  onError?: (error: Error) => void;
}

export interface UseVapiReturn {
  isCallActive: boolean;
  isMuted: boolean;
  isLoading: boolean;
  error: string | null;
  startCall: () => Promise<void>;
  stopCall: () => void;
  forceStop: () => void;
  toggleMute: () => void;
  transcript: TranscriptEntry[];
}

export function useVapi({
  interview,
  onCallStart,
  onCallEnd,
  onMessage,
  onError,
}: UseVapiOptions): UseVapiReturn {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);

  const vapiRef = useRef<Vapi | null>(null);

  useEffect(() => {
    if (!VAPI_PUBLIC_KEY) {
      setError("Vapi public key not configured");
      return;
    }

    // Initialize Vapi
    const vapi = new Vapi(VAPI_PUBLIC_KEY);
    vapiRef.current = vapi;

    // Set up event listeners
    vapi.on("call-start", () => {
      setIsCallActive(true);
      setIsLoading(false);
      setError(null);
      onCallStart?.();
    });

    vapi.on("call-end", () => {
      setIsCallActive(false);
      setIsLoading(false);
      onCallEnd?.();
    });

    vapi.on("message", (message) => {
      if (message.type === "transcript") {
        const role: "assistant" | "user" =
          message.role === "assistant" ? "assistant" : "user";
        const text = message.transcript || message.text || "";
        const isFinal = message.transcriptType === "final";

        if (!text.trim()) return;

        setTranscript((prev) => {
          if (isFinal) {
            const withoutPartial = prev.filter(
              (e) => !(e.role === role && !e.isFinal),
            );
            return [
              ...withoutPartial,
              { role, text, isFinal: true, timestamp: Date.now() },
            ];
          } else {
            const idx = prev.findIndex((e) => e.role === role && !e.isFinal);
            if (idx >= 0) {
              const updated = [...prev];
              updated[idx] = { ...updated[idx], text };
              return updated;
            }
            return [
              ...prev,
              { role, text, isFinal: false, timestamp: Date.now() },
            ];
          }
        });
      }
      onMessage?.(message);
    });

    vapi.on("error", (err) => {
      setError(err.message || "An error occurred");
      setIsLoading(false);
      onError?.(err);
    });

    // Cleanup
    return () => {
      vapi.stop();
    };
  }, [onCallStart, onCallEnd, onMessage, onError]);

  const startCall = useCallback(async () => {
    if (!vapiRef.current || isCallActive) return;

    setIsLoading(true);
    setError(null);

    try {
      // Format questions for the assistant
      const questionsText = interview.questions
        .map((q, i) => `${i + 1}. ${q}`)
        .join("\n");

      // Create assistant config with interview questions
      const assistantConfig: CreateAssistantDTO = {
        ...interviewerConfig,
        model: interviewerConfig.model
          ? {
              ...interviewerConfig.model,
              messages: interviewerConfig.model.messages
                ? [
                    {
                      role: "system",
                      content:
                        interviewerConfig.model.messages[0]?.content?.replace(
                          "{{questions}}",
                          questionsText,
                        ) || "",
                    },
                  ]
                : [],
            }
          : undefined,
      };

      await vapiRef.current.start(assistantConfig);
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to start call");
      setError(error.message);
      setIsLoading(false);
      onError?.(error);
    }
  }, [interview, isCallActive, onError]);

  const stopCall = useCallback(() => {
    if (!vapiRef.current) return;
    vapiRef.current.stop();
  }, []);

  const forceStop = useCallback(() => {
    if (!vapiRef.current) return;
    try {
      vapiRef.current.setMuted(true);
    } catch {}
    try {
      vapiRef.current.stop();
    } catch {}
    setIsCallActive(false);
    setIsLoading(false);
    setIsMuted(false);
  }, []);

  const toggleMute = useCallback(() => {
    if (!vapiRef.current || !isCallActive) return;
    const newMutedState = !isMuted;
    vapiRef.current.setMuted(newMutedState);
    setIsMuted(newMutedState);
  }, [isMuted, isCallActive]);

  return {
    isCallActive,
    isMuted,
    isLoading,
    error,
    startCall,
    stopCall,
    forceStop,
    toggleMute,
    transcript,
  };
}
