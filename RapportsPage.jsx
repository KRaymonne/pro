import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Download,
  Award,
  Clock,
  Target,
  BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { rapportsAPI } from '../lib/api';

const RapportsPage = () => {
  const [rapport, setRapport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [periode, setPeriode] = useState('mois');

  useEffect(() => {
    fetchRapport();
  }, [periode]);

  const fetchRapport = async () => {
    try {
      setLoading(true);
      const response = await rapportsAPI.getIndividuel({ periode });
      setRapport(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement du rapport:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = async (format) => {
    try {
      const response = await rapportsAPI.export({ format, type: 'complet' });
      
      // Créer un lien de téléchargement
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { 
        type: format === 'json' ? 'application/json' : 'text/csv' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `rapport-${periode}-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short'
    });
  };

  const getPeriodeLabel = (periode) => {
    const labels = {
      semaine: 'Cette semaine',
      mois: 'Ce mois',
      trimestre: 'Ce trimestre',
      annee: 'Cette année'
    };
    return labels[periode] || 'Période';
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
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <BarChart3 className="w-8 h-8 text-green-600" />
          <h1 className="text-3xl font-bold text-gray-900">Mes Rapports de Progrès</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={periode} onValueChange={setPeriode}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semaine">Cette semaine</SelectItem>
              <SelectItem value="mois">Ce mois</SelectItem>
              <SelectItem value="trimestre">Ce trimestre</SelectItem>
              <SelectItem value="annee">Cette année</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            onClick={() => exportData('json')}
            className="border-green-300 text-green-700 hover:bg-green-100"
          >
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {rapport && (
        <>
          {/* Statistiques générales */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Statistiques - {getPeriodeLabel(periode)}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-blue-50 border-blue-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-700">Lectures</h3>
                    <BookOpen className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {rapport.statistiques.lectures.totalLectures}
                  </div>
                  <p className="text-sm text-gray-500">
                    {rapport.statistiques.lectures.lecturesTerminees} terminées
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-green-50 border-green-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-700">Temps</h3>
                    <Clock className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {Math.round((rapport.statistiques.lectures.tempsTotal || 0) / 60)}
                  </div>
                  <p className="text-sm text-gray-500">minutes</p>
                </CardContent>
              </Card>
              
              <Card className="bg-purple-50 border-purple-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-700">Score moyen</h3>
                    <Target className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {Math.round(rapport.statistiques.lectures.scoresMoyen || 0)}%
                  </div>
                  <p className="text-sm text-gray-500">précision</p>
                </CardContent>
              </Card>
              
              <Card className="bg-orange-50 border-orange-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-700">Enregistrements</h3>
                    <Award className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {rapport.statistiques.enregistrements.totalEnregistrements}
                  </div>
                  <p className="text-sm text-gray-500">créés</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Évolution des scores */}
          {rapport.evolution && rapport.evolution.length > 0 && (
            <div className="mb-8">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                    <CardTitle>Évolution des Scores</CardTitle>
                  </div>
                  <CardDescription>
                    Progression de vos scores de lecture au fil du temps
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={rapport.evolution}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="_id" 
                          tickFormatter={formatDate}
                        />
                        <YAxis domain={[0, 100]} />
                        <Tooltip 
                          labelFormatter={(label) => `Date: ${formatDate(label)}`}
                          formatter={(value) => [`${Math.round(value)}%`, 'Score moyen']}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="scoreMoyen" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Répartition par niveau et thème */}
          <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Répartition par Niveau</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(rapport.repartition.niveau).map(([niveau, count]) => (
                    <div key={niveau} className="flex items-center justify-between">
                      <span className="capitalize">{niveau}</span>
                      <Badge variant="outline">{count} lectures</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Répartition par Thème</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(rapport.repartition.theme).map(([theme, count]) => (
                    <div key={theme} className="flex items-center justify-between">
                      <span className="capitalize">{theme}</span>
                      <Badge variant="outline">{count} lectures</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mots difficiles */}
          {rapport.motsDifficiles && rapport.motsDifficiles.length > 0 && (
            <div className="mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>Mots les Plus Difficiles</CardTitle>
                  <CardDescription>
                    Les mots sur lesquels vous devez vous concentrer
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {rapport.motsDifficiles.slice(0, 10).map((mot, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                        <span className="font-medium text-gray-900">{mot._id}</span>
                        <div className="text-right">
                          <div className="text-sm text-red-600 font-medium">
                            {mot.frequence} fois
                          </div>
                          <div className="text-xs text-gray-500">
                            {Math.round(mot.tentativesMoyennes)} tentatives
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Qualité des enregistrements */}
          {rapport.repartition.qualiteEnregistrements && 
           Object.keys(rapport.repartition.qualiteEnregistrements).length > 0 && (
            <div className="mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>Qualité des Enregistrements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={Object.entries(rapport.repartition.qualiteEnregistrements).map(([qualite, count]) => ({
                        qualite: qualite.replace('-', ' '),
                        count
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="qualite" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#8b5cf6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RapportsPage;

