import React, { useState, useEffect } from 'react';
import { 
  Home, 
  BookOpen, 
  BarChart3, 
  Play, 
  Clock, 
  Target, 
  Award,
  TrendingUp,
  Library,
  Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '../contexts/AuthContext';
import { poesiesAPI, lecturesAPI } from '../lib/api';

const AccueilPage = () => {
  const { user } = useAuth();
  const [poesies, setPoesies] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [poesiesResponse, statsResponse] = await Promise.all([
          poesiesAPI.getAll({ limit: 3 }),
          lecturesAPI.getStats()
        ]);
        
        setPoesies(poesiesResponse.data.poesies);
        setStats(statsResponse.data);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const currentBook = poesies[0] || { titre: 'Aucune poésie disponible', auteur: '', niveau: '', dureeEstimee: 0 };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-48 bg-gray-200 rounded"></div>
            <div className="h-48 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <Home className="w-8 h-8 text-orange-500" />
          <h1 className="text-3xl font-bold text-gray-900">
            Bonjour {user?.prenom} ! Bienvenue dans votre espace de lecture
          </h1>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <BookOpen className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Mes Activités d'Aujourd'hui</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-orange-50 border-orange-100">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Award className="w-6 h-6 text-yellow-500" />
                <CardTitle className="text-gray-900">Lecture Recommandée</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">{currentBook.titre}</h4>
                <p className="text-sm text-gray-600 mb-4">
                  {currentBook.auteur && `par ${currentBook.auteur} • `}
                  Niveau: {currentBook.niveau} • Durée: {currentBook.dureeEstimee} min
                </p>
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                  <Play className="w-5 h-5 mr-2" />
                  Commencer la Lecture
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-100">
            <CardHeader>
              <div className="flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-blue-600" />
                <CardTitle className="text-gray-900">Continuer ma Lecture</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Les Quatre Saisons</h4>
                <p className="text-sm text-gray-600 mb-2">Progression: 75% terminé • Dernière lecture: hier à 16h30</p>
                <div className="w-full bg-blue-200 rounded-full h-2 mb-4">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                </div>
                <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                  <Play className="w-5 h-5 mr-2" />
                  Reprendre
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Mes Progrès Cette Semaine</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-blue-50 border-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-700">Lectures Terminées</h3>
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {stats?.statsSemaine?.lecturesSemaine || 0}
              </div>
              <p className="text-sm text-gray-500">Cette semaine</p>
            </CardContent>
          </Card>
          
          <Card className="bg-green-50 border-green-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-700">Temps de Lecture</h3>
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {Math.round((stats?.statsSemaine?.tempsSemaine || 0) / 60)} min
              </div>
              <p className="text-sm text-gray-500">Cette semaine</p>
            </CardContent>
          </Card>
          
          <Card className="bg-purple-50 border-purple-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-700">Score de Précision</h3>
                <Target className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {Math.round(stats?.stats?.scoresMoyen || 0)}%
              </div>
              <p className="text-sm text-gray-500">Score moyen</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <TrendingUp className="w-6 h-6 text-orange-500" />
          <h2 className="text-xl font-semibold text-gray-900">Actions Rapides</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            variant="outline" 
            className="h-auto p-6 justify-start bg-white border-blue-200 hover:border-blue-300"
            onClick={() => window.location.href = '/bibliotheque'}
          >
            <div className="flex items-center gap-3">
              <Library className="w-6 h-6 text-blue-600" />
              <span className="font-medium">Bibliothèque</span>
            </div>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-auto p-6 justify-start bg-white border-orange-200 hover:border-orange-300"
            onClick={() => window.location.href = '/lectures'}
          >
            <div className="flex items-center gap-3">
              <Save className="w-6 h-6 text-orange-600" />
              <span className="font-medium">Mes Enregistrements</span>
            </div>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-auto p-6 justify-start bg-white border-green-200 hover:border-green-300"
            onClick={() => window.location.href = '/rapports'}
          >
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-green-600" />
              <span className="font-medium">Mes Progrès</span>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AccueilPage;

