const mongoose = require('mongoose');

const lectureSchema = new mongoose.Schema({
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
  dateDebut: {
    type: Date,
    required: true,
    default: Date.now
  },
  dateFin: {
    type: Date
  },
  duree: {
    type: Number, // en secondes
    min: 0
  },
  score: {
    type: Number, // pourcentage de précision (0-100)
    min: 0,
    max: 100
  },
  motsDifficiles: [{
    mot: String,
    position: Number,
    tentatives: Number
  }],
  progression: {
    type: Number, // pourcentage de completion (0-100)
    default: 0,
    min: 0,
    max: 100
  },
  statut: {
    type: String,
    enum: ['en-cours', 'terminee', 'abandonnee'],
    default: 'en-cours'
  },
  enregistrementUrl: {
    type: String, // URL de l'enregistrement de l'enfant
    trim: true
  },
  commentaires: {
    type: String,
    trim: true
  },
  tentatives: {
    type: Number,
    default: 1,
    min: 1
  }
}, {
  timestamps: true
});

// Index pour les requêtes fréquentes
lectureSchema.index({ utilisateurId: 1, dateDebut: -1 });
lectureSchema.index({ poesieId: 1 });
lectureSchema.index({ statut: 1 });

module.exports = mongoose.model('Lecture', lectureSchema);

