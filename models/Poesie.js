const mongoose = require('mongoose');

const poesieSchema = new mongoose.Schema({
  titre: {
    type: String,
    required: true,
    trim: true
  },
  auteur: {
    type: String,
    required: true,
    trim: true
  },
  contenu: {
    type: String,
    required: true
  },
  niveau: {
    type: String,
    enum: ['debutant', 'intermediaire', 'avance'],
    required: true
  },
  theme: {
    type: String,
    enum: ['nature', 'aventure', 'amitie', 'imagination', 'ecole', 'famille', 'animaux', 'saisons'],
    required: true
  },
  dureeEstimee: {
    type: Number, // en minutes
    required: true,
    min: 1
  },
  difficulte: {
    type: String,
    enum: ['facile', 'moyen', 'difficile'],
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  audioUrl: {
    voixFeminine: {
      type: String, // URL du fichier audio avec voix féminine
      trim: true
    },
    voixMasculine: {
      type: String, // URL du fichier audio avec voix masculine
      trim: true
    }
  },
  dateAjout: {
    type: Date,
    default: Date.now
  },
  motsCles: [{
    type: String,
    trim: true
  }],
  ageMin: {
    type: Number,
    default: 7
  },
  ageMax: {
    type: Number,
    default: 15
  },
  actif: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index pour la recherche
poesieSchema.index({ titre: 'text', auteur: 'text', motsCles: 'text' });
poesieSchema.index({ niveau: 1, theme: 1 });
poesieSchema.index({ actif: 1 });

module.exports = mongoose.model('Poesie', poesieSchema);

