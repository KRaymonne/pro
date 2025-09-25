const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    trim: true
  },
  prenom: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  motDePasse: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['eleve', 'enseignant', 'parent', 'admin'],
    default: 'eleve'
  },
  classe: {
    type: String,
    trim: true
  },
  etablissement: {
    type: String,
    trim: true
  },
  dateCreation: {
    type: Date,
    default: Date.now
  },
  parametres: {
    tailleFonte: {
      type: String,
      enum: ['normale', 'grande', 'tres-grande'],
      default: 'normale'
    },
    contraste: {
      type: String,
      enum: ['standard', 'eleve', 'tres-eleve'],
      default: 'standard'
    },
    vitesseLecture: {
      type: String,
      enum: ['normale', 'lente', 'rapide'],
      default: 'normale'
    },
    volumeAudio: {
      type: String,
      enum: ['moyen', 'faible', 'fort'],
      default: 'moyen'
    },
    preferenceVoix: {
      type: String,
      enum: ['feminine', 'masculine'],
      default: 'feminine'
    },
    aidesVisuelles: {
      type: Boolean,
      default: false
    },
    descriptionsAudio: {
      type: Boolean,
      default: false
    },
    interfaceSimplifiee: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Hash du mot de passe avant sauvegarde
userSchema.pre('save', async function(next) {
  if (!this.isModified('motDePasse')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.motDePasse = await bcrypt.hash(this.motDePasse, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.motDePasse);
};

// Méthode pour obtenir les informations publiques de l'utilisateur
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.motDePasse;
  return user;
};

module.exports = mongoose.model('User', userSchema);

