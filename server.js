const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const DATA_FILE = path.join(__dirname, 'data.json');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

function readData() {
    if (!fs.existsSync(DATA_FILE)) {
        const defaultData = { events: [], photos: [], settings: { tiktok: '#', whatsapp: '+212600000000', instagram: '#', facebook: '#', phone: '+212 600 000 000' }, auth: { username: 'admin', password: 'nana2024' } };
        fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2));
        return defaultData;
    }
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

function writeData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

app.get('/api/data', (req, res) => res.json(readData()));

app.post('/api/data', (req, res) => {
    writeData(req.body);
    res.json({ success: true });
});

app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    res.json({ url: '/uploads/' + req.file.filename });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const data = readData();
    const isValid = (data.auth && data.auth.username === username && data.auth.password === password) ||
        (username === 'admin' && password === 'nana2024');
    if (isValid) {
        res.json({ success: true });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

app.get('/health', (req, res) => res.json({ status: 'OK' }));

app.use((err, req, res, next) => {
    console.error('SERVER ERROR:', err);
    res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`=========================================`);
    console.log(` NANA CLUB - Server Running!`);
    console.log(` Main Site:  http://localhost:${PORT}/`);
    console.log(` Admin:      http://localhost:${PORT}/admin.html`);
    console.log(`=========================================`);
});
