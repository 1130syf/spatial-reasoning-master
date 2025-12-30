module.exports = (ipcMain, db) => {
  // 用户相关操作
  ipcMain.handle('user:getAll', () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM users ORDER BY name', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  });
  
  ipcMain.handle('user:create', (event, userData) => {
    return new Promise((resolve, reject) => {
      const { name, gender, birthdate, notes } = userData;
      db.run(
        'INSERT INTO users (name, gender, birthdate, notes) VALUES (?, ?, ?, ?)',
        [name, gender, birthdate, notes],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, ...userData });
        }
      );
    });
  });
  
  // 评估相关操作
  ipcMain.handle('assessment:save', (event, assessmentData) => {
    return new Promise((resolve, reject) => {
      const { user_id, type, data, report } = assessmentData;
      db.run(
        'INSERT INTO assessments (user_id, type, data, report) VALUES (?, ?, ?, ?)',
        [user_id, type, JSON.stringify(data), report],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, ...assessmentData });
        }
      );
    });
  });
  
  ipcMain.handle('assessment:getByUser', (event, userId) => {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM assessments WHERE user_id = ? ORDER BY date DESC',
        [userId],
        (err, rows) => {
          if (err) reject(err);
          else {
            // 解析存储的JSON数据
            const assessments = rows.map(row => ({
              ...row,
              data: JSON.parse(row.data)
            }));
            resolve(assessments);
          }
        }
      );
    });
  });

  // 仪表板相关操作
  ipcMain.handle('dashboard:getRecentUsers', () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM users ORDER BY created_at DESC LIMIT 5', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  });

  ipcMain.handle('dashboard:getRecentAssessments', () => {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT a.*, u.name as user_name 
        FROM assessments a 
        JOIN users u ON a.user_id = u.id 
        ORDER BY a.date DESC LIMIT 5
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  });

  ipcMain.handle('dashboard:getStats', () => {
    return new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as totalUsers FROM users', (err, userRow) => {
        if (err) reject(err);
        else {
          db.get('SELECT COUNT(*) as totalAssessments FROM assessments', (err, assessmentRow) => {
            if (err) reject(err);
            else {
              db.all('SELECT type, COUNT(*) as count FROM assessments GROUP BY type', (err, typeRows) => {
                if (err) reject(err);
                else {
                  const assessmentsByType = {};
                  typeRows.forEach(row => {
                    assessmentsByType[row.type] = row.count;
                  });
                  
                  resolve({
                    totalUsers: userRow.totalUsers,
                    totalAssessments: assessmentRow.totalAssessments,
                    assessmentsByType
                  });
                }
              });
            }
          });
        }
      });
    });
  });
};
