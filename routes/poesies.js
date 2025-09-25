const express = require("express");
const { body, validationResult, query } = require("express-validator");
const Poesie = require("../models/Poesie");
const { auth, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// @route   GET /api/poesies
// @desc    Obtenir la liste des poésies avec filtres
// @access  Public
router.get("/", [
  query("page").optional().isInt({ min: 1 }).withMessage("Page doit être un entier positif"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit doit être entre 1 et 100"),
  query("niveau").optional().isIn(["debutant", "intermediaire", "avance"]).withMessage("Niveau invalide"),
  query("theme").optional().isIn(["nature", "aventure", "amitie", "imagination", "ecole", "famille", "animaux", "saisons"]).withMessage("Thème invalide"),
  query("difficulte").optional().isIn(["facile", "moyen", "difficile"]).withMessage("Difficulté invalide"),
  query("search").optional().isString().withMessage("Recherche doit être une chaîne")
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Construction du filtre
    let filter = { actif: true };
    
    if (req.query.niveau) filter.niveau = req.query.niveau;
    if (req.query.theme) filter.theme = req.query.theme;
    if (req.query.difficulte) filter.difficulte = req.query.difficulte;
    
    // Recherche textuelle
    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }

    const poesies = await Poesie.find(filter)
      .sort({ dateAjout: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Poesie.countDocuments(filter);

    res.json({
      poesies,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des poésies:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// @route   GET /api/poesies/:id
// @desc    Obtenir une poésie par ID
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const poesie = await Poesie.findById(req.params.id);
    
    if (!poesie || !poesie.actif) {
      return res.status(404).json({ message: "Poésie non trouvée" });
    }

    res.json({ poesie });
  } catch (error) {
    console.error("Erreur lors de la récupération de la poésie:", error);
    if (error.name === "CastError") {
      return res.status(400).json({ message: "ID invalide" });
    }
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// @route   POST /api/poesies
// @desc    Créer une nouvelle poésie
// @access  Private (Admin/Enseignant)
router.post("/", auth, authorize("admin", "enseignant"), [
  body("titre").trim().isLength({ min: 1 }).withMessage("Titre requis"),
  body("auteur").trim().isLength({ min: 1 }).withMessage("Auteur requis"),
  body("contenu").trim().isLength({ min: 1 }).withMessage("Contenu requis"),
  body("niveau").isIn(["debutant", "intermediaire", "avance"]).withMessage("Niveau invalide"),
  body("theme").isIn(["nature", "aventure", "amitie", "imagination", "ecole", "famille", "animaux", "saisons"]).withMessage("Thème invalide"),
  body("dureeEstimee").isInt({ min: 1 }).withMessage("Durée estimée doit être un entier positif"),
  body("difficulte").isIn(["facile", "moyen", "difficile"]).withMessage("Difficulté invalide"),
  body("description").optional().trim(),
  body("motsCles").optional().isArray().withMessage("Mots-clés doivent être un tableau"),
  body("ageMin").optional().isInt({ min: 5, max: 18 }).withMessage("Âge minimum invalide"),
  body("ageMax").optional().isInt({ min: 5, max: 18 }).withMessage("Âge maximum invalide")
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const poesie = new Poesie(req.body);
    await poesie.save();

    res.status(201).json({
      message: "Poésie créée avec succès",
      poesie
    });
  } catch (error) {
    console.error("Erreur lors de la création de la poésie:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// @route   PUT /api/poesies/:id
// @desc    Mettre à jour une poésie
// @access  Private (Admin/Enseignant)
router.put("/:id", auth, authorize("admin", "enseignant"), [
  body("titre").optional().trim().isLength({ min: 1 }).withMessage("Titre requis"),
  body("auteur").optional().trim().isLength({ min: 1 }).withMessage("Auteur requis"),
  body("contenu").optional().trim().isLength({ min: 1 }).withMessage("Contenu requis"),
  body("niveau").optional().isIn(["debutant", "intermediaire", "avance"]).withMessage("Niveau invalide"),
  body("theme").optional().isIn(["nature", "aventure", "amitie", "imagination", "ecole", "famille", "animaux", "saisons"]).withMessage("Thème invalide"),
  body("dureeEstimee").optional().isInt({ min: 1 }).withMessage("Durée estimée doit être un entier positif"),
  body("difficulte").optional().isIn(["facile", "moyen", "difficile"]).withMessage("Difficulté invalide"),
  body("description").optional().trim(),
  body("motsCles").optional().isArray().withMessage("Mots-clés doivent être un tableau"),
  body("ageMin").optional().isInt({ min: 5, max: 18 }).withMessage("Âge minimum invalide"),
  body("ageMax").optional().isInt({ min: 5, max: 18 }).withMessage("Âge maximum invalide"),
  body("actif").optional().isBoolean().withMessage("Actif doit être un booléen")
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const poesie = await Poesie.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!poesie) {
      return res.status(404).json({ message: "Poésie non trouvée" });
    }

    res.json({
      message: "Poésie mise à jour avec succès",
      poesie
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la poésie:", error);
    if (error.name === "CastError") {
      return res.status(400).json({ message: "ID invalide" });
    }
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// @route   DELETE /api/poesies/:id
// @desc    Supprimer une poésie (soft delete)
// @access  Private (Admin)
router.delete("/:id", auth, authorize("admin"), async (req, res) => {
  try {
    const poesie = await Poesie.findByIdAndUpdate(
      req.params.id,
      { actif: false },
      { new: true }
    );

    if (!poesie) {
      return res.status(404).json({ message: "Poésie non trouvée" });
    }

    res.json({ message: "Poésie supprimée avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression de la poésie:", error);
    if (error.name === "CastError") {
      return res.status(400).json({ message: "ID invalide" });
    }
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// @route   GET /api/poesies/stats/general
// @desc    Obtenir les statistiques générales des poésies
// @access  Private (Admin/Enseignant)
router.get("/stats/general", auth, authorize("admin", "enseignant"), async (req, res) => {
  try {
    const stats = await Poesie.aggregate([
      { $match: { actif: true } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          parNiveau: {
            $push: {
              niveau: "$niveau",
              count: 1
            }
          },
          parTheme: {
            $push: {
              theme: "$theme",
              count: 1
            }
          }
        }
      }
    ]);

    res.json({ stats: stats[0] || { total: 0, parNiveau: [], parTheme: [] } });
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;

