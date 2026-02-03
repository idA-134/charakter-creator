import multer from 'multer';
import path from 'path';
import fs from 'fs';

const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Datei-Filter: Nur bestimmte Dateitypen erlauben
const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = [
    // Dokumente
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    // PowerPoint
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    // Bilder
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/bmp',
    // Archive
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'application/x-tar',
    'application/gzip',
    // Code
    'text/plain',
    'text/html',
    'text/css',
    'application/javascript',
    'application/json',
    'application/xml',
    'text/x-python',
    'text/x-java',
    'text/x-c',
    'text/x-c++',
    'text/x-csharp',
    // Tabellen
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    // Videos
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Dateityp nicht erlaubt: ${file.mimetype}. Erlaubte Typen: PDF, Word, Excel, PowerPoint, Bilder, ZIP/RAR/7z, Videos, Text-Dateien`), false);
  }
};

const buildStorage = (uploadDir: string) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      // Generiere eindeutigen Dateinamen: timestamp-originalname
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      const nameWithoutExt = path.basename(file.originalname, ext);
      const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');
      cb(null, `${sanitizedName}-${uniqueSuffix}${ext}`);
    }
  });

export const createUpload = (subDir: string, maxFileSizeMB: number = 10) => {
  const uploadDir = path.join(process.cwd(), 'uploads', subDir);
  ensureDir(uploadDir);

  return multer({
    storage: buildStorage(uploadDir),
    fileFilter: fileFilter,
    limits: {
      fileSize: maxFileSizeMB * 1024 * 1024,
    }
  });
};

// Standard Upload (Abgaben)
export const upload = createUpload('submissions', 10);

// Hilfsfunktion zum Löschen von Dateien
export const deleteFile = (filePath: string): void => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`✅ Datei gelöscht: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Fehler beim Löschen der Datei:`, error);
  }
};

// Hilfsfunktion: Relativer Pfad für DB-Speicherung
export const getRelativePath = (absolutePath: string): string => {
  return path.relative(process.cwd(), absolutePath);
};

// Hilfsfunktion: Absoluter Pfad aus DB-Pfad
export const getAbsolutePath = (relativePath: string): string => {
  return path.join(process.cwd(), relativePath);
};
