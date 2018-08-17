-- phpMyAdmin SQL Dump
-- version 4.8.0
-- https://www.phpmyadmin.net/
--
-- Servidor: localhost
-- Tiempo de generación: 17-08-2018 a las 18:43:47
-- Versión del servidor: 10.1.31-MariaDB
-- Versión de PHP: 7.1.16

SET FOREIGN_KEY_CHECKS=0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `domotik`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `casas`
--

DROP TABLE IF EXISTS `casas`;
CREATE TABLE IF NOT EXISTS `casas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(60) COLLATE utf8_bin NOT NULL,
  `direccion` varchar(150) COLLATE utf8_bin NOT NULL,
  `poblacion` varchar(50) COLLATE utf8_bin NOT NULL,
  `codigo_postal` varchar(20) COLLATE utf8_bin NOT NULL,
  `user_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

--
-- Truncar tablas antes de insertar `casas`
--

TRUNCATE TABLE `casas`;
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

DROP TABLE IF EXISTS `controladores`;
CREATE TABLE IF NOT EXISTS `controladores` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8_bin NOT NULL,
  `tipo` varchar(50) COLLATE utf8_bin NOT NULL,
  `casa_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `casa_id` (`casa_id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

--
-- Truncar tablas antes de insertar `controladores`
--

TRUNCATE TABLE `controladores`;
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

DROP TABLE IF EXISTS `dispositivos`;
CREATE TABLE IF NOT EXISTS `dispositivos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `port` varchar(20) COLLATE utf8_bin DEFAULT NULL,
  `tipo` varchar(50) COLLATE utf8_bin NOT NULL,
  `temperatura` varchar(10) COLLATE utf8_bin NOT NULL,
  `status` tinyint(1) DEFAULT '0',
  `nombre` varchar(70) COLLATE utf8_bin NOT NULL,
  `controller_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `controller_id` (`controller_id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

--
-- Truncar tablas antes de insertar `dispositivos`
--

TRUNCATE TABLE `dispositivos`;
--
-- Volcado de datos para la tabla `dispositivos`
--

INSERT INTO `dispositivos` (`id`, `port`, `tipo`, `temperatura`, `status`, `nombre`, `controller_id`) VALUES
(2, NULL, 'light', '0', 0, 'Luz 220W derecha', 1),
(5, NULL, 'clima', '23', 0, 'Fujitsu Silent', 1),
(6, NULL, '', '21', 0, 'Fujitsu Silent', 1),
(7, NULL, '', '21', 0, 'Fujitsu Silent', 1),
(8, NULL, '', '21', 0, 'Fujitsu Silent', 1),
(9, NULL, 'light', '0', 1, 'Bombilla man', 1),
(10, '15', 'clima', '21', 0, 'Aire man', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `eventos`
--

DROP TABLE IF EXISTS `eventos`;
CREATE TABLE IF NOT EXISTS `eventos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `log` varchar(250) DEFAULT NULL,
  `fecha` datetime DEFAULT NULL,
  `controller_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `controller_id` (`controller_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Truncar tablas antes de insertar `eventos`
--

TRUNCATE TABLE `eventos`;
-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `programaciones`
--

DROP TABLE IF EXISTS `programaciones`;
CREATE TABLE IF NOT EXISTS `programaciones` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `fecha` datetime NOT NULL,
  `action` varchar(100) COLLATE utf8_bin NOT NULL,
  `controller_id` int(11) DEFAULT NULL,
  `dispositivo_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `controller_id` (`controller_id`),
  KEY `dispositivo_id` (`dispositivo_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

--
-- Truncar tablas antes de insertar `programaciones`
--

TRUNCATE TABLE `programaciones`;
--
-- Volcado de datos para la tabla `programaciones`
--

INSERT INTO `programaciones` (`id`, `fecha`, `action`, `controller_id`, `dispositivo_id`) VALUES
(1, '2999-04-16 14:15:00', 'PUT temperatura 25', 1, 5);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `login` varchar(50) COLLATE utf8_bin NOT NULL,
  `password` text COLLATE utf8_bin NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

--
-- Truncar tablas antes de insertar `usuarios`
--

TRUNCATE TABLE `usuarios`;
--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `login`, `password`) VALUES
(1, 'morenocantoj', '$2a$08$nBvHah3PNghJ704qwPsAMOSYw6irNYF895Tcg5/VpuqVpB9TyUsd.'),
(2, 'elfary', '$2a$08$0OCa8W78MgXJbH9NG2RjYOOlOJqqodkfVQmXiyUzzax4WHn/VFj7W');

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
-- Filtros para la tabla `eventos`
--
ALTER TABLE `eventos`
  ADD CONSTRAINT `eventos_ibfk_1` FOREIGN KEY (`controller_id`) REFERENCES `controladores` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `programaciones`
--
ALTER TABLE `programaciones`
  ADD CONSTRAINT `programaciones_ibfk_1` FOREIGN KEY (`controller_id`) REFERENCES `controladores` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `programaciones_ibfk_2` FOREIGN KEY (`dispositivo_id`) REFERENCES `dispositivos` (`id`) ON DELETE CASCADE;
SET FOREIGN_KEY_CHECKS=1;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
