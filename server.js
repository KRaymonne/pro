const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config({ path: ".env" });

const app = express();

// Middleware de sécurité
app.use(helmet());

// Configuration CORS
app.use(cors({
  origin: "*", // Permettre toutes les origines pour le développement
  credentials: true
}));

// Limitation du taux de requêtes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limite chaque IP à 100 requêtes par windowMs
});
app.use(limiter);

// Middleware pour parser JSON
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Servir les fichiers statiques (uploads)
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/poesies", require("./routes/poesies"));
app.use("/api/lectures", require("./routes/lectures"));
app.use("/api/enregistrements", require("./routes/enregistrements"));
app.use("/api/favoris", require("./routes/favoris"));
app.use("/api/rapports", require("./routes/rapports"));
app.use("/api/audio", require("./routes/audio"));

// Route de test
app.get("/api/test", (req, res) => {
  res.json({ message: "API fonctionne correctement!" });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Erreur serveur interne" });
});

// Route 404
app.use((req, res) => {
  res.status(404).json({ message: "Route non trouvée" });
});

// Connexion à MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log("Connecté à MongoDB");
})
.catch((err) => {
  console.error("Erreur de connexion à MongoDB:", err);
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});

module.exports = app;
