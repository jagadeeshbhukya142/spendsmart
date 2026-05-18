// login.js — form tab switching, validation, fake auth
// TODO later: replace fake auth with real API call to POST /api/auth/login

document.addEventListener('DOMContentLoaded', () => {

  // ---- Tab Switching ----
  const tabs = document.querySelectorAll('.form-tab');
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const target = tab.dataset.tab;
      if (target === 'login') {
        loginForm.style.display = 'flex';
        signupForm.style.display = 'none';
      } else {
        loginForm.style.display = 'none';
        signupForm.style.display = 'flex';
      }
    });
  });

  // ---- Password Toggle ----
  document.querySelectorAll('.toggle-pw').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.previousElementSibling;
      if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🙈';
      } else {
        input.type = 'password';
        btn.textContent = '👁️';
      }
    });
  });

  // ---- Login Submit ----
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');
    const btn = loginForm.querySelector('.btn-auth');
    const spinner = btn.querySelector('.spinner');

    // basic validation
    if (!email || !password) {
      errorEl.textContent = 'Please fill in all fields.';
      errorEl.classList.add('show');
      return;
    }

    if (!isValidEmail(email)) {
      errorEl.textContent = 'Please enter a valid email address.';
      errorEl.classList.add('show');
      return;
    }

    errorEl.classList.remove('show');

    // show loading state
    btn.disabled = true;
    spinner.style.display = 'block';
    btn.querySelector('.btn-text').textContent = 'Signing in...';

    // simulate API call — replace this with real fetch later
    await fakeDelay(1200);

    // for now, any login goes to dashboard
    showToast('Welcome back! 👋', 'success');
    setTimeout(() => {
      window.location.href = 'pages/dashboard.html';
    }, 800);
  });

  // ---- Signup Submit ----
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const errorEl = document.getElementById('signupError');
    const btn = signupForm.querySelector('.btn-auth');
    const spinner = btn.querySelector('.spinner');

    if (!name || !email || !password) {
      errorEl.textContent = 'Please fill in all fields.';
      errorEl.classList.add('show');
      return;
    }

    if (password.length < 6) {
      errorEl.textContent = 'Password must be at least 6 characters.';
      errorEl.classList.add('show');
      return;
    }

    errorEl.classList.remove('show');

    btn.disabled = true;
    spinner.style.display = 'block';
    btn.querySelector('.btn-text').textContent = 'Creating account...';

    await fakeDelay(1400);

    showToast('Account created! Welcome 🎉', 'success');
    setTimeout(() => {
      window.location.href = 'pages/dashboard.html';
    }, 800);
  });

  // ---- Helpers ----
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function fakeDelay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

});