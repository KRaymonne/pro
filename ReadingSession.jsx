import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Volume2, 
  Mic, 
  Play, 
  Pause,
  RotateCcw,
  CheckCircle,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AudioPlayer from '../Audio/AudioPlayer';
import AudioRecorder from '../Audio/AudioRecorder';
import { lecturesAPI, enregistrementsAPI, audioAPI } from '../../lib/api';

const ReadingSession = ({ poesie, onComplete, onBack }) => {
  const [currentStep, setCurrentStep] = useState('reading'); // 'reading', 'listening', 'recording', 'completed'
  const [lecture, setLecture] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [startTime, setStartTime] = useState(null);

  useEffect(() => {
    initializeSession();
  }, [poesie._id]);

  const initializeSession = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Créer une nouvelle session de lecture
      const lectureResponse = await lecturesAPI.create({
        poesieId: poesie._id,
        statut: 'en-cours'
      });
      
      setLecture(lectureResponse.data.lecture);
      setStartTime(new Date());

      // Récupérer l'URL audio de la poésie
      const audioResponse = await audioAPI.getPoesieAudio(poesie._id);
      setAudioUrl(`http://localhost:5000${audioResponse.data.audioUrl}`);

    } catch (error) {
      console.error('Erreur lors de l\'initialisation de la session:', error);
      setError('Impossible de démarrer la session de lecture');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStepComplete = (step) => {
    switch (step) {
      case 'reading':
        setCurrentStep('listening');
        break;
      case 'listening':
        setCurrentStep('recording');
        break;
      case 'recording':
        setCurrentStep('completed');
        break;
      default:
        break;
    }
  };

  const handleRecordingComplete = async (audioBlob, duration) => {
    try {
      setIsLoading(true);
      
      // Créer un FormData pour l'upload
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('lectureId', lecture._id);
      formData.append('poesieId', poesie._id);
      formData.append('duree', duration);

      // Uploader l'enregistrement
      await enregistrementsAPI.upload(formData);
      
      // Marquer la lecture comme terminée
      const endTime = new Date();
      const totalDuration = Math.floor((endTime - startTime) / 1000);
      
      await lecturesAPI.update(lecture._id, {
        statut: 'terminee',
        dateFin: endTime,
        duree: totalDuration,
        progression: 100
      });

      handleStepComplete('recording');
      
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'enregistrement:', error);
      setError('Erreur lors de la sauvegarde de l\'enregistrement');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSessionComplete = () => {
    if (onComplete) {
      onComplete(lecture);
    }
  };

  const restartSession = () => {
    setCurrentStep('reading');
    setStartTime(new Date());
    setError(null);
  };

  const getStepProgress = () => {
    const steps = ['reading', 'listening', 'recording', 'completed'];
    const currentIndex = steps.indexOf(currentStep);
    return ((currentIndex + 1) / steps.length) * 100;
  };

  const getStepTitle = () => {
    const titles = {
      reading: 'Lecture du poème',
      listening: 'Écoute du modèle',
      recording: 'Votre enregistrement',
      completed: 'Session terminée'
    };
    return titles[currentStep] || '';
  };

  const getStepDescription = () => {
    const descriptions = {
      reading: 'Lisez le poème à voix haute pour vous familiariser avec le texte',
      listening: 'Écoutez la lecture modèle pour comprendre la prononciation et le rythme',
      recording: 'Enregistrez votre propre lecture du poème',
      completed: 'Félicitations ! Vous avez terminé cette session de lecture'
    };
    return descriptions[currentStep] || '';
  };

  if (isLoading && !lecture) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-8 h-8 animate-spin rounded-full border-2 border-orange-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Préparation de la session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* En-tête */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          onClick={onBack}
          className="border-gray-300"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{poesie.titre}</h1>
          <p className="text-gray-600">par {poesie.auteur}</p>
        </div>
        
        <div className="flex gap-2">
          <Badge variant="outline">{poesie.niveau}</Badge>
          <Badge variant="outline">{poesie.theme}</Badge>
        </div>
      </div>

      {/* Barre de progression */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progression de la session</span>
          <span>{Math.round(getStepProgress())}%</span>
        </div>
        <Progress value={getStepProgress()} className="h-2" />
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Contenu principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Texte du poème */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Texte du poème
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-lg max-w-none">
              <pre className="whitespace-pre-wrap font-serif text-lg leading-relaxed text-gray-900">
                {poesie.contenu}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Panneau d'activité */}
        <Card>
          <CardHeader>
            <CardTitle>{getStepTitle()}</CardTitle>
            <CardDescription>{getStepDescription()}</CardDescription>
          </CardHeader>
          <CardContent>
            {currentStep === 'reading' && (
              <div className="space-y-4">
                <div className="text-center p-8 bg-blue-50 rounded-lg">
                  <BookOpen className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Lisez le poème à voix haute
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Prenez votre temps pour vous familiariser avec le texte
                  </p>
                  <Button
                    onClick={() => handleStepComplete('reading')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    J'ai terminé la lecture
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 'listening' && audioUrl && (
              <div className="space-y-4">
                <AudioPlayer
                  src={audioUrl}
                  title="Lecture modèle"
                  onEnded={() => {
                    // Auto-avancer après la lecture
                    setTimeout(() => handleStepComplete('listening'), 1000);
                  }}
                />
                <div className="text-center">
                  <Button
                    onClick={() => handleStepComplete('listening')}
                    variant="outline"
                    className="mt-4"
                  >
                    Passer à l'enregistrement
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 'recording' && (
              <AudioRecorder
                title="Votre enregistrement"
                description="Enregistrez votre lecture du poème"
                onRecordingComplete={handleRecordingComplete}
                onUpload={handleRecordingComplete}
                maxDuration={300}
              />
            )}

            {currentStep === 'completed' && (
              <div className="text-center space-y-4">
                <div className="p-8 bg-green-50 rounded-lg">
                  <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Félicitations !
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Vous avez terminé cette session de lecture avec succès
                  </p>
                  
                  <div className="flex gap-3 justify-center">
                    <Button
                      onClick={restartSession}
                      variant="outline"
                      className="border-orange-300 text-orange-700 hover:bg-orange-100"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Recommencer
                    </Button>
                    
                    <Button
                      onClick={handleSessionComplete}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Terminer la session
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReadingSession;

