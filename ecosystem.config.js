module.exports = {
    apps: [{
        name: 'hudanhidayat',
        script: './app.js',
        instances: 1,
        exec_mode: 'fork',
        autorestart: true,
        watch: false,
        max_memory_restart: '150M',
        env: {
            NODE_ENV: 'production',
            PORT: 3002
        },
        node_args: '--max-old-space-size=150',
        error_file: './logs/err.log',
        out_file: './logs/out.log',
        log_file: './logs/combined.log',
        time: true
    }]
};
