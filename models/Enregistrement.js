const mongoose = require('mongoose');

const enregistrementSchema = new mongoose.Schema({
  utilisateurId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  poesieId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Poesie',
    required: true
  },
  lectureId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lecture',
    required: true
  },
  fichierUrl: {
    type: String,
    required: true,
    trim: true
  },
  duree: {
    type: Number, // en secondes
    required: true,
    min: 0
  },
  qualite: {
    type: String,
    enum: ['excellente', 'tres-bonne', 'bonne', 'a-ameliorer'],
    default: 'bonne'
  },
  dateEnregistrement: {
    type: Date,
    default: Date.now
  },
  scoreComparaison: {
    type: Number, // score de comparaison avec le modèle (0-100)
    min: 0,
    max: 100
  },
  commentaires: {
    type: String,
    trim: true
  },
  tailleFichier: {
    type: Number, // en bytes
    min: 0
  },
  formatFichier: {
    type: String,
    enum: ['mp3', 'wav', 'ogg', 'm4a'],
    default: 'mp3'
  },
  actif: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index pour les requêtes fréquentes
enregistrementSchema.index({ utilisateurId: 1, dateEnregistrement: -1 });
enregistrementSchema.index({ lectureId: 1 });
enregistrementSchema.index({ poesieId: 1 });
enregistrementSchema.index({ actif: 1 });

module.exports = mongoose.model('Enregistrement', enregistrementSchema);

