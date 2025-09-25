import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  User, 
  Volume2, 
  Eye, 
  Palette,
  Save,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '../contexts/AuthContext';
import { audioAPI } from '../lib/api';

const ParametresPage = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    nom: user?.nom || '',
    prenom: user?.prenom || '',
    email: user?.email || '',
    classe: user?.classe || '',
    etablissement: user?.etablissement || ''
  });
  const [parametres, setParametres] = useState({
    tailleFonte: user?.parametres?.tailleFonte || 'normale',
    contraste: user?.parametres?.contraste || 'standard',
    vitesseLecture: user?.parametres?.vitesseLecture || 'normale',
    volumeAudio: user?.parametres?.volumeAudio || 'moyen',
    preferenceVoix: user?.parametres?.preferenceVoix || 'feminine',
    aidesVisuelles: user?.parametres?.aidesVisuelles || false,
    descriptionsAudio: user?.parametres?.descriptionsAudio || false,
    interfaceSimplifiee: user?.parametres?.interfaceSimplifiee || false
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleParametreChange = (key, value) => {
    setParametres(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSwitchChange = (key, checked) => {
    setParametres(prev => ({
      ...prev,
      [key]: checked
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const updateData = {
        ...formData,
        parametres
      };

      const result = await updateUser(updateData);
      
      if (result.success) {
        // Mettre à jour la préférence de voix via l'API audio
        if (parametres.preferenceVoix !== user?.parametres?.preferenceVoix) {
          await audioAPI.updateVoicePreference(parametres.preferenceVoix);
        }
        
        setMessage('Paramètres mis à jour avec succès !');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(result.error || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      setMessage('Erreur lors de la mise à jour des paramètres');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-8">
        <Settings className="w-8 h-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {message && (
          <Alert className={message.includes('succès') ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            <CheckCircle className={`h-4 w-4 ${message.includes('succès') ? 'text-green-600' : 'text-red-600'}`} />
            <AlertDescription className={message.includes('succès') ? 'text-green-800' : 'text-red-800'}>
              {message}
            </AlertDescription>
          </Alert>
        )}

        {/* Informations personnelles */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <User className="w-6 h-6 text-blue-600" />
              <CardTitle>Informations personnelles</CardTitle>
            </div>
            <CardDescription>
              Modifiez vos informations de profil
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prenom">Prénom</Label>
                <Input
                  id="prenom"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleInputChange}
                  placeholder="Votre prénom"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nom">Nom</Label>
                <Input
                  id="nom"
                  name="nom"
                  value={formData.nom}
                  onChange={handleInputChange}
                  placeholder="Votre nom"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Adresse email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="votre.email@ecole.fr"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="classe">Classe</Label>
                <Input
                  id="classe"
                  name="classe"
                  value={formData.classe}
                  onChange={handleInputChange}
                  placeholder="CE2-A"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="etablissement">Établissement</Label>
                <Input
                  id="etablissement"
                  name="etablissement"
                  value={formData.etablissement}
                  onChange={handleInputChange}
                  placeholder="École Primaire..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Paramètres d'affichage */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Eye className="w-6 h-6 text-green-600" />
              <CardTitle>Paramètres d'affichage</CardTitle>
            </div>
            <CardDescription>
              Personnalisez l'affichage selon vos besoins
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Taille de la police</Label>
                <Select 
                  value={parametres.tailleFonte} 
                  onValueChange={(value) => handleParametreChange('tailleFonte', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normale">Normale</SelectItem>
                    <SelectItem value="grande">Grande</SelectItem>
                    <SelectItem value="tres-grande">Très grande</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Contraste</Label>
                <Select 
                  value={parametres.contraste} 
                  onValueChange={(value) => handleParametreChange('contraste', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="eleve">Élevé</SelectItem>
                    <SelectItem value="tres-eleve">Très élevé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Aides visuelles</Label>
                  <p className="text-sm text-gray-600">Afficher des indicateurs visuels pour la lecture</p>
                </div>
                <Switch
                  checked={parametres.aidesVisuelles}
                  onCheckedChange={(checked) => handleSwitchChange('aidesVisuelles', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Interface simplifiée</Label>
                  <p className="text-sm text-gray-600">Réduire les éléments d'interface pour plus de clarté</p>
                </div>
                <Switch
                  checked={parametres.interfaceSimplifiee}
                  onCheckedChange={(checked) => handleSwitchChange('interfaceSimplifiee', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Paramètres audio */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Volume2 className="w-6 h-6 text-purple-600" />
              <CardTitle>Paramètres audio</CardTitle>
            </div>
            <CardDescription>
              Configurez les options de lecture et d'enregistrement
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>Vitesse de lecture</Label>
                <Select 
                  value={parametres.vitesseLecture} 
                  onValueChange={(value) => handleParametreChange('vitesseLecture', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lente">Lente</SelectItem>
                    <SelectItem value="normale">Normale</SelectItem>
                    <SelectItem value="rapide">Rapide</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Volume audio</Label>
                <Select 
                  value={parametres.volumeAudio} 
                  onValueChange={(value) => handleParametreChange('volumeAudio', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="faible">Faible</SelectItem>
                    <SelectItem value="moyen">Moyen</SelectItem>
                    <SelectItem value="fort">Fort</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Préférence de voix</Label>
                <Select 
                  value={parametres.preferenceVoix} 
                  onValueChange={(value) => handleParametreChange('preferenceVoix', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="feminine">Voix féminine</SelectItem>
                    <SelectItem value="masculine">Voix masculine</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Descriptions audio</Label>
                <p className="text-sm text-gray-600">Activer les descriptions audio pour l'accessibilité</p>
              </div>
              <Switch
                checked={parametres.descriptionsAudio}
                onCheckedChange={(checked) => handleSwitchChange('descriptionsAudio', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Bouton de sauvegarde */}
        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Settings className="w-4 h-4 mr-2 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Sauvegarder les paramètres
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ParametresPage;

