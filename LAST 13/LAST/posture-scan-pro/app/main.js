const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
require('dotenv').config();
const mysql = require('mysql2/promise');

let dbPool;
try {
  dbPool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
  console.log("Database pool created successfully.");
} catch (error) {
  console.error("FATAL: Failed to create database pool.", error);
  dbPool = null;
}

// --- IPC Handlers with Full Implementation and Error Handling ---

// --- Patient IPC Handlers ---
ipcMain.handle('db:get-patients', async () => {
  if (!dbPool) throw new Error("Database pool is not available.");
  try {
    const [rows] = await dbPool.query('SELECT * FROM patients ORDER BY created_at DESC');
    return rows;
  } catch (error) {
    console.error("IPC_ERROR: Failed to get patients.", error);
    throw error;
  }
});

ipcMain.handle('db:add-patient', async (event, patient) => {
    if (!dbPool) throw new Error("Database pool is not available.");
    try {
        const { name, gender, age, height, weight } = patient;
        const sql = 'INSERT INTO patients (name, gender, age, height, weight) VALUES (?, ?, ?, ?, ?)';
        const [result] = await dbPool.execute(sql, [name, gender, age, height, weight]);
        return { id: result.insertId, ...patient };
    } catch (error) {
        console.error("IPC_ERROR: Failed to add patient.", error);
        throw error;
    }
});

ipcMain.handle('db:update-patient', async (event, patient) => {
    if (!dbPool) throw new Error("Database pool is not available.");
    try {
        const { id, name, gender, age, height, weight } = patient;
        const sql = 'UPDATE patients SET name = ?, gender = ?, age = ?, height = ?, weight = ? WHERE id = ?';
        await dbPool.execute(sql, [name, gender, age, height, weight, id]);
        return patient;
    } catch (error) {
        console.error("IPC_ERROR: Failed to update patient.", error);
        throw error;
    }
});

ipcMain.handle('db:delete-patient', async (event, id) => {
    if (!dbPool) throw new Error("Database pool is not available.");
    try {
        await dbPool.execute('DELETE FROM patients WHERE id = ?', [id]);
        return id;
    } catch (error) {
        console.error("IPC_ERROR: Failed to delete patient.", error);
        throw error;
    }
});

ipcMain.handle('db:get-patient-by-id', async (event, id) => {
    if (!dbPool) throw new Error("Database pool is not available.");
    try {
        const patientId = parseInt(id, 10);
        if (isNaN(patientId)) throw new Error("Invalid patient ID provided.");
        const [rows] = await dbPool.query('SELECT * FROM patients WHERE id = ?', [patientId]);
        return rows[0] || null;
    } catch (error) {
        console.error(`IPC_ERROR: Failed to get patient ${id}.`, error);
        throw error;
    }
});

// --- Assessment (Report) IPC Handlers ---
ipcMain.handle('db:add-assessment', async (event, { patientId, assessmentData, screenshot }) => {
  if (!dbPool) throw new Error("Database pool is not available.");
  try {
    const sql = 'INSERT INTO assessments (patient_id, assessment_data, screenshot) VALUES (?, ?, ?)';
    const [result] = await dbPool.execute(sql, [patientId, JSON.stringify(assessmentData), screenshot]);
    return { id: result.insertId };
  } catch (error) {
    console.error("IPC_ERROR: Failed to add assessment.", error);
    throw error;
  }
});

ipcMain.handle('db:get-all-assessments', async () => {
  if (!dbPool) throw new Error("Database pool is not available.");
  try {
    const sql = `
      SELECT a.id, a.patient_id, a.created_at, p.name as patientName 
      FROM assessments a
      JOIN patients p ON a.patient_id = p.id
      ORDER BY a.created_at DESC
    `;
    const [rows] = await dbPool.query(sql);
    return rows;
  } catch (error) {
    console.error("IPC_ERROR: Failed to get all assessments.", error);
    throw error;
  }
});

ipcMain.handle('db:get-assessment-by-id', async (event, id) => {
  if (!dbPool) throw new Error("Database pool is not available.");
  try {
    const assessmentId = parseInt(id, 10);
    if (isNaN(assessmentId)) throw new Error("Invalid assessment ID provided.");
    const [rows] = await dbPool.query('SELECT * FROM assessments WHERE id = ?', [assessmentId]);
    if (rows.length > 0) {
      const [patientRows] = await dbPool.query('SELECT name FROM patients WHERE id = ?', [rows[0].patient_id]);
      return { ...rows[0], patientName: patientRows[0]?.name };
    }
    return null;
  } catch (error) {
    console.error(`IPC_ERROR: Failed to get assessment ${id}.`, error);
    throw error;
  }
});

ipcMain.handle('db:get-assessments-by-patient-id', async (event, patientId) => {
    if (!dbPool) throw new Error("Database pool is not available.");
    try {
        const id = parseInt(patientId, 10);
        if (isNaN(id)) throw new Error("Invalid patient ID provided.");
        const sql = `SELECT id, created_at FROM assessments WHERE patient_id = ? ORDER BY created_at DESC`;
        const [rows] = await dbPool.query(sql, [id]);
        return rows;
    } catch (error) {
        console.error(`IPC_ERROR: Failed to get assessments for patient ${patientId}.`, error);
        throw error;
    }
});

// --- Exercise IPC Handlers ---
ipcMain.handle('db:get-all-exercises', async () => {
    if (!dbPool) throw new Error("Database pool is not available.");
    try {
        const sql = `
            SELECT e.id, e.name, e.slug, e.description, ec.name as categoryName
            FROM exercises e
            JOIN exercise_categories ec ON e.category_id = ec.id
            ORDER BY ec.id, e.name;
        `;
        const [rows] = await dbPool.query(sql);
        return rows;
    } catch (error) {
        console.error("IPC_ERROR: Failed to get all exercises.", error);
        throw error;
    }
});

ipcMain.handle('db:get-exercise-by-slug', async (event, slug) => {
    if (!dbPool) throw new Error("Database pool is not available.");
    try {
        const [rows] = await dbPool.query('SELECT * FROM exercises WHERE slug = ?', [slug]);
        if (rows.length > 0) {
            return rows[0];
        }
        return null;
    } catch (error) {
        console.error(`IPC_ERROR: Failed to get exercise with slug ${slug}.`, error);
        throw error;
    }
});

// --- Electron Window Creation ---
function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const startUrl = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, '../build/index.html')}`;
  win.loadURL(startUrl);
  win.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', async () => {
  if (dbPool) await dbPool.end();
});
