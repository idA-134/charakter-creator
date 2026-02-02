// PM2 Ecosystem Configuration
// Automatische Überwachung und Neustart bei Abstürzen
// 
// Verwendung:
//   pm2 start ecosystem.config.js       # Beide Server starten
//   pm2 stop all                        # Beide Server stoppen
//   pm2 restart all                     # Beide Server neustarten
//   pm2 logs                            # Logs anzeigen
//   pm2 monit                           # Monitoring Dashboard
//   pm2 status                          # Status aller Prozesse

module.exports = {
  apps: [
    {
      name: 'charakter-backend',
      script: './backend/dist/server.js',
      cwd: 'C:\\Users\\mario\\Desktop\\GitHub\\charakter_creation',
      
      // Single instance (kein Cluster wegen SQLite)
      instances: 1,
      exec_mode: 'fork',
      
      // Environment Variables
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        DATABASE_URL: 'postgresql://charakter:CharakterDev2026@localhost:5432/charakter_db'
      },
      
      // Logging
      error_file: './logs/backend-err.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      
      // Restart Policy - Automatischer Neustart bei Abstürzen
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      
      // Advanced - Verhindert zu viele schnelle Neustarts
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 2000,
      
      // Graceful Shutdown
      kill_timeout: 5000,
    },
    {
      name: 'charakter-frontend',
      script: 'cmd.exe',
      args: '/c npm run dev',
      interpreter: 'none',
      cwd: 'C:\\Users\\mario\\Desktop\\GitHub\\charakter_creation\\frontend',
      
      // Single instance
      instances: 1,
      exec_mode: 'fork',
      
      // Environment Variables
      env: {
        NODE_ENV: 'development',
      },
      
      // Logging
      error_file: './logs/frontend-err.log',
      out_file: './logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      
      // Restart Policy
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      
      // Advanced
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 2000,
      
      // Graceful Shutdown
      kill_timeout: 5000,
    }
  ]
};
