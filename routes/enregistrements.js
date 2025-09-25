const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { body, validationResult } = require("express-validator");
const Enregistrement = require("../models/Enregistrement");
const Lecture = require("../models/Lecture");
const { auth, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// Configuration de multer pour l'upload des fichiers audio
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads/audio");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, `enregistrement-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Accepter seulement les fichiers audio
  if (file.mimetype.startsWith("audio/")) {
    cb(null, true);
  } else {
    cb(new Error("Seuls les fichiers audio sont acceptés"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB par défaut
  }
});

// @route   POST /api/enregistrements
// @desc    Upload d'un enregistrement audio
// @access  Private
router.post("/", auth, upload.single("audio"), [
  body("lectureId").isMongoId().withMessage("ID de lecture invalide"),
  body("poesieId").isMongoId().withMessage("ID de poésie invalide"),
  body("duree").optional().isFloat({ min: 0 }).withMessage("Durée doit être positive"),
  body("commentaires").optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Fichier audio requis" });
    }

    const { lectureId, poesieId, duree, commentaires } = req.body;

    // Vérifier que la lecture appartient à l'utilisateur
    const lecture = await Lecture.findOne({
      _id: lectureId,
      utilisateurId: req.user._id
    });

    if (!lecture) {
      // Supprimer le fichier uploadé si la lecture n'existe pas
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: "Lecture non trouvée" });
    }

    // Créer l'enregistrement
    const enregistrement = new Enregistrement({
      utilisateurId: req.user._id,
      poesieId,
      lectureId,
      fichierUrl: `/uploads/audio/${req.file.filename}`,
      duree: duree || 0,
      tailleFichier: req.file.size,
      formatFichier: path.extname(req.file.originalname).substring(1).toLowerCase(),
      commentaires
    });

    await enregistrement.save();

    // Mettre à jour la lecture avec l'URL de l'enregistrement
    await Lecture.findByIdAndUpdate(lectureId, {
      enregistrementUrl: enregistrement.fichierUrl
    });

    res.status(201).json({
      message: "Enregistrement uploadé avec succès",
      enregistrement
    });
  } catch (error) {
    // Supprimer le fichier en cas d'erreur
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    
    console.error("Erreur lors de l'upload de l'enregistrement:", error);
    
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "Fichier trop volumineux" });
    }
    
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// @route   GET /api/enregistrements/lecture/:lectureId
// @desc    Obtenir les enregistrements d'une lecture
// @access  Private
router.get("/lecture/:lectureId", auth, async (req, res) => {
  try {
    // Vérifier que la lecture appartient à l'utilisateur
    const lecture = await Lecture.findOne({
      _id: req.params.lectureId,
      utilisateurId: req.user._id
    });

    if (!lecture) {
      return res.status(404).json({ message: "Lecture non trouvée" });
    }

    const enregistrements = await Enregistrement.find({
      lectureId: req.params.lectureId,
      actif: true
    })
    .populate("poesieId", "titre auteur")
    .sort({ dateEnregistrement: -1 });

    res.json({ enregistrements });
  } catch (error) {
    console.error("Erreur lors de la récupération des enregistrements:", error);
    if (error.name === "CastError") {
      return res.status(400).json({ message: "ID invalide" });
    }
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// @route   GET /api/enregistrements/user
// @desc    Obtenir tous les enregistrements de l'utilisateur
// @access  Private
router.get("/user", auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const enregistrements = await Enregistrement.find({
      utilisateurId: req.user._id,
      actif: true
    })
    .populate("poesieId", "titre auteur")
    .populate("lectureId", "dateDebut score statut")
    .sort({ dateEnregistrement: -1 })
    .skip(skip)
    .limit(limit);

    const total = await Enregistrement.countDocuments({
      utilisateurId: req.user._id,
      actif: true
    });

    res.json({
      enregistrements,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des enregistrements:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// @route   GET /api/enregistrements/:id
// @desc    Obtenir un enregistrement spécifique
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    const enregistrement = await Enregistrement.findOne({
      _id: req.params.id,
      utilisateurId: req.user._id,
      actif: true
    })
    .populate("poesieId", "titre auteur contenu")
    .populate("lectureId", "dateDebut score statut");

    if (!enregistrement) {
      return res.status(404).json({ message: "Enregistrement non trouvé" });
    }

    res.json({
      enregistrement
    });
  } catch (error) {
    console.error("Erreur lors de la récupération de l'enregistrement:", error);
    if (error.name === "CastError") {
      return res.status(400).json({ message: "ID invalide" });
    }
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// @route   PUT /api/enregistrements/:id
// @desc    Mettre à jour un enregistrement
// @access  Private
router.put("/:id", auth, [
  body("qualite").optional().isIn(["excellente", "tres-bonne", "bonne", "a-ameliorer"]).withMessage("Qualité invalide"),
  body("scoreComparaison").optional().isFloat({ min: 0, max: 100 }).withMessage("Score de comparaison doit être entre 0 et 100"),
  body("commentaires").optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const enregistrement = await Enregistrement.findOneAndUpdate(
      { _id: req.params.id, utilisateurId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!enregistrement) {
      return res.status(404).json({ message: "Enregistrement non trouvé" });
    }

    res.json({
      message: "Enregistrement mis à jour avec succès",
      enregistrement
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'enregistrement:", error);
    if (error.name === "CastError") {
      return res.status(400).json({ message: "ID invalide" });
    }
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// @route   DELETE /api/enregistrements/:id
// @desc    Supprimer un enregistrement (soft delete)
// @access  Private
router.delete("/:id", auth, async (req, res) => {
  try {
    const enregistrement = await Enregistrement.findOneAndUpdate(
      { _id: req.params.id, utilisateurId: req.user._id },
      { actif: false },
      { new: true }
    );

    if (!enregistrement) {
      return res.status(404).json({ message: "Enregistrement non trouvé" });
    }

    res.json({ message: "Enregistrement supprimé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'enregistrement:", error);
    if (error.name === "CastError") {
      return res.status(400).json({ message: "ID invalide" });
    }
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// @route   GET /api/enregistrements/stats/user
// @desc    Obtenir les statistiques d'enregistrements de l'utilisateur
// @access  Private
router.get("/stats/user", auth, async (req, res) => {
  try {
    const stats = await Enregistrement.aggregate([
      { $match: { utilisateurId: req.user._id, actif: true } },
      {
        $group: {
          _id: null,
          totalEnregistrements: { $sum: 1 },
          dureeTotal: { $sum: "$duree" },
          scoreComparaisonMoyen: { $avg: "$scoreComparaison" },
          repartitionQualite: {
            $push: "$qualite"
          }
        }
      }
    ]);

    // Compter la répartition par qualité
    let repartitionQualite = {};
    if (stats[0] && stats[0].repartitionQualite) {
      stats[0].repartitionQualite.forEach(qualite => {
        repartitionQualite[qualite] = (repartitionQualite[qualite] || 0) + 1;
      });
    }

    res.json({
      stats: stats[0] || {
        totalEnregistrements: 0,
        dureeTotal: 0,
        scoreComparaisonMoyen: 0
      },
      repartitionQualite
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;

