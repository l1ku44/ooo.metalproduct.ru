-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Хост: localhost
-- Время создания: Июн 16 2026 г., 00:57
-- Версия сервера: 10.4.28-MariaDB
-- Версия PHP: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- База данных: `metalloprodukciya_it`
--

-- --------------------------------------------------------

--
-- Структура таблицы `support_requests`
--

CREATE TABLE `support_requests` (
  `id` int(10) UNSIGNED NOT NULL,
  `employee_name` varchar(150) NOT NULL,
  `department` varchar(120) NOT NULL,
  `email` varchar(180) NOT NULL,
  `phone` varchar(60) NOT NULL,
  `topic` varchar(120) NOT NULL,
  `message` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('новая','в работе','завершена','отклонена') NOT NULL DEFAULT 'новая'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Дамп данных таблицы `support_requests`
--

INSERT INTO `support_requests` (`id`, `employee_name`, `department`, `email`, `phone`, `topic`, `message`, `created_at`, `status`) VALUES
(1, 'asd sad as d', 'adlsds', '12332@gmail.com', '123123', '1С:Предприятие', 'dasdasdasdsasddsaadsdsðœp----------------------das', '2026-06-13 17:58:19', 'отклонена'),
(2, 'Антон Брюхо Ухов', 'Бухгалтерия', 'asjdas@gmail.com', '+70021742192', 'Доступы и учетные записи', 'Забыл пароль к учетной записи', '2026-06-15 22:23:12', 'завершена'),
(3, 'Банан Яблочкин Грушев', 'Курьер', 'banan@gmail.com', '+8219219122', '1С:Предприятие', 'Не отображаются товары на складе', '2026-06-15 22:29:51', 'в работе');

-- --------------------------------------------------------

--
-- Структура таблицы `support_staff`
--

CREATE TABLE `support_staff` (
  `id` int(10) UNSIGNED NOT NULL,
  `username` varchar(50) NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `role` enum('admin','operator') NOT NULL DEFAULT 'operator',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `password` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Дамп данных таблицы `support_staff`
--

INSERT INTO `support_staff` (`id`, `username`, `full_name`, `role`, `created_at`, `password`) VALUES
(1, 'admin', 'Администратор', 'admin', '2026-06-15 21:47:23', '1234'),
(2, 'pavel', 'Медведев Павел Михайлович', 'operator', '2026-06-15 22:11:50', '1234');

--
-- Индексы сохранённых таблиц
--

--
-- Индексы таблицы `support_requests`
--
ALTER TABLE `support_requests`
  ADD PRIMARY KEY (`id`);

--
-- Индексы таблицы `support_staff`
--
ALTER TABLE `support_staff`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT для сохранённых таблиц
--

--
-- AUTO_INCREMENT для таблицы `support_requests`
--
ALTER TABLE `support_requests`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT для таблицы `support_staff`
--
ALTER TABLE `support_staff`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
