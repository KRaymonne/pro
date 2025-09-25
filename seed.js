const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: __dirname + '/.env' });

const User = require('./models/User');
const Poesie = require('./models/Poesie');

// Données de test
const utilisateursTest = [
  {
    nom: 'Dupont',
    prenom: 'Marie',
    email: 'marie.dupont@ecole.fr',
    motDePasse: 'password123',
    role: 'eleve',
    classe: 'CE2-A',
    etablissement: 'École Primaire Jean Jaurès'
  },
  {
    nom: 'Martin',
    prenom: 'Pierre',
    email: 'pierre.martin@ecole.fr',
    motDePasse: 'password123',
    role: 'enseignant',
    classe: 'CE2-A',
    etablissement: 'École Primaire Jean Jaurès'
  },
  {
    nom: 'Durand',
    prenom: 'Sophie',
    email: 'sophie.durand@ecole.fr',
    motDePasse: 'password123',
    role: 'eleve',
    classe: 'CM1-B',
    etablissement: 'École Primaire Jean Jaurès'
  }
];

const poesiesTest = [
  {
    titre: 'La Fourmi',
    auteur: 'Robert Desnos',
    contenu: `Une fourmi de dix-huit mètres
Avec un chapeau sur la tête
Ça n'existe pas ça n'existe pas
Une fourmi traînant un char
Plein de pingouins et de canards
Ça n'existe pas ça n'existe pas
Une fourmi parlant français
Parlant latin et javanais
Ça n'existe pas ça n'existe pas
Et pourquoi pas ?`,
    niveau: 'debutant',
    theme: 'imagination',
    dureeEstimee: 2,
    difficulte: 'facile',
    description: 'Un poème ludique et imaginatif de Robert Desnos qui joue avec l\'impossible.',
    audioUrl: {
      voixFeminine: '/uploads/audio/la-fourmi-femme.wav',
      voixMasculine: '/uploads/audio/la-fourmi-homme.wav'
    },
    motsCles: ['fourmi', 'imagination', 'impossible', 'animaux'],
    ageMin: 7,
    ageMax: 10
  },
  {
    titre: 'L\'École',
    auteur: 'Maurice Carême',
    contenu: `L'école est une maison
Où l'on apprend des chansons
Des histoires et des leçons
Pour devenir de grands garçons
Et de grandes filles aussi
Qui sauront tout sur la vie.`,
    niveau: 'debutant',
    theme: 'ecole',
    dureeEstimee: 1,
    difficulte: 'facile',
    description: 'Un poème simple sur l\'école et l\'apprentissage.',
    audioUrl: {
      voixFeminine: '/uploads/audio/lecole-femme.wav',
      voixMasculine: '/uploads/audio/lecole-homme.wav'
    },
    motsCles: ['école', 'apprentissage', 'enfants', 'éducation'],
    ageMin: 6,
    ageMax: 9
  },
  {
    titre: 'L\'Enfant Heureux',
    auteur: 'Arnaud Berquin',
    contenu: `Heureux enfant ! que j'envie
Ton innocence et ton bonheur !
Ah ! garde bien toute la vie
La paix qui règne dans ton cœur !
Tu dors ; mille songes volages,
Amis paisibles du sommeil,
Te peignent de douces images
Jusqu'au moment de ton réveil.`,
    niveau: 'intermediaire',
    theme: 'famille',
    dureeEstimee: 3,
    difficulte: 'moyen',
    description: 'Un poème touchant sur l\'innocence et le bonheur de l\'enfance.',
    motsCles: ['enfance', 'bonheur', 'innocence', 'famille'],
    ageMin: 9,
    ageMax: 12
  },
  {
    titre: 'Les Quatre Saisons',
    auteur: 'Anonyme',
    contenu: `Au printemps, les fleurs s'éveillent
Et les oiseaux chantent gaiement
L'été nous offre ses merveilles
Sous un soleil éclatant

L'automne peint les feuilles d'or
Et l'hiver nous couvre de blanc
Chaque saison a son trésor
Pour les enfants comme les grands`,
    niveau: 'intermediaire',
    theme: 'nature',
    dureeEstimee: 2,
    difficulte: 'moyen',
    description: 'Un poème sur le cycle des saisons et leurs beautés.',
    audioUrl: {
      voixFeminine: '/uploads/audio/quatre-saisons-femme.wav',
      voixMasculine: '/uploads/audio/quatre-saisons-homme.wav'
    },
    motsCles: ['saisons', 'nature', 'printemps', 'été', 'automne', 'hiver'],
    ageMin: 8,
    ageMax: 12
  },
  {
    titre: 'Mon Ami',
    auteur: 'Paul Fort',
    contenu: `J'ai un ami qui me comprend
Quand je suis triste ou content
Il partage tous mes secrets
Et ne me juge jamais

Avec lui je peux tout dire
Sans avoir peur de rougir
L'amitié c'est un trésor
Plus précieux que l'or`,
    niveau: 'intermediaire',
    theme: 'amitie',
    dureeEstimee: 2,
    difficulte: 'moyen',
    description: 'Un poème sur la valeur de l\'amitié sincère.',
    motsCles: ['amitié', 'confiance', 'secrets', 'trésor'],
    ageMin: 9,
    ageMax: 13
  },
  {
    titre: 'Le Petit Chat',
    auteur: 'Maurice Carême',
    contenu: `Un petit chat gris
Qui dort sur son lit
Rêve qu'il attrape
Une souris qui s'échappe

Il bouge ses pattes
Comme s'il se battait
Puis ouvre les yeux
Et bâille un peu`,
    niveau: 'debutant',
    theme: 'animaux',
    dureeEstimee: 1,
    difficulte: 'facile',
    description: 'Un poème mignon sur un petit chat qui rêve.',
    motsCles: ['chat', 'rêve', 'souris', 'sommeil'],
    ageMin: 6,
    ageMax: 9
  }
];

async function seedDatabase() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connecté à MongoDB');

    // Supprimer les données existantes
    await User.deleteMany({});
    await Poesie.deleteMany({});
    console.log('Données existantes supprimées');

    // Créer les utilisateurs
    for (const userData of utilisateursTest) {
      const user = new User(userData);
      await user.save();
      console.log(`Utilisateur créé: ${user.prenom} ${user.nom}`);
    }

    // Créer les poésies
    for (const poesieData of poesiesTest) {
      const poesie = new Poesie(poesieData);
      await poesie.save();
      console.log(`Poésie créée: ${poesie.titre}`);
    }

    console.log('Base de données peuplée avec succès!');
    console.log('\nComptes de test créés:');
    console.log('- Élève: marie.dupont@ecole.fr / password123');
    console.log('- Enseignant: pierre.martin@ecole.fr / password123');
    console.log('- Élève: sophie.durand@ecole.fr / password123');

  } catch (error) {
    console.error('Erreur lors du peuplement:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Déconnecté de MongoDB');
  }
}

// Exécuter le script
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;

