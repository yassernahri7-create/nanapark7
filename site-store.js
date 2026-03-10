const fs = require("fs");
const path = require("path");

const bundledDataFile = path.join(__dirname, "data.json");
const bundledUploadsDir = path.join(__dirname, "uploads");
const dataFile = process.env.DATA_FILE || bundledDataFile;
const uploadsDir = process.env.UPLOADS_DIR || bundledUploadsDir;

const INITIAL_DATA = {
  events: [],
  carta: {
    drinks: []
  },
  photos: [],
  settings: {
    tiktok: "#",
    whatsapp: "+212600000000",
    instagram: "#",
    facebook: "#",
    phone: "+212 600 000 000"
  }
};

function ensureParentDirectory(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyDirectoryContents(sourceDir, targetDir) {
  if (!fs.existsSync(sourceDir)) return;
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    if (entry.name === ".gitkeep") {
      continue;
    }
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);
    if (sourcePath === targetPath) {
      continue;
    }
    if (entry.isDirectory()) {
      if (!fs.existsSync(targetPath)) {
        fs.mkdirSync(targetPath, { recursive: true });
      }
      copyDirectoryContents(sourcePath, targetPath);
      continue;
    }
    if (!fs.existsSync(targetPath)) {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

function seedDataFile() {
  if (fs.existsSync(dataFile)) return;
  if (dataFile !== bundledDataFile && fs.existsSync(bundledDataFile)) {
    fs.copyFileSync(bundledDataFile, dataFile);
    return;
  }
  fs.writeFileSync(dataFile, JSON.stringify(INITIAL_DATA, null, 2), "utf8");
}

function seedUploadsDirectory() {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  if (uploadsDir !== bundledUploadsDir && fs.existsSync(bundledUploadsDir)) {
    copyDirectoryContents(bundledUploadsDir, uploadsDir);
  }
}

function ensureStorage() {
  ensureParentDirectory(dataFile);
  seedUploadsDirectory();
  seedDataFile();
}

function asString(value, maxLength = 4000) {
  if (typeof value !== "string") return "";
  return value.slice(0, maxLength);
}

function sanitizeEvent(event, index) {
  const source = event && typeof event === "object" ? event : {};
  return {
    id: asString(source.id, 128) || `ev-${Date.now()}-${index}`,
    image: asString(source.image, 2048),
    day: asString(source.day, 80),
    date: asString(source.date, 160),
    details: asString(source.details, 4000),
    musicBy: asString(source.musicBy, 160),
    themeColor: asString(source.themeColor, 32) || "#d4af37"
  };
}

function sanitizeDrink(drink, index) {
  const source = drink && typeof drink === "object" ? drink : {};
  return {
    id: asString(source.id, 128) || `drink-${Date.now()}-${index}`,
    image: asString(source.image, 2048),
    name: asString(source.name, 160),
    category: asString(source.category, 120),
    price: asString(source.price, 120),
    tablePrice: asString(source.tablePrice, 120)
  };
}

function sanitizePhoto(photo, index) {
  const source = photo && typeof photo === "object" ? photo : {};
  const type = asString(source.type, 16).toLowerCase() === "video" ? "video" : "image";
  return {
    id: asString(source.id, 128) || `photo-${Date.now()}-${index}`,
    type,
    src: asString(source.src, 2048),
    alt: asString(source.alt, 240)
  };
}

function sanitizeSettings(settings) {
  const source = settings && typeof settings === "object" ? settings : {};
  return {
    tiktok: asString(source.tiktok, 2048),
    whatsapp: asString(source.whatsapp, 64),
    instagram: asString(source.instagram, 2048),
    facebook: asString(source.facebook, 2048),
    phone: asString(source.phone, 64)
  };
}

function normalizeData(input) {
  const source = input && typeof input === "object" ? input : {};
  return {
    events: Array.isArray(source.events) ? source.events.map(sanitizeEvent) : [],
    carta: {
      drinks: source.carta && Array.isArray(source.carta.drinks)
        ? source.carta.drinks.map(sanitizeDrink)
        : []
    },
    photos: Array.isArray(source.photos) ? source.photos.map(sanitizePhoto) : [],
    settings: sanitizeSettings(source.settings)
  };
}

function readData() {
  ensureStorage();

  try {
    const raw = fs.readFileSync(dataFile, "utf8");
    return normalizeData(JSON.parse(raw));
  } catch (_error) {
    return normalizeData(INITIAL_DATA);
  }
}

function writeData(data) {
  ensureStorage();
  const normalized = normalizeData(data);
  fs.writeFileSync(dataFile, JSON.stringify(normalized, null, 2), "utf8");
  return normalized;
}

module.exports = {
  dataFile,
  uploadsDir,
  ensureStorage,
  readData,
  writeData,
  normalizeData
};
