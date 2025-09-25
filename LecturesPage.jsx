import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  BarChart3, 
  Save, 
  Award,
  Volume2,
  Play,
  Pause,
  Mic,
  MicOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { lecturesAPI, enregistrementsAPI } from '../lib/api';

const LecturesPage = () => {
  const [lectures, setLectures] = useState([]);
  const [enregistrements, setEnregistrements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [audioElement, setAudioElement] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [lecturesResponse, enregistrementsResponse] = await Promise.all([
        lecturesAPI.getAll({ limit: 10 }),
        enregistrementsAPI.getUserEnregistrements({ limit: 10 })
      ]);
      
      setLectures(lecturesResponse.data.lectures);
      setEnregistrements(enregistrementsResponse.data.enregistrements);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const playAudio = (audioUrl, id) => {
    try {
      // Arrêter l'audio en cours
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
      }

      if (currentAudio === id) {
        setCurrentAudio(null);
        setAudioElement(null);
        return;
      }

      const audio = new Audio(`http://localhost:5000${audioUrl}`);
      audio.onended = () => {
        setCurrentAudio(null);
        setAudioElement(null);
      };
      
      audio.play();
      setCurrentAudio(id);
      setAudioElement(audio);
    } catch (error) {
      console.error('Erreur lors de la lecture audio:', error);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        // Ici, vous pourriez uploader l'enregistrement
        console.log('Enregistrement terminé', blob);
        
        // Arrêter le stream
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('Erreur lors du démarrage de l\'enregistrement:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setMediaRecorder(null);
      setIsRecording(false);
    }
  };

  const getStatutColor = (statut) => {
    const colors = {
      'terminee': 'bg-green-100 text-green-800',
      'en-cours': 'bg-blue-100 text-blue-800',
      'abandonnee': 'bg-red-100 text-red-800'
    };
    return colors[statut] || 'bg-gray-100 text-gray-800';
  };

  const getQualiteColor = (qualite) => {
    const colors = {
      'excellente': 'bg-green-100 text-green-800',
      'tres-bonne': 'bg-blue-100 text-blue-800',
      'bonne': 'bg-yellow-100 text-yellow-800',
      'a-ameliorer': 'bg-red-100 text-red-800'
    };
    return colors[qualite] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-8">
        <BookOpen className="w-8 h-8 text-purple-600" />
        <h1 className="text-3xl font-bold text-gray-900">Mes Lectures</h1>
      </div>

      {/* Contrôles d'enregistrement */}
      <div className="mb-8 p-4 bg-purple-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-4">Enregistrement vocal</h3>
        <div className="flex items-center gap-4">
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            className={isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-purple-600 hover:bg-purple-700'}
          >
            {isRecording ? (
              <>
                <MicOff className="w-4 h-4 mr-2" />
                Arrêter l'enregistrement
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 mr-2" />
                Commencer l'enregistrement
              </>
            )}
          </Button>
          {isRecording && (
            <div className="flex items-center gap-2 text-red-600">
              <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Enregistrement en cours...</span>
            </div>
          )}
        </div>
      </div>

      {/* Historique des lectures */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Historique des Lectures</h2>
        </div>
        
        <div className="space-y-4">
          {lectures.map((lecture) => (
            <Card key={lecture._id} className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <Award className="w-6 h-6 text-green-600" />
                    <div>
                      <h3 className="font-semibold text-gray-900">{lecture.poesieId?.titre}</h3>
                      <p className="text-sm text-gray-600">
                        {formatDate(lecture.dateDebut)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600 mb-1">Score</div>
                    <div className="text-2xl font-bold text-green-600">
                      {lecture.score ? `${Math.round(lecture.score)}%` : 'N/A'}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge className={getStatutColor(lecture.statut)}>
                    {lecture.statut}
                  </Badge>
                  {lecture.duree && (
                    <Badge variant="outline">
                      Durée: {formatDuration(lecture.duree)}
                    </Badge>
                  )}
                  {lecture.motsDifficiles && lecture.motsDifficiles.length > 0 && (
                    <Badge variant="outline">
                      {lecture.motsDifficiles.length} mots difficiles
                    </Badge>
                  )}
                </div>

                {lecture.progression !== undefined && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progression</span>
                      <span>{Math.round(lecture.progression)}%</span>
                    </div>
                    <Progress value={lecture.progression} className="h-2" />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {lectures.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune lecture</h3>
              <p className="text-gray-600">Commencez par lire une poésie dans la bibliothèque.</p>
            </div>
          )}
        </div>
      </div>

      {/* Mes enregistrements */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <Save className="w-6 h-6 text-purple-600" />
          <h2 className="text-xl font-semibold text-gray-900">Mes Enregistrements</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {enregistrements.map((enregistrement) => (
            <Card key={enregistrement._id} className="bg-purple-50 border-purple-100">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Volume2 className="w-6 h-6 text-purple-600" />
                  <CardTitle className="text-gray-900">{enregistrement.poesieId?.titre}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600 mb-4">
                  <p>Enregistré: {formatDate(enregistrement.dateEnregistrement)}</p>
                  <p>Durée: {formatDuration(enregistrement.duree)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span>Qualité:</span>
                    <Badge className={getQualiteColor(enregistrement.qualite)}>
                      {enregistrement.qualite}
                    </Badge>
                  </div>
                  {enregistrement.scoreComparaison && (
                    <p className="mt-1">Score de comparaison: {Math.round(enregistrement.scoreComparaison)}%</p>
                  )}
                </div>
                
                <div className="flex gap-3">
                  <Button
                    onClick={() => playAudio(enregistrement.fichierUrl, `enr-${enregistrement._id}`)}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    {currentAudio === `enr-${enregistrement._id}` ? (
                      <Pause className="w-4 h-4 mr-2" />
                    ) : (
                      <Play className="w-4 h-4 mr-2" />
                    )}
                    Écouter
                  </Button>
                  <Button
                    variant="outline"
                    className="border-purple-300 text-purple-700 hover:bg-purple-100"
                  >
                    Comparer
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {enregistrements.length === 0 && (
            <div className="col-span-2 text-center py-12">
              <Mic className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun enregistrement</h3>
              <p className="text-gray-600">Commencez par enregistrer votre lecture d'une poésie.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LecturesPage;

