import React, { useState, useEffect } from 'react';
import { 
  Library, 
  Search, 
  BookOpen, 
  Heart,
  Play,
  Volume2,
  VolumeX
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ReadingSession from '../components/Reading/ReadingSession';
import { poesiesAPI, favorisAPI, audioAPI } from '../lib/api';

const BibliotequePage = () => {
  const [poesies, setPoesies] = useState([]);
  const [favoris, setFavoris] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPoesie, setSelectedPoesie] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    niveau: '',
    theme: '',
    difficulte: ''
  });
  const [currentAudio, setCurrentAudio] = useState(null);
  const [audioElement, setAudioElement] = useState(null);
  const [voicePreference, setVoicePreference] = useState('feminine');

  useEffect(() => {
    fetchData();
    fetchVoicePreference();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [poesiesResponse, favorisResponse] = await Promise.all([
        poesiesAPI.getAll(filters),
        favorisAPI.getAll()
      ]);
      
      setPoesies(poesiesResponse.data.poesies);
      setFavoris(favorisResponse.data.favoris.map(f => f.poesieId._id));
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVoicePreference = async () => {
    try {
      const response = await audioAPI.getVoicePreference();
      setVoicePreference(response.data.preferenceVoix);
    } catch (error) {
      console.error('Erreur lors de la récupération de la préférence vocale:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const toggleFavori = async (poesieId) => {
    try {
      if (favoris.includes(poesieId)) {
        await favorisAPI.remove(poesieId);
        setFavoris(prev => prev.filter(id => id !== poesieId));
      } else {
        await favorisAPI.add(poesieId);
        setFavoris(prev => [...prev, poesieId]);
      }
    } catch (error) {
      console.error('Erreur lors de la gestion des favoris:', error);
    }
  };

  const playAudio = async (poesieId) => {
    try {
      // Arrêter l'audio en cours
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
      }

      if (currentAudio === poesieId) {
        setCurrentAudio(null);
        setAudioElement(null);
        return;
      }

      const response = await audioAPI.getPoesieAudioByVoice(poesieId, voicePreference);
      const audioUrl = `http://localhost:5000${response.data.audioUrl}`;
      
      const audio = new Audio(audioUrl);
      audio.onended = () => {
        setCurrentAudio(null);
        setAudioElement(null);
      };
      
      audio.play();
      setCurrentAudio(poesieId);
      setAudioElement(audio);
    } catch (error) {
      console.error('Erreur lors de la lecture audio:', error);
    }
  };

  const stopAudio = () => {
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }
    setCurrentAudio(null);
    setAudioElement(null);
  };

  const startReadingSession = (poesie) => {
    // Arrêter l'audio en cours
    stopAudio();
    setSelectedPoesie(poesie);
  };

  const handleSessionComplete = () => {
    setSelectedPoesie(null);
    // Optionnel: rafraîchir les données
    fetchData();
  };

  const handleBackToLibrary = () => {
    setSelectedPoesie(null);
  };

  const getThemeColor = (theme) => {
    const colors = {
      nature: 'bg-green-100 text-green-800',
      aventure: 'bg-red-100 text-red-800',
      amitie: 'bg-blue-100 text-blue-800',
      imagination: 'bg-purple-100 text-purple-800',
      ecole: 'bg-yellow-100 text-yellow-800',
      famille: 'bg-pink-100 text-pink-800',
      animaux: 'bg-orange-100 text-orange-800',
      saisons: 'bg-teal-100 text-teal-800'
    };
    return colors[theme] || 'bg-gray-100 text-gray-800';
  };

  const getNiveauColor = (niveau) => {
    const colors = {
      debutant: 'bg-green-100 text-green-800',
      intermediaire: 'bg-yellow-100 text-yellow-800',
      avance: 'bg-red-100 text-red-800'
    };
    return colors[niveau] || 'bg-gray-100 text-gray-800';
  };

  // Si une poésie est sélectionnée, afficher la session de lecture
  if (selectedPoesie) {
    return (
      <ReadingSession
        poesie={selectedPoesie}
        onComplete={handleSessionComplete}
        onBack={handleBackToLibrary}
      />
    );
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-6">
        <Library className="w-8 h-8 text-green-600" />
        <h1 className="text-3xl font-bold text-gray-900">Bibliothèque de Poèmes</h1>
      </div>

      {/* Filtres */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Rechercher par titre, auteur..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={filters.niveau} onValueChange={(value) => handleFilterChange('niveau', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Tous les niveaux" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tous les niveaux</SelectItem>
            <SelectItem value="debutant">Débutant</SelectItem>
            <SelectItem value="intermediaire">Intermédiaire</SelectItem>
            <SelectItem value="avance">Avancé</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.theme} onValueChange={(value) => handleFilterChange('theme', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Tous les thèmes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tous les thèmes</SelectItem>
            <SelectItem value="nature">Nature</SelectItem>
            <SelectItem value="aventure">Aventure</SelectItem>
            <SelectItem value="amitie">Amitié</SelectItem>
            <SelectItem value="imagination">Imagination</SelectItem>
            <SelectItem value="ecole">École</SelectItem>
            <SelectItem value="famille">Famille</SelectItem>
            <SelectItem value="animaux">Animaux</SelectItem>
            <SelectItem value="saisons">Saisons</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.difficulte} onValueChange={(value) => handleFilterChange('difficulte', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Toutes les difficultés" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Toutes les difficultés</SelectItem>
            <SelectItem value="facile">Facile</SelectItem>
            <SelectItem value="moyen">Moyen</SelectItem>
            <SelectItem value="difficile">Difficile</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Préférence de voix */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">Préférence de voix pour la lecture</h3>
        <div className="flex gap-4">
          <Button
            variant={voicePreference === 'feminine' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setVoicePreference('feminine');
              audioAPI.updateVoicePreference('feminine');
            }}
          >
            Voix féminine
          </Button>
          <Button
            variant={voicePreference === 'masculine' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setVoicePreference('masculine');
              audioAPI.updateVoicePreference('masculine');
            }}
          >
            Voix masculine
          </Button>
        </div>
      </div>

      {/* Liste des poésies */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <BookOpen className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Tous les Poèmes</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {poesies.map((poesie) => (
            <Card key={poesie._id} className="bg-orange-50 border-orange-100">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg text-gray-900 mb-2">{poesie.titre}</CardTitle>
                    <CardDescription className="text-gray-600">par {poesie.auteur}</CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleFavori(poesie._id)}
                    className={favoris.includes(poesie._id) ? 'text-red-500' : 'text-gray-400'}
                  >
                    <Heart className={`w-5 h-5 ${favoris.includes(poesie._id) ? 'fill-current' : ''}`} />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge className={getNiveauColor(poesie.niveau)}>
                    {poesie.niveau}
                  </Badge>
                  <Badge className={getThemeColor(poesie.theme)}>
                    {poesie.theme}
                  </Badge>
                  <Badge variant="outline">
                    {poesie.dureeEstimee} min
                  </Badge>
                  <Badge variant="outline">
                    {poesie.difficulte}
                  </Badge>
                </div>
                
                <p className="text-sm text-gray-700 mb-4 line-clamp-3">{poesie.description}</p>
                
                <div className="flex gap-3">
                  <Button 
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                    onClick={() => startReadingSession(poesie)}
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Commencer la lecture
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => currentAudio === poesie._id ? stopAudio() : playAudio(poesie._id)}
                    className="border-orange-300 text-orange-700 hover:bg-orange-100"
                  >
                    {currentAudio === poesie._id ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {poesies.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune poésie trouvée</h3>
            <p className="text-gray-600">Essayez de modifier vos filtres de recherche.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BibliotequePage;

