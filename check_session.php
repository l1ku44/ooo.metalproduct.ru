<?php
declare(strict_types=1);
session_start();

header('Content-Type: application/json; charset=utf-8');

if (isset($_SESSION['staff_id'])) {
    echo json_encode(['authenticated' => true]);
} else {
    http_response_code(401);
    echo json_encode(['authenticated' => false]);
}