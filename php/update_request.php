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

$id = (int)($_POST['id'] ?? 0);
$status = (string)($_POST['status'] ?? '');
$allowedStatuses = ['новая', 'в работе', 'завершена', 'отклонена'];

if ($id <= 0 || !in_array($status, $allowedStatuses, true)) {
    http_response_code(422);
    echo json_encode([
        'success' => false,
        'message' => 'Некорректные данные заявки.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $statement = $pdo->prepare('UPDATE support_requests SET status = :status WHERE id = :id');
    $statement->execute([
        ':status' => $status,
        ':id' => $id,
    ]);

    if ($statement->rowCount() === 0) {
        echo json_encode([
            'success' => false,
            'message' => "Заявка с ID {$id} не найдена или статус не изменился.",
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    echo json_encode([
        'success' => true,
        'message' => 'Статус заявки обновлен.',
    ], JSON_UNESCAPED_UNICODE);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Ошибка базы данных: ' . $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
}