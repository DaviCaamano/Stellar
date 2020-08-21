module.exports = {
    apps : [{
        name: 'Storystring - API',
        script: 'server.js',
        ignore_watch: [
            "node_modules",
            "temp",
            "public",
            ".git",
            "images",
        ],
        autorestart: true,
        watch_delay: 1000,
        watch: true,
        max_memory_restart: '1G',
    }]
};
