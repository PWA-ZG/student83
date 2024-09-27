self.addEventListener('install', e => {
    console.log('V1 installing…');
    e.waitUntil(
        caches.open('CameraAppCache').then(cache => {
            return cache.addAll([
                '/',
                '/index.html',
                '/app.js',
                'public/img/camera_icon.png',
                'public/stylesheets/styles.css',
                '/favicon.ico'
            ]);
        })
    );
});

self.addEventListener('activate', event => {
    console.log('Activated, V1 now ready to handle fetches!');
    });

self.addEventListener('fetch', e => {
    e.respondWith(
        caches.match(e.request).then(response => {
            return response || fetch(e.request);
        })
    );
});