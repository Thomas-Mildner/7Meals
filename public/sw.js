importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyDnI55SQ9P5TixQsfridnIJxb9ZBE0HvEg",
    authDomain: "meals-af1c6.firebaseapp.com",
    projectId: "meals-af1c6",
    storageBucket: "meals-af1c6.firebasestorage.app",
    messagingSenderId: "153120469629",
    appId: "1:153120469629:web:f38224f0a727da7de87714",
    measurementId: "G-DH496B0SBQ"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/icons/icon-192x192.png' // Ensure this path is correct or generic
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
