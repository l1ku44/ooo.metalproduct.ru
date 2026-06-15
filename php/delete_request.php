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

session_start();
if (!isset($_SESSION['staff_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Не авторизован']);
    exit;
}

require __DIR__ . '/db.php';

$id = (int)($_POST['id'] ?? 0);

if ($id <= 0) {
    http_response_code(422);
    echo json_encode([
        'success' => false,
        'message' => 'Некорректный номер заявки.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$statement = $pdo->prepare('DELETE FROM support_requests WHERE id = :id');
$statement->execute([':id' => $id]);

echo json_encode([
    'success' => true,
    'message' => 'Заявка удалена.',
], JSON_UNESCAPED_UNICODE);
