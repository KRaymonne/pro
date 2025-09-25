const express = require('express');
const { body, validationResult } = require('express-validator');
const Poesie = require('../models/Poesie');
const User = require('../models/User');
const { auth, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// @route   GET /api/audio/poesie/:id
// @desc    Obtenir les URLs audio d'une poésie selon les préférences utilisateur
// @access  Private
router.get('/poesie/:id', auth, async (req, res) => {
  try {
    const poesie = await Poesie.findById(req.params.id);
    
    if (!poesie || !poesie.actif) {
      return res.status(404).json({ message: 'Poésie non trouvée' });
    }

    // Récupérer les préférences de l'utilisateur
    const user = await User.findById(req.user._id);
    const preferenceVoix = user.parametres?.preferenceVoix || 'feminine';

    // Déterminer l'URL audio à utiliser
    let audioUrl = null;
    if (preferenceVoix === 'masculine' && poesie.audioUrl?.voixMasculine) {
      audioUrl = poesie.audioUrl.voixMasculine;
    } else if (preferenceVoix === 'feminine' && poesie.audioUrl?.voixFeminine) {
      audioUrl = poesie.audioUrl.voixFeminine;
    } else {
      // Fallback: utiliser la voix disponible
      audioUrl = poesie.audioUrl?.voixFeminine || poesie.audioUrl?.voixMasculine;
    }

    res.json({
      poesieId: poesie._id,
      titre: poesie.titre,
      auteur: poesie.auteur,
      audioUrl,
      voixDisponibles: {
        feminine: !!poesie.audioUrl?.voixFeminine,
        masculine: !!poesie.audioUrl?.voixMasculine
      },
      voixUtilisee: audioUrl === poesie.audioUrl?.voixMasculine ? 'masculine' : 'feminine'
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'audio:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'ID invalide' });
    }
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   GET /api/audio/poesie/:id/voix/:typeVoix
// @desc    Obtenir l'URL audio d'une poésie pour un type de voix spécifique
// @access  Private
router.get('/poesie/:id/voix/:typeVoix', auth, async (req, res) => {
  try {
    const { typeVoix } = req.params;
    
    if (!['feminine', 'masculine'].includes(typeVoix)) {
      return res.status(400).json({ message: 'Type de voix invalide. Utilisez "feminine" ou "masculine".' });
    }

    const poesie = await Poesie.findById(req.params.id);
    
    if (!poesie || !poesie.actif) {
      return res.status(404).json({ message: 'Poésie non trouvée' });
    }

    const audioUrl = typeVoix === 'masculine' 
      ? poesie.audioUrl?.voixMasculine 
      : poesie.audioUrl?.voixFeminine;

    if (!audioUrl) {
      return res.status(404).json({ 
        message: `Audio avec voix ${typeVoix} non disponible pour cette poésie` 
      });
    }

    res.json({
      poesieId: poesie._id,
      titre: poesie.titre,
      auteur: poesie.auteur,
      audioUrl,
      typeVoix
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'audio:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'ID invalide' });
    }
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   PUT /api/audio/preference-voix
// @desc    Mettre à jour la préférence de voix de l'utilisateur
// @access  Private
router.put('/preference-voix', auth, [
  body('preferenceVoix').isIn(['feminine', 'masculine']).withMessage('Préférence de voix invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { preferenceVoix } = req.body;

    // Mettre à jour les paramètres de l'utilisateur
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { 
        $set: { 
          'parametres.preferenceVoix': preferenceVoix 
        }
      },
      { new: true }
    );

    res.json({
      message: 'Préférence de voix mise à jour avec succès',
      preferenceVoix,
      parametres: user.parametres
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la préférence:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   GET /api/audio/preference-voix
// @desc    Obtenir la préférence de voix de l'utilisateur
// @access  Private
router.get('/preference-voix', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const preferenceVoix = user.parametres?.preferenceVoix || 'feminine';

    res.json({
      preferenceVoix,
      parametres: user.parametres
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la préférence:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;

