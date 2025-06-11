// script.js

// === Konfigurasi Firebase Anda ===
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

// --- Konstanta untuk Pengguna Default ---
const DEFAULT_USER_ID = '1111';
const DEFAULT_PASSWORD = 'admin';
const DEFAULT_BALANCE = 1000000; // Saldo default untuk pengguna '1111'
const LOCAL_STORAGE_DEFAULT_USER_KEY = 'bprMonitoringDefaultUserLoggedIn';

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

    // Fungsi untuk mengubah mode UI antara login dan daftar
    function toggleAuthUI(toLoginMode) {
        isLoginMode = toLoginMode;
        if (isLoginMode) {
            authTitle.textContent = 'Login';
            authButton.textContent = 'Login';
            switchText.innerHTML = 'Belum punya akun? <button type="button" id="toggleAuthMode">Daftar Sekarang</button>';
        } else {
            authTitle.textContent = 'Daftar Akun Baru';
            authButton.textContent = 'Daftar';
            switchText.innerHTML = 'Sudah punya akun? <button type="button" id="toggleAuthMode">Login</button>';
        }
        // Pasang kembali event listener karena innerHTML menggantikan elemen
        document.getElementById('toggleAuthMode').addEventListener('click', () => {
            toggleAuthUI(!isLoginMode); // Panggil fungsi dengan mode berlawanan
        });
        hideMessage('authMessage'); // Sembunyikan pesan sebelumnya
    }

    // Event listener untuk tombol toggle mode
    toggleAuthModeBtn.addEventListener('click', () => toggleAuthUI(!isLoginMode));

    // Event listener untuk submit form
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Mencegah submit form default
        hideMessage('authMessage'); // Sembunyikan pesan sebelumnya

        const emailOrId = emailInput.value.trim();
        const password = passwordInput.value.trim();

        // --- Cek Pengguna Default (1111/admin) ---
        if (isLoginMode && emailOrId === DEFAULT_USER_ID && password === DEFAULT_PASSWORD) {
            localStorage.setItem(LOCAL_STORAGE_DEFAULT_USER_KEY, 'true'); // Tandai login default
            showMessage('authMessage', 'Login Pengguna Default Berhasil! Mengarahkan...', 'success');
            window.location.href = 'home.html';
            return; // Hentikan eksekusi lebih lanjut
        }

        // --- Logika Autentikasi Firebase ---
        if (isLoginMode) {
            // Logika Login Firebase
            try {
                await auth.signInWithEmailAndPassword(emailOrId, password);
                showMessage('authMessage', 'Login Berhasil! Mengarahkan...', 'success');
                window.location.href = 'home.html'; // Arahkan ke halaman utama
            } catch (error) {
                console.error('Error login:', error.message);
                showMessage('authMessage', `Error login: ${error.message}`, 'error');
            }
        } else {
            // Logika Daftar Firebase
            // Pastikan email bukan '1111' karena itu ID pengguna default lokal
            if (emailOrId === DEFAULT_USER_ID) {
                 showMessage('authMessage', 'ID Pengguna ' + DEFAULT_USER_ID + ' tidak dapat digunakan untuk pendaftaran Firebase. Harap gunakan email.', 'error');
                 return;
            }

            try {
                const userCredential = await auth.createUserWithEmailAndPassword(emailOrId, password);
                // Tambahkan data user ke Firestore setelah berhasil daftar
                // Set saldo awal 0 untuk pengguna baru Firebase
                await db.collection('users').doc(userCredential.user.uid).set({
                    email: userCredential.user.email,
                    balance: 0, // Saldo awal untuk pengguna baru Firebase
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                });
                showMessage('authMessage', 'Pendaftaran Berhasil! Silakan login.', 'success');
                // Alihkan ke mode login setelah daftar
                toggleAuthUI(true); // Kembali ke mode login
                emailInput.value = emailOrId; // Isi kembali email untuk memudahkan login
                passwordInput.value = '';
            } catch (error) {
                console.error('Error daftar:', error.message);
                showMessage('authMessage', `Error daftar: ${error.message}`, 'error');
            }
        }
    });

    // Cek status login saat halaman dimuat
    auth.onAuthStateChanged(user => {
        // Jika ada pengguna Firebase yang login ATAU ada flag pengguna default
        if (user || localStorage.getItem(LOCAL_STORAGE_DEFAULT_USER_KEY) === 'true') {
            console.log('Pengguna sudah login atau default user terdeteksi. Mengarahkan ke home.html');
            window.location.href = 'home.html';
        } else {
            console.log('Tidak ada pengguna yang login.');
        }
    });
}

// --- Logika untuk Halaman Utama (home.html) ---
if (document.getElementById('balanceDisplay')) {
    const logoutBtn = document.getElementById('logoutBtn');
    const userEmailDisplay = document.getElementById('userEmailDisplay');
    const balanceDisplay = document.getElementById('balanceDisplay');
    const updateBalanceBtn = document.getElementById('updateBalanceBtn');
    const newBalanceInput = document.getElementById('newBalanceInput');
    const balanceMessage = document.getElementById('balanceMessage');
    const updateBalanceSection = document.querySelector('.home-content h3:nth-of-type(2)').parentElement; // Dapatkan bagian "Perbarui Saldo"

    // Cek status login saat halaman utama dimuat
    auth.onAuthStateChanged(async (user) => {
        const isDefaultUserLoggedIn = localStorage.getItem(LOCAL_STORAGE_DEFAULT_USER_KEY) === 'true';

        if (user) {
            // Pengguna Firebase Login
            console.log('Pengguna Firebase di halaman utama:', user.email);
            userEmailDisplay.textContent = `Email: ${user.email}`;
            // Tampilkan bagian update saldo
            updateBalanceSection.style.display = 'block'; 
            fetchUserBalance(user.uid); // Ambil saldo dari Firestore
        } else if (isDefaultUserLoggedIn) {
            // Pengguna Default Login (1111/admin)
            console.log('Pengguna Default (1111/admin) di halaman utama.');
            userEmailDisplay.textContent = `ID Pengguna: ${DEFAULT_USER_ID}`;
            balanceDisplay.textContent = `Rp ${DEFAULT_BALANCE.toLocaleString('id-ID')}`;
            balanceDisplay.style.color = '#007bff'; // Warna berbeda untuk default
            // Sembunyikan bagian update saldo karena pengguna default tidak punya data di Firestore
            updateBalanceSection.style.display = 'none'; 
        }
        else {
            // Tidak ada yang login, arahkan kembali ke halaman login
            console.log('Tidak ada pengguna yang login, kembali ke index.html.');
            window.location.href = 'index.html';
        }
    });

    // Fungsi untuk mengambil saldo dari Firestore
    async function fetchUserBalance(uid) {
        balanceDisplay.textContent = 'Memuat saldo...';
        hideMessage('balanceMessage');
        try {
            const userDocRef = db.collection('users').doc(uid);
            const doc = await userDocRef.get(); // Dapatkan dokumen pengguna

            if (doc.exists) {
                const data = doc.data();
                if (data && typeof data.balance === 'number') {
                    balanceDisplay.textContent = `Rp ${data.balance.toLocaleString('id-ID')}`;
                    showMessage('balanceMessage', 'Saldo berhasil dimuat.', 'success');
                } else {
                    balanceDisplay.textContent = 'Saldo: Tidak Tersedia';
                    showMessage('balanceMessage', 'Data saldo tidak ditemukan atau tidak valid.', 'error');
                }
            } else {
                balanceDisplay.textContent = 'Saldo: Belum Ada Data';
                showMessage('balanceMessage', 'Dokumen pengguna tidak ditemukan.', 'error');
                // Ini bisa terjadi jika pengguna terdaftar via auth tapi dokumen di Firestore belum dibuat
                // Atau jika ada masalah dengan UID
            }
        } catch (error) {
            console.error('Error fetching balance:', error);
            balanceDisplay.textContent = 'Gagal memuat saldo.';
            showMessage('balanceMessage', `Error memuat saldo: ${error.message}`, 'error');
        }
    }

    // Fungsi untuk memperbarui saldo di Firestore (hanya untuk pengguna Firebase)
    if (updateBalanceBtn) {
        updateBalanceBtn.addEventListener('click', async () => {
            const newBalance = parseFloat(newBalanceInput.value);
            const user = auth.currentUser;

            if (!user) {
                showMessage('balanceMessage', 'Anda harus login sebagai pengguna Firebase untuk memperbarui saldo.', 'error');
                return;
            }
            if (isNaN(newBalance) || newBalance < 0) {
                showMessage('balanceMessage', 'Mohon masukkan angka saldo yang valid (positif).', 'error');
                return;
            }
            
            hideMessage('balanceMessage'); // Sembunyikan pesan sebelumnya

            try {
                const userDocRef = db.collection('users').doc(user.uid);
                await userDocRef.update({
                    balance: newBalance
                });
                newBalanceInput.value = ''; // Kosongkan input
                showMessage('balanceMessage', 'Saldo berhasil diperbarui!', 'success');
                fetchUserBalance(user.uid); // Muat ulang saldo untuk tampilan
            } catch (error) {
                console.error('Error updating balance:', error);
                showMessage('balanceMessage', `Error memperbarui saldo: ${error.message}`, 'error');
            }
        });
    }

    // Logika Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                // Hapus flag pengguna default dari local storage
                localStorage.removeItem(LOCAL_STORAGE_DEFAULT_USER_KEY); 
                await auth.signOut(); // Logout dari Firebase
                console.log('Logout berhasil.');
                window.location.href = 'index.html'; // Arahkan kembali ke halaman login
            } catch (error) {
                console.error('Error logout:', error);
                alert(`Error logout: ${error.message}`); // Menggunakan alert karena ini situasi darurat logout
            }
        });
    }
      }
                                                                   
