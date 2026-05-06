<?php
declare(strict_types=1);
$token = $_GET['token'] ?? '';
?>
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Cormorant+Garamond:wght@500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="styles.css" />
  <title>Passwort zurücksetzen - Lashes by Lia</title>
</head>
<body class="dashboard-body">
  <main class="dashboard-shell">
    <section class="login-section">
      <div class="login-grid login-stage">
        <div class="login-panel card reveal-up is-visible">
          <p class="eyebrow">Passwort zurücksetzen</p>
          <h1>Neues Passwort festlegen</h1>
          <p class="lead">Gib dein neues Passwort ein. Der Link ist aus Sicherheitsgründen nur begrenzt gültig.</p>
          <form id="resetPasswordForm" class="login-form">
            <input type="hidden" id="resetToken" value="<?php echo htmlspecialchars((string)$token, ENT_QUOTES, 'UTF-8'); ?>">
            <label><span>Neues Passwort</span><input type="password" id="resetPassword" minlength="8" required></label>
            <label><span>Passwort wiederholen</span><input type="password" id="resetPasswordConfirm" minlength="8" required></label>
            <button class="button primary" type="submit">Passwort speichern</button>
            <p class="form-note" id="resetPasswordNote"></p>
          </form>
          <a href="dashboard.html" class="text-button">Zurück zum Login</a>
        </div>
        <div class="card login-visual reveal-up delay-1 is-visible">
          <img src="assets/studio-wide.jpeg" alt="Studio von Lashes by Lia">
        </div>
      </div>
    </section>
  </main>
  <script>
    const form = document.getElementById('resetPasswordForm');
    const note = document.getElementById('resetPasswordNote');
    form?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const token = document.getElementById('resetToken').value;
      const password = document.getElementById('resetPassword').value;
      const passwordConfirm = document.getElementById('resetPasswordConfirm').value;
      if (password !== passwordConfirm) {
        note.textContent = 'Die Passwörter stimmen nicht überein.';
        return;
      }
      const response = await fetch('dashboard-api.php?action=reset-password', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({token, password})
      });
      const result = await response.json();
      note.textContent = result.message || 'Das Passwort konnte nicht aktualisiert werden.';
      if (result.ok) {
        setTimeout(() => { window.location.href = 'dashboard.html'; }, 1600);
      }
    });
  </script>
</body>
</html>
