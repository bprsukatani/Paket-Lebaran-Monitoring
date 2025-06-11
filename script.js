// script.js

// === Konfigurasi Firebase Anda ===
// GANTI DENGAN KONFIGURASI PROYEK FIREBASE ANDA SENDIRI!
const firebaseConfig = {
      apiKey: "AIzaSyBFzJr48Y8F3_S_d6t_Qlg3NinlyLvFiGU",
      authDomain: "bpr-monitoring.firebaseapp.com",
      projectId: "bpr-monitoring",
      storageBucket: "bpr-monitoring.firebasestorage.app",
      messagingSenderId: "787451089590",
      appId: "1:787451089590:web:23e008144972a5cecc0c17",
      measurementId: "G-SNE62EWQVL"
};

// Inisialisasi Firebase
firebase.initializeApp(firebaseConfig);

// Dapatkan referensi ke layanan Firebase
const auth = firebase.auth();
const db = firebase.firestore();

// --- Fungsi Helper untuk Menampilkan Pesan ---
function showMessage(elementId, message, type) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.className = `${elementId} ${type}`; // Add type class (e.g., 'error' or 'success')
        element.style.display = 'block';
    }
}

function hideMessage(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.display = 'none';
        element.textContent = '';
        element.className = elementId; // Reset class
    }
}

// --- Logika untuk Halaman Login (index.html) ---
if (document.getElementById('authContainer')) {
    const authForm = document.getElementById('authForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const authButton = document.getElementById('authButton');
    const authTitle = document.getElementById('authTitle');
    const toggleAuthModeBtn = document.getElementById('toggleAuthMode');
    const switchText = document.getElementById('switchText');
    
    let isLoginMode = true; // State untuk mode login atau daftar

    toggleAuthModeBtn.addEventListener('click', () => {
        isLoginMode = !isLoginMode;
        if (isLoginMode) {
            authTitle.textContent = 'Login';
            authButton.textContent = 'Login';
            switchText.innerHTML = 'Belum punya akun? <button type="button" id="toggleAuthMode">Daftar Sekarang</button>';
        } else {
            authTitle.textContent = 'Daftar Akun Baru';
            authButton.textContent = 'Daftar';
            switchText.innerHTML = 'Sudah punya akun? <button type="button" id="toggleAuthMode">Login</button>';
        }
        // Re-attach event listener because innerHTML replaces it
        document.getElementById('toggleAuthMode').addEventListener('click', () => {
            toggleAuthModeBtn.click(); // Simulate click on the original button
        });
        hideMessage('authMessage'); // Clear messages on mode switch
    });

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Mencegah submit form default
        hideMessage('authMessage'); // Sembunyikan pesan sebelumnya

        const email = emailInput.value;
        const password = passwordInput.value;

        if (isLoginMode) {
            // Logika Login
            try {
                await auth.signInWithEmailAndPassword(email, password);
                showMessage('authMessage', 'Login Berhasil! Mengarahkan...', 'success');
                window.location.href = 'home.html'; // Arahkan ke halaman utama
            } catch (error) {
                console.error('Error login:', error.message);
                showMessage('authMessage', `Error login: ${error.message}`, 'error');
            }
        } else {
            // Logika Daftar
            try {
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                // Tambahkan data user ke Firestore setelah berhasil daftar
                await db.collection('users').doc(userCredential.user.uid).set({
                    email: userCredential.user.email,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    // Tambahkan bidang lain yang Anda inginkan
                });
                showMessage('authMessage', 'Pendaftaran Berhasil! Silakan login.', 'success');
                // Alihkan ke mode login setelah daftar
                isLoginMode = true;
                authTitle.textContent = 'Login';
                authButton.textContent = 'Login';
                switchText.innerHTML = 'Belum punya akun? <button type="button" id="toggleAuthMode">Daftar Sekarang</button>';
                 // Re-attach event listener
                document.getElementById('toggleAuthMode').addEventListener('click', () => {
                    toggleAuthModeBtn.click();
                });
            } catch (error) {
                console.error('Error daftar:', error.message);
                showMessage('authMessage', `Error daftar: ${error.message}`, 'error');
            }
        }
    });

    // Cek status login saat halaman dimuat
    auth.onAuthStateChanged(user => {
        if (user) {
            // Pengguna sudah login, arahkan ke halaman utama
            console.log('User sudah login:', user.email);
            window.location.href = 'home.html';
        } else {
            // Pengguna belum login
            console.log('User belum login');
        }
    });
}

// --- Logika untuk Halaman Utama (home.html) ---
if (document.getElementById('userDataList')) {
    const logoutBtn = document.getElementById('logoutBtn');
    const userDataList = document.getElementById('userDataList');
    const addDataBtn = document.getElementById('addDataBtn');
    const newDataInput = document.getElementById('newDataInput');

    // Cek status login saat halaman utama dimuat
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            console.log('User di halaman utama:', user.email);
            // Ambil dan tampilkan data
            fetchUserData(user.uid);
        } else {
            // Jika belum login, arahkan kembali ke halaman login
            console.log('Tidak ada user di halaman utama, kembali ke login.');
            window.location.href = 'index.html';
        }
    });

    // Fungsi untuk mengambil data dari Firestore
    async function fetchUserData(uid) {
        userDataList.innerHTML = '<li>Memuat data...</li>'; // Tampilkan pesan loading
        hideMessage('dataMessage');
        try {
            // Ambil koleksi 'items' yang spesifik untuk pengguna ini
            const userDocRef = db.collection('users').doc(uid);
            const userItemsRef = userDocRef.collection('items').orderBy('createdAt', 'desc');
            
            userItemsRef.onSnapshot((snapshot) => { // Menggunakan onSnapshot untuk real-time update
                userDataList.innerHTML = ''; // Kosongkan daftar sebelum mengisi ulang
                if (snapshot.empty) {
                    userDataList.innerHTML = '<li>Tidak ada data tersimpan.</li>';
                } else {
                    snapshot.forEach(doc => {
                        const data = doc.data();
                        const li = document.createElement('li');
                        li.textContent = data.name + (data.createdAt ? ` (Ditambahkan: ${new Date(data.createdAt.toDate()).toLocaleString()})` : '');
                        userDataList.appendChild(li);
                    });
                }
                showMessage('dataMessage', 'Data berhasil dimuat.', 'success');
            }, (error) => {
                console.error('Error fetching real-time data:', error);
                showMessage('dataMessage', `Error memuat data: ${error.message}`, 'error');
            });

        } catch (error) {
            console.error('Error fetching user data:', error);
            showMessage('dataMessage', `Error memuat data: ${error.message}`, 'error');
            userDataList.innerHTML = '<li>Gagal memuat data.</li>';
        }
    }

    // Tambah data baru
    if (addDataBtn) {
        addDataBtn.addEventListener('click', async () => {
            const itemName = newDataInput.value.trim();
            const user = auth.currentUser;

            if (itemName && user) {
                try {
                    // Tambahkan item ke sub-koleksi 'items' di dalam dokumen user
                    await db.collection('users').doc(user.uid).collection('items').add({
                        name: itemName,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp() // Timestamp server
                    });
                    newDataInput.value = ''; // Kosongkan input
                    showMessage('dataMessage', 'Data berhasil ditambahkan!', 'success');
                } catch (error) {
                    console.error('Error adding data:', error);
                    showMessage('dataMessage', `Error menambahkan data: ${error.message}`, 'error');
                }
            } else {
                showMessage('dataMessage', 'Mohon masukkan nama item.', 'error');
            }
        });
    }

    // Logika Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await auth.signOut();
                console.log('Logout berhasil.');
                window.location.href = 'index.html'; // Arahkan kembali ke halaman login
            } catch (error) {
                console.error('Error logout:', error);
                alert(`Error logout: ${error.message}`);
            }
        });
    }
}
