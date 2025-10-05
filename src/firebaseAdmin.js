import admin from "firebase-admin";

let serviceAccount;

// Verificar si estamos en producción (Railway) con variables separadas
if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
  // En producción: construir el objeto desde variables de entorno
  serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Convertir \n literales a saltos de línea reales
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
  };
  console.log("✓ Firebase config cargada desde variables de entorno");
} else {
  // En desarrollo: leer desde archivo local
  try {
    const { readFileSync } = await import("fs");
    const { fileURLToPath } = await import("url");
    const { dirname, resolve } = await import("path");
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    
    serviceAccount = JSON.parse(
      readFileSync(resolve(__dirname, "../serviceAccountKey.json"), "utf8")
    );
    console.log("✓ Firebase config cargada desde archivo local");
  } catch (error) {
    console.error("✗ Error al leer serviceAccountKey.json:", error.message);
    throw error;
  }
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default admin;