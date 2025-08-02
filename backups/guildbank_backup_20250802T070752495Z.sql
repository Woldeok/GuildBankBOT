-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: localhost    Database: guildbank
-- ------------------------------------------------------
-- Server version	8.0.42

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `admins`
--

DROP TABLE IF EXISTS `admins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admins` (
  `user_id` bigint NOT NULL,
  `is_superadmin` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`user_id`),
  CONSTRAINT `admins_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admins`
--

LOCK TABLES `admins` WRITE;
/*!40000 ALTER TABLE `admins` DISABLE KEYS */;
/*!40000 ALTER TABLE `admins` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attendance_logs`
--

DROP TABLE IF EXISTS `attendance_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` bigint DEFAULT NULL,
  `date` date DEFAULT NULL,
  `reward` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `attendance_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance_logs`
--

LOCK TABLES `attendance_logs` WRITE;
/*!40000 ALTER TABLE `attendance_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `attendance_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `guild_bank`
--

DROP TABLE IF EXISTS `guild_bank`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `guild_bank` (
  `id` int NOT NULL AUTO_INCREMENT,
  `balance` decimal(30,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `guild_bank`
--

LOCK TABLES `guild_bank` WRITE;
/*!40000 ALTER TABLE `guild_bank` DISABLE KEYS */;
INSERT INTO `guild_bank` VALUES (1,1437361718324430300.00);
/*!40000 ALTER TABLE `guild_bank` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `guild_invitations`
--

DROP TABLE IF EXISTS `guild_invitations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `guild_invitations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `guild_id` int NOT NULL,
  `inviter_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `invitee_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('pending','accepted','declined','expired') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `expires_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `guild_id` (`guild_id`),
  CONSTRAINT `guild_invitations_ibfk_1` FOREIGN KEY (`guild_id`) REFERENCES `guilds` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `guild_invitations`
--

LOCK TABLES `guild_invitations` WRITE;
/*!40000 ALTER TABLE `guild_invitations` DISABLE KEYS */;
/*!40000 ALTER TABLE `guild_invitations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `guild_members`
--

DROP TABLE IF EXISTS `guild_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `guild_members` (
  `guild_id` int NOT NULL,
  `user_id` bigint NOT NULL,
  `contribution` int DEFAULT '0',
  PRIMARY KEY (`guild_id`,`user_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `guild_members_ibfk_1` FOREIGN KEY (`guild_id`) REFERENCES `guilds` (`id`) ON DELETE CASCADE,
  CONSTRAINT `guild_members_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `guild_members`
--

LOCK TABLES `guild_members` WRITE;
/*!40000 ALTER TABLE `guild_members` DISABLE KEYS */;
INSERT INTO `guild_members` VALUES (1,886478189520637992,0);
/*!40000 ALTER TABLE `guild_members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `guild_missions`
--

DROP TABLE IF EXISTS `guild_missions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `guild_missions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `guild_id` int NOT NULL,
  `type` enum('수익률','거래량','도박승리') COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_value` decimal(30,2) NOT NULL,
  `current_value` decimal(30,2) DEFAULT '0.00',
  `completed` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `guild_id` (`guild_id`),
  CONSTRAINT `guild_missions_ibfk_1` FOREIGN KEY (`guild_id`) REFERENCES `guilds` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `guild_missions`
--

LOCK TABLES `guild_missions` WRITE;
/*!40000 ALTER TABLE `guild_missions` DISABLE KEYS */;
/*!40000 ALTER TABLE `guild_missions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `guild_rewards`
--

DROP TABLE IF EXISTS `guild_rewards`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `guild_rewards` (
  `id` int NOT NULL AUTO_INCREMENT,
  `guild_id` int NOT NULL,
  `season_id` int NOT NULL,
  `reward_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reward_value` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `claimed` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `guild_id` (`guild_id`),
  KEY `season_id` (`season_id`),
  CONSTRAINT `guild_rewards_ibfk_1` FOREIGN KEY (`guild_id`) REFERENCES `guilds` (`id`),
  CONSTRAINT `guild_rewards_ibfk_2` FOREIGN KEY (`season_id`) REFERENCES `guild_seasons` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `guild_rewards`
--

LOCK TABLES `guild_rewards` WRITE;
/*!40000 ALTER TABLE `guild_rewards` DISABLE KEYS */;
/*!40000 ALTER TABLE `guild_rewards` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `guild_seasons`
--

DROP TABLE IF EXISTS `guild_seasons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `guild_seasons` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_date` datetime NOT NULL,
  `end_date` datetime DEFAULT NULL,
  `ranking_criteria` enum('수익률','총거래량','참여도') COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `guild_seasons`
--

LOCK TABLES `guild_seasons` WRITE;
/*!40000 ALTER TABLE `guild_seasons` DISABLE KEYS */;
INSERT INTO `guild_seasons` VALUES (1,'테스트','2025-08-01 09:00:00','2025-09-01 09:00:00','수익률',1);
/*!40000 ALTER TABLE `guild_seasons` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `guild_stocks`
--

DROP TABLE IF EXISTS `guild_stocks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `guild_stocks` (
  `guild_id` int NOT NULL DEFAULT '1',
  `stock_id` int NOT NULL,
  `quantity` bigint NOT NULL,
  `average_purchase_price` decimal(30,2) NOT NULL,
  PRIMARY KEY (`guild_id`,`stock_id`),
  KEY `stock_id` (`stock_id`),
  CONSTRAINT `guild_stocks_ibfk_1` FOREIGN KEY (`stock_id`) REFERENCES `stocks` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `guild_stocks`
--

LOCK TABLES `guild_stocks` WRITE;
/*!40000 ALTER TABLE `guild_stocks` DISABLE KEYS */;
INSERT INTO `guild_stocks` VALUES (1,10,5989007159684,60000.00);
/*!40000 ALTER TABLE `guild_stocks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `guild_transactions`
--

DROP TABLE IF EXISTS `guild_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `guild_transactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `type` enum('deposit','withdrawal','loan','repayment','loan_collection','guild_buy','tax_collection','transfer_sent','transfer_received','transfer_fee') COLLATE utf8mb4_unicode_ci NOT NULL,
  `timestamp` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=154 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `guild_transactions`
--

LOCK TABLES `guild_transactions` WRITE;
/*!40000 ALTER TABLE `guild_transactions` DISABLE KEYS */;
INSERT INTO `guild_transactions` VALUES (1,'886478189520637992',1000044765.00,'deposit','2025-07-30 05:07:04'),(2,'886478189520637992',1000000.00,'loan','2025-07-30 05:15:14'),(3,'886478189520637992',1050000.00,'loan_collection','2025-07-30 05:16:46'),(4,'886478189520637992',1000000.00,'loan','2025-07-30 05:19:54'),(5,'886478189520637992',1050000.00,'loan_collection','2025-07-30 05:20:56'),(6,'886478189520637992',1000000.00,'loan','2025-07-31 13:19:35'),(7,'886478189520637992',1050000.00,'loan_collection','2025-07-31 13:22:25'),(8,'889085646768078800',100.00,'tax_collection','2025-08-01 13:25:45'),(9,'889085646768078800',100.00,'tax_collection','2025-08-01 13:25:57'),(10,'889085646768078800',100.00,'tax_collection','2025-08-01 13:27:34'),(11,'889085646768078800',100.00,'tax_collection','2025-08-01 13:28:20'),(12,'889085646768078800',100.00,'tax_collection','2025-08-01 13:28:53'),(13,'889085646768078800',100.00,'tax_collection','2025-08-01 13:29:24'),(14,'886478189520637992',43728985467.00,'withdrawal','2025-08-01 13:29:42'),(15,'886478189520638000',100.00,'tax_collection','2025-08-01 13:30:38'),(16,'889085646768078800',100.00,'tax_collection','2025-08-01 13:30:38'),(17,'886478189520638000',100.00,'tax_collection','2025-08-01 13:31:15'),(18,'889085646768078800',100.00,'tax_collection','2025-08-01 13:31:15'),(19,'886478189520638000',100.00,'tax_collection','2025-08-01 13:31:23'),(20,'889085646768078800',100.00,'tax_collection','2025-08-01 13:31:23'),(21,'886478189520638000',100.00,'tax_collection','2025-08-01 13:31:29'),(22,'889085646768078800',100.00,'tax_collection','2025-08-01 13:31:29'),(23,'886478189520638000',100.00,'tax_collection','2025-08-01 13:31:43'),(24,'889085646768078800',100.00,'tax_collection','2025-08-01 13:31:43'),(25,'886478189520638000',100.00,'tax_collection','2025-08-01 13:48:38'),(26,'889085646768078800',100.00,'tax_collection','2025-08-01 13:48:38'),(27,'886478189520638000',100.00,'tax_collection','2025-08-01 13:48:57'),(28,'889085646768078800',100.00,'tax_collection','2025-08-01 13:48:57'),(29,'886478189520638000',100.00,'tax_collection','2025-08-01 13:50:10'),(30,'889085646768078800',100.00,'tax_collection','2025-08-01 13:50:10'),(31,'886478189520638000',100.00,'tax_collection','2025-08-01 13:50:30'),(32,'889085646768078800',100.00,'tax_collection','2025-08-01 13:50:30'),(33,'886478189520638000',100.00,'tax_collection','2025-08-01 13:51:34'),(34,'889085646768078800',100.00,'tax_collection','2025-08-01 13:51:34'),(35,'886478189520638000',100.00,'tax_collection','2025-08-01 13:52:24'),(36,'889085646768078800',100.00,'tax_collection','2025-08-01 13:52:24'),(37,'886478189520638000',100.00,'tax_collection','2025-08-01 13:53:31'),(38,'889085646768078800',100.00,'tax_collection','2025-08-01 13:53:31'),(39,'886478189520638000',100.00,'tax_collection','2025-08-01 13:57:00'),(40,'889085646768078800',100.00,'tax_collection','2025-08-01 13:57:00'),(41,'886478189520638000',100.00,'tax_collection','2025-08-01 13:57:15'),(42,'889085646768078800',100.00,'tax_collection','2025-08-01 13:57:15'),(43,'886478189520638000',100.00,'tax_collection','2025-08-01 13:57:59'),(44,'889085646768078800',100.00,'tax_collection','2025-08-01 13:57:59'),(45,'886478189520638000',100.00,'tax_collection','2025-08-01 13:58:21'),(46,'889085646768078800',100.00,'tax_collection','2025-08-01 13:58:21'),(47,'886478189520638000',100.00,'tax_collection','2025-08-01 13:59:05'),(48,'889085646768078800',100.00,'tax_collection','2025-08-01 13:59:05'),(49,'886478189520638000',100.00,'tax_collection','2025-08-01 14:04:07'),(50,'889085646768078800',100.00,'tax_collection','2025-08-01 14:04:07'),(51,'886478189520638000',100.00,'tax_collection','2025-08-01 14:04:27'),(52,'889085646768078800',100.00,'tax_collection','2025-08-01 14:04:27'),(53,'886478189520638000',100.00,'tax_collection','2025-08-01 14:04:56'),(54,'889085646768078800',100.00,'tax_collection','2025-08-01 14:04:56'),(55,'886478189520638000',100.00,'tax_collection','2025-08-01 14:05:06'),(56,'889085646768078800',100.00,'tax_collection','2025-08-01 14:05:06'),(57,'886478189520638000',100.00,'tax_collection','2025-08-01 14:05:53'),(58,'889085646768078800',100.00,'tax_collection','2025-08-01 14:05:53'),(59,'886478189520638000',100.00,'tax_collection','2025-08-01 14:06:02'),(60,'889085646768078800',100.00,'tax_collection','2025-08-01 14:06:02'),(61,'886478189520638000',100.00,'tax_collection','2025-08-01 14:06:58'),(62,'889085646768078800',100.00,'tax_collection','2025-08-01 14:06:58'),(63,'886478189520638000',100.00,'tax_collection','2025-08-01 14:07:22'),(64,'889085646768078800',100.00,'tax_collection','2025-08-01 14:07:22'),(65,'886478189520638000',100.00,'tax_collection','2025-08-01 14:08:26'),(66,'889085646768078800',100.00,'tax_collection','2025-08-01 14:08:26'),(67,'886478189520638000',100.00,'tax_collection','2025-08-01 14:11:16'),(68,'889085646768078800',100.00,'tax_collection','2025-08-01 14:11:16'),(69,'886478189520638000',100.00,'tax_collection','2025-08-01 14:12:46'),(70,'889085646768078800',100.00,'tax_collection','2025-08-01 14:12:46'),(71,'886478189520638000',100.00,'tax_collection','2025-08-01 14:13:28'),(72,'889085646768078800',100.00,'tax_collection','2025-08-01 14:13:28'),(73,'886478189520638000',100.00,'tax_collection','2025-08-01 14:13:41'),(74,'889085646768078800',100.00,'tax_collection','2025-08-01 14:13:41'),(75,'886478189520638000',100.00,'tax_collection','2025-08-01 14:14:52'),(76,'889085646768078800',100.00,'tax_collection','2025-08-01 14:14:52'),(77,'886478189520638000',100.00,'tax_collection','2025-08-01 14:17:24'),(78,'889085646768078800',100.00,'tax_collection','2025-08-01 14:17:24'),(79,'886478189520638000',100.00,'tax_collection','2025-08-01 14:17:45'),(80,'889085646768078800',100.00,'tax_collection','2025-08-01 14:17:45'),(81,'886478189520637992',-1000000.00,'transfer_sent','2025-08-01 14:18:30'),(82,'886478189520637992',100000.00,'transfer_fee','2025-08-01 14:18:30'),(83,'889085646768078850',1000000.00,'transfer_received','2025-08-01 14:18:30'),(84,'886478189520638000',100.00,'tax_collection','2025-08-01 14:19:43'),(85,'889085646768078800',100.00,'tax_collection','2025-08-01 14:19:43'),(86,'886478189520637992',-1000000.00,'transfer_sent','2025-08-01 14:20:13'),(87,'886478189520637992',100000.00,'transfer_fee','2025-08-01 14:20:13'),(88,'889085646768078850',1000000.00,'transfer_received','2025-08-01 14:20:13'),(89,'889085646768078850',1000.00,'loan','2025-08-01 14:21:14'),(90,'886478189520638000',100.00,'tax_collection','2025-08-01 14:22:22'),(91,'889085646768078800',100.00,'tax_collection','2025-08-01 14:22:22'),(92,'889085646768078850',1050.00,'repayment','2025-08-01 14:23:14'),(93,'889085646768078850',10000000.00,'loan','2025-08-01 14:23:26'),(94,'886478189520638000',100.00,'tax_collection','2025-08-01 14:24:03'),(95,'889085646768078800',100.00,'tax_collection','2025-08-01 14:24:03'),(96,'886478189520638000',100.00,'tax_collection','2025-08-01 14:25:51'),(97,'889085646768078800',100.00,'tax_collection','2025-08-01 14:25:51'),(98,'886478189520638000',100.00,'tax_collection','2025-08-01 14:26:53'),(99,'889085646768078800',100.00,'tax_collection','2025-08-01 14:26:53'),(100,'886478189520638000',100.00,'tax_collection','2025-08-01 14:30:36'),(101,'889085646768078800',100.00,'tax_collection','2025-08-01 14:30:36'),(102,'886478189520638000',100.00,'tax_collection','2025-08-01 14:31:26'),(103,'889085646768078800',100.00,'tax_collection','2025-08-01 14:31:26'),(104,'886478189520638000',100.00,'tax_collection','2025-08-01 14:32:03'),(105,'889085646768078800',100.00,'tax_collection','2025-08-01 14:32:03'),(106,'886478189520638000',100.00,'tax_collection','2025-08-01 14:36:25'),(107,'889085646768078800',100.00,'tax_collection','2025-08-01 14:36:25'),(108,'886478189520638000',100.00,'tax_collection','2025-08-01 14:39:30'),(109,'889085646768078800',100.00,'tax_collection','2025-08-01 14:39:30'),(110,'886478189520638000',100.00,'tax_collection','2025-08-01 14:40:43'),(111,'889085646768078800',100.00,'tax_collection','2025-08-01 14:40:43'),(112,'886478189520638000',100.00,'tax_collection','2025-08-01 14:42:16'),(113,'889085646768078800',100.00,'tax_collection','2025-08-01 14:42:16'),(114,'886478189520638000',100.00,'tax_collection','2025-08-01 14:43:29'),(115,'889085646768078800',100.00,'tax_collection','2025-08-01 14:43:29'),(116,'886478189520638000',100.00,'tax_collection','2025-08-01 14:44:59'),(117,'889085646768078800',100.00,'tax_collection','2025-08-01 14:44:59'),(118,'886478189520638000',100.00,'tax_collection','2025-08-01 14:46:57'),(119,'889085646768078800',100.00,'tax_collection','2025-08-01 14:46:57'),(120,'886478189520638000',100.00,'tax_collection','2025-08-01 14:55:00'),(121,'889085646768078800',100.00,'tax_collection','2025-08-01 14:55:00'),(122,'886478189520638000',100.00,'tax_collection','2025-08-01 14:55:46'),(123,'889085646768078800',100.00,'tax_collection','2025-08-01 14:55:46'),(124,'886478189520638000',100.00,'tax_collection','2025-08-01 14:57:40'),(125,'889085646768078800',100.00,'tax_collection','2025-08-01 14:57:40'),(126,'886478189520638000',100.00,'tax_collection','2025-08-01 15:06:00'),(127,'889085646768078800',100.00,'tax_collection','2025-08-01 15:06:00'),(128,'886478189520638000',100.00,'tax_collection','2025-08-01 15:44:05'),(129,'889085646768078800',100.00,'tax_collection','2025-08-01 15:44:05'),(130,'886478189520638000',100.00,'tax_collection','2025-08-01 15:45:02'),(131,'889085646768078800',100.00,'tax_collection','2025-08-01 15:45:02'),(132,'886478189520638000',100.00,'tax_collection','2025-08-01 18:25:17'),(133,'889085646768078800',100.00,'tax_collection','2025-08-01 18:25:17'),(134,'886478189520638000',100.00,'tax_collection','2025-08-01 18:48:15'),(135,'889085646768078800',100.00,'tax_collection','2025-08-01 18:48:15'),(136,'886478189520638000',100.00,'tax_collection','2025-08-01 18:50:53'),(137,'889085646768078800',100.00,'tax_collection','2025-08-01 18:50:53'),(138,'886478189520638000',100.00,'tax_collection','2025-08-02 00:00:00'),(139,'889085646768078800',100.00,'tax_collection','2025-08-02 00:00:00'),(140,'886478189520638000',100.00,'tax_collection','2025-08-02 15:38:13'),(141,'889085646768078800',100.00,'tax_collection','2025-08-02 15:38:13'),(142,'886478189520638000',100.00,'tax_collection','2025-08-02 15:41:37'),(143,'889085646768078800',100.00,'tax_collection','2025-08-02 15:41:37'),(144,'886478189520638000',100.00,'tax_collection','2025-08-02 15:42:55'),(145,'889085646768078800',100.00,'tax_collection','2025-08-02 15:42:55'),(146,'886478189520637992',100.00,'tax_collection','2025-08-02 15:44:16'),(147,'889085646768078850',100.00,'tax_collection','2025-08-02 15:44:16'),(148,'886478189520637992',100.00,'tax_collection','2025-08-02 15:50:17'),(149,'889085646768078850',100.00,'tax_collection','2025-08-02 15:50:17'),(150,'886478189520637992',100.00,'tax_collection','2025-08-02 15:50:32'),(151,'889085646768078850',100.00,'tax_collection','2025-08-02 15:50:32'),(152,'886478189520637992',100.00,'tax_collection','2025-08-02 16:07:52'),(153,'889085646768078850',100.00,'tax_collection','2025-08-02 16:07:52');
/*!40000 ALTER TABLE `guild_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `guilds`
--

DROP TABLE IF EXISTS `guilds`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `guilds` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `owner_id` bigint DEFAULT NULL,
  `total_fund` int DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `owner_id` (`owner_id`),
  CONSTRAINT `guilds_ibfk_1` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `guilds`
--

LOCK TABLES `guilds` WRITE;
/*!40000 ALTER TABLE `guilds` DISABLE KEYS */;
INSERT INTO `guilds` VALUES (1,'월덕',NULL,0,'2025-08-01 15:35:14');
/*!40000 ALTER TABLE `guilds` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `loans`
--

DROP TABLE IF EXISTS `loans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `loans` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(30,2) NOT NULL,
  `interest_rate` decimal(5,4) NOT NULL DEFAULT '0.0500',
  `due_date` datetime NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('active','paid') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `loans`
--

LOCK TABLES `loans` WRITE;
/*!40000 ALTER TABLE `loans` DISABLE KEYS */;
INSERT INTO `loans` VALUES (1,'889085646768078850',1000.00,0.0500,'2025-08-08 14:21:15','2025-08-01 05:21:14','paid'),(2,'889085646768078850',10000000.00,0.0500,'2025-08-08 14:23:27','2025-08-01 05:23:26','active');
/*!40000 ALTER TABLE `loans` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stocks`
--

DROP TABLE IF EXISTS `stocks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stocks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `symbol` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price` int NOT NULL,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `symbol` (`symbol`),
  UNIQUE KEY `symbol_2` (`symbol`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stocks`
--

LOCK TABLES `stocks` WRITE;
/*!40000 ALTER TABLE `stocks` DISABLE KEYS */;
INSERT INTO `stocks` VALUES (1,'삼전','삼성전자',80000,'2025-08-02 16:07:50'),(2,'하이닉스','SK하이닉스',130000,'2025-08-02 16:07:50'),(3,'카카오','카카오',120000,'2025-08-02 16:07:50'),(4,'네이버','네이버',350000,'2025-08-02 16:07:50'),(5,'LG화학','LG화학',700000,'2025-08-02 16:07:50'),(6,'현대차','현대차',200000,'2025-08-02 16:07:50'),(7,'기아','기아',90000,'2025-08-02 16:07:50'),(8,'셀트리온','셀트리온',250000,'2025-08-02 16:07:50'),(9,'포스코','POSCO홀딩스',400000,'2025-08-02 16:07:50'),(10,'KB금융','KB금융',60000,'2025-08-02 16:07:50');
/*!40000 ALTER TABLE `stocks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transactions`
--

DROP TABLE IF EXISTS `transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` bigint DEFAULT NULL,
  `type` enum('deposit','withdraw','gamble','stock_buy','stock_sell','transfer') COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` int DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transactions`
--

LOCK TABLES `transactions` WRITE;
/*!40000 ALTER TABLE `transactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_stocks`
--

DROP TABLE IF EXISTS `user_stocks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_stocks` (
  `user_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `stock_id` int NOT NULL,
  `quantity` int NOT NULL,
  `average_purchase_price` decimal(10,2) NOT NULL,
  PRIMARY KEY (`user_id`,`stock_id`),
  KEY `stock_id` (`stock_id`),
  CONSTRAINT `user_stocks_ibfk_1` FOREIGN KEY (`stock_id`) REFERENCES `stocks` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_stocks`
--

LOCK TABLES `user_stocks` WRITE;
/*!40000 ALTER TABLE `user_stocks` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_stocks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint NOT NULL,
  `username` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `balance` decimal(30,2) NOT NULL DEFAULT '0.00',
  `join_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `last_attendance` date DEFAULT NULL,
  `last_reward_claimed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (886478189520637992,'weoldeog1',43725740793.00,'2025-07-29 11:00:38',NULL,'2025-08-01 18:23:05'),(889085646768078850,'atcode1',12099550.00,'2025-07-29 09:35:28',NULL,'2025-07-29 09:40:00');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-08-02 16:07:52
