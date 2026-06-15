<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

session_start();
if (!isset($_SESSION['staff_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Не авторизован']);
    exit;
}

require __DIR__ . '/db.php';

try {
    // Простой запрос без дополнительных проверок
    $stmt = $pdo->query('SELECT * FROM support_requests ORDER BY id DESC');
    $requests = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'requests' => $requests
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Ошибка сервера: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}