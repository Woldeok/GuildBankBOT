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
-- Table structure for table `bank_profit_records`
--

DROP TABLE IF EXISTS `bank_profit_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bank_profit_records` (
  `id` int NOT NULL AUTO_INCREMENT,
  `recorded_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `guild_bank_balance_snapshot` decimal(30,2) NOT NULL,
  `net_profit_since_last_record` decimal(30,2) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bank_profit_records`
--

LOCK TABLES `bank_profit_records` WRITE;
/*!40000 ALTER TABLE `bank_profit_records` DISABLE KEYS */;
INSERT INTO `bank_profit_records` VALUES (1,'2025-08-02 16:12:06',296607546277477400000.00,NULL),(2,'2025-08-02 16:14:11',151863063694068680000.00,-144744482583408720000.00),(3,'2025-08-02 16:33:50',514968129303885050000000.00,514816266240190981320000.00),(4,'2025-08-03 11:20:12',105612563189173960000000.00,-409355566114711090000000.00);
/*!40000 ALTER TABLE `bank_profit_records` ENABLE KEYS */;
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
INSERT INTO `guild_bank` VALUES (1,248367784404642100000000000.00);
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
  `quantity` decimal(65,0) NOT NULL,
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
INSERT INTO `guild_stocks` VALUES (1,1,1015107501602724200000,100000.00),(1,7,1750583807718716140300,89905.04),(1,10,252432676172695510200,98828.34);
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
  `amount_high` decimal(35,0) NOT NULL,
  `amount_low` decimal(30,2) NOT NULL,
  `type` enum('deposit','withdrawal','loan','repayment','loan_collection','guild_buy','tax_collection','transfer_sent','transfer_received','transfer_fee','stock_trading_profit','stock_trading_loss') COLLATE utf8mb4_unicode_ci NOT NULL,
  `timestamp` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `guild_transactions`
--

LOCK TABLES `guild_transactions` WRITE;
/*!40000 ALTER TABLE `guild_transactions` DISABLE KEYS */;
INSERT INTO `guild_transactions` VALUES (1,'886478189520637992',0,4767529534.00,'tax_collection','2025-08-03 16:46:31'),(2,'889085646768078850',0,401241.00,'tax_collection','2025-08-03 16:46:31'),(3,'886478189520637992',0,4529153057.00,'tax_collection','2025-08-03 16:46:51'),(4,'889085646768078850',0,381179.00,'tax_collection','2025-08-03 16:46:51'),(5,'886478189520637992',0,4302695405.00,'tax_collection','2025-08-03 16:47:03'),(6,'889085646768078850',0,362120.00,'tax_collection','2025-08-03 16:47:03'),(7,'886478189520637992',0,4087560634.00,'tax_collection','2025-08-03 16:47:23'),(8,'889085646768078850',0,344014.00,'tax_collection','2025-08-03 16:47:23'),(9,'886478189520637992',0,3883182603.00,'tax_collection','2025-08-03 16:49:07'),(10,'889085646768078850',0,326814.00,'tax_collection','2025-08-03 16:49:07'),(11,'886478189520637992',0,3689023473.00,'tax_collection','2025-08-03 16:50:04'),(12,'889085646768078850',0,310473.00,'tax_collection','2025-08-03 16:50:04'),(13,'886478189520637992',0,3504572299.00,'tax_collection','2025-08-03 16:50:21'),(14,'889085646768078850',0,294949.00,'tax_collection','2025-08-03 16:50:21'),(15,'886478189520637992',0,3329343684.00,'tax_collection','2025-08-03 16:57:36'),(16,'889085646768078850',0,280202.00,'tax_collection','2025-08-03 16:57:36'),(17,'886478189520637992',0,3162876500.00,'tax_collection','2025-08-03 17:00:23'),(18,'889085646768078850',0,266192.00,'tax_collection','2025-08-03 17:00:23');
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `loans`
--

LOCK TABLES `loans` WRITE;
/*!40000 ALTER TABLE `loans` DISABLE KEYS */;
INSERT INTO `loans` VALUES (1,'889085646768078850',1000.00,0.0500,'2025-08-08 14:21:15','2025-08-01 05:21:14','paid'),(2,'889085646768078850',10000000.00,0.0500,'2025-08-08 14:23:27','2025-08-01 05:23:26','active'),(3,'886478189520637992',100000000000.00,0.0500,'2025-08-10 11:20:02','2025-08-03 02:20:01','active');
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
INSERT INTO `stocks` VALUES (1,'삼전','삼성전자',101507,'2025-08-03 16:57:21'),(2,'하이닉스','SK하이닉스',107868,'2025-08-03 16:57:21'),(3,'카카오','카카오',95690,'2025-08-03 16:57:21'),(4,'네이버','네이버',111711,'2025-08-03 16:57:21'),(5,'LG화학','LG화학',106284,'2025-08-03 16:57:21'),(6,'현대차','현대차',92878,'2025-08-03 16:57:21'),(7,'기아','기아',88928,'2025-08-03 16:57:21'),(8,'셀트리온','셀트리온',108670,'2025-08-03 16:57:21'),(9,'포스코','POSCO홀딩스',103901,'2025-08-03 16:57:21'),(10,'KB금융','KB금융',101954,'2025-08-03 16:57:21');
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
INSERT INTO `users` VALUES (886478189520637992,'weoldeog1',60094653504.00,'2025-07-29 11:00:38',NULL,'2025-08-01 18:23:05'),(889085646768078850,'atcode1',5057653.00,'2025-07-29 09:35:28',NULL,'2025-07-29 09:40:00');
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

-- Dump completed on 2025-08-03 17:00:23
