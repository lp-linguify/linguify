import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SpeakingQuestionData {
  id: string;
  question: string;
  prompt: string;
  expected_keywords?: string[];
  time_limit?: number; // in seconds
  sample_answer?: string;
  explanation?: string;
}

interface SpeakingQuestionProps {
  data: SpeakingQuestionData;
  onAnswer: (answer: { text: string; audio?: Blob }) => void;
  savedAnswer?: { text: string; audio?: string };
}

const SpeakingQuestion: React.FC<SpeakingQuestionProps> = ({
  data,
  onAnswer,
  savedAnswer,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(data.time_limit || 60);
  const [showValidation, setShowValidation] = useState(false);
  const [recordingPermissionDenied, setRecordingPermissionDenied] = useState(false);
  
  // Speech recognition state
  const [recognition, setRecognition] = useState<any>(null);
  
  // Timer reference for countdown
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);
  
  // Media recorder for audio
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      // @ts-ignore - TypeScript doesn't know about webkit prefixed APIs
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      
      recognitionInstance.onresult = (event: any) => {
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          }
        }
        
        if (finalTranscript) {
          setTranscript((prev) => {
            const updatedTranscript = prev ? `${prev} ${finalTranscript}` : finalTranscript;
            return updatedTranscript;
          });
        }
      };
      
      setRecognition(recognitionInstance);
    }
    
    // Load saved answer if available
    if (savedAnswer) {
      setTranscript(savedAnswer.text || '');
      // Note: We can't restore the audio Blob from storage easily
    }
    
    // Clean up on unmount
    return () => {
      if (recognition) {
        try {
          recognition.stop();
        } catch (e) {
          // Ignore errors when stopping
        }
      }
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, [savedAnswer]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Initialize media recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        
        // Stop all audio tracks to release the microphone
        stream.getAudioTracks().forEach(track => track.stop());
      };
      
      // Start media recorder
      mediaRecorder.start();
      
      // Start speech recognition
      if (recognition) {
        recognition.start();
      }
      
      setIsRecording(true);
      setRecordingPermissionDenied(false);
      setShowValidation(false);
      
      // Start countdown timer if time limit is set
      if (data.time_limit) {
        setTimeRemaining(data.time_limit);
        
        timerRef.current = setInterval(() => {
          setTimeRemaining((prevTime) => {
            if (prevTime <= 1) {
              stopRecording();
              return 0;
            }
            return prevTime - 1;
          });
        }, 1000);
      }
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setRecordingPermissionDenied(true);
    }
  };

  const stopRecording = () => {
    // Stop the timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Stop speech recognition
    if (recognition) {
      try {
        recognition.stop();
      } catch (e) {
        // Ignore errors when stopping
      }
    }
    
    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    setIsRecording(false);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTranscript(e.target.value);
    setShowValidation(false);
  };

  const handleSubmit = () => {
    if (isRecording) {
      stopRecording();
    }
    
    if (!transcript.trim()) {
      setShowValidation(true);
      return;
    }
    
    onAnswer({
      text: transcript,
      audio: audioBlob || undefined,
    });
  };

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div className="text-lg font-medium mb-2">{data.question}</div>
      
      <Card className="p-4 bg-gray-50 dark:bg-gray-900/50">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Speaking Prompt</h3>
            {data.time_limit && (
              <Badge variant={isRecording ? "destructive" : "outline"}>
                {isRecording ? formatTime(timeRemaining) : `Time limit: ${formatTime(data.time_limit)}`}
              </Badge>
            )}
          </div>
          <p>{data.prompt}</p>
          {data.expected_keywords && data.expected_keywords.length > 0 && (
            <div className="mt-2">
              <h4 className="text-sm font-medium mb-1">Try to include these keywords:</h4>
              <div className="flex flex-wrap gap-2">
                {data.expected_keywords.map((keyword, index) => (
                  <Badge key={index} variant="secondary">{keyword}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
      
      {recordingPermissionDenied && (
        <Alert variant="destructive">
          <AlertDescription>
            Microphone access was denied. Please enable microphone access in your browser settings to record your answer.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Your Response</h3>
          <div className="flex gap-2">
            {isRecording ? (
              <div className="flex items-center">
                <span className="w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse"></span>
                <span className="text-sm text-gray-500">Recording...</span>
              </div>
            ) : (
              audioBlob && (
                <audio 
                  controls 
                  src={URL.createObjectURL(audioBlob)} 
                  className="max-w-[200px]"
                />
              )
            )}
          </div>
        </div>
        
        <Textarea
          placeholder="Your spoken response will appear here. You can also type your answer directly."
          value={transcript}
          onChange={handleTextChange}
          className={`min-h-[120px] ${showValidation && !transcript.trim() ? 'border-red-500' : ''}`}
          disabled={isRecording}
        />
        
        {showValidation && !transcript.trim() && (
          <p className="text-red-500 text-sm">
            Please provide a response before submitting.
          </p>
        )}
        
        <div className="flex gap-3">
          {!isRecording ? (
            <Button 
              type="button" 
              variant="outline" 
              onClick={startRecording}
              className="flex items-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
              Start Recording
            </Button>
          ) : (
            <Button 
              type="button" 
              variant="outline" 
              onClick={stopRecording}
              className="flex items-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="16" height="16" x="4" y="4" />
              </svg>
              Stop Recording
            </Button>
          )}
        </div>
      </div>
      
      <div className="flex justify-end mt-6">
        <Button onClick={handleSubmit} disabled={isRecording}>Submit</Button>
      </div>
    </div>
  );
};

export default SpeakingQuestion;