const express = require("express");
const { body, validationResult } = require("express-validator");
const Favori = require("../models/Favori");
const Poesie = require("../models/Poesie");
const { auth, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// @route   GET /api/favoris
// @desc    Obtenir la liste des favoris de l'utilisateur
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const favoris = await Favori.find({ utilisateurId: req.user._id })
      .populate("poesieId", "titre auteur niveau theme dureeEstimee difficulte description")
      .sort({ dateAjout: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Favori.countDocuments({ utilisateurId: req.user._id });

    // Filtrer les favoris dont la poésie existe encore et est active
    const favorisActifs = favoris.filter(favori => 
      favori.poesieId && favori.poesieId.actif !== false
    );

    res.json({
      favoris: favorisActifs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des favoris:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// @route   POST /api/favoris
// @desc    Ajouter une poésie aux favoris
// @access  Private
router.post("/", auth, [
  body("poesieId").isMongoId().withMessage("ID de poésie invalide")
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { poesieId } = req.body;

    // Vérifier que la poésie existe et est active
    const poesie = await Poesie.findById(poesieId);
    if (!poesie || !poesie.actif) {
      return res.status(404).json({ message: "Poésie non trouvée" });
    }

    // Vérifier si la poésie n'est pas déjà dans les favoris
    const favoriExistant = await Favori.findOne({
      utilisateurId: req.user._id,
      poesieId
    });

    if (favoriExistant) {
      return res.status(400).json({ message: "Cette poésie est déjà dans vos favoris" });
    }

    // Créer le favori
    const favori = new Favori({
      utilisateurId: req.user._id,
      poesieId
    });

    await favori.save();
    await favori.populate("poesieId", "titre auteur niveau theme dureeEstimee difficulte description");

    res.status(201).json({
      message: "Poésie ajoutée aux favoris avec succès",
      favori
    });
  } catch (error) {
    console.error("Erreur lors de l'ajout aux favoris:", error);
    
    // Gestion de l'erreur de duplication (au cas où)
    if (error.code === 11000) {
      return res.status(400).json({ message: "Cette poésie est déjà dans vos favoris" });
    }
    
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// @route   DELETE /api/favoris/:poesieId
// @desc    Retirer une poésie des favoris
// @access  Private
router.delete("/:poesieId", auth, async (req, res) => {
  try {
    const favori = await Favori.findOneAndDelete({
      utilisateurId: req.user._id,
      poesieId: req.params.poesieId
    });

    if (!favori) {
      return res.status(404).json({ message: "Favori non trouvé" });
    }

    res.json({ message: "Poésie retirée des favoris avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression du favori:", error);
    if (error.name === "CastError") {
      return res.status(400).json({ message: "ID invalide" });
    }
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// @route   GET /api/favoris/check/:poesieId
// @desc    Vérifier si une poésie est dans les favoris
// @access  Private
router.get("/check/:poesieId", auth, async (req, res) => {
  try {
    const favori = await Favori.findOne({
      utilisateurId: req.user._id,
      poesieId: req.params.poesieId
    });

    res.json({ estFavori: !!favori });
  } catch (error) {
    console.error("Erreur lors de la vérification du favori:", error);
    if (error.name === "CastError") {
      return res.status(400).json({ message: "ID invalide" });
    }
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// @route   GET /api/favoris/stats
// @desc    Obtenir les statistiques des favoris
// @access  Private
router.get("/stats", auth, async (req, res) => {
  try {
    const stats = await Favori.aggregate([
      { $match: { utilisateurId: req.user._id } },
      {
        $lookup: {
          from: "poesies",
          localField: "poesieId",
          foreignField: "_id",
          as: "poesie"
        }
      },
      { $unwind: "$poesie" },
      { $match: { "poesie.actif": true } },
      {
        $group: {
          _id: null,
          totalFavoris: { $sum: 1 },
          repartitionNiveau: {
            $push: "$poesie.niveau"
          },
          repartitionTheme: {
            $push: "$poesie.theme"
          }
        }
      }
    ]);

    let repartitionNiveau = {};
    let repartitionTheme = {};

    if (stats[0]) {
      // Compter la répartition par niveau
      stats[0].repartitionNiveau.forEach(niveau => {
        repartitionNiveau[niveau] = (repartitionNiveau[niveau] || 0) + 1;
      });

      // Compter la répartition par thème
      stats[0].repartitionTheme.forEach(theme => {
        repartitionTheme[theme] = (repartitionTheme[theme] || 0) + 1;
      });
    }

    res.json({
      totalFavoris: stats[0]?.totalFavoris || 0,
      repartitionNiveau,
      repartitionTheme
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques des favoris:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;

