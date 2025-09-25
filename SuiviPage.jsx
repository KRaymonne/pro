import React, { useState, useEffect } from 'react';
import { 
  Users, 
  BarChart3, 
  AlertTriangle, 
  TrendingUp,
  BookOpen,
  Clock,
  Target,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { rapportsAPI } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

const SuiviPage = () => {
  const { user } = useAuth();
  const [rapport, setRapport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    classe: user?.classe || '',
    etablissement: user?.etablissement || '',
    periode: 'mois'
  });

  useEffect(() => {
    fetchRapport();
  }, [filters]);

  const fetchRapport = async () => {
    try {
      setLoading(true);
      const response = await rapportsAPI.getClasse(filters);
      setRapport(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement du rapport de classe:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const exportData = async () => {
    try {
      const response = await rapportsAPI.export({ 
        format: 'json', 
        type: 'classe',
        ...filters 
      });
      
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { 
        type: 'application/json' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `rapport-classe-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeColor = (score) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Users className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Suivi de Classe</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={exportData}
            className="border-blue-300 text-blue-700 hover:bg-blue-100"
          >
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Filtres */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Input
            placeholder="Classe (ex: CE2-A)"
            value={filters.classe}
            onChange={(e) => handleFilterChange('classe', e.target.value)}
          />
        </div>
        
        <div>
          <Input
            placeholder="Établissement"
            value={filters.etablissement}
            onChange={(e) => handleFilterChange('etablissement', e.target.value)}
          />
        </div>
        
        <Select value={filters.periode} onValueChange={(value) => handleFilterChange('periode', value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semaine">Cette semaine</SelectItem>
            <SelectItem value="mois">Ce mois</SelectItem>
            <SelectItem value="trimestre">Ce trimestre</SelectItem>
            <SelectItem value="annee">Cette année</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {rapport && (
        <>
          {/* Statistiques générales */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Vue d'ensemble de la classe</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-blue-50 border-blue-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-700">Élèves</h3>
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {rapport.statistiques.nombreEleves}
                  </div>
                  <p className="text-sm text-gray-500">
                    {rapport.statistiques.elevesActifs} actifs
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-green-50 border-green-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-700">Taux de réussite</h3>
                    <Target className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {Math.round(rapport.statistiques.tauxReussite)}%
                  </div>
                  <p className="text-sm text-gray-500">moyenne classe</p>
                </CardContent>
              </Card>
              
              <Card className="bg-purple-50 border-purple-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-700">Score moyen</h3>
                    <BarChart3 className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {Math.round(rapport.statistiques.scoresMoyen)}%
                  </div>
                  <p className="text-sm text-gray-500">précision</p>
                </CardContent>
              </Card>
              
              <Card className="bg-orange-50 border-orange-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-700">Temps total</h3>
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {Math.round((rapport.statistiques.tempsTotal || 0) / 60)}
                  </div>
                  <p className="text-sm text-gray-500">minutes</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Alertes */}
          {(rapport.alertes.nombreElevesEnDifficulte > 0 || rapport.alertes.elevesInactifs > 0) && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Alertes</h2>
              <div className="space-y-4">
                {rapport.alertes.nombreElevesEnDifficulte > 0 && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      <strong>{rapport.alertes.nombreElevesEnDifficulte} élève(s)</strong> en difficulté 
                      (score &lt; 60% ou taux de réussite &lt; 50%)
                    </AlertDescription>
                  </Alert>
                )}
                
                {rapport.alertes.elevesInactifs > 0 && (
                  <Alert className="border-yellow-200 bg-yellow-50">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">
                      <strong>{rapport.alertes.elevesInactifs} élève(s)</strong> inactif(s) 
                      sur la période sélectionnée
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          )}

          {/* Classement des élèves */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <TrendingUp className="w-6 h-6 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900">Classement des Élèves</h2>
            </div>
            
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rang
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Élève
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Score moyen
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Lectures
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Taux de réussite
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Temps
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {rapport.classement.map((eleve, index) => (
                        <tr key={eleve._id} className={index < 3 ? 'bg-yellow-50' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {index === 0 && <span className="text-yellow-500 mr-2">🥇</span>}
                              {index === 1 && <span className="text-gray-400 mr-2">🥈</span>}
                              {index === 2 && <span className="text-orange-500 mr-2">🥉</span>}
                              <span className="text-sm font-medium text-gray-900">
                                {index + 1}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {eleve.prenom} {eleve.nom}
                              </div>
                              <div className="text-sm text-gray-500">{eleve.classe}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={getScoreBadgeColor(eleve.scoresMoyen)}>
                              {Math.round(eleve.scoresMoyen)}%
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {eleve.totalLectures} ({eleve.lecturesTerminees} terminées)
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-sm font-medium ${getScoreColor(eleve.tauxReussite)}`}>
                              {Math.round(eleve.tauxReussite)}%
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {Math.round((eleve.tempsTotal || 0) / 60)} min
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {rapport.classement.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun élève trouvé</h3>
                <p className="text-gray-600">
                  Vérifiez les filtres ou assurez-vous que des élèves sont inscrits dans cette classe.
                </p>
              </div>
            )}
          </div>

          {/* Élèves en difficulté */}
          {rapport.elevesEnDifficulte && rapport.elevesEnDifficulte.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-6">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                <h2 className="text-xl font-semibold text-gray-900">Élèves Nécessitant une Attention Particulière</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {rapport.elevesEnDifficulte.map((eleve) => (
                  <Card key={eleve._id} className="border-red-200 bg-red-50">
                    <CardHeader>
                      <CardTitle className="text-red-900">
                        {eleve.prenom} {eleve.nom}
                      </CardTitle>
                      <CardDescription className="text-red-700">
                        Classe: {eleve.classe}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-red-800">Score moyen:</span>
                          <span className="text-sm font-medium text-red-900">
                            {Math.round(eleve.scoresMoyen)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-red-800">Taux de réussite:</span>
                          <span className="text-sm font-medium text-red-900">
                            {Math.round(eleve.tauxReussite)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-red-800">Lectures:</span>
                          <span className="text-sm font-medium text-red-900">
                            {eleve.totalLectures}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SuiviPage;

