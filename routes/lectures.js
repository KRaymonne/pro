const express = require("express");
const { body, validationResult, query } = require("express-validator");
const Lecture = require("../models/Lecture");
const Poesie = require("../models/Poesie");
const { auth, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// @route   GET /api/lectures
// @desc    Obtenir l'historique des lectures de l'utilisateur
// @access  Private
router.get("/", auth, [
  query("page").optional().isInt({ min: 1 }).withMessage("Page doit être un entier positif"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit doit être entre 1 et 100"),
  query("statut").optional().isIn(["en-cours", "terminee", "abandonnee"]).withMessage("Statut invalide")
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let filter = { utilisateurId: req.user._id };
    if (req.query.statut) filter.statut = req.query.statut;

    const lectures = await Lecture.find(filter)
      .populate("poesieId", "titre auteur niveau theme dureeEstimee")
      .sort({ dateDebut: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Lecture.countDocuments(filter);

    res.json({
      lectures,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des lectures:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// @route   GET /api/lectures/:id
// @desc    Obtenir une lecture spécifique
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    const lecture = await Lecture.findOne({
      _id: req.params.id,
      utilisateurId: req.user._id
    }).populate("poesieId", "titre auteur contenu niveau theme dureeEstimee audioUrl");

    if (!lecture) {
      return res.status(404).json({ message: "Lecture non trouvée" });
    }

    res.json({ lecture });
  } catch (error) {
    console.error("Erreur lors de la récupération de la lecture:", error);
    if (error.name === "CastError") {
      return res.status(400).json({ message: "ID invalide" });
    }
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// @route   POST /api/lectures
// @desc    Démarrer une nouvelle lecture
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

    // Vérifier que la poésie existe
    const poesie = await Poesie.findById(poesieId);
    if (!poesie || !poesie.actif) {
      return res.status(404).json({ message: "Poésie non trouvée" });
    }

    // Vérifier s'il y a déjà une lecture en cours pour cette poésie
    const lectureEnCours = await Lecture.findOne({
      utilisateurId: req.user._id,
      poesieId,
      statut: "en-cours"
    });

    if (lectureEnCours) {
      return res.json({
        message: "Lecture en cours trouvée",
        lecture: lectureEnCours
      });
    }

    // Créer une nouvelle lecture
    const lecture = new Lecture({
      utilisateurId: req.user._id,
      poesieId,
      dateDebut: new Date()
    });

    await lecture.save();
    await lecture.populate("poesieId", "titre auteur contenu niveau theme dureeEstimee audioUrl");

    res.status(201).json({
      message: "Lecture démarrée avec succès",
      lecture
    });
  } catch (error) {
    console.error("Erreur lors du démarrage de la lecture:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// @route   PUT /api/lectures/:id
// @desc    Mettre à jour une lecture
// @access  Private
router.put("/:id", auth, [
  body("progression").optional().isFloat({ min: 0, max: 100 }).withMessage("Progression doit être entre 0 et 100"),
  body("score").optional().isFloat({ min: 0, max: 100 }).withMessage("Score doit être entre 0 et 100"),
  body("statut").optional().isIn(["en-cours", "terminee", "abandonnee"]).withMessage("Statut invalide"),
  body("motsDifficiles").optional().isArray().withMessage("Mots difficiles doivent être un tableau"),
  body("commentaires").optional().trim(),
  body("enregistrementUrl").optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const updateData = { ...req.body };

    // Si le statut passe à 'terminee', mettre à jour la date de fin et la durée
    if (req.body.statut === "terminee") {
      updateData.dateFin = new Date();
      
      const lecture = await Lecture.findOne({
        _id: req.params.id,
        utilisateurId: req.user._id
      });
      
      if (lecture) {
        updateData.duree = Math.floor((updateData.dateFin - lecture.dateDebut) / 1000);
      }
    }

    const lecture = await Lecture.findOneAndUpdate(
      { _id: req.params.id, utilisateurId: req.user._id },
      updateData,
      { new: true, runValidators: true }
    ).populate("poesieId", "titre auteur niveau theme dureeEstimee");

    if (!lecture) {
      return res.status(404).json({ message: "Lecture non trouvée" });
    }

    res.json({
      message: "Lecture mise à jour avec succès",
      lecture
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la lecture:", error);
    if (error.name === "CastError") {
      return res.status(400).json({ message: "ID invalide" });
    }
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// @route   GET /api/lectures/stats/personal
// @desc    Obtenir les statistiques personnelles de lecture
// @access  Private
router.get("/stats/personal", auth, async (req, res) => {
  try {
    const stats = await Lecture.aggregate([
      { $match: { utilisateurId: req.user._id } },
      {
        $group: {
          _id: null,
          totalLectures: { $sum: 1 },
          lecturesTerminees: {
            $sum: { $cond: [{ $eq: ["$statut", "terminee"] }, 1, 0] }
          },
          lecturesEnCours: {
            $sum: { $cond: [{ $eq: ["$statut", "en-cours"] }, 1, 0] }
          },
          scoresMoyen: { $avg: "$score" },
          tempsMoyenLecture: { $avg: "$duree" },
          tempsTotal: { $sum: "$duree" }
        }
      }
    ]);

    // Statistiques par semaine (7 derniers jours)
    const dateDebut = new Date();
    dateDebut.setDate(dateDebut.getDate() - 7);

    const statsSemaine = await Lecture.aggregate([
      {
        $match: {
          utilisateurId: req.user._id,
          dateDebut: { $gte: dateDebut }
        }
      },
      {
        $group: {
          _id: null,
          lecturesSemaine: { $sum: 1 },
          tempsSemaine: { $sum: "$duree" }
        }
      }
    ]);

    res.json({
      stats: stats[0] || {
        totalLectures: 0,
        lecturesTerminees: 0,
        lecturesEnCours: 0,
        scoresMoyen: 0,
        tempsMoyenLecture: 0,
        tempsTotal: 0
      },
      statsSemaine: statsSemaine[0] || {
        lecturesSemaine: 0,
        tempsSemaine: 0
      }
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// @route   GET /api/lectures/progress/:poesieId
// @desc    Obtenir la progression pour une poésie spécifique
// @access  Private
router.get("/progress/:poesieId", auth, async (req, res) => {
  try {
    const lectures = await Lecture.find({
      utilisateurId: req.user._id,
      poesieId: req.params.poesieId
    }).sort({ dateDebut: 1 });

    if (lectures.length === 0) {
      return res.json({ progression: [] });
    }

    const progression = lectures.map(lecture => ({
      date: lecture.dateDebut,
      score: lecture.score || 0,
      progression: lecture.progression || 0,
      statut: lecture.statut,
      tentative: lecture.tentatives || 1
    }));

    res.json({ progression });
  } catch (error) {
    console.error("Erreur lors de la récupération de la progression:", error);
    if (error.name === "CastError") {
      return res.status(400).json({ message: "ID invalide" });
    }
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;

