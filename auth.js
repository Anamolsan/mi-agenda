(function(){
  'use strict';

  var authScreen = document.getElementById('authScreen');
  var appEl = document.querySelector('.app');
  var tabLogin = document.getElementById('tabLogin');
  var tabRegister = document.getElementById('tabRegister');
  var formLogin = document.getElementById('formLogin');
  var formRegister = document.getElementById('formRegister');
  var loginEmail = document.getElementById('loginEmail');
  var loginPassword = document.getElementById('loginPassword');
  var loginError = document.getElementById('loginError');
  var regEmail = document.getElementById('regEmail');
  var regPassword = document.getElementById('regPassword');
  var registerError = document.getElementById('registerError');
  var registerSuccess = document.getElementById('registerSuccess');
  var logoutBtn = document.getElementById('logoutBtn');
  var settingsUserEmail = document.getElementById('settingsUserEmail');

  // Comprobar sesión al cargar la página
  _sb.auth.getSession().then(function(r) {
    if (r.data && r.data.session) {
      showApp(r.data.session.user);
    } else {
      showAuth();
    }
  });

  // Escuchar cambios de sesión
  _sb.auth.onAuthStateChange(function(event, session) {
    if (session) {
      showApp(session.user);
    } else {
      showAuth();
    }
  });

  function showApp(user) {
    authScreen.hidden = true;
    appEl.hidden = false;
    if (settingsUserEmail) settingsUserEmail.textContent = user.email;
  }

  function showAuth() {
    authScreen.hidden = false;
    appEl.hidden = true;
    formLogin.reset();
    formRegister.reset();
    loginError.hidden = true;
    registerError.hidden = true;
    registerSuccess.hidden = true;
  }

  // Cambiar pestaña login ↔ registro
  tabLogin.addEventListener('click', function() {
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    formLogin.hidden = false;
    formRegister.hidden = true;
    loginError.hidden = true;
  });

  tabRegister.addEventListener('click', function() {
    tabRegister.classList.add('active');
    tabLogin.classList.remove('active');
    formRegister.hidden = false;
    formLogin.hidden = true;
    registerError.hidden = true;
    registerSuccess.hidden = true;
  });

  // Login
  formLogin.addEventListener('submit', function(e) {
    e.preventDefault();
    loginError.hidden = true;
    var btn = formLogin.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Entrando...';

    _sb.auth.signInWithPassword({
      email: loginEmail.value.trim(),
      password: loginPassword.value
    }).then(function(r) {
      btn.disabled = false;
      btn.textContent = 'Entrar';
      if (r.error) {
        loginError.textContent = 'Email o contraseña incorrectos';
        loginError.hidden = false;
      }
    });
  });

  // Registro
  formRegister.addEventListener('submit', function(e) {
    e.preventDefault();
    registerError.hidden = true;
    registerSuccess.hidden = true;
    var btn = formRegister.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Creando cuenta...';

    _sb.auth.signUp({
      email: regEmail.value.trim(),
      password: regPassword.value
    }).then(function(r) {
      btn.disabled = false;
      btn.textContent = 'Crear cuenta';
      if (r.error) {
        var msg = r.error.message || '';
        if (msg.indexOf('already') !== -1 || msg.indexOf('registered') !== -1) {
          registerError.textContent = 'Este email ya está registrado. Inicia sesión.';
        } else {
          registerError.textContent = 'Error al crear la cuenta. Inténtalo de nuevo.';
        }
        registerError.hidden = false;
      } else if (r.data && !r.data.session) {
        registerSuccess.textContent = 'Cuenta creada. Revisa tu email y haz clic en el enlace de confirmación.';
        registerSuccess.hidden = false;
        formRegister.reset();
      }
    });
  });

  // Cerrar sesión
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      _sb.auth.signOut();
    });
  }
})();
