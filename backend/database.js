const path = require('path');
const fs = require('fs');

// 系统权限定义
const PERMISSIONS = {
  // 设备权限
  DEVICE_VIEW: 'device:view',
  DEVICE_ADD: 'device:add',
  DEVICE_EDIT: 'device:edit',
  DEVICE_DELETE: 'device:delete',
  DEVICE_CONTROL: 'device:control',

  // 分组权限
  GROUP_VIEW: 'group:view',
  GROUP_ADD: 'group:add',
  GROUP_EDIT: 'group:edit',
  GROUP_DELETE: 'group:delete',
  GROUP_DEVICE_ADD: 'group:device:add',
  GROUP_DEVICE_REMOVE: 'group:device:remove',
  GROUP_DEVICE_MOVE: 'group:device:move',
  GROUP_DEVICE_CLEAR: 'group:device:clear',

  // 固件权限
  FIRMWARE_VIEW: 'firmware:view',
  FIRMWARE_UPLOAD: 'firmware:upload',
  FIRMWARE_DOWNLOAD: 'firmware:download',
  FIRMWARE_DELETE: 'firmware:delete',
  FIRMWARE_UPGRADE: 'firmware:upgrade',

  // 蓝牙配网
  BLUETOOTH_VIEW: 'bluetooth:view',

  // 用户权限
  USER_VIEW: 'user:view',
  USER_ADD: 'user:add',
  USER_EDIT: 'user:edit',
  USER_DELETE: 'user:delete',
  USER_ROLE: 'user:role',

  // 角色权限
  ROLE_VIEW: 'role:view',
  ROLE_ADD: 'role:add',
  ROLE_EDIT: 'role:edit',
  ROLE_DELETE: 'role:delete',
  ROLE_PERMISSION: 'role:permission',

  // 操作日志
  LOG_VIEW: 'log:view',

  // 系统设置
  SYSTEM_VIEW: 'system:view',
  SETTINGS_BASIC: 'settings:basic',
  SETTINGS_NETWORK: 'settings:network',
  SETTINGS_EMAIL: 'settings:email',
  SETTINGS_PASSWORD: 'settings:password',
  SETTINGS_DATABASE: 'settings:database',
};

// 预定义角色
const DEFAULT_ROLES = {
  admin: {
    name: '管理员',
    description: '拥有所有权限',
    permissions: Object.values(PERMISSIONS)
  },
  operator: {
    name: '操作员',
    description: '设备操作人员',
    permissions: [
      PERMISSIONS.DEVICE_VIEW, PERMISSIONS.DEVICE_CONTROL,
      PERMISSIONS.GROUP_VIEW, PERMISSIONS.GROUP_ADD, PERMISSIONS.GROUP_EDIT,
      PERMISSIONS.GROUP_DEVICE_ADD, PERMISSIONS.GROUP_DEVICE_REMOVE, PERMISSIONS.GROUP_DEVICE_MOVE, PERMISSIONS.GROUP_DEVICE_CLEAR,
      PERMISSIONS.FIRMWARE_VIEW, PERMISSIONS.FIRMWARE_UPLOAD, PERMISSIONS.FIRMWARE_DOWNLOAD, PERMISSIONS.FIRMWARE_DELETE, PERMISSIONS.FIRMWARE_UPGRADE,
      PERMISSIONS.BLUETOOTH_VIEW,
      PERMISSIONS.USER_VIEW, PERMISSIONS.USER_ROLE,
      PERMISSIONS.ROLE_VIEW, PERMISSIONS.SYSTEM_VIEW,
    ]
  },
  viewer: {
    name: '查看者',
    description: '仅可查看数据',
    permissions: [
      PERMISSIONS.DEVICE_VIEW,
      PERMISSIONS.GROUP_VIEW,
      PERMISSIONS.FIRMWARE_VIEW,
      PERMISSIONS.SYSTEM_VIEW,
    ]
  }
};

// 数据库配置文件路径
const CONFIG_FILE = path.join(__dirname, 'db-config.json');

class Database {
  constructor() {
    this.type = 'sqlite';
    this.db = null;
    this.SQL = null;
    this.dbPath = null;
    this.config = this.loadConfig();
    this.initPromise = this.init();
  }

  loadConfig() {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      }
    } catch (err) {
      console.error('加载数据库配置失败:', err);
    }
    return { type: 'sqlite', path: path.join(__dirname, 'data', 'database.sqlite') };
  }

  // 获取数据库类型
  getDBType() {
    return this.config.type || 'sqlite';
  }

  // 获取 INSERT IGNORE 语法（兼容各数据库）
  getInsertIgnore(table, cols, values) {
    const type = this.getDBType();
    if (type === 'mysql') {
      return `INSERT IGNORE INTO ${table} (${cols}) VALUES ${values}`;
    }
    // SQLite 和 PostgreSQL
    return `INSERT OR IGNORE INTO ${table} (${cols}) VALUES ${values}`;
  }

  // 获取当前时间的 SQL 表达式
  now() {
    const type = this.getDBType();
    return type === 'mysql' || type === 'postgresql' ? 'NOW()' : "datetime('now', 'localtime')";
  }

  saveConfig(config) {
    this.config = config;
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  }

  async getConnection() {
    const cfg = this.config;
    
    switch (cfg.type) {
      case 'mysql':
        const mysql = require('mysql2/promise');
        return mysql.createPool({
          host: cfg.host,
          port: cfg.port || 3306,
          user: cfg.user,
          password: cfg.password,
          database: cfg.database,
          waitForConnections: true,
          connectionLimit: 10
        });
        
      case 'postgresql':
        const { Pool } = require('pg');
        return new Pool({
          host: cfg.host,
          port: cfg.port || 5432,
          user: cfg.user,
          password: cfg.password,
          database: cfg.database,
        });
        
      case 'sqlite':
      default:
        return 'sqlite';
    }
  }

  async init() {
    const cfg = this.config;
    
    if (cfg.type === 'mysql' || cfg.type === 'postgresql') {
      await this.initRemoteDB(cfg);
    } else {
      await this.initSQLite();
    }
  }

  async initSQLite() {
    this.dbPath = this.config.path || path.join(__dirname, 'data', 'database.sqlite');
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    const sqlite3 = require('sqlite3').verbose();
    this.db = new sqlite3.Database(this.dbPath);
    
    await new Promise((resolve, reject) => {
      this.db.run("PRAGMA journal_mode=WAL", (err) => {
        if (err) console.warn('WAL模式设置失败:', err);
        this.createTables().then(resolve).catch(reject);
      });
    });
  }

  async initRemoteDB(cfg) {
    try {
      if (cfg.type === 'mysql') {
        const mysql = require('mysql2/promise');
        // 先连接不带数据库，创建数据库（如果不存在）
        const tempConn = await mysql.createConnection({
          host: cfg.host,
          port: cfg.port || 3306,
          user: cfg.user,
          password: cfg.password,
        });
        await tempConn.query(`CREATE DATABASE IF NOT EXISTS \`${cfg.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        await tempConn.end();
        
        // 连接数据库
        this.db = await this.getConnection();
        
      } else if (cfg.type === 'postgresql') {
        const { Pool } = require('pg');
        // PostgreSQL 自动创建数据库需要特殊处理，这里直接连接
        this.db = new Pool({
          host: cfg.host,
          port: cfg.port || 5432,
          user: cfg.user,
          password: cfg.password,
          database: cfg.database,
        });
        // 测试连接
        await this.db.query('SELECT 1');
      }
      
      await this.createTables();
    } catch (err) {
      console.error(`数据库连接失败:`, err.message);
      // 降级到 SQLite
      console.log('降级使用 SQLite...');
      this.config = { type: 'sqlite', path: path.join(__dirname, 'data', 'database.sqlite') };
      await this.initSQLite();
    }
  }

  // 创建表结构（兼容所有数据库）
  async createTables() {
    const isMySQL = this.config.type === 'mysql';
    const isPg = this.config.type === 'postgresql';
    
    // 根据数据库类型选择 SQL 语法
    const ai = isMySQL ? 'AUTO_INCREMENT' : (isPg ? 'SERIAL' : 'AUTOINCREMENT');
    const dtNow = isMySQL || isPg ? 'NOW()' : "(datetime('now', 'localtime'))";
    
    const tables = [
      // 设备表
      `CREATE TABLE IF NOT EXISTS devices (
        id INTEGER PRIMARY KEY ${ai},
        device_id VARCHAR(64) UNIQUE NOT NULL,
        name VARCHAR(128),
        type VARCHAR(64),
        status VARCHAR(32) DEFAULT 'offline',
        ip VARCHAR(45),
        last_seen DATETIME,
        created_at DATETIME DEFAULT ${dtNow},
        updated_at DATETIME DEFAULT ${dtNow}
      )`,
      
      // 设备数据表
      `CREATE TABLE IF NOT EXISTS device_data (
        id INTEGER PRIMARY KEY ${ai},
        device_id VARCHAR(64) NOT NULL,
        data_type VARCHAR(64),
        data_value TEXT,
        created_at DATETIME DEFAULT ${dtNow}
      )`,
      
      // 用户表
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY ${ai},
        username VARCHAR(64) UNIQUE NOT NULL,
        display_name VARCHAR(64),
        password VARCHAR(128) NOT NULL,
        created_at DATETIME DEFAULT ${dtNow}
      )`,
      
      // 角色表
      `CREATE TABLE IF NOT EXISTS roles (
        id INTEGER PRIMARY KEY ${ai},
        code VARCHAR(64) UNIQUE NOT NULL,
        name VARCHAR(64) NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT ${dtNow},
        updated_at DATETIME DEFAULT ${dtNow}
      )`,
      
      // 权限表
      `CREATE TABLE IF NOT EXISTS permissions (
        id INTEGER PRIMARY KEY ${ai},
        code VARCHAR(64) UNIQUE NOT NULL,
        name VARCHAR(64) NOT NULL,
        category VARCHAR(64),
        created_at DATETIME DEFAULT ${dtNow}
      )`,
      
      // 角色权限关联表
      `CREATE TABLE IF NOT EXISTS role_permissions (
        role_id INTEGER NOT NULL,
        permission_id INTEGER NOT NULL,
        PRIMARY KEY (role_id, permission_id)
      )`,
      
      // 用户角色关联表
      `CREATE TABLE IF NOT EXISTS user_roles (
        user_id INTEGER NOT NULL,
        role_id INTEGER NOT NULL,
        assigned_at DATETIME DEFAULT ${dtNow},
        assigned_by INTEGER,
        PRIMARY KEY (user_id, role_id)
      )`,
      
      // 验证码表
      `CREATE TABLE IF NOT EXISTS verification_codes (
        id INTEGER PRIMARY KEY ${ai},
        username VARCHAR(64) NOT NULL,
        code VARCHAR(16) NOT NULL,
        purpose VARCHAR(32) DEFAULT 'reset_password',
        expires_at DATETIME NOT NULL,
        used INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT ${dtNow}
      )`,
      
      // 命令日志表
      `CREATE TABLE IF NOT EXISTS command_logs (
        id INTEGER PRIMARY KEY ${ai},
        device_id VARCHAR(64) NOT NULL,
        command VARCHAR(64) NOT NULL,
        params TEXT,
        executed_at DATETIME DEFAULT ${dtNow}
      )`,
      
      // 用户操作日志表
      `CREATE TABLE IF NOT EXISTS user_logs (
        id INTEGER PRIMARY KEY ${ai},
        user_id INTEGER,
        username VARCHAR(64),
        action VARCHAR(32) NOT NULL,
        detail TEXT,
        ip_address VARCHAR(45),
        created_at DATETIME DEFAULT ${dtNow}
      )`,
      
      // 系统配置表
      `CREATE TABLE IF NOT EXISTS system_config (
        id INTEGER PRIMARY KEY ${ai},
        config_key VARCHAR(128) UNIQUE NOT NULL,
        config_value TEXT,
        updated_at DATETIME DEFAULT ${dtNow}
      )`,
      
      // OTA升级日志表
      `CREATE TABLE IF NOT EXISTS ota_logs (
        id INTEGER PRIMARY KEY ${ai},
        device_id VARCHAR(64) NOT NULL,
        firmware_url TEXT NOT NULL,
        version VARCHAR(32),
        status VARCHAR(32) DEFAULT 'pending',
        error_message TEXT,
        started_at DATETIME DEFAULT ${dtNow},
        completed_at DATETIME
      )`,
      
      // 设备分组表
      `CREATE TABLE IF NOT EXISTS device_groups (
        id INTEGER PRIMARY KEY ${ai},
        name VARCHAR(128) NOT NULL,
        description TEXT,
        icon VARCHAR(64) DEFAULT 'folder',
        color VARCHAR(32) DEFAULT '#409EFF',
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT ${dtNow},
        updated_at DATETIME DEFAULT ${dtNow}
      )`,
      
      // 设备分组关联表
      `CREATE TABLE IF NOT EXISTS device_group_members (
        id INTEGER PRIMARY KEY ${ai},
        group_id INTEGER NOT NULL,
        device_id VARCHAR(64) NOT NULL,
        added_at DATETIME DEFAULT ${dtNow},
        UNIQUE(group_id, device_id)
      )`,
    ];

    for (const sql of tables) {
      try {
        await this.run(sql);
      } catch (err) {
        console.error('建表错误:', err.message);
      }
    }

    // 初始化默认数据
    await this.initDefaultData();
  }

  // 初始化默认数据
  async initDefaultData() {
    const bcrypt = require('bcryptjs');
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    const insertIgnore = this.config.type === 'sqlite' ? 'INSERT OR IGNORE' : 'INSERT IGNORE';

    // 创建默认管理员
    await this.run(
      `${insertIgnore} INTO users (username, display_name, password) VALUES (?, ?, ?)`,
      ['admin', '系统管理员', hashedPassword]
    );

    // 初始化权限
    const allPermissions = [
      // 设备管理权限
      { code: PERMISSIONS.DEVICE_VIEW, name: '查看设备', category: '设备管理' },
      { code: PERMISSIONS.DEVICE_ADD, name: '添加设备', category: '设备管理' },
      { code: PERMISSIONS.DEVICE_EDIT, name: '编辑设备', category: '设备管理' },
      { code: PERMISSIONS.DEVICE_DELETE, name: '删除设备', category: '设备管理' },
      { code: PERMISSIONS.DEVICE_CONTROL, name: '控制设备', category: '设备管理' },
      // 分组管理权限
      { code: PERMISSIONS.GROUP_VIEW, name: '查看分组', category: '分组管理' },
      { code: PERMISSIONS.GROUP_ADD, name: '创建分组', category: '分组管理' },
      { code: PERMISSIONS.GROUP_EDIT, name: '编辑分组', category: '分组管理' },
      { code: PERMISSIONS.GROUP_DELETE, name: '删除分组', category: '分组管理' },
      { code: PERMISSIONS.GROUP_DEVICE_ADD, name: '添加设备到分组', category: '分组管理' },
      { code: PERMISSIONS.GROUP_DEVICE_REMOVE, name: '从分组移除设备', category: '分组管理' },
      { code: PERMISSIONS.GROUP_DEVICE_MOVE, name: '移动分组设备', category: '分组管理' },
      { code: PERMISSIONS.GROUP_DEVICE_CLEAR, name: '清空分组设备', category: '分组管理' },
      // 固件管理权限
      { code: PERMISSIONS.FIRMWARE_VIEW, name: '查看固件', category: '固件管理' },
      { code: PERMISSIONS.FIRMWARE_UPLOAD, name: '上传固件', category: '固件管理' },
      { code: PERMISSIONS.FIRMWARE_DOWNLOAD, name: '下载固件', category: '固件管理' },
      { code: PERMISSIONS.FIRMWARE_DELETE, name: '删除固件', category: '固件管理' },
      { code: PERMISSIONS.FIRMWARE_UPGRADE, name: '批量升级', category: '固件管理' },
      // 蓝牙配网权限
      { code: PERMISSIONS.BLUETOOTH_VIEW, name: '使用蓝牙配网', category: '蓝牙配网' },
      // 用户管理权限
      { code: PERMISSIONS.USER_VIEW, name: '查看用户', category: '用户管理' },
      { code: PERMISSIONS.USER_ADD, name: '添加用户', category: '用户管理' },
      { code: PERMISSIONS.USER_EDIT, name: '编辑用户', category: '用户管理' },
      { code: PERMISSIONS.USER_DELETE, name: '删除用户', category: '用户管理' },
      { code: PERMISSIONS.USER_ROLE, name: '分配角色', category: '用户管理' },
      // 角色权限
      { code: PERMISSIONS.ROLE_VIEW, name: '查看角色', category: '角色权限' },
      { code: PERMISSIONS.ROLE_ADD, name: '创建角色', category: '角色权限' },
      { code: PERMISSIONS.ROLE_EDIT, name: '编辑角色', category: '角色权限' },
      { code: PERMISSIONS.ROLE_DELETE, name: '删除角色', category: '角色权限' },
      { code: PERMISSIONS.ROLE_PERMISSION, name: '分配权限', category: '角色权限' },
      // 操作日志
      { code: PERMISSIONS.LOG_VIEW, name: '查看操作日志', category: '系统设置' },
      // 系统设置权限
      { code: PERMISSIONS.SYSTEM_VIEW, name: '查看系统', category: '系统设置' },
      { code: PERMISSIONS.SETTINGS_BASIC, name: '基本信息', category: '系统设置' },
      { code: PERMISSIONS.SETTINGS_NETWORK, name: '网络配置', category: '系统设置' },
      { code: PERMISSIONS.SETTINGS_EMAIL, name: '邮件服务', category: '系统设置' },
      { code: PERMISSIONS.SETTINGS_PASSWORD, name: '修改密码', category: '系统设置' },
      { code: PERMISSIONS.SETTINGS_DATABASE, name: '数据库配置', category: '系统设置' },
    ];

    for (const p of allPermissions) {
      await this.run(
        `${insertIgnore} INTO permissions (code, name, category) VALUES (?, ?, ?)`,
        [p.code, p.name, p.category]
      );
    }

    // 初始化角色
    for (const [code, role] of Object.entries(DEFAULT_ROLES)) {
      await this.run(
        `${insertIgnore} INTO roles (code, name, description) VALUES (?, ?, ?)`,
        [code, role.name, role.description]
      );
    }

    // 为所有预定义角色分配权限
    for (const [code, role] of Object.entries(DEFAULT_ROLES)) {
      const dbRole = await this.get(`SELECT id FROM roles WHERE code = ?`, [code]);
      if (dbRole && role.permissions) {
        for (const p of role.permissions) {
          const perm = await this.get(`SELECT id FROM permissions WHERE code = ?`, [p]);
          if (perm) {
            await this.run(
              `${insertIgnore} INTO role_permissions (role_id, permission_id) VALUES (?, ?)`,
              [dbRole.id, perm.id]
            );
          }
        }
      }
    }

    // 将 admin 用户分配给 admin 角色
    const adminRole = await this.get(`SELECT id FROM roles WHERE code = 'admin'`);
    const adminUser = await this.get(`SELECT id FROM users WHERE username = 'admin'`);
    if (adminUser && adminRole) {
      await this.run(
        `${insertIgnore} INTO user_roles (user_id, role_id) VALUES (?, ?)`,
        [adminUser.id, adminRole.id]
      );
    }
  }

  // 通用 SQL 执行方法
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      if (this.config.type === 'postgresql') {
        this.db.query(sql, params).then(res => {
          resolve({ changes: res.rowCount || 0, lastID: res.rows?.[0]?.id });
        }).catch(reject);
      } else if (this.config.type === 'mysql') {
        this.db.query(sql, params).then(res => {
          resolve({ changes: res[0].affectedRows || 0, lastID: res[0].insertId });
        }).catch(reject);
      } else {
        // SQLite
        this.db.run(sql, params, function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ changes: this.changes, lastID: this.lastID });
          }
        });
      }
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      if (this.config.type === 'postgresql') {
        this.db.query(sql, params).then(res => {
          resolve(res.rows[0] || null);
        }).catch(reject);
      } else if (this.config.type === 'mysql') {
        this.db.query(sql, params).then(res => {
          resolve(res[0][0] || null);
        }).catch(reject);
      } else {
        // SQLite
        this.db.get(sql, params, (err, row) => {
          if (err) reject(err);
          else resolve(row || null);
        });
      }
    });
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      if (this.config.type === 'postgresql') {
        this.db.query(sql, params).then(res => {
          resolve(res.rows);
        }).catch(reject);
      } else if (this.config.type === 'mysql') {
        this.db.query(sql, params).then(res => {
          resolve(res[0]);
        }).catch(reject);
      } else {
        // SQLite
        this.db.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      }
    });
  }

  // ============ 设备相关方法 ============
  createDevice(deviceId, name, type) {
    return this.run(
      `INSERT INTO devices (device_id, name, type) VALUES (?, ?, ?)`,
      [deviceId, name, type]
    );
  }

  getAllDevices() {
    return this.all(`SELECT * FROM devices ORDER BY created_at DESC`);
  }

  getDeviceById(deviceId) {
    return this.get(`SELECT * FROM devices WHERE device_id = ?`, [deviceId]);
  }

  updateDeviceStatus(deviceId, status, ip = null) {
    return this.run(
      `UPDATE devices SET status = ?, ip = ?, last_seen = ${this.now()}, updated_at = ${this.now()} WHERE device_id = ?`,
      [status, ip, deviceId]
    );
  }

  deleteDevice(deviceId) {
    return this.run(`DELETE FROM devices WHERE device_id = ?`, [deviceId]);
  }

  updateDevice(deviceId, name) {
    return this.run(
      `UPDATE devices SET name = ?, updated_at = ${this.now()} WHERE device_id = ?`,
      [name, deviceId]
    );
  }

  // ============ 设备数据 ============
  insertDeviceData(deviceId, data) {
    return this.run(
      `INSERT INTO device_data (device_id, data_type, data_value) VALUES (?, ?, ?)`,
      [deviceId, data.type || 'unknown', JSON.stringify(data)]
    );
  }

  getDeviceData(deviceId, limit = 100, offset = 0) {
    return this.all(
      `SELECT * FROM device_data WHERE device_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [deviceId, limit, offset]
    );
  }

  // 按时间范围获取设备数据（用于图表）
  getDeviceDataByTimeRange(deviceId, startTime, endTime) {
    const isMySQL = this.config.type === 'mysql';
    const isPg = this.config.type === 'postgresql';
    
    let dateFilter;
    if (isMySQL || isPg) {
      dateFilter = `created_at BETWEEN ? AND ?`;
    } else {
      dateFilter = `created_at >= ? AND created_at <= ?`;
    }
    
    return this.all(
      `SELECT * FROM device_data WHERE device_id = ? AND ${dateFilter} ORDER BY created_at ASC`,
      [deviceId, startTime, endTime]
    );
  }

  // 获取设备数据统计（按字段聚合）
  getDeviceDataStats(deviceId, field, interval = 'hour', limit = 100) {
    const isMySQL = this.config.type === 'mysql';
    const isPg = this.config.type === 'postgresql';
    
    let timeGroup;
    if (isMySQL) {
      timeGroup = `DATE_FORMAT(created_at, '%Y-%m-%d %H:00:00')`;
    } else if (isPg) {
      timeGroup = `TO_CHAR(created_at, 'YYYY-MM-DD HH24:00:00')`;
    } else {
      timeGroup = `STRFTIME('%Y-%m-%d %H:00:00', created_at)`;
    }
    
    return this.all(
      `SELECT ${timeGroup} as time_group, 
              AVG(CAST(json_extract(data_value, '$.${field}') AS REAL)) as avg_value,
              MIN(CAST(json_extract(data_value, '$.${field}') AS REAL)) as min_value,
              MAX(CAST(json_extract(data_value, '$.${field}') AS REAL)) as max_value,
              COUNT(*) as count
       FROM device_data 
       WHERE device_id = ? 
         AND data_value LIKE '%${field}%'
       GROUP BY time_group 
       ORDER BY time_group DESC 
       LIMIT ?`,
      [deviceId, limit]
    );
  }

  // ============ 用户日志相关 ============
  addUserLog(userId, username, action, detail = null, ipAddress = null) {
    return this.run(
      `INSERT INTO user_logs (user_id, username, action, detail, ip_address) VALUES (?, ?, ?, ?, ?)`,
      [userId, username, action, detail, ipAddress]
    );
  }

  getUserLogs(limit = 100, offset = 0, action = null, startDate = null, endDate = null) {
    let sql = `SELECT * FROM user_logs WHERE 1=1`;
    const params = [];
    
    if (action) {
      sql += ` AND action = ?`;
      params.push(action);
    }
    if (startDate) {
      sql += ` AND date(created_at) >= date(?)`;
      params.push(startDate);
    }
    if (endDate) {
      sql += ` AND date(created_at) <= date(?)`;
      params.push(endDate);
    }
    
    sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    return this.all(sql, params);
  }

  countUserLogs(action = null, startDate = null, endDate = null) {
    let sql = `SELECT COUNT(*) as total FROM user_logs WHERE 1=1`;
    const params = [];
    
    if (action) {
      sql += ` AND action = ?`;
      params.push(action);
    }
    if (startDate) {
      sql += ` AND date(created_at) >= date(?)`;
      params.push(startDate);
    }
    if (endDate) {
      sql += ` AND date(created_at) <= date(?)`;
      params.push(endDate);
    }
    
    return this.get(sql, params);
  }

  // ============ 用户相关 ============
  getUserByUsername(username) {
    return this.get(`SELECT * FROM users WHERE username = ?`, [username]);
  }

  getUserById(id) {
    return this.get(`SELECT * FROM users WHERE id = ?`, [id]);
  }

  createUser(username, password, displayName = null) {
    return this.run(
      `INSERT INTO users (username, password, display_name) VALUES (?, ?, ?)`,
      [username, password, displayName || username]
    );
  }

  getAllUsers() {
    return this.all(`SELECT id, username, display_name, created_at FROM users ORDER BY created_at DESC`);
  }

  updateUserDisplayName(userId, displayName) {
    return this.run(`UPDATE users SET display_name = ? WHERE id = ?`, [displayName, userId]);
  }

  deleteUser(id) {
    return this.run(`DELETE FROM users WHERE id = ?`, [id]);
  }

  updatePassword(username, hashedPassword) {
    return this.run(`UPDATE users SET password = ? WHERE username = ?`, [hashedPassword, username]);
  }

  updateUsername(userId, newUsername) {
    return this.run(`UPDATE users SET username = ? WHERE id = ?`, [newUsername, userId]);
  }

  // ============ 验证码 ============
  saveVerificationCode(username, code, expiresInMinutes = 10) {
    return this.run(
      `UPDATE verification_codes SET used = 1 WHERE username = ?`,
      [username]
    ).then(() => {
      const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
      return this.run(
        `INSERT INTO verification_codes (username, code, expires_at) VALUES (?, ?, ?)`,
        [username, code, expiresAt]
      );
    });
  }

  verifyCode(username, code) {
    return this.get(
      `SELECT * FROM verification_codes WHERE username = ? AND code = ? AND used = 0 AND expires_at > ${this.now()} ORDER BY created_at DESC LIMIT 1`,
      [username, code]
    );
  }

  markCodeUsed(id) {
    return this.run(`UPDATE verification_codes SET used = 1 WHERE id = ?`, [id]);
  }

  // ============ 命令日志 ============
  insertCommandLog(deviceId, command, params) {
    return this.run(
      `INSERT INTO command_logs (device_id, command, params) VALUES (?, ?, ?)`,
      [deviceId, command, JSON.stringify(params)]
    );
  }

  // ============ 角色权限 ============
  getAllRoles() {
    return this.all(`SELECT * FROM roles ORDER BY id`);
  }

  getRoleById(roleId) {
    return this.get(`SELECT * FROM roles WHERE id = ?`, [roleId]);
  }

  getRoleByCode(code) {
    return this.get(`SELECT * FROM roles WHERE code = ?`, [code]);
  }

  getRolesByIds(ids) {
    if (!ids || ids.length === 0) return Promise.resolve([]);
    const placeholders = ids.map(() => '?').join(',');
    return this.all(`SELECT * FROM roles WHERE id IN (${placeholders})`, ids);
  }

  getRolePermissions(roleId) {
    return this.all(
      `SELECT p.* FROM permissions p INNER JOIN role_permissions rp ON p.id = rp.permission_id WHERE rp.role_id = ?`,
      [roleId]
    );
  }

  createRole(code, name, description) {
    return this.run(
      `INSERT INTO roles (code, name, description) VALUES (?, ?, ?)`,
      [code, name, description]
    );
  }

  updateRole(roleId, name, description) {
    return this.run(
      `UPDATE roles SET name = ?, description = ?, updated_at = ${this.now()} WHERE id = ?`,
      [name, description, roleId]
    );
  }

  deleteRole(roleId) {
    return this.run(`DELETE FROM roles WHERE id = ?`, [roleId]);
  }

  setRolePermissions(roleId, permissionIds) {
    return this.run(`DELETE FROM role_permissions WHERE role_id = ?`, [roleId]).then(() => {
      const promises = permissionIds.map(permId => {
        return this.run(`INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)`, [roleId, permId]);
      });
      return Promise.all(promises).then(() => ({}));
    });
  }

  getPermissionByCode(code) {
    return this.get(`SELECT * FROM permissions WHERE code = ?`, [code]);
  }

  createPermission(code, name, category) {
    return this.run(
      `INSERT INTO permissions (code, name, category) VALUES (?, ?, ?)`,
      [code, name, category]
    );
  }

  getAllPermissions() {
    return this.all(`SELECT * FROM permissions ORDER BY category, id`);
  }

  getUserRoles(userId) {
    return this.all(
      `SELECT r.* FROM roles r INNER JOIN user_roles ur ON r.id = ur.role_id WHERE ur.user_id = ?`,
      [userId]
    );
  }

  getUserPermissions(userId) {
    return this.all(
      `SELECT DISTINCT p.* FROM permissions p INNER JOIN role_permissions rp ON p.id = rp.permission_id INNER JOIN user_roles ur ON rp.role_id = ur.role_id WHERE ur.user_id = ?`,
      [userId]
    );
  }

  userHasPermission(userId, permissionCode) {
    return this.get(
      `SELECT 1 FROM permissions p INNER JOIN role_permissions rp ON p.id = rp.permission_id INNER JOIN user_roles ur ON rp.role_id = ur.role_id WHERE ur.user_id = ? AND p.code = ?`,
      [userId, permissionCode]
    ).then(row => !!row);
  }

  setUserRoles(userId, roleIds, assignedBy) {
    return this.run(`DELETE FROM user_roles WHERE user_id = ?`, [userId]).then(() => {
      const promises = roleIds.map(roleId => {
        return this.run(`INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES (?, ?, ?)`, [userId, roleId, assignedBy]);
      });
      return Promise.all(promises).then(() => ({}));
    });
  }

  getUserWithRoles(userId) {
    return this.get(`SELECT * FROM users WHERE id = ?`, [userId]).then(async (user) => {
      if (!user) return null;
      const roles = await this.getUserRoles(userId);
      const permissions = await this.getUserPermissions(userId);
      return { ...user, roles, permissions: permissions.map(p => p.code) };
    });
  }

  // ============ 系统配置 ============
  getConfig(key) {
    return this.get(`SELECT config_value FROM system_config WHERE config_key = ?`, [key])
      .then(row => row ? row.config_value : null);
  }

  getAllConfigs() {
    return this.all(`SELECT * FROM system_config`).then(rows => {
      const configs = {};
      rows.forEach(row => { configs[row.config_key] = row.config_value; });
      return configs;
    });
  }

  setConfig(key, value) {
    const type = this.getDBType();
    if (type === 'mysql') {
      return this.run(
        `INSERT INTO system_config (config_key, config_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE config_value = ?`,
        [key, value, value]
      );
    } else {
      // SQLite 和 PostgreSQL 使用 REPLACE 或 UPSERT
      return this.run(
        `INSERT OR REPLACE INTO system_config (config_key, config_value) VALUES (?, ?)`,
        [key, value]
      );
    }
  }

  getUserEmail(userId) { return this.getConfig(`user_email_${userId}`); }
  setUserEmail(userId, email) { return this.setConfig(`user_email_${userId}`, email); }

  // ============ OTA ============
  insertOTALog(deviceId, firmwareUrl, version, status) {
    return this.run(
      `INSERT INTO ota_logs (device_id, firmware_url, version, status) VALUES (?, ?, ?, ?)`,
      [deviceId, firmwareUrl, version, status]
    );
  }

  updateOTALog(deviceId, status, errorMessage = null) {
    if (status === 'success' || status === 'failed') {
      return this.run(
        `UPDATE ota_logs SET status = ?, error_message = ?, completed_at = ${this.now()} WHERE device_id = ? AND status = 'pending' ORDER BY started_at DESC LIMIT 1`,
        [status, errorMessage, deviceId]
      );
    }
    return this.run(
      `UPDATE ota_logs SET status = ?, error_message = ? WHERE device_id = ? AND status = 'pending' ORDER BY started_at DESC LIMIT 1`,
      [status, errorMessage, deviceId]
    );
  }

  getOTALogs(deviceId, limit = 10) {
    return this.all(`SELECT * FROM ota_logs WHERE device_id = ? ORDER BY started_at DESC LIMIT ?`, [deviceId, limit]);
  }

  getLatestOTAStatus(deviceId) {
    return this.get(`SELECT * FROM ota_logs WHERE device_id = ? ORDER BY started_at DESC LIMIT 1`, [deviceId]);
  }

  // ============ 数据库管理 ============
  getDBConfig() {
    // 返回配置（不返回密码，由用户自行填写）
    const cfg = { type: this.config.type };
    if (this.config.type === 'sqlite') {
      cfg.path = this.config.path;
    } else {
      cfg.host = this.config.host;
      cfg.port = this.config.port;
      cfg.user = this.config.user;
      cfg.database = this.config.database;
      // 密码不返回
    }
    return cfg;
  }

  // ============ 设备分组管理 ============
  
  async getAllGroups() {
    return await this.all(`
      SELECT g.id, g.name, g.description, g.icon, g.color,
        COALESCE(g.sort_order, 0) as sort_order,
        g.created_at, g.updated_at,
        (SELECT COUNT(*) FROM device_group_members WHERE group_id = g.id) as device_count
      FROM device_groups g
      ORDER BY sort_order ASC, created_at ASC
    `);
  }
  
  async getGroupById(id) {
    const rows = await this.all(`
      SELECT g.*, 
        (SELECT COUNT(*) FROM device_group_members WHERE group_id = g.id) as device_count
      FROM device_groups g WHERE g.id = ?
    `, [id]);
    return rows[0];
  }
  
  async createGroup(name, description, icon, color, sortOrder) {
    const result = await this.run(
      'INSERT INTO device_groups (name, description, icon, color, sort_order) VALUES (?, ?, ?, ?, ?)',
      [name, description || '', icon || 'folder', color || '#409EFF', sortOrder || 0]
    );
    return result.lastInsertRowid;
  }
  
  async updateGroup(id, name, description, icon, color, sortOrder) {
    await this.run(
      'UPDATE device_groups SET name = ?, description = ?, icon = ?, color = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, description, icon, color, sortOrder || 0, id]
    );
  }
  
  async deleteGroup(id) {
    await this.run('DELETE FROM device_group_members WHERE group_id = ?', [id]);
    await this.run('DELETE FROM device_groups WHERE id = ?', [id]);
  }
  
  async addDeviceToGroup(groupId, deviceId) {
    await this.run(
      'INSERT OR IGNORE INTO device_group_members (group_id, device_id) VALUES (?, ?)',
      [groupId, deviceId]
    );
  }
  
  async removeDeviceFromGroup(groupId, deviceId) {
    await this.run(
      'DELETE FROM device_group_members WHERE group_id = ? AND device_id = ?',
      [groupId, deviceId]
    );
  }

  async clearGroupDevices(groupId) {
    await this.run(
      'DELETE FROM device_group_members WHERE group_id = ?',
      [groupId]
    );
  }

  async moveDeviceToGroup(deviceId, fromGroupId, toGroupId) {
    // 从原分组移除
    await this.removeDeviceFromGroup(fromGroupId, deviceId);
    // 添加到新分组
    await this.addDeviceToGroup(toGroupId, deviceId);
  }

  async getDevicesByGroup(groupId) {
    return await this.all(`
      SELECT d.*, gm.added_at as group_added_at
      FROM devices d
      JOIN device_group_members gm ON d.device_id = gm.device_id
      WHERE gm.group_id = ?
      ORDER BY d.name
    `, [groupId]);
  }
  
  async getGroupsByDevice(deviceId) {
    return await this.all(`
      SELECT g.* FROM device_groups g
      JOIN device_group_members gm ON g.id = gm.group_id
      WHERE gm.device_id = ?
    `, [deviceId]);
  }
  
  async getDevicesWithGroups() {
    const devices = await this.all(`
      SELECT d.*, 
        GROUP_CONCAT(g.id) as group_ids,
        GROUP_CONCAT(g.name) as group_names
      FROM devices d
      LEFT JOIN device_group_members gm ON d.device_id = gm.device_id
      LEFT JOIN device_groups g ON gm.group_id = g.id
      GROUP BY d.id
      ORDER BY d.created_at DESC
    `);
    
    return devices.map(d => ({
      ...d,
      groups: d.group_ids ? d.group_ids.split(',').map((id, i) => ({
        id: parseInt(id),
        name: d.group_names.split(',')[i]
      })) : []
    }));
  }

  async testConnection(config) {
    try {
      const tempCfg = { ...this.config, ...config };
      
      if (tempCfg.type === 'mysql') {
        const mysql = require('mysql2/promise');
        const conn = await mysql.createConnection({
          host: tempCfg.host,
          port: tempCfg.port || 3306,
          user: tempCfg.user,
          password: tempCfg.password,
        });
        await conn.query('SELECT 1');
        await conn.end();
        return { success: true };
      }
      
      if (tempCfg.type === 'postgresql') {
        const { Pool } = require('pg');
        const pool = new Pool({
          host: tempCfg.host,
          port: tempCfg.port || 5432,
          user: tempCfg.user,
          password: tempCfg.password,
          database: tempCfg.database,
        });
        await pool.query('SELECT 1');
        await pool.end();
        return { success: true };
      }
      
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async resetDatabase() {
    // 删除所有表并重新创建
    const dropTables = [
      'ota_logs', 'system_config', 'command_logs', 'verification_codes',
      'user_roles', 'role_permissions', 'permissions', 'roles', 'users',
      'device_data', 'devices'
    ];

    for (const table of dropTables) {
      try {
        await this.run(`DROP TABLE IF EXISTS ${table}`);
      } catch (err) { /* 忽略 */ }
    }

    await this.createTables();
    return { success: true };
  }
}

module.exports = Database;
module.exports.PERMISSIONS = PERMISSIONS;
