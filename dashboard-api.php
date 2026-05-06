<?php
declare(strict_types=1);

$secureCookie = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
session_set_cookie_params([
    'httponly' => true,
    'samesite' => 'Lax',
    'secure' => $secureCookie,
    'path' => '/',
]);
session_start();

const DASHBOARD_DATA_DIR = __DIR__ . '/data';
const DASHBOARD_DATA_FILE = DASHBOARD_DATA_DIR . '/dashboard-data.json';
const DASHBOARD_RESET_LOG = DASHBOARD_DATA_DIR . '/password-reset-links.log';
const DASHBOARD_MAIL_LOG = DASHBOARD_DATA_DIR . '/dashboard-mails.log';

function dashboard_now_iso(): string {
    return gmdate('Y-m-d\TH:i:s');
}

function dashboard_seed_state(): array {
    return [
        'users' => [
            [
                'id' => 'admin-1',
                'role' => 'admin',
                'approvalStatus' => 'approved',
                'approvedAt' => '2026-03-01T09:00:00',
                'approvedBy' => 'System',
                'firstName' => 'Julia',
                'lastName' => 'Edmaier',
                'name' => 'Julia Edmaier',
                'email' => 'julia@lashes-by-lia.de',
                'passwordHash' => password_hash('Julia2026!', PASSWORD_DEFAULT),
                'phone' => '0170 2454353',
                'birthdate' => '2000-06-12',
                'address' => 'Zum Kirchplatz 15, 84056 Rottenburg a. d. Laaber',
                'avatar' => '',
                'deletedAt' => '',
                'deletedBy' => '',
                'documents' => new stdClass(),
                'createdAt' => '2026-03-01T09:00:00',
                'lastEdited' => '2026-03-31T10:00:00',
                'lastLogin' => '2026-03-31T10:00:00',
                'lastActive' => '2026-03-31T10:00:00',
                'online' => false,
                'resetTokenHash' => '',
                'resetExpiresAt' => '',
            ],
            [
                'id' => 'cust-1',
                'role' => 'customer',
                'approvalStatus' => 'approved',
                'approvedAt' => '2026-03-15T14:10:00',
                'approvedBy' => 'Julia Edmaier',
                'firstName' => 'Mara',
                'lastName' => 'Schneider',
                'name' => 'Mara Schneider',
                'email' => 'mara@example.com',
                'passwordHash' => password_hash('Kundin2026!', PASSWORD_DEFAULT),
                'phone' => '0171 1112233',
                'birthdate' => '2010-04-22',
                'address' => 'Musterstraße 7, 84056 Rottenburg',
                'avatar' => '',
                'deletedAt' => '',
                'deletedBy' => '',
                'documents' => [
                    'minorConsent' => true,
                    'idCopy' => false,
                    'treatmentContract' => false,
                ],
                'createdAt' => '2026-03-15T14:10:00',
                'lastEdited' => '2026-03-29T11:30:00',
                'lastLogin' => '2026-03-30T18:20:00',
                'lastActive' => '2026-03-30T18:23:00',
                'online' => false,
                'resetTokenHash' => '',
                'resetExpiresAt' => '',
            ],
        ],
        'appointments' => [
            [
                'id' => 'a1',
                'customerId' => 'cust-1',
                'service' => 'Wimpernverlängerung',
                'date' => '2026-04-03',
                'time' => '10:00',
                'note' => 'Neues Set gewünscht',
                'status' => 'open',
                'updatedBy' => 'Mara Schneider',
                'updatedByRole' => 'customer',
                'updatedAt' => '2026-03-30T19:42:00',
                'needsReconfirm' => true,
            ],
            [
                'id' => 'a2',
                'customerId' => 'cust-1',
                'service' => 'Lashlifting',
                'date' => '2026-04-10',
                'time' => '14:30',
                'note' => '',
                'status' => 'confirmed',
                'updatedBy' => 'Julia Edmaier',
                'updatedByRole' => 'admin',
                'updatedAt' => '2026-03-31T09:05:00',
                'needsReconfirm' => false,
            ],
        ],
        'customTasks' => [],
        'settings' => [
            'services' => [
                'Wimpernverlängerung' => true,
                'Lashlifting' => true,
                'Browlifting' => true,
                'Auffüllen' => true,
                'Beratung' => true,
            ],
            'openingHours' => [
                'Mo' => ['enabled' => true, 'start' => '09:00', 'end' => '18:00'],
                'Di' => ['enabled' => true, 'start' => '09:00', 'end' => '18:00'],
                'Mi' => ['enabled' => true, 'start' => '09:00', 'end' => '18:00'],
                'Do' => ['enabled' => true, 'start' => '09:00', 'end' => '18:00'],
                'Fr' => ['enabled' => true, 'start' => '09:00', 'end' => '18:00'],
                'Sa' => ['enabled' => false, 'start' => '09:00', 'end' => '14:00'],
                'So' => ['enabled' => false, 'start' => '00:00', 'end' => '00:00'],
            ],
        ],
    ];
}

function dashboard_ensure_storage(): void {
    if (!is_dir(DASHBOARD_DATA_DIR)) {
        mkdir(DASHBOARD_DATA_DIR, 0775, true);
    }
    if (!file_exists(DASHBOARD_DATA_FILE)) {
        file_put_contents(DASHBOARD_DATA_FILE, json_encode(dashboard_seed_state(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
    }
}

function dashboard_load_db(): array {
    dashboard_ensure_storage();
    $raw = file_get_contents(DASHBOARD_DATA_FILE);
    $decoded = json_decode($raw ?: '', true);
    if (!is_array($decoded)) {
        $decoded = dashboard_seed_state();
        file_put_contents(DASHBOARD_DATA_FILE, json_encode($decoded, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
    }
    $decoded['customTasks'] = isset($decoded['customTasks']) && is_array($decoded['customTasks']) ? $decoded['customTasks'] : [];
    return $decoded;
}

function dashboard_save_db(array $db): void {
    file_put_contents(DASHBOARD_DATA_FILE, json_encode($db, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
}

function dashboard_json_response(array $payload, int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function dashboard_request_data(): array {
    $input = file_get_contents('php://input');
    $decoded = json_decode($input ?: '', true);
    return is_array($decoded) ? $decoded : [];
}

function dashboard_public_user(array $user): array {
    unset($user['passwordHash'], $user['resetTokenHash'], $user['resetExpiresAt']);
    return $user;
}

function dashboard_public_state(array $db): array {
    return [
        'users' => array_map('dashboard_public_user', $db['users'] ?? []),
        'appointments' => $db['appointments'] ?? [],
        'customTasks' => $db['customTasks'] ?? [],
        'settings' => $db['settings'] ?? [],
    ];
}

function dashboard_find_user_index(array $db, string $id): int {
    foreach ($db['users'] as $index => $user) {
        if (($user['id'] ?? '') === $id) {
            return $index;
        }
    }
    return -1;
}

function dashboard_find_user_by_email(array $db, string $email): int {
    foreach ($db['users'] as $index => $user) {
        if (mb_strtolower((string)($user['email'] ?? '')) === mb_strtolower($email)) {
            return $index;
        }
    }
    return -1;
}

function dashboard_current_user(array $db): ?array {
    $userId = $_SESSION['dashboard_user_id'] ?? '';
    if (!$userId) {
        return null;
    }
    $index = dashboard_find_user_index($db, (string)$userId);
    if ($index < 0) {
        return null;
    }
    return $db['users'][$index];
}

function dashboard_require_user(array $db): array {
    $user = dashboard_current_user($db);
    if (!$user) {
        dashboard_json_response(['ok' => false, 'message' => 'Nicht angemeldet.'], 401);
    }
    return $user;
}

function dashboard_issue_reset_link(array &$db, int $userIndex): void {
    $token = bin2hex(random_bytes(32));
    $db['users'][$userIndex]['resetTokenHash'] = hash('sha256', $token);
    $db['users'][$userIndex]['resetExpiresAt'] = date('c', time() + 3600);
    dashboard_save_db($db);

    $scheme = $GLOBALS['secureCookie'] ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $basePath = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '/')), '/');
    $resetUrl = $scheme . '://' . $host . ($basePath ? $basePath : '') . '/dashboard-reset.php?token=' . urlencode($token);

    $recipient = $db['users'][$userIndex]['email'] ?? '';
    $subject = 'Passwort zuruecksetzen';
    $body = "Hallo,\n\nbitte nutze diesen Link, um dein Passwort zurueckzusetzen:\n" . $resetUrl . "\n\nDer Link ist 60 Minuten gueltig.";
    $headers = 'Content-Type: text/plain; charset=UTF-8';
    @mail($recipient, $subject, $body, $headers);
    file_put_contents(DASHBOARD_RESET_LOG, '[' . date('c') . '] ' . $recipient . ' ' . $resetUrl . PHP_EOL, FILE_APPEND | LOCK_EX);
}

function dashboard_send_mail_message(string $recipient, string $subject, string $body): void {
    if ($recipient === '') {
        return;
    }
    $headers = 'Content-Type: text/plain; charset=UTF-8';
    @mail($recipient, $subject, $body, $headers);
    file_put_contents(
        DASHBOARD_MAIL_LOG,
        '[' . date('c') . '] ' . $recipient . ' | ' . $subject . PHP_EOL . $body . PHP_EOL . str_repeat('-', 40) . PHP_EOL,
        FILE_APPEND | LOCK_EX
    );
}

function dashboard_send_registration_received_mail(array $user): void {
    $recipient = (string)($user['email'] ?? '');
    $firstName = trim((string)($user['firstName'] ?? ''));
    $subject = 'Deine Registrierung bei Lashes by Lia';
    $body = "Hallo " . ($firstName !== '' ? $firstName : 'du') . ",\n\n"
        . "du wurdest erfolgreich registriert.\n"
        . "Dein Konto wird anschließend persönlich bestätigt.\n\n"
        . "Du wirst benachrichtigt, sobald dein Account freigegeben wurde.\n\n"
        . "Liebe Grüße\nLashes by Lia";
    dashboard_send_mail_message($recipient, $subject, $body);
}

function dashboard_send_registration_approved_mail(array $user): void {
    $recipient = (string)($user['email'] ?? '');
    $firstName = trim((string)($user['firstName'] ?? ''));
    $subject = 'Du bist jetzt startklar!';
    $body = "Hallo " . ($firstName !== '' ? $firstName : 'du') . ",\n\n"
        . "dein Konto wurde soeben persönlich freigegeben.\n"
        . "Du bist jetzt startklar und kannst dich direkt in dein Dashboard einloggen.\n\n"
        . "Wir freuen uns auf dich.\n\n"
        . "Liebe Grüße\nLashes by Lia";
    dashboard_send_mail_message($recipient, $subject, $body);
}

function dashboard_send_registration_rejected_mail(array $user): void {
    $recipient = (string)($user['email'] ?? '');
    $firstName = trim((string)($user['firstName'] ?? ''));
    $subject = 'Update zu deiner Registrierung';
    $body = "Hallo " . ($firstName !== '' ? $firstName : 'du') . ",\n\n"
        . "deine Registrierung konnte aktuell noch nicht freigegeben werden.\n"
        . "Wenn du Rückfragen hast, melde dich bitte direkt bei Lashes by Lia.\n\n"
        . "Liebe Grüße\nLashes by Lia";
    dashboard_send_mail_message($recipient, $subject, $body);
}

function dashboard_send_appointment_confirmed_mail(array $user, array $appointment): void {
    $recipient = (string)($user['email'] ?? '');
    $firstName = trim((string)($user['firstName'] ?? ''));
    $service = trim((string)($appointment['service'] ?? 'Termin'));
    $date = trim((string)($appointment['date'] ?? ''));
    $time = trim((string)($appointment['time'] ?? ''));
    $subject = 'Dein Termin wurde bestätigt';
    $body = "Hallo " . ($firstName !== '' ? $firstName : 'du') . ",\n\n"
        . "dein Termin wurde soeben bestätigt.\n\n"
        . "Leistung: " . $service . "\n"
        . "Datum: " . $date . "\n"
        . "Uhrzeit: " . $time . "\n\n"
        . "Du bist jetzt startklar. Wir freuen uns auf dich.\n\n"
        . "Liebe Grüße\nLashes by Lia";
    dashboard_send_mail_message($recipient, $subject, $body);
}

function dashboard_merge_users_for_admin(array $existingUsers, array $incomingUsers): array {
    $existingById = [];
    foreach ($existingUsers as $user) {
        $existingById[$user['id']] = $user;
    }
    $merged = [];
    foreach ($incomingUsers as $incoming) {
        if (!is_array($incoming) || empty($incoming['id'])) {
            continue;
        }
        $id = (string)$incoming['id'];
        $existing = $existingById[$id] ?? null;
        $passwordHash = $existing['passwordHash'] ?? '';
        $pendingPassword = trim((string)($incoming['pendingPassword'] ?? ''));
        if ($pendingPassword !== '') {
            $passwordHash = password_hash($pendingPassword, PASSWORD_DEFAULT);
        }
        if (!$existing && $passwordHash === '') {
            continue;
        }
        $approvalStatus = (string)($incoming['approvalStatus'] ?? ($existing['approvalStatus'] ?? 'approved'));
        $mergedUser = [
            'id' => $id,
            'role' => (string)($incoming['role'] ?? ($existing['role'] ?? 'customer')),
            'approvalStatus' => $approvalStatus,
            'approvedAt' => (string)($incoming['approvedAt'] ?? ($existing['approvedAt'] ?? '')),
            'approvedBy' => (string)($incoming['approvedBy'] ?? ($existing['approvedBy'] ?? '')),
            'firstName' => (string)($incoming['firstName'] ?? ($existing['firstName'] ?? '')),
            'lastName' => (string)($incoming['lastName'] ?? ($existing['lastName'] ?? '')),
            'name' => (string)($incoming['name'] ?? ''),
            'email' => mb_strtolower(trim((string)($incoming['email'] ?? ''))),
            'passwordHash' => $passwordHash,
            'phone' => (string)($incoming['phone'] ?? ''),
            'whatsapp' => (string)($incoming['whatsapp'] ?? ($existing['whatsapp'] ?? '')),
            'instagram' => (string)($incoming['instagram'] ?? ($existing['instagram'] ?? '')),
            'birthdate' => (string)($incoming['birthdate'] ?? ''),
            'address' => (string)($incoming['address'] ?? ''),
            'avatar' => (string)($incoming['avatar'] ?? ''),
            'contactHint' => (string)($incoming['contactHint'] ?? ($existing['contactHint'] ?? '')),
            'registrationNote' => (string)($incoming['registrationNote'] ?? ($existing['registrationNote'] ?? '')),
            'registrationSource' => (string)($incoming['registrationSource'] ?? ($existing['registrationSource'] ?? '')),
            'deletedAt' => (string)($incoming['deletedAt'] ?? ($existing['deletedAt'] ?? '')),
            'deletedBy' => (string)($incoming['deletedBy'] ?? ($existing['deletedBy'] ?? '')),
            'documents' => is_array($incoming['documents'] ?? null) ? $incoming['documents'] : ($existing['documents'] ?? new stdClass()),
            'createdAt' => (string)($incoming['createdAt'] ?? ($existing['createdAt'] ?? dashboard_now_iso())),
            'lastEdited' => (string)($incoming['lastEdited'] ?? dashboard_now_iso()),
            'lastLogin' => (string)($incoming['lastLogin'] ?? ($existing['lastLogin'] ?? '')),
            'lastActive' => (string)($incoming['lastActive'] ?? ($existing['lastActive'] ?? '')),
            'online' => (bool)($incoming['online'] ?? ($existing['online'] ?? false)),
            'resetTokenHash' => (string)($existing['resetTokenHash'] ?? ''),
            'resetExpiresAt' => (string)($existing['resetExpiresAt'] ?? ''),
        ];
        $merged[] = $mergedUser;
        $previousApprovalStatus = (string)($existing['approvalStatus'] ?? '');
        if ($existing && $previousApprovalStatus !== $approvalStatus) {
            if ($approvalStatus === 'approved') {
                dashboard_send_registration_approved_mail($mergedUser);
            } elseif ($approvalStatus === 'rejected') {
                dashboard_send_registration_rejected_mail($mergedUser);
            }
        }
    }
    return $merged;
}

function dashboard_merge_state(array $db, array $incomingState, array $sessionUser): array {
    if (($sessionUser['role'] ?? '') === 'admin') {
        $db['users'] = dashboard_merge_users_for_admin($db['users'] ?? [], $incomingState['users'] ?? []);
        $existingAppointments = $db['appointments'] ?? [];
        $incomingAppointments = is_array($incomingState['appointments'] ?? null) ? array_values($incomingState['appointments']) : $existingAppointments;
        $existingAppointmentsById = [];
        foreach ($existingAppointments as $appointment) {
            if (is_array($appointment) && isset($appointment['id'])) {
                $existingAppointmentsById[(string)$appointment['id']] = $appointment;
            }
        }
        $db['appointments'] = $incomingAppointments;
        foreach ($incomingAppointments as $appointment) {
            if (!is_array($appointment)) {
                continue;
            }
            $appointmentId = (string)($appointment['id'] ?? '');
            if ($appointmentId === '') {
                continue;
            }
            $previous = $existingAppointmentsById[$appointmentId] ?? null;
            $previousStatus = (string)($previous['status'] ?? '');
            $newStatus = (string)($appointment['status'] ?? '');
            if ($newStatus === 'confirmed' && $previousStatus !== 'confirmed') {
                foreach ($db['users'] as $user) {
                    if (($user['id'] ?? '') === ($appointment['customerId'] ?? '')) {
                        dashboard_send_appointment_confirmed_mail($user, $appointment);
                        break;
                    }
                }
            }
        }
        $db['customTasks'] = is_array($incomingState['customTasks'] ?? null) ? array_values($incomingState['customTasks']) : [];
        $db['settings'] = is_array($incomingState['settings'] ?? null) ? $incomingState['settings'] : ($db['settings'] ?? []);
        return $db;
    }

    $incomingUsers = [];
    foreach (($incomingState['users'] ?? []) as $user) {
        if (is_array($user) && ($user['id'] ?? '') === $sessionUser['id']) {
            $incomingUsers[$user['id']] = $user;
        }
    }
    foreach ($db['users'] as $index => $existingUser) {
        if ($existingUser['id'] !== $sessionUser['id']) {
            continue;
        }
        $incoming = $incomingUsers[$existingUser['id']] ?? [];
          $db['users'][$index]['firstName'] = (string)($incoming['firstName'] ?? ($existingUser['firstName'] ?? ''));
          $db['users'][$index]['lastName'] = (string)($incoming['lastName'] ?? ($existingUser['lastName'] ?? ''));
          $db['users'][$index]['name'] = (string)($incoming['name'] ?? $existingUser['name']);
          $db['users'][$index]['phone'] = (string)($incoming['phone'] ?? $existingUser['phone']);
          $db['users'][$index]['whatsapp'] = (string)($incoming['whatsapp'] ?? ($existingUser['whatsapp'] ?? ''));
          $db['users'][$index]['instagram'] = (string)($incoming['instagram'] ?? ($existingUser['instagram'] ?? ''));
          $db['users'][$index]['birthdate'] = (string)($incoming['birthdate'] ?? $existingUser['birthdate']);
          $db['users'][$index]['address'] = (string)($incoming['address'] ?? $existingUser['address']);
          $db['users'][$index]['avatar'] = (string)($incoming['avatar'] ?? $existingUser['avatar']);
          $db['users'][$index]['contactHint'] = (string)($incoming['contactHint'] ?? ($existingUser['contactHint'] ?? ''));
          $db['users'][$index]['registrationNote'] = (string)($incoming['registrationNote'] ?? ($existingUser['registrationNote'] ?? ''));
          $db['users'][$index]['registrationSource'] = (string)($incoming['registrationSource'] ?? ($existingUser['registrationSource'] ?? ''));
          $db['users'][$index]['deletedAt'] = (string)($incoming['deletedAt'] ?? ($existingUser['deletedAt'] ?? ''));
          $db['users'][$index]['deletedBy'] = (string)($incoming['deletedBy'] ?? ($existingUser['deletedBy'] ?? ''));
          $db['users'][$index]['approvalStatus'] = (string)($incoming['approvalStatus'] ?? ($existingUser['approvalStatus'] ?? 'approved'));
          $db['users'][$index]['approvedAt'] = (string)($incoming['approvedAt'] ?? ($existingUser['approvedAt'] ?? ''));
          $db['users'][$index]['approvedBy'] = (string)($incoming['approvedBy'] ?? ($existingUser['approvedBy'] ?? ''));
          $db['users'][$index]['lastEdited'] = (string)($incoming['lastEdited'] ?? dashboard_now_iso());
        $pendingPassword = trim((string)($incoming['pendingPassword'] ?? ''));
        if ($pendingPassword !== '') {
            $db['users'][$index]['passwordHash'] = password_hash($pendingPassword, PASSWORD_DEFAULT);
        }
    }

    $allowedAppointments = [];
    foreach (($incomingState['appointments'] ?? []) as $appointment) {
        if (!is_array($appointment) || (($appointment['customerId'] ?? '') !== $sessionUser['id'])) {
            continue;
        }
        $allowedAppointments[(string)$appointment['id']] = $appointment;
    }
    foreach ($db['appointments'] as $index => $existingAppointment) {
        if (($existingAppointment['customerId'] ?? '') !== $sessionUser['id']) {
            continue;
        }
        $incoming = $allowedAppointments[$existingAppointment['id']] ?? null;
        if (!$incoming) {
            continue;
        }
        $db['appointments'][$index] = array_merge($existingAppointment, $incoming);
    }
    foreach ($allowedAppointments as $appointmentId => $appointment) {
        $found = false;
        foreach ($db['appointments'] as $existingAppointment) {
            if (($existingAppointment['id'] ?? '') === $appointmentId) {
                $found = true;
                break;
            }
        }
        if (!$found) {
            $db['appointments'][] = $appointment;
        }
    }

    $db['customTasks'] = array_values(array_filter($db['customTasks'] ?? [], static function ($task) use ($sessionUser) {
        return !is_array($task) || (($task['createdById'] ?? '') !== $sessionUser['id'] && ($task['completedById'] ?? '') !== $sessionUser['id']);
    }));
    foreach (($incomingState['customTasks'] ?? []) as $task) {
        if (!is_array($task)) {
            continue;
        }
        if (($task['createdById'] ?? '') !== $sessionUser['id'] && ($task['completedById'] ?? '') !== $sessionUser['id']) {
            continue;
        }
        $db['customTasks'][] = $task;
    }
    return $db;
}

$db = dashboard_load_db();
$action = $_GET['action'] ?? ($_POST['action'] ?? '');
if ($action === '') {
    $body = dashboard_request_data();
    $action = $body['action'] ?? '';
}
$request = dashboard_request_data();

switch ($action) {
    case 'session':
        $user = dashboard_current_user($db);
        dashboard_json_response([
            'ok' => true,
            'authenticated' => (bool)$user,
            'currentUser' => $user ? dashboard_public_user($user) : null,
            'state' => $user ? dashboard_public_state($db) : null,
        ]);
        break;

    case 'login':
        $email = mb_strtolower(trim((string)($request['email'] ?? '')));
        $password = (string)($request['password'] ?? '');
        $index = dashboard_find_user_by_email($db, $email);
          if ($index < 0 || !password_verify($password, (string)($db['users'][$index]['passwordHash'] ?? ''))) {
              dashboard_json_response(['ok' => false, 'message' => 'Die E-Mail-Adresse oder das Passwort stimmen nicht.'], 401);
          }
          $approvalStatus = (string)($db['users'][$index]['approvalStatus'] ?? 'approved');
          if ($approvalStatus !== 'approved') {
              dashboard_json_response([
                  'ok' => false,
                  'message' => $approvalStatus === 'rejected'
                      ? 'Dieses Konto wurde noch nicht als Kundin freigegeben. Bitte melde dich direkt bei Lashes by Lia.'
                      : 'Deine Registrierung wurde empfangen und wartet noch auf die Bestätigung durch den Admin.',
              ], 403);
          }
          $db['users'][$index]['lastLogin'] = dashboard_now_iso();
        $db['users'][$index]['lastActive'] = dashboard_now_iso();
        $db['users'][$index]['online'] = true;
        $_SESSION['dashboard_user_id'] = $db['users'][$index]['id'];
        dashboard_save_db($db);
        dashboard_json_response([
            'ok' => true,
            'currentUser' => dashboard_public_user($db['users'][$index]),
            'state' => dashboard_public_state($db),
        ]);
        break;

    case 'logout':
        $user = dashboard_current_user($db);
        if ($user) {
            $index = dashboard_find_user_index($db, (string)$user['id']);
            if ($index >= 0) {
                $db['users'][$index]['online'] = false;
                $db['users'][$index]['lastActive'] = dashboard_now_iso();
                dashboard_save_db($db);
            }
        }
        $_SESSION = [];
        session_destroy();
        dashboard_json_response(['ok' => true]);
        break;

    case 'save-state':
        $user = dashboard_require_user($db);
        $incomingState = is_array($request['state'] ?? null) ? $request['state'] : [];
        $db = dashboard_merge_state($db, $incomingState, $user);
        dashboard_save_db($db);
        $freshUser = dashboard_current_user($db);
        dashboard_json_response([
            'ok' => true,
            'currentUser' => $freshUser ? dashboard_public_user($freshUser) : null,
            'state' => dashboard_public_state($db),
        ]);
        break;

    case 'request-password-reset':
        $email = mb_strtolower(trim((string)($request['email'] ?? '')));
        $index = $email !== '' ? dashboard_find_user_by_email($db, $email) : -1;
        if ($index >= 0) {
            dashboard_issue_reset_link($db, $index);
        }
        dashboard_json_response([
            'ok' => true,
            'message' => 'Wenn ein Konto mit dieser E-Mail existiert, wurde ein Reset-Link verschickt.',
          ]);
          break;

    case 'register':
          $firstName = trim((string)($request['firstName'] ?? ''));
          $lastName = trim((string)($request['lastName'] ?? ''));
          $name = trim((string)($request['name'] ?? trim($firstName . ' ' . $lastName)));
          $email = mb_strtolower(trim((string)($request['email'] ?? '')));
          $password = (string)($request['password'] ?? '');
          $phone = trim((string)($request['phone'] ?? ''));
          $birthdate = trim((string)($request['birthdate'] ?? ''));
          $contactHint = trim((string)($request['contactHint'] ?? ''));
          $note = trim((string)($request['note'] ?? ''));
          if ($firstName === '' || $lastName === '' || $email === '' || strlen($password) < 8) {
              dashboard_json_response(['ok' => false, 'message' => 'Bitte fülle Vorname, Nachname, E-Mail-Adresse und ein Passwort mit mindestens 8 Zeichen aus.'], 422);
          }
          if (dashboard_find_user_by_email($db, $email) >= 0) {
              dashboard_json_response(['ok' => false, 'message' => 'Für diese E-Mail-Adresse existiert bereits ein Konto.'], 409);
          }
          $db['users'][] = [
              'id' => 'cust-' . time() . '-' . bin2hex(random_bytes(3)),
              'role' => 'customer',
              'approvalStatus' => 'pending',
              'approvedAt' => '',
              'approvedBy' => '',
              'firstName' => $firstName,
              'lastName' => $lastName,
              'name' => $name,
              'email' => $email,
              'passwordHash' => password_hash($password, PASSWORD_DEFAULT),
              'phone' => $phone,
              'birthdate' => $birthdate,
              'address' => '',
              'avatar' => '',
              'contactHint' => $contactHint,
              'registrationNote' => $note,
              'registrationSource' => 'self-service',
              'deletedAt' => '',
              'deletedBy' => '',
              'documents' => new stdClass(),
              'createdAt' => dashboard_now_iso(),
              'lastEdited' => dashboard_now_iso(),
              'lastLogin' => '',
              'lastActive' => '',
              'online' => false,
              'resetTokenHash' => '',
              'resetExpiresAt' => '',
          ];
          $newUser = $db['users'][count($db['users']) - 1];
          dashboard_save_db($db);
          dashboard_send_registration_received_mail($newUser);
          dashboard_json_response([
              'ok' => true,
              'message' => 'Deine Registrierung wurde empfangen und wartet jetzt auf Freigabe durch den Admin.',
              'state' => dashboard_public_state($db),
          ]);
          break;

      case 'reset-password':
        $token = trim((string)($request['token'] ?? ''));
        $password = (string)($request['password'] ?? '');
        if ($token === '' || strlen($password) < 8) {
            dashboard_json_response(['ok' => false, 'message' => 'Ungültige Anfrage.'], 422);
        }
        $hash = hash('sha256', $token);
        foreach ($db['users'] as $index => $user) {
            if (($user['resetTokenHash'] ?? '') !== $hash) {
                continue;
            }
            $expiresAt = strtotime((string)($user['resetExpiresAt'] ?? ''));
            if (!$expiresAt || $expiresAt < time()) {
                dashboard_json_response(['ok' => false, 'message' => 'Der Reset-Link ist abgelaufen.'], 410);
            }
            $db['users'][$index]['passwordHash'] = password_hash($password, PASSWORD_DEFAULT);
            $db['users'][$index]['resetTokenHash'] = '';
            $db['users'][$index]['resetExpiresAt'] = '';
            $db['users'][$index]['lastEdited'] = dashboard_now_iso();
            dashboard_save_db($db);
            dashboard_json_response(['ok' => true, 'message' => 'Das Passwort wurde erfolgreich aktualisiert.']);
        }
        dashboard_json_response(['ok' => false, 'message' => 'Der Reset-Link ist ungültig.'], 404);
        break;

    default:
        dashboard_json_response(['ok' => false, 'message' => 'Unbekannte Aktion.'], 400);
}
