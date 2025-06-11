// Konfigurasi Firebase Anda
const firebaseConfig = {
  apiKey: "YOUR_API_KEY", // Ganti dengan API Key Anda
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com", // Ganti dengan Project ID Anda
  projectId: "YOUR_PROJECT_ID", // Ganti dengan Project ID Anda
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

// Inisialisasi Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Logika untuk halaman login (index.html)
if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = loginForm.username.value;
        const password = loginForm.password.value;

        errorMessage.textContent = ''; // Bersihkan pesan error sebelumnya

        try {
            // Cari pengguna berdasarkan username
            const usersRef = db.collection('users');
            const snapshot = await usersRef.where('username', '==', username).get();

            if (snapshot.empty) {
                errorMessage.textContent = 'Invalid username or password.';
                return;
            }

            let foundUser = null;
            snapshot.forEach(doc => {
                const userData = doc.data();
                if (userData.password === password) { // PERINGATAN: Tidak aman untuk produksi!
                    foundUser = { id: doc.id, ...userData };
                }
            });

            if (foundUser) {
                // Simpan data pengguna di sessionStorage untuk diakses di halaman lain
                sessionStorage.setItem('loggedInUser', JSON.stringify(foundUser));
                window.location.href = 'user.html'; // Redirect ke halaman pengguna
            } else {
                errorMessage.textContent = 'Invalid username or password.';
            }

        } catch (error) {
            console.error("Error during login:", error);
            errorMessage.textContent = 'An error occurred. Please try again.';
        }
    });
}
