<?php
declare(strict_types=1);
session_start();

header('Content-Type: application/json; charset=utf-8');

// Проверка авторизации и роли admin
if (!isset($_SESSION['staff_id']) || $_SESSION['staff_role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Доступ запрещён']);
    exit;
}

require __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
    if ($method === 'GET' && $action === 'list') {
        // Получить список всех сотрудников
        $stmt = $pdo->query('SELECT id, username, full_name, role FROM support_staff ORDER BY id');
        echo json_encode(['success' => true, 'staff' => $stmt->fetchAll()]);
        exit;
    }

    if ($method === 'POST') {
        $id = isset($_POST['id']) ? (int)$_POST['id'] : 0;
        $username = trim($_POST['username'] ?? '');
        $password = trim($_POST['password'] ?? '');
        $full_name = trim($_POST['full_name'] ?? '');
        $role = $_POST['role'] ?? 'operator';

        if ($username === '' || $password === '' || $full_name === '') {
            echo json_encode(['success' => false, 'message' => 'Заполните все поля']);
            exit;
        }

        if ($id > 0) {
            // Редактирование
            $stmt = $pdo->prepare('UPDATE support_staff SET username = :username, password = :password, full_name = :full_name, role = :role WHERE id = :id');
            $stmt->execute([':username' => $username, ':password' => $password, ':full_name' => $full_name, ':role' => $role, ':id' => $id]);
            echo json_encode(['success' => true, 'message' => 'Сотрудник обновлён']);
        } else {
            // Добавление
            // Проверка на уникальность логина
            $check = $pdo->prepare('SELECT id FROM support_staff WHERE username = :username');
            $check->execute([':username' => $username]);
            if ($check->fetch()) {
                echo json_encode(['success' => false, 'message' => 'Логин уже существует']);
                exit;
            }
            $stmt = $pdo->prepare('INSERT INTO support_staff (username, password, full_name, role) VALUES (:username, :password, :full_name, :role)');
            $stmt->execute([':username' => $username, ':password' => $password, ':full_name' => $full_name, ':role' => $role]);
            echo json_encode(['success' => true, 'message' => 'Сотрудник добавлен', 'id' => $pdo->lastInsertId()]);
        }
        exit;
    }

    if ($method === 'DELETE') {
        parse_str(file_get_contents('php://input'), $deleteData);
        $id = (int)($deleteData['id'] ?? 0);
        if ($id <= 0) {
            echo json_encode(['success' => false, 'message' => 'Некорректный ID']);
            exit;
        }
        // Запретить удаление самого себя
        if ($id === $_SESSION['staff_id']) {
            echo json_encode(['success' => false, 'message' => 'Нельзя удалить свою учётную запись']);
            exit;
        }
        $stmt = $pdo->prepare('DELETE FROM support_staff WHERE id = :id');
        $stmt->execute([':id' => $id]);
        echo json_encode(['success' => true, 'message' => 'Сотрудник удалён']);
        exit;
    }

    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Метод не разрешён']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Ошибка сервера: ' . $e->getMessage()]);
}