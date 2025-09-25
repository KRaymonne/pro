const mongoose = require('mongoose');

const favoriSchema = new mongoose.Schema({
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
  dateAjout: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index unique pour éviter les doublons
favoriSchema.index({ utilisateurId: 1, poesieId: 1 }, { unique: true });

module.exports = mongoose.model('Favori', favoriSchema);

