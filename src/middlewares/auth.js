import admin from "../firebaseAdmin.js";

export const verificarToken = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ error: "Token requerido" });

    const token = header.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Token mal formado" });

    const decoded = await admin.auth().verifyIdToken(token);
    req.userFirebase = decoded; 
    next();
  } catch (err) {
    console.error("verify token:", err);
    return res.status(403).json({ error: "Token inválido" });
  }
};