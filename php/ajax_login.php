<?php
declare(strict_types=1);

error_reporting(E_ALL);
ini_set('display_errors', 1);

session_start();
header('Content-Type: application/json; charset=utf-8');

ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php_errors.log');

function debugResponse($message, $extra = []) {
    echo json_encode(array_merge([
        'success' => false,
        'debug_message' => $message,
        'debug_post' => $_POST,
        'debug_session' => isset($_SESSION) ? 'session started' : 'no session',
    ], $extra), JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    debugResponse('Метод не POST', ['method' => $_SERVER['REQUEST_METHOD']]);
}

require __DIR__ . '/db.php';

$login = trim($_POST['login'] ?? '');
$password = $_POST['password'] ?? '';

if ($login === '' || $password === '') {
    debugResponse('Логин или пароль пустые');
}

try {
    $stmt = $pdo->prepare('SELECT id, username, password, full_name, role FROM support_staff WHERE username = :username');
    $stmt->execute([':username' => $login]);
    $user = $stmt->fetch();

    if (!$user) {
        debugResponse('Пользователь не найден в таблице support_staff', ['login' => $login]);
    }

    if ($user['password'] !== $password) {
        debugResponse('Пароль не совпадает', [
            'input_password' => $password,
            'stored_password' => $user['password']
        ]);
    }

    $_SESSION['staff_id'] = $user['id'];
    $_SESSION['staff_username'] = $user['username'];
    $_SESSION['staff_full_name'] = $user['full_name'];
    $_SESSION['staff_role'] = $user['role'];

    echo json_encode(['success' => true, 'message' => 'Вход выполнен']);
} catch (Exception $e) {
    debugResponse('Ошибка БД: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
}