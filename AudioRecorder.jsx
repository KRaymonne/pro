import React, { useEffect } from 'react';
import { 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  Square, 
  RotateCcw,
  Upload,
  Volume2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';

const AudioRecorder = ({ 
  onRecordingComplete, 
  onUpload, 
  maxDuration = 300, // 5 minutes par défaut
  title = "Enregistrement Audio",
  description = "Enregistrez votre lecture de la poésie"
}) => {
  const {
    isRecording,
    isPaused,
    recordingTime,
    audioBlob,
    error,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    clearRecording,
    cleanup,
    formatTime,
    canRecord,
    canPause,
    canResume,
    canStop,
    hasRecording
  } = useAudioRecorder();

  const [isPlaying, setIsPlaying] = React.useState(false);
  const [audioElement, setAudioElement] = React.useState(null);
  const [isUploading, setIsUploading] = React.useState(false);

  // Nettoyer les ressources lors du démontage
  useEffect(() => {
    return () => {
      cleanup();
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
      }
    };
  }, [cleanup, audioElement]);

  // Arrêter automatiquement l'enregistrement si la durée maximale est atteinte
  useEffect(() => {
    if (recordingTime >= maxDuration && isRecording) {
      stopRecording();
    }
  }, [recordingTime, maxDuration, isRecording, stopRecording]);

  // Notifier le parent quand un enregistrement est terminé
  useEffect(() => {
    if (audioBlob && onRecordingComplete) {
      onRecordingComplete(audioBlob, recordingTime);
    }
  }, [audioBlob, recordingTime, onRecordingComplete]);

  const playRecording = () => {
    if (!audioBlob) return;

    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }

    if (isPlaying) {
      setIsPlaying(false);
      setAudioElement(null);
      return;
    }

    const url = URL.createObjectURL(audioBlob);
    const audio = new Audio(url);
    
    audio.onended = () => {
      setIsPlaying(false);
      setAudioElement(null);
      URL.revokeObjectURL(url);
    };

    audio.onerror = () => {
      setIsPlaying(false);
      setAudioElement(null);
      URL.revokeObjectURL(url);
    };

    audio.play();
    setIsPlaying(true);
    setAudioElement(audio);
  };

  const handleUpload = async () => {
    if (!audioBlob || !onUpload) return;

    setIsUploading(true);
    try {
      await onUpload(audioBlob, recordingTime);
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const progressPercentage = (recordingTime / maxDuration) * 100;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="w-5 h-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Indicateur de temps et progression */}
        <div className="text-center">
          <div className="text-2xl font-mono font-bold text-gray-900 mb-2">
            {formatTime}
          </div>
          {isRecording && (
            <div className="space-y-2">
              <Progress value={progressPercentage} className="h-2" />
              <p className="text-xs text-gray-500">
                {Math.floor((maxDuration - recordingTime) / 60)}:{((maxDuration - recordingTime) % 60).toString().padStart(2, '0')} restantes
              </p>
            </div>
          )}
        </div>

        {/* Indicateur visuel d'enregistrement */}
        {isRecording && (
          <div className="flex items-center justify-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-red-600">
              {isPaused ? 'En pause' : 'Enregistrement en cours...'}
            </span>
          </div>
        )}

        {/* Contrôles d'enregistrement */}
        <div className="flex justify-center gap-2">
          {canRecord && (
            <Button
              onClick={startRecording}
              className="bg-red-600 hover:bg-red-700 text-white"
              size="lg"
            >
              <Mic className="w-5 h-5 mr-2" />
              Enregistrer
            </Button>
          )}

          {canPause && (
            <Button
              onClick={pauseRecording}
              variant="outline"
              size="lg"
            >
              <Pause className="w-5 h-5" />
            </Button>
          )}

          {canResume && (
            <Button
              onClick={resumeRecording}
              className="bg-red-600 hover:bg-red-700 text-white"
              size="lg"
            >
              <Play className="w-5 h-5" />
            </Button>
          )}

          {canStop && (
            <Button
              onClick={stopRecording}
              variant="outline"
              size="lg"
            >
              <Square className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* Contrôles de lecture et actions */}
        {hasRecording && (
          <div className="space-y-3">
            <div className="flex justify-center gap-2">
              <Button
                onClick={playRecording}
                variant="outline"
                className="border-green-300 text-green-700 hover:bg-green-100"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 mr-2" />
                    Écouter
                  </>
                )}
              </Button>

              <Button
                onClick={clearRecording}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Recommencer
              </Button>
            </div>

            {onUpload && (
              <Button
                onClick={handleUpload}
                disabled={isUploading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Sauvegarder l'enregistrement
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {/* Informations sur les permissions */}
        {!isRecording && !hasRecording && (
          <div className="text-center text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
            <p>Cliquez sur "Enregistrer" pour commencer.</p>
            <p className="mt-1">Votre navigateur vous demandera l'autorisation d'accéder au microphone.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AudioRecorder;

