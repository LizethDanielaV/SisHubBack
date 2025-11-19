import { bucket } from "../firebaseAdmin.js";
import fs from 'fs';
import simpleGit from 'simple-git';
import path from 'path';
import { promisify } from 'util';
import { pipeline } from 'stream';
import fetch from 'node-fetch';

const streamPipeline = promisify(pipeline);
const git = simpleGit();

/**
 * Sube un archivo local a Firebase Storage
 */
<<<<<<< HEAD
async function subirArchivoAFirebase(file, filePath, folder = "entregables") {
=======
async function subirArchivoAFirebase(file, filePath, folder = "preguntas") {
>>>>>>> f9dbfc58c3f2bb43145ed565918c18d2c254b2bc
  try {
    const fileName = path.basename(filePath);
    const destination = `${folder}/${fileName.replace(/\\/g, "_")}`;
    console.log(`📤 Subiendo archivo a Firebase: ${destination}`);

    // ✅ Crea la referencia correcta dentro del bucket
    const fileUpload = bucket.file(destination);

    // ✅ Si el contenido viene como Buffer
    if (Buffer.isBuffer(file)) {
      await fileUpload.save(file, {
        metadata: { contentType: "application/octet-stream" },
      });
    }
    // ✅ Si viene como una ruta de archivo local
    else if (typeof file === "string") {
      await bucket.upload(file, {
        destination,
        metadata: { contentType: "application/octet-stream" },
      });
    } else {
      throw new Error("Tipo de archivo no soportado");
    }

    // ✅ Hacer público el archivo
    await fileUpload.makePublic();

    // ✅ Construir y retornar la URL pública
    const url = `https://storage.googleapis.com/${bucket.name}/${destination}`;
    console.log(`✅ Archivo subido exitosamente: ${url}`);

    return url;
  } catch (error) {
    console.error("❌ Error al subir archivo a Firebase:", error);
    throw new Error("Error al subir el archivo: " + error.message);
  }
}

/**
 * Clona un repositorio de Git
 */
async function clonarRepositorio(repoUrl, outputPath = './temp/repos') {
    try {
        console.log(`📥 Clonando repositorio: ${repoUrl}`);

        // Validar URL de Git
        const gitUrlPattern = /^(https?:\/\/)?(www\.)?(github|gitlab|bitbucket)\.(com|org)\/.+\/.+/i;
        if (!gitUrlPattern.test(repoUrl)) {
            throw new Error('URL de repositorio Git inválida');
        }

        if (!fs.existsSync(outputPath)) {
            fs.mkdirSync(outputPath, { recursive: true });
        }

        const repoName = repoUrl.split('/').pop().replace('.git', '');
        const repoPath = path.join(outputPath, `${Date.now()}_${repoName}`);

        // Clonar con timeout de 5 minutos
        await git.clone(repoUrl, repoPath, {
            '--depth': 1, // Clone superficial (más rápido)
            '--single-branch': null,
            '--config': 'http.timeout=300'
        });

        console.log(`✅ Repositorio clonado: ${repoPath}`);

        return repoPath;
    } catch (error) {
        console.error('❌ Error al clonar repositorio:', error);
        throw new Error('Error al clonar el repositorio: ' + error.message);
    }
}

/**
 * Descarga una imagen desde una URL
 */
async function descargarImagen(url, outputPath = './temp/images') {
    try {
        console.log(`📥 Descargando imagen: ${url}`);

        if (!fs.existsSync(outputPath)) {
            fs.mkdirSync(outputPath, { recursive: true });
        }

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Error al descargar imagen: ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.startsWith('image/')) {
            throw new Error('La URL no apunta a una imagen válida');
        }

        const extension = contentType.split('/')[1];
        const fileName = `image_${Date.now()}.${extension}`;
        const filePath = path.join(outputPath, fileName);

        await streamPipeline(response.body, fs.createWriteStream(filePath));

        console.log(`✅ Imagen descargada: ${filePath}`);

        return filePath;
    } catch (error) {
        console.error('❌ Error al descargar imagen:', error);
        throw new Error('Error al descargar la imagen: ' + error.message);
    }
}

/**
 * Comprime una carpeta (útil para repositorios)
 */
async function comprimirCarpeta(folderPath) {
    try {
        console.log(`📦 Comprimiendo carpeta: ${folderPath}`);

        const { default: archiver } = await import('archiver');
        const zipPath = `${folderPath}.zip`;
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        return new Promise((resolve, reject) => {
            output.on('close', () => {
                console.log(`✅ Carpeta comprimida: ${zipPath} (${archive.pointer()} bytes)`);
                resolve(zipPath);
            });

            archive.on('error', reject);
            archive.on('warning', (err) => {
                if (err.code !== 'ENOENT') {
                    console.warn('⚠️ Advertencia al comprimir:', err);
                }
            });

            archive.pipe(output);
            archive.directory(folderPath, false);
            archive.finalize();
        });
    } catch (error) {
        console.error('❌ Error al comprimir carpeta:', error);
        throw new Error('Error al comprimir la carpeta: ' + error.message);
    }
}

/**
 * Limpia archivos temporales
 */
function limpiarArchivosTemporales(rutas) {
    try {
        if (!rutas) return;

        // Convertir a array si es un solo string
        const archivos = Array.isArray(rutas) ? rutas : [rutas];

        for (const filePath of archivos) {
            if (fs.existsSync(filePath)) {
                if (fs.lstatSync(filePath).isDirectory()) {
                    fs.rmSync(filePath, { recursive: true, force: true });
                    console.log(`🗑️ Carpeta temporal eliminada: ${filePath}`);
                } else {
                    fs.unlinkSync(filePath);
                    console.log(`🗑️ Archivo temporal eliminado: ${filePath}`);
                }
            }
        }
    } catch (error) {
        console.error("⚠️ Error al limpiar archivos temporales:", error);
    }
}

export {
    descargarImagen,
    subirArchivoAFirebase,
    clonarRepositorio,
    comprimirCarpeta,
    limpiarArchivosTemporales
};