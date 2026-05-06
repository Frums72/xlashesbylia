<?php
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  header('Location: index.html#kontakt');
  exit;
}
$name = trim($_POST['name'] ?? '');
$email = trim($_POST['email'] ?? '');
$phone = trim($_POST['phone'] ?? '');
$message = trim($_POST['message'] ?? '');
if ($name === '' || $email === '' || $message === '') {
  header('Location: index.html#kontakt');
  exit;
}
$to = 'info@lashes-by-lia.de';
$subject = 'Neue Kontaktanfrage über lashes-by-lia.de';
$body = "Name: $name\nE-Mail: $email\nTelefon: $phone\n\nNachricht:\n$message";
$headers = 'From: noreply@lashes-by-lia.de' . "\r\n" .
           'Reply-To: ' . $email . "\r\n" .
           'Content-Type: text/plain; charset=UTF-8';
@mail($to, $subject, $body, $headers);
header('Location: danke.html');
exit;
?>