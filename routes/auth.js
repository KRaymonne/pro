const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");

// @route   POST /api/auth/register
// @desc    Enregistrer un nouvel utilisateur
// @access  Public
router.post("/register", [
    body("nom").not().isEmpty().withMessage("Le nom est requis"),
    body("prenom").not().isEmpty().withMessage("Le prénom est requis"),
    body("email").isEmail().withMessage("Veuillez inclure un email valide"),
    body("motDePasse").isLength({ min: 6 }).withMessage("Le mot de passe doit contenir au moins 6 caractères")
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { nom, prenom, email, motDePasse, role, classe, etablissement } = req.body;

    try {
        let user = await User.findOne({ email });

        if (user) {
            return res.status(400).json({ message: "Cet utilisateur existe déjà" });
        }

        user = new User({
            nom,
            prenom,
            email,
            motDePasse,
            role: role || 'eleve',
            classe,
            etablissement
        });

        const salt = await bcrypt.genSalt(10);
        user.motDePasse = await bcrypt.hash(motDePasse, salt);

        await user.save();

        const payload = {
            id: user.id,
            role: user.role
        };

        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 3600 }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erreur du serveur");
    }
});

// @route   POST /api/auth/login
// @desc    Authentifier l'utilisateur et obtenir le token
// @access  Public
router.post("/login", [
    body("email").isEmail().withMessage("Veuillez inclure un email valide"),
    body("motDePasse").exists().withMessage("Le mot de passe est requis")
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, motDePasse } = req.body;

    try {
        let user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: "Identifiants invalides" });
        }

        const isMatch = await bcrypt.compare(motDePasse, user.motDePasse);

        if (!isMatch) {
            return res.status(400).json({ message: "Identifiants invalides" });
        }

        const payload = {
            id: user.id,
            role: user.role
        };

        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 3600 }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erreur du serveur");
    }
});

module.exports = router;
