require('dotenv').config();
const path = require('path');

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const nodemailer = require('nodemailer');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const { syncData, loadDataFromMega, syncMediaToMega, deleteMediaFromMega, createMegaFolder } = require('./sync');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static frontend in production (if built)
app.use(express.static(path.join(__dirname, 'frontend', 'dist')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

const DATA_DIR = path.join(__dirname, 'data');
const UPLOAD_DIR = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const STUDENTS_FILE = path.join(DATA_DIR, 'students.json');
const TEACHERS_FILE = path.join(DATA_DIR, 'teachers.json');
const ATTENDANCE_FILE = path.join(DATA_DIR, 'attendance.json');
const LEAVES_FILE = path.join(DATA_DIR, 'leaves.json');
const GALLERY_FILE = path.join(DATA_DIR, 'gallery.json');
const ANNOUNCEMENTS_FILE = path.join(DATA_DIR, 'announcements.json');

// Helper to read JSON file safely
function readJSON(file, defaultVal = null) {
    try {
        if (!fs.existsSync(file)) return defaultVal;
        const content = fs.readFileSync(file, 'utf8');
        if (!content || !content.trim()) return defaultVal;
        return JSON.parse(content);
    } catch (e) {
        console.error(`Error reading ${file}:`, e.message);
        return defaultVal;
    }
}

// Helper to write JSON file safely (Atomic write via tmp file)
function writeJSON(file, data) {
    try {
        const tempFile = file + '.tmp';
        fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
        fs.renameSync(tempFile, file);
        return true;
    } catch (e) {
        console.error(`Error writing to ${file}:`, e);
        return false;
    }
}

// --- Startup Mega Cloud Storage Initialization ---
async function initializeDataFromMegaStartup() {
    const dataTypes = [
        { type: 'students', file: STUDENTS_FILE, defaultVal: [] },
        { type: 'teachers', file: TEACHERS_FILE, defaultVal: [] },
        { type: 'attendance', file: ATTENDANCE_FILE, defaultVal: {} },
        { type: 'leaves', file: LEAVES_FILE, defaultVal: [] },
        { type: 'gallery', file: GALLERY_FILE, defaultVal: [{ id: 1, name: 'Madrasa Events 2026', date: '2026-01-01', items: [] }] },
        { type: 'announcements', file: ANNOUNCEMENTS_FILE, defaultVal: [] }
    ];

    console.log(`[STARTUP] Checking local data files against Mega Cloud Storage...`);
    for (const item of dataTypes) {
        const exists = fs.existsSync(item.file);
        const content = exists ? fs.readFileSync(item.file, 'utf8').trim() : '';
        if (!exists || !content) {
            console.log(`[STARTUP] Local ${item.type}.json missing or empty. Fetching from Mega Cloud Storage...`);
            const cloudData = await loadDataFromMega(item.type);
            if (cloudData !== null && cloudData !== undefined) {
                writeJSON(item.file, cloudData);
                console.log(`[STARTUP] Successfully restored ${item.type}.json from Mega Cloud Storage.`);
            } else {
                console.log(`[STARTUP] No cloud backup found for ${item.type} on Mega. Initializing with default values.`);
                writeJSON(item.file, item.defaultVal);
            }
        } else {
            console.log(`[STARTUP] Local ${item.type}.json verified.`);
        }
    }
}

// Run startup sync in background
initializeDataFromMegaStartup().catch(err => {
    console.error(`[STARTUP] Error during Mega Cloud Storage initialization sync:`, err.message);
});

// ---------------- API ROUTES ----------------

// --- Students CRUD ---
app.get('/api/students', (req, res) => {
    const students = readJSON(STUDENTS_FILE, []);
    const seen = new Set();
    const uniqueStudents = students.filter(s => {
        const key = s.rollId || s.id;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
    res.json(uniqueStudents);
});

app.post('/api/students', (req, res) => {
    const students = readJSON(STUDENTS_FILE, []);
    const newStudent = req.body;

    if (!newStudent.name || !newStudent.rollId) {
        return res.status(400).json({ error: 'Name and Roll/ITS ID are required.' });
    }

    newStudent.id = newStudent.id || `s_${Date.now()}`;
    students.push(newStudent);

    if (writeJSON(STUDENTS_FILE, students)) {
        syncData('students', students);
        res.status(201).json({ success: true, student: newStudent });
    } else {
        res.status(500).json({ error: 'Failed to add student.' });
    }
});

app.put('/api/students/:id', (req, res) => {
    const { id } = req.params;
    const updatedData = req.body;
    const students = readJSON(STUDENTS_FILE, []);
    const index = students.findIndex(s => String(s.id) === String(id) || String(s.rollId) === String(id) || (updatedData.rollId && String(s.rollId) === String(updatedData.rollId)));

    if (index === -1) {
        return res.status(404).json({ error: 'Student not found.' });
    }

    students[index] = { ...students[index], ...updatedData };

    if (writeJSON(STUDENTS_FILE, students)) {
        syncData('students', students);
        res.json({ success: true, student: students[index] });
    } else {
        res.status(500).json({ error: 'Failed to update student.' });
    }
});

app.delete('/api/students/:id', (req, res) => {
    const { id } = req.params;
    let students = readJSON(STUDENTS_FILE, []);
    const filtered = students.filter(s => String(s.id) !== String(id) && String(s.rollId) !== String(id));

    if (filtered.length === students.length) {
        return res.status(404).json({ error: 'Student not found.' });
    }

    if (writeJSON(STUDENTS_FILE, filtered)) {
        syncData('students', filtered);
        res.json({ success: true, message: 'Student deleted successfully.' });
    } else {
        res.status(500).json({ error: 'Failed to delete student.' });
    }
});

// --- Teachers CRUD ---
app.get('/api/teachers', (req, res) => {
    const teachers = readJSON(TEACHERS_FILE, []);
    res.json(teachers);
});

app.post('/api/teachers', (req, res) => {
    const teachers = readJSON(TEACHERS_FILE, []);
    const newTeacher = req.body;

    if (!newTeacher.name || !newTeacher.id) {
        return res.status(400).json({ error: 'Teacher Name and ID are required.' });
    }

    teachers.push(newTeacher);

    if (writeJSON(TEACHERS_FILE, teachers)) {
        syncData('teachers', teachers);
        res.status(201).json({ success: true, teacher: newTeacher });
    } else {
        res.status(500).json({ error: 'Failed to add teacher.' });
    }
});

app.put('/api/teachers/:id', (req, res) => {
    const { id } = req.params;
    const updatedData = req.body;
    const teachers = readJSON(TEACHERS_FILE, []);
    const index = teachers.findIndex(t => String(t.id) === String(id));

    if (index === -1) {
        return res.status(404).json({ error: 'Teacher not found.' });
    }

    teachers[index] = { ...teachers[index], ...updatedData };

    if (writeJSON(TEACHERS_FILE, teachers)) {
        syncData('teachers', teachers);
        res.json({ success: true, teacher: teachers[index] });
    } else {
        res.status(500).json({ error: 'Failed to update teacher.' });
    }
});

app.delete('/api/teachers/:id', (req, res) => {
    const { id } = req.params;
    let teachers = readJSON(TEACHERS_FILE, []);
    const filtered = teachers.filter(t => String(t.id) !== String(id));

    if (filtered.length === teachers.length) {
        return res.status(404).json({ error: 'Teacher not found.' });
    }

    if (writeJSON(TEACHERS_FILE, filtered)) {
        syncData('teachers', filtered);
        res.json({ success: true, message: 'Teacher deleted successfully.' });
    } else {
        res.status(500).json({ error: 'Failed to delete teacher.' });
    }
});

// --- Email Notification Setup ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'kchmwajihiyah@gmail.com',
        pass: process.env.EMAIL_PASS || process.env.MAIL_PASS || ''
    }
});

async function sendAbsentEmail(student, date) {
    if (!student.email) return;
    try {
        await transporter.sendMail({
            from: '"Madrasa Wajihiyah Khachroad" <kchmwajihiyah@gmail.com>',
            to: student.email,
            subject: `Absentee Notice for ${student.name} - ${date}`,
            text: `Dear Parents,\n\nYour ward, ${student.name} (${student.grade || 'Class'}), was marked absent on ${date} without prior intimation.\n\nRegular attendance is essential for academic progress. Kindly submit a leave request here: https://kch-connect.onrender.com/\n\nKindly ensure your child attends school tomorrow with all pending work completed.\n\nRegards,\nMadrasa Wajihiyah Khachroad`
        });
        console.log(`[Email] Absent notice sent to ${student.email} for ${student.name}`);
    } catch (e) {
        console.error(`[Email] Failed to send absent email to ${student.email}:`, e.message);
    }
}

// --- WhatsApp Automated Alerts Setup ---
let client = null;
try {
    const { Client, LocalAuth } = require('whatsapp-web.js');
    const qrcode = require('qrcode-terminal');
    client = new Client({
        authStrategy: new LocalAuth(),
        puppeteer: {
            headless: true,
            executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
    });
    client.on('qr', (qr) => {
        console.log('[WhatsApp] QR RECEIVED, scan please:');
        qrcode.generate(qr, { small: true });
    });
    client.on('ready', () => {
        console.log('[WhatsApp] Client is ready!');
    });
    client.initialize().catch(err => {
        console.log('[WhatsApp] Initialization skipped or failed:', err.message);
    });
} catch (e) {
    console.log('[WhatsApp] whatsapp-web.js not active:', e.message);
}

// Email transporter configuration (kchmwajihiyah@gmail.com)
const emailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'kchmwajihiyah@gmail.com',
        pass: process.env.EMAIL_PASSWORD || process.env.GMAIL_PASS || ''
    }
});

async function sendAbsentEmail(student, date) {
    const emailPass = process.env.EMAIL_PASSWORD || process.env.GMAIL_PASS;
    if (!emailPass) {
        console.log(`[Email Notice] Email password not configured in .env (EMAIL_PASSWORD). Simulated email for ${student.name} to ${student.email || 'kchmwajihiyah@gmail.com'}`);
        return;
    }
    const recipient = student.email || student.parentEmail || 'kchmwajihiyah@gmail.com';
    try {
        await emailTransporter.sendMail({
            from: '"Madrasa Wajihiyah Khachroad" <kchmwajihiyah@gmail.com>',
            to: recipient,
            subject: `Absence Notice for ${student.name} - ${date}`,
            text: `Dear Parents,\n\nYour ward, ${student.name} (${student.grade || 'Class'}), was marked absent on ${date} without prior intimation.\n\nKindly submit a leave request via KCH Connect: https://kch-connect.onrender.com/\n\nRegards,\nMadrasa Wajihiyah Khachroad`
        });
        console.log(`[Email] Sent absence email to ${recipient} for ${student.name}`);
    } catch (e) {
        console.error(`[Email] Failed to send email to ${recipient}:`, e.message);
    }
}

// Helper to create random delays between requests
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function sendBatchAbsentAlerts(absentList, date = new Date().toISOString().split('T')[0]) {
    for (let i = 0; i < absentList.length; i++) {
        const student = absentList[i];

        // Send email notification via kchmwajihiyah@gmail.com
        await sendAbsentEmail(student, date);

        const cleanPhone = (student.phone || '').replace(/[^0-9]/g, '');
        if (!cleanPhone) continue;
        const formattedNumber = `${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}@c.us`;

        const message = `📋 ABSENTEE NOTICE

Dear Parents,

Your ward, ${student.name} (${student.grade || 'Class'}), was marked absent on ${date} without prior intimation.

Regular attendance is essential for academic progress. Kindly submit a leave request here: https://kch-connect.onrender.com/

Kindly ensure your child attends school tomorrow with all pending work completed. Kindly acknowledge this message.

Regards,
Madrasa Wajihiyah Khachroad (Sender: +91 7737252833)`;

        try {
            let sentViaWhatsApp = false;
            if (client && client.info && client.pupPage && typeof client.sendMessage === 'function') {
                try {
                    await client.sendMessage(formattedNumber, message);
                    console.log(`[${i + 1}/${absentList.length}] Sent WhatsApp absent alert to ${student.name} (${cleanPhone}) from +91 7737252833`);
                    sentViaWhatsApp = true;
                } catch (innerErr) {
                    console.log(`[WhatsApp] sendMessage error (${innerErr.message}), falling back to simulation.`);
                }
            }
            if (!sentViaWhatsApp) {
                console.log(`[WhatsApp Simulation] [${i + 1}/${absentList.length}] From: +91 7737252833 To: ${cleanPhone}\nMessage:\n${message}\n-------------------`);
            }
        } catch (err) {
            console.error(`Failed for ${student.name}:`, err.message);
        }

        // Wait between 3 to 6 seconds before sending the next message
        const randomDelay = Math.floor(Math.random() * 3000) + 3000;
        await sleep(randomDelay);
    }

    console.log(`All ${absentList.length} attendance absence alerts completed safely!`);
}

// --- Attendance Routes ---
app.get('/api/attendance', (req, res) => {
    const attendance = readJSON(ATTENDANCE_FILE, {});
    res.json(attendance);
});

app.post('/api/attendance', (req, res) => {
    const { date, records } = req.body;
    if (!date || !records) {
        return res.status(400).json({ error: 'Date and records are required.' });
    }

    const attendance = readJSON(ATTENDANCE_FILE, {});
    attendance[date] = { ...(attendance[date] || {}), ...records };

    if (writeJSON(ATTENDANCE_FILE, attendance)) {
        syncData('attendance', attendance);

        // Automatically trigger batch absent alerts for absentees on this date
        const students = readJSON(STUDENTS_FILE, []);
        const absentList = [];
        for (const [studentId, status] of Object.entries(records)) {
            if (status === 'Absent') {
                const student = students.find(s => String(s.id) === String(studentId) || String(s.rollId) === String(studentId));
                if (student && student.phone && student.phone !== '-') {
                    absentList.push({
                        phone: student.phone,
                        name: student.name,
                        grade: student.grade || 'N/A',
                        email: student.email,
                        parentEmail: student.parentEmail
                    });
                }
            }
        }

        if (absentList.length > 0) {
            sendBatchAbsentAlerts(absentList, date).catch(e => console.error('Batch WhatsApp error:', e));
        }

        res.json({ success: true, attendance });
    } else {
        res.status(500).json({ error: 'Failed to save attendance.' });
    }
});

app.post('/api/whatsapp/send-absent', async (req, res) => {
    const { date, absentList } = req.body;
    if (!absentList || !Array.isArray(absentList)) {
        return res.status(400).json({ error: 'absentList array required.' });
    }
    const targetDate = date || new Date().toISOString().split('T')[0];
    sendBatchAbsentAlerts(absentList, targetDate).catch(e => console.error('Manual batch WhatsApp error:', e));
    res.json({ success: true, message: `Batch WhatsApp absent alerts initiated for ${absentList.length} students.` });
});

// --- Leaves Routes ---
app.get('/api/leaves', (req, res) => {
    const leaves = readJSON(LEAVES_FILE, []);
    res.json(leaves);
});

app.post('/api/leaves', (req, res) => {
    const leave = req.body;
    if (!leave || !leave.sId || !leave.start || !leave.end) {
        return res.status(400).json({ error: 'Missing required leave fields.' });
    }

    const leaves = readJSON(LEAVES_FILE, []);
    const newLeave = {
        id: leave.id || `${leave.sId}_${leave.start}_${Date.now()}`,
        sId: leave.sId,
        type: leave.type || 'Other',
        reason: leave.reason || '',
        start: leave.start,
        end: leave.end,
        status: leave.status || 'Pending',
        rejReason: leave.rejReason || '',
        submittedAt: leave.submittedAt || new Date().toISOString()
    };

    leaves.push(newLeave);

    if (writeJSON(LEAVES_FILE, leaves)) {
        syncData('leaves', leaves);
        res.json({ success: true, leave: newLeave });
    } else {
        res.status(500).json({ error: 'Failed to submit leave.' });
    }
});

app.put('/api/leaves/:id', (req, res) => {
    const { id } = req.params;
    const { status, rejReason } = req.body;

    const leaves = readJSON(LEAVES_FILE, []);
    const leaveIndex = leaves.findIndex(l => l.id === id);

    if (leaveIndex === -1) {
        return res.status(404).json({ error: 'Leave request not found.' });
    }

    leaves[leaveIndex].status = status || leaves[leaveIndex].status;
    if (rejReason !== undefined) {
        leaves[leaveIndex].rejReason = rejReason;
    }

    // Auto update attendance on approval
    if (status === 'Approved') {
        const leave = leaves[leaveIndex];
        const attendance = readJSON(ATTENDANCE_FILE, {});
        const students = readJSON(STUDENTS_FILE, []);
        const student = students.find(s => String(s.id) === String(leave.sId) || String(s.rollId) === String(leave.sId));
        const targetIds = [leave.sId];
        if (student) {
            targetIds.push(String(student.id), String(student.rollId));
        }

        let currentDate = new Date(leave.start);
        const stopDate = new Date(leave.end);
        while (currentDate <= stopDate) {
            const dateStr = currentDate.toISOString().split('T')[0];
            if (!attendance[dateStr]) attendance[dateStr] = {};
            targetIds.forEach(id => {
                if (id) attendance[dateStr][id] = 'Leave';
            });
            currentDate.setDate(currentDate.getDate() + 1);
        }
        writeJSON(ATTENDANCE_FILE, attendance);
        syncData('attendance', attendance);
    }

    if (writeJSON(LEAVES_FILE, leaves)) {
        syncData('leaves', leaves);
        res.json({ success: true, leave: leaves[leaveIndex] });
    } else {
        res.status(500).json({ error: 'Failed to update leave.' });
    }
});

app.delete('/api/leaves/:id', (req, res) => {
    const { id } = req.params;
    let leaves = readJSON(LEAVES_FILE, []);
    const filtered = leaves.filter(l => l.id !== id);

    if (filtered.length === leaves.length) {
        return res.status(404).json({ error: 'Leave request not found.' });
    }

    if (writeJSON(LEAVES_FILE, filtered)) {
        syncData('leaves', filtered);
        res.json({ success: true, message: 'Leave deleted successfully.' });
    } else {
        res.status(500).json({ error: 'Failed to delete leave.' });
    }
});

// --- Media Upload Route ---
app.post('/api/upload', async (req, res) => {
    try {
        const { image, filename } = req.body;
        if (!image) {
            return res.status(400).json({ error: 'No image data provided.' });
        }
        const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            return res.status(400).json({ error: 'Invalid base64 string.' });
        }
        const ext = matches[1].split('/')[1] || 'jpg';
        const buffer = Buffer.from(matches[2], 'base64');
        const uniqueName = `media_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
        const filePath = path.join(UPLOAD_DIR, uniqueName);
        fs.writeFileSync(filePath, buffer);

        // Also sync media file to Mega cloud storage asynchronously
        syncMediaToMega(uniqueName, buffer);

        res.json({ success: true, url: `/uploads/${uniqueName}` });
    } catch (e) {
        console.error('Upload error:', e);
        res.status(500).json({ error: 'Failed to upload media file.' });
    }
});

// --- Media Delete Route ---
app.delete('/api/upload/:filename', (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(UPLOAD_DIR, filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        deleteMediaFromMega(filename);
        res.json({ success: true, message: 'Media deleted from local and Mega.' });
    } catch (e) {
        console.error('Delete media error:', e);
        res.status(500).json({ error: 'Failed to delete media file.' });
    }
});

// --- File Download Routes ---
app.get('/api/download/data/:type', (req, res) => {
    const { type } = req.params;
    const allowedTypes = ['students', 'teachers', 'attendance', 'leaves', 'gallery', 'announcements'];
    if (!allowedTypes.includes(type)) {
        return res.status(400).json({ error: 'Invalid data type.' });
    }
    const filePath = path.join(DATA_DIR, `${type}.json`);
    if (fs.existsSync(filePath)) {
        res.download(filePath, `${type}_backup.json`);
    } else {
        res.status(404).json({ error: 'Data file not found.' });
    }
});

app.get('/api/download/upload/:filename', (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(UPLOAD_DIR, filename);
    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).json({ data: null, error: 'Media file not found.' });
    }
});

// --- Gallery Routes ---
app.get('/api/gallery', (req, res) => {
    const gallery = readJSON(GALLERY_FILE, [
        { id: 1, name: 'Madrasa Events 2026', date: '2026-01-01', items: [] },
        { id: 2, name: 'Classrooms & Activities', date: '2026-01-02', items: [] }
    ]);
    res.json(gallery);
});

app.post('/api/gallery', (req, res) => {
    const { folders } = req.body;
    if (!folders) {
        return res.status(400).json({ error: 'Folders data required.' });
    }
    if (folders.length > 0 && folders[0] && folders[0].name) {
        createMegaFolder(folders[0].name);
    }
    if (writeJSON(GALLERY_FILE, folders)) {
        syncData('gallery', folders);
        res.json({ success: true, gallery: folders });
    } else {
        res.status(500).json({ error: 'Failed to save gallery.' });
    }
});

// --- Announcements Routes ---
app.get('/api/announcements', (req, res) => {
    const announcements = readJSON(ANNOUNCEMENTS_FILE, []);
    res.json(announcements);
});

app.post('/api/announcements', (req, res) => {
    const announcements = readJSON(ANNOUNCEMENTS_FILE, []);
    const newAnnouncement = {
        id: Date.now(),
        title: req.body.title || '',
        message: req.body.message || '',
        date: req.body.date || new Date().toISOString().split('T')[0],
        author: req.body.author || 'Admin',
        mediaUrl: req.body.mediaUrl || null,
        mediaType: req.body.mediaType || null
    };
    announcements.unshift(newAnnouncement);
    if (newAnnouncement.title) {
        createMegaFolder(`Announcement_${newAnnouncement.title}`);
    }
    if (writeJSON(ANNOUNCEMENTS_FILE, announcements)) {
        syncData('announcements', announcements);
        res.status(201).json({ success: true, announcement: newAnnouncement });
    } else {
        res.status(500).json({ error: 'Failed to post announcement.' });
    }
});

app.delete('/api/announcements/:id', (req, res) => {
    const { id } = req.params;
    let announcements = readJSON(ANNOUNCEMENTS_FILE, []);
    const filtered = announcements.filter(a => String(a.id) !== String(id));
    if (writeJSON(ANNOUNCEMENTS_FILE, filtered)) {
        syncData('announcements', filtered);
        res.json({ success: true, message: 'Announcement deleted.' });
    } else {
        res.status(500).json({ error: 'Failed to delete announcement.' });
    }
});

// Fallback for any path that doesn't match API routes
app.get('/:catchall', (req, res) => {
    const reactIndex = path.join(__dirname, 'frontend', 'dist', 'index.html');
    if (fs.existsSync(reactIndex)) {
        res.sendFile(reactIndex);
    } else {
        res.sendFile(path.join(__dirname, 'KCH Connect.html'));
    }
});

async function startServer() {
    const server = app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`[SERVER] Port ${PORT} is already in use. KCH Connect server is already running!`);
        } else {
            console.error(`[SERVER] Server error:`, err.message);
        }
    });

    const types = ['students', 'teachers', 'attendance', 'leaves', 'gallery', 'announcements'];
    for (const type of types) {
        try {
            const filePath = path.join(DATA_DIR, `${type}.json`);
            const megaData = await loadDataFromMega(type);
            if (megaData !== null) {
                writeJSON(filePath, megaData);
                console.log(`[INIT] Initialized ${type}.json from Mega cloud storage.`);
            }
        } catch (e) {
            console.error(`[INIT] Error syncing ${type} from Mega:`, e.message);
        }
    }
}

startServer();
