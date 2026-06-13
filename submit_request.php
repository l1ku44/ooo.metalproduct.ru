<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Метод запроса не поддерживается.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

require __DIR__ . '/db.php';

$name = trim((string)($_POST['name'] ?? ''));
$department = trim((string)($_POST['department'] ?? ''));
$email = trim((string)($_POST['email'] ?? ''));
$phone = trim((string)($_POST['phone'] ?? ''));
$topic = trim((string)($_POST['topic'] ?? ''));
$message = trim((string)($_POST['message'] ?? ''));

$errors = [];

if (mb_strlen($name) < 3) {
    $errors[] = 'Укажите ФИО.';
}

if (mb_strlen($department) < 2) {
    $errors[] = 'Укажите подразделение.';
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Укажите корректный email.';
}

if ($phone === '') {
    $errors[] = 'Укажите телефон.';
}

if ($topic === '') {
    $errors[] = 'Выберите тему обращения.';
}

if (mb_strlen($message) < 20) {
    $errors[] = 'Описание проблемы должно содержать не менее 20 символов.';
}

if ($errors !== []) {
    http_response_code(422);
    echo json_encode([
        'success' => false,
        'message' => implode(' ', $errors),
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$statement = $pdo->prepare(
    'INSERT INTO support_requests (employee_name, department, email, phone, topic, message)
     VALUES (:employee_name, :department, :email, :phone, :topic, :message)'
);

$statement->execute([
    ':employee_name' => $name,
    ':department' => $department,
    ':email' => $email,
    ':phone' => $phone,
    ':topic' => $topic,
    ':message' => $message,
]);

echo json_encode([
    'success' => true,
    'message' => 'Заявка сохранена в базе данных.',
    'request_id' => (int)$pdo->lastInsertId(),
], JSON_UNESCAPED_UNICODE);
