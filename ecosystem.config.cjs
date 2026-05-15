module.exports = {
  apps: [
    {
      name: 'cc-gen',
      script: 'node_modules/.bin/tsx',
      args: 'server/index.ts',
      cwd: '/var/www/cc-gen',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
    },
  ],
};
