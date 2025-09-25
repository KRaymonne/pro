const express = require("express");
const { query, validationResult } = require("express-validator");
const User = require("../models/User");
const Lecture = require("../models/Lecture");
const Enregistrement = require("../models/Enregistrement");
const { auth, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// @route   GET /api/rapports/individuel
// @desc    Obtenir le rapport individuel de l'utilisateur
// @access  Private
router.get("/individuel", auth, [
  query("periode").optional().isIn(["semaine", "mois", "trimestre", "annee"]).withMessage("Période invalide"),
  query("dateDebut").optional().isISO8601().withMessage("Date de début invalide"),
  query("dateFin").optional().isISO8601().withMessage("Date de fin invalide")
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Calculer les dates selon la période
    let dateDebut, dateFin;
    const maintenant = new Date();

    if (req.query.dateDebut && req.query.dateFin) {
      dateDebut = new Date(req.query.dateDebut);
      dateFin = new Date(req.query.dateFin);
    } else {
      switch (req.query.periode || "mois") {
        case "semaine":
          dateDebut = new Date(maintenant.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "mois":
          dateDebut = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
          break;
        case "trimestre":
          const trimestre = Math.floor(maintenant.getMonth() / 3);
          dateDebut = new Date(maintenant.getFullYear(), trimestre * 3, 1);
          break;
        case "annee":
          dateDebut = new Date(maintenant.getFullYear(), 0, 1);
          break;
        default:
          dateDebut = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
      }
      dateFin = maintenant;
    }

    // Statistiques générales
    const statsGenerales = await Lecture.aggregate([
      {
        $match: {
          utilisateurId: req.user._id,
          dateDebut: { $gte: dateDebut, $lte: dateFin }
        }
      },
      {
        $group: {
          _id: null,
          totalLectures: { $sum: 1 },
          lecturesTerminees: {
            $sum: { $cond: [{ $eq: ["$statut", "terminee"] }, 1, 0] }
          },
          scoresMoyen: { $avg: "$score" },
          tempsTotal: { $sum: "$duree" },
          progressionMoyenne: { $avg: "$progression" }
        }
      }
    ]);

    // Évolution des scores par jour
    const evolutionScores = await Lecture.aggregate([
      {
        $match: {
          utilisateurId: req.user._id,
          dateDebut: { $gte: dateDebut, $lte: dateFin },
          score: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$dateDebut" }
          },
          scoreMoyen: { $avg: "$score" },
          nombreLectures: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // Répartition par niveau et thème
    const repartition = await Lecture.aggregate([
      {
        $match: {
          utilisateurId: req.user._id,
          dateDebut: { $gte: dateDebut, $lte: dateFin }
        }
      },
      {
        $lookup: {
          from: "poesies",
          localField: "poesieId",
          foreignField: "_id",
          as: "poesie"
        }
      },
      { $unwind: "$poesie" },
      {
        $group: {
          _id: null,
          parNiveau: {
            $push: "$poesie.niveau"
          },
          parTheme: {
            $push: "$poesie.theme"
          }
        }
      }
    ]);

    // Mots difficiles les plus fréquents
    const motsDifficiles = await Lecture.aggregate([
      {
        $match: {
          utilisateurId: req.user._id,
          dateDebut: { $gte: dateDebut, $lte: dateFin },
          motsDifficiles: { $exists: true, $ne: [] }
        }
      },
      { $unwind: "$motsDifficiles" },
      {
        $group: {
          _id: "$motsDifficiles.mot",
          frequence: { $sum: 1 },
          tentativesMoyennes: { $avg: "$motsDifficiles.tentatives" }
        }
      },
      { $sort: { frequence: -1 } },
      { $limit: 10 }
    ]);

    // Statistiques d'enregistrements
    const statsEnregistrements = await Enregistrement.aggregate([
      {
        $match: {
          utilisateurId: req.user._id,
          dateEnregistrement: { $gte: dateDebut, $lte: dateFin },
          actif: true
        }
      },
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

    // Traitement des répartitions
    let repartitionNiveau = {};
    let repartitionTheme = {};
    let repartitionQualite = {};

    if (repartition[0]) {
      repartition[0].parNiveau.forEach(niveau => {
        repartitionNiveau[niveau] = (repartitionNiveau[niveau] || 0) + 1;
      });
      repartition[0].parTheme.forEach(theme => {
        repartitionTheme[theme] = (repartitionTheme[theme] || 0) + 1;
      });
    }

    if (statsEnregistrements[0] && statsEnregistrements[0].repartitionQualite) {
      statsEnregistrements[0].repartitionQualite.forEach(qualite => {
        repartitionQualite[qualite] = (repartitionQualite[qualite] || 0) + 1;
      });
    }

    res.json({
      periode: {
        debut: dateDebut,
        fin: dateFin,
        type: req.query.periode || "mois"
      },
      statistiques: {
        lectures: statsGenerales[0] || {
          totalLectures: 0,
          lecturesTerminees: 0,
          scoresMoyen: 0,
          tempsTotal: 0,
          progressionMoyenne: 0
        },
        enregistrements: statsEnregistrements[0] || {
          totalEnregistrements: 0,
          dureeTotal: 0,
          scoreComparaisonMoyen: 0
        }
      },
      evolution: evolutionScores,
      repartition: {
        niveau: repartitionNiveau,
        theme: repartitionTheme,
        qualiteEnregistrements: repartitionQualite
      },
      motsDifficiles
    });
  } catch (error) {
    console.error("Erreur lors de la génération du rapport individuel:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// @route   GET /api/rapports/classe
// @desc    Obtenir le rapport de classe (pour enseignants)
// @access  Private (Enseignant/Admin)
router.get("/classe", auth, authorize("enseignant", "admin"), [
  query("classe").optional().trim(),
  query("etablissement").optional().trim(),
  query("periode").optional().isIn(["semaine", "mois", "trimestre", "annee"]).withMessage("Période invalide")
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Filtres pour les utilisateurs
    let filtreUtilisateurs = { role: "eleve" };
    if (req.query.classe) filtreUtilisateurs.classe = req.query.classe;
    if (req.query.etablissement) filtreUtilisateurs.etablissement = req.query.etablissement;
    else if (req.user.etablissement) filtreUtilisateurs.etablissement = req.user.etablissement;

    // Obtenir les élèves
    const eleves = await User.find(filtreUtilisateurs).select("_id nom prenom classe");
    const elevesIds = eleves.map(eleve => eleve._id);

    if (elevesIds.length === 0) {
      return res.json({
        message: "Aucun élève trouvé",
        statistiques: {
          nombreEleves: 0,
          elevesActifs: 0,
          tauxReussite: 0,
          scoresMoyen: 0,
          tempsTotal: 0
        },
        classement: [],
        repartition: {}
      });
    }

    // Calculer les dates
    let dateDebut;
    const maintenant = new Date();

    switch (req.query.periode || "mois") {
      case "semaine":
        dateDebut = new Date(maintenant.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "mois":
        dateDebut = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
        break;
      case "trimestre":
        const trimestre = Math.floor(maintenant.getMonth() / 3);
        dateDebut = new Date(maintenant.getFullYear(), trimestre * 3, 1);
        break;
      case "annee":
        dateDebut = new Date(maintenant.getFullYear(), 0, 1);
        break;
      default:
        dateDebut = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
    }

    // Statistiques générales de la classe
    const statsClasse = await Lecture.aggregate([
      {
        $match: {
          utilisateurId: { $in: elevesIds },
          dateDebut: { $gte: dateDebut }
        }
      },
      {
        $group: {
          _id: null,
          totalLectures: { $sum: 1 },
          lecturesTerminees: {
            $sum: { $cond: [{ $eq: ["$statut", "terminee"] }, 1, 0] }
          },
          scoresMoyen: { $avg: "$score" },
          tempsTotal: { $sum: "$duree" },
          elevesActifs: { $addToSet: "$utilisateurId" }
        }
      }
    ]);

    // Classement des élèves
    const classement = await Lecture.aggregate([
      {
        $match: {
          utilisateurId: { $in: elevesIds },
          dateDebut: { $gte: dateDebut }
        }
      },
      {
        $group: {
          _id: "$utilisateurId",
          scoresMoyen: { $avg: "$score" },
          totalLectures: { $sum: 1 },
          lecturesTerminees: {
            $sum: { $cond: [{ $eq: ["$statut", "terminee"] }, 1, 0] }
          },
          tempsTotal: { $sum: "$duree" }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "utilisateur"
        }
      },
      { $unwind: "$utilisateur" },
      {
        $project: {
          nom: "$utilisateur.nom",
          prenom: "$utilisateur.prenom",
          classe: "$utilisateur.classe",
          scoresMoyen: 1,
          totalLectures: 1,
          lecturesTerminees: 1,
          tempsTotal: 1,
          tauxReussite: {
            $cond: [
              { $eq: ["$totalLectures", 0] },
              0,
              { $multiply: [{ $divide: ["$lecturesTerminees", "$totalLectures"] }, 100] }
            ]
          }
        }
      },
      { $sort: { scoresMoyen: -1 } }
    ]);

    // Élèves en difficulté (score < 60%)
    const elevesEnDifficulte = classement.filter(eleve => 
      eleve.scoresMoyen < 60 || eleve.tauxReussite < 50
    );

    res.json({
      periode: {
        debut: dateDebut,
        fin: maintenant,
        type: req.query.periode || "mois"
      },
      statistiques: {
        nombreEleves: eleves.length,
        elevesActifs: statsClasse[0]?.elevesActifs.length || 0,
        tauxReussite: statsClasse[0] ? 
          (statsClasse[0].lecturesTerminees / statsClasse[0].totalLectures * 100) : 0,
        scoresMoyen: statsClasse[0]?.scoresMoyen || 0,
        tempsTotal: statsClasse[0]?.tempsTotal || 0,
        totalLectures: statsClasse[0]?.totalLectures || 0
      },
      classement,
      elevesEnDifficulte,
      alertes: {
        nombreElevesEnDifficulte: elevesEnDifficulte.length,
        elevesInactifs: eleves.length - (statsClasse[0]?.elevesActifs.length || 0)
      }
    });
  } catch (error) {
    console.error("Erreur lors de la génération du rapport de classe:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// @route   GET /api/rapports/export
// @desc    Exporter les données de l'utilisateur
// @access  Private
router.get("/export", auth, [
  query("format").optional().isIn(["json", "csv"]).withMessage("Format invalide"),
  query("type").optional().isIn(["lectures", "enregistrements", "complet"]).withMessage("Type invalide")
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const format = req.query.format || "json";
    const type = req.query.type || "complet";

    let donnees = {};

    if (type === "lectures" || type === "complet") {
      donnees.lectures = await Lecture.find({ utilisateurId: req.user._id })
        .populate("poesieId", "titre auteur niveau theme")
        .sort({ dateDebut: -1 });
    }

    if (type === "enregistrements" || type === "complet") {
      donnees.enregistrements = await Enregistrement.find({ 
        utilisateurId: req.user._id,
        actif: true 
      })
        .populate("poesieId", "titre auteur")
        .sort({ dateEnregistrement: -1 });
    }

    if (type === "complet") {
      donnees.utilisateur = req.user.toJSON();
    }

    if (format === "json") {
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="export-${type}-${Date.now()}.json"`);
      res.json(donnees);
    } else {
      // Format CSV (simplifié pour les lectures)
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="export-${type}-${Date.now()}.csv"`);
      
      if (type === "lectures" && donnees.lectures) {
        let csv = "Date,Poésie,Auteur,Score,Durée,Statut\n";
        donnees.lectures.forEach(lecture => {
          csv += `${lecture.dateDebut.toISOString()},${lecture.poesieId?.titre || ""},${lecture.poesieId?.auteur || ""},${lecture.score || ""},${lecture.duree || ""},${lecture.statut}\n`;
        });
        res.send(csv);
      } else {
        res.status(400).json({ message: "Export CSV non disponible pour ce type de données" });
      }
    }
  } catch (error) {
    console.error("Erreur lors de l'export:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;

