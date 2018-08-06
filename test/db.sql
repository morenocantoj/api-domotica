-- phpMyAdmin SQL Dump
-- version 4.8.0
-- https://www.phpmyadmin.net/
--
-- Servidor: localhost
-- Tiempo de generación: 06-08-2018 a las 17:43:43
-- Versión del servidor: 10.1.31-MariaDB
-- Versión de PHP: 7.1.16

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `test`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `casas`
--

CREATE TABLE `casas` (
  `id` int(11) NOT NULL,
  `nombre` varchar(60) COLLATE utf8_bin NOT NULL,
  `direccion` varchar(150) COLLATE utf8_bin NOT NULL,
  `poblacion` varchar(50) COLLATE utf8_bin NOT NULL,
  `codigo_postal` varchar(20) COLLATE utf8_bin NOT NULL,
  `user_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

--
-- Volcado de datos para la tabla `casas`
--

INSERT INTO `casas` (`id`, `nombre`, `direccion`, `poblacion`, `codigo_postal`, `user_id`) VALUES
(1, 'Adosado en la playa', 'Calle Magallanes 7A', 'Marbella', '29601', 1),
(2, 'Piso de estudiantes', 'Calle Francia 1 timbre 19', 'San Vicente del Raspeig', '03690', 1),
(3, 'Casa con piscina', 'Calle Cirineo 31', 'Sella', '03579', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `controladores`
--

CREATE TABLE `controladores` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) COLLATE utf8_bin NOT NULL,
  `tipo` varchar(50) COLLATE utf8_bin NOT NULL,
  `casa_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

--
-- Volcado de datos para la tabla `controladores`
--

INSERT INTO `controladores` (`id`, `nombre`, `tipo`, `casa_id`) VALUES
(1, 'Salón principal', 'room', 1),
(2, 'Pasillo habitaciones planta superior', 'gangway', 1),
(3, 'Habitación de matrimonio', 'room', 1),
(6, 'Habitación pequeña', 'room', 1),
(7, 'Cocina', 'room', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `dispositivos`
--

CREATE TABLE `dispositivos` (
  `id` int(11) NOT NULL,
  `port` varchar(20) COLLATE utf8_bin DEFAULT NULL,
  `tipo` varchar(50) COLLATE utf8_bin NOT NULL,
  `temperatura` varchar(10) COLLATE utf8_bin NOT NULL,
  `status` tinyint(1) DEFAULT '0',
  `nombre` varchar(70) COLLATE utf8_bin NOT NULL,
  `controller_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

--
-- Volcado de datos para la tabla `dispositivos`
--

INSERT INTO `dispositivos` (`id`, `port`, `tipo`, `temperatura`, `status`, `nombre`, `controller_id`) VALUES
(1, NULL, 'clima', '23', 0, 'Mitsubishi INVERTER', 1),
(5, NULL, 'clima', '23', 0, 'Fujitsu Silent', 1),
(6, NULL, '', '21', 0, 'Fujitsu Silent', 1),
(7, NULL, '', '21', 0, 'Fujitsu Silent', 1),
(8, NULL, '', '21', 0, 'Fujitsu Silent', 1),
(9, '13', 'light', '0', 0, 'Bombilla man', 1),
(10, '15', 'clima', '21', 0, 'Aire man', 1),
(11, '22', 'light', '0', 0, 'Luz', 1),
(13, '21', 'light', '0', 0, 'Luz verde derecha', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `programaciones`
--

CREATE TABLE `programaciones` (
  `id` int(11) NOT NULL,
  `fecha` datetime NOT NULL,
  `action` varchar(100) COLLATE utf8_bin NOT NULL,
  `controller_id` int(11) DEFAULT NULL,
  `dispositivo_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `login` varchar(50) COLLATE utf8_bin NOT NULL,
  `password` text COLLATE utf8_bin NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `login`, `password`) VALUES
(1, 'morenocantoj', '$2y$12$JqI9xd3fap51hUfYvzJRIu7pSDkI.nOyG1DVdTjEHDVKLN26q49y.'),
(2, 'thelocoxs', '$2a$08$tNYYZB1D4k7.g8lbKwDCXOVWCfLA.P0EVjIL40QoYUNFaGcpByPpW'),
(3, 'elfary', '$2a$08$iwbgRBnFR02nyibTp3TLtuNeYLB28JmFFUuJuQeJ7cQQKej1LdVyq');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `casas`
--
ALTER TABLE `casas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indices de la tabla `controladores`
--
ALTER TABLE `controladores`
  ADD PRIMARY KEY (`id`),
  ADD KEY `casa_id` (`casa_id`);

--
-- Indices de la tabla `dispositivos`
--
ALTER TABLE `dispositivos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `controller_id` (`controller_id`);

--
-- Indices de la tabla `programaciones`
--
ALTER TABLE `programaciones`
  ADD PRIMARY KEY (`id`),
  ADD KEY `controller_id` (`controller_id`),
  ADD KEY `dispositivo_id` (`dispositivo_id`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `casas`
--
ALTER TABLE `casas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `controladores`
--
ALTER TABLE `controladores`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `dispositivos`
--
ALTER TABLE `dispositivos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT de la tabla `programaciones`
--
ALTER TABLE `programaciones`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=70;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `casas`
--
ALTER TABLE `casas`
  ADD CONSTRAINT `casas_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `controladores`
--
ALTER TABLE `controladores`
  ADD CONSTRAINT `controladores_ibfk_1` FOREIGN KEY (`casa_id`) REFERENCES `casas` (`id`);

--
-- Filtros para la tabla `dispositivos`
--
ALTER TABLE `dispositivos`
  ADD CONSTRAINT `dispositivos_ibfk_1` FOREIGN KEY (`controller_id`) REFERENCES `controladores` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `programaciones`
--
ALTER TABLE `programaciones`
  ADD CONSTRAINT `programaciones_ibfk_1` FOREIGN KEY (`controller_id`) REFERENCES `controladores` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `programaciones_ibfk_2` FOREIGN KEY (`dispositivo_id`) REFERENCES `dispositivos` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
