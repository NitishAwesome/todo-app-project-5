-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: todo_app
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `todo_app`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `todo_app` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */;

USE `todo_app`;

--
-- Table structure for table `assignment_discussions`
--

DROP TABLE IF EXISTS `assignment_discussions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `assignment_discussions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `assignment_id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `sender_role` enum('Admin','User') NOT NULL,
  `message_type` enum('comment','inquiry','progress_update','blocker_report','reminder','system') NOT NULL DEFAULT 'comment',
  `message` text NOT NULL,
  `progress_percent` int(11) DEFAULT NULL,
  `status_update` enum('Pending','InProgress','Completed') DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_ad_sender` (`sender_id`),
  KEY `idx_ad_assignment_created` (`assignment_id`,`created_at`),
  CONSTRAINT `fk_ad_assignment` FOREIGN KEY (`assignment_id`) REFERENCES `task_assignments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ad_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=59 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `assignment_discussions`
--

LOCK TABLES `assignment_discussions` WRITE;
/*!40000 ALTER TABLE `assignment_discussions` DISABLE KEYS */;
INSERT INTO `assignment_discussions` VALUES (11,5,8,'Admin','system','Task assigned to 407 B-1 NITISH GUPTA by 407 B-1 NITISH GUPTA.',NULL,NULL,1,'2026-11-21 19:50:51'),(12,5,8,'Admin','progress_update','Updated status to Completed (100% completed).',100,'Completed',0,'2026-11-21 19:52:04'),(13,5,8,'Admin','inquiry','eryherger',NULL,NULL,0,'2026-11-21 19:52:12'),(14,6,8,'Admin','system','Task assigned to Rehan Malim by 407 B-1 NITISH GUPTA.',NULL,NULL,1,'2026-11-21 19:59:24'),(15,6,8,'Admin','reminder','Reminder: Please update your progress on \"Throw some lines\". The deadline is approaching.',NULL,NULL,0,'2026-11-21 19:59:31'),(16,6,8,'Admin','reminder','Reminder: Please update your progress on \"Throw some lines\". The deadline is approaching.',NULL,NULL,0,'2026-11-21 19:59:55'),(24,9,8,'Admin','system','Task assigned to Rehan Malim by 407 B-1 NITISH GUPTA.',NULL,NULL,1,'2026-11-21 20:17:04'),(25,9,8,'Admin','comment','ethstrhyertgertg',NULL,NULL,1,'2026-11-21 20:17:26'),(26,9,42,'User','progress_update','Updated status to Completed (100% completed).',100,'Completed',0,'2026-11-21 20:18:29'),(27,10,1,'Admin','system','Task assigned to User X by Admin One.',NULL,NULL,1,'2026-11-21 21:20:21'),(28,11,1,'Admin','system','Task assigned to User Y by Admin One.',NULL,NULL,1,'2026-11-21 21:20:21'),(29,10,45,'User','progress_update','Drafted initial KPI outline.',40,'InProgress',1,'2026-11-21 21:20:21'),(30,10,45,'User','progress_update','Finished report and submitted slides.',100,'Completed',1,'2026-11-21 21:20:22'),(31,11,46,'User','inquiry','Should I include international market data?',NULL,NULL,1,'2026-11-21 21:20:22'),(32,11,1,'Admin','comment','Yes, include European and APAC regions please.',NULL,NULL,1,'2026-11-21 21:20:22'),(33,11,1,'Admin','reminder','Please finalize your strategic review input by EOD.',NULL,NULL,0,'2026-11-21 21:20:22'),(34,12,1,'Admin','system','Task assigned to User X by Admin One.',NULL,NULL,1,'2026-11-21 22:15:36'),(35,13,1,'Admin','system','Task assigned to User Y by Admin One.',NULL,NULL,1,'2026-11-21 22:15:36'),(36,12,47,'User','progress_update','Drafted initial KPI outline.',40,'InProgress',0,'2026-11-21 22:15:36'),(37,12,47,'User','progress_update','Finished report and submitted slides.',100,'Completed',0,'2026-11-21 22:15:36'),(38,13,48,'User','inquiry','Should I include international market data?',NULL,NULL,1,'2026-11-21 22:15:37'),(39,13,1,'Admin','comment','Yes, include European and APAC regions please.',NULL,NULL,1,'2026-11-21 22:15:37'),(40,13,1,'Admin','reminder','Please finalize your strategic review input by EOD.',NULL,NULL,0,'2026-11-21 22:15:37'),(41,14,8,'Admin','system','Task assigned to Saraswati by 407 B-1 NITISH GUPTA.',NULL,NULL,1,'2026-11-22 08:10:47'),(42,14,8,'Admin','reminder','Reminder: Please update your progress on \"rger\". The deadline is approaching.',NULL,NULL,0,'2026-11-22 08:11:03'),(43,14,50,'User','progress_update','24efd',100,'Completed',0,'2026-11-22 08:11:47'),(44,15,8,'Admin','system','Task assigned to Rehan Malim by 407 B-1 NITISH GUPTA.',NULL,NULL,1,'2026-11-22 09:10:31'),(45,16,8,'Admin','system','Task assigned to Saraswati by 407 B-1 NITISH GUPTA.',NULL,NULL,1,'2026-11-22 09:10:31'),(46,17,8,'Admin','system','Task assigned to Nitish by 407 B-1 NITISH GUPTA.',NULL,NULL,1,'2026-11-22 09:10:31'),(47,15,8,'Admin','reminder','Reminder: Please update your progress on \"completebackend\". The deadline is approaching.',NULL,NULL,0,'2026-11-22 09:10:51'),(48,16,8,'Admin','reminder','Reminder: Please update your progress on \"completebackend\". The deadline is approaching.',NULL,NULL,0,'2026-11-22 09:10:51'),(49,17,8,'Admin','reminder','Reminder: Please update your progress on \"completebackend\". The deadline is approaching.',NULL,NULL,0,'2026-11-22 09:10:51'),(50,18,1,'Admin','system','Task assigned to User X by Admin One.',NULL,NULL,1,'2026-11-22 10:17:24'),(51,19,1,'Admin','system','Task assigned to User Y by Admin One.',NULL,NULL,1,'2026-11-22 10:17:24'),(52,18,52,'User','progress_update','Drafted initial KPI outline.',40,'InProgress',0,'2026-11-22 10:17:25'),(53,18,52,'User','progress_update','Finished report and submitted slides.',100,'Completed',0,'2026-11-22 10:17:25'),(54,19,53,'User','inquiry','Should I include international market data?',NULL,NULL,1,'2026-11-22 10:17:25'),(55,19,1,'Admin','comment','Yes, include European and APAC regions please.',NULL,NULL,1,'2026-11-22 10:17:25'),(56,19,1,'Admin','reminder','Please finalize your strategic review input by EOD.',NULL,NULL,0,'2026-11-22 10:17:25'),(57,20,1,'Admin','comment','Welcome Sarthak Kene! Please update your progress slider as you complete milestones.',NULL,NULL,0,'2026-11-22 10:35:01'),(58,21,1,'Admin','comment','Welcome Rehan Malim! Please update your progress slider as you complete milestones.',NULL,NULL,0,'2026-11-22 10:35:01');
/*!40000 ALTER TABLE `assignment_discussions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_categories_id_user` (`id`,`user_id`),
  UNIQUE KEY `uq_categories_user_name` (`user_id`,`name`),
  CONSTRAINT `fk_categories_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `chk_categories_name_not_blank` CHECK (char_length(trim(`name`)) > 0)
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,2,'Study','2026-11-21 08:37:55'),(2,2,'Personal','2026-11-21 08:37:55'),(3,3,'Projects','2026-11-21 08:37:55'),(4,3,'Study','2026-11-21 08:37:55'),(5,1,'Administration','2026-11-21 08:37:55'),(6,5,'Work','2026-11-21 12:24:40'),(7,5,'Personal','2026-11-21 12:24:40'),(8,5,'Study','2026-11-21 12:24:40'),(9,5,'Projects','2026-11-21 12:25:01'),(10,8,'Work','2026-11-21 12:36:59'),(11,8,'Personal','2026-11-21 12:36:59'),(12,8,'Study','2026-11-21 12:36:59'),(17,22,'Work','2026-11-21 17:10:07'),(18,22,'Personal','2026-11-21 17:10:07'),(19,22,'Study','2026-11-21 17:10:07'),(25,42,'Work','2026-11-21 20:18:56'),(26,42,'Personal','2026-11-21 20:18:56'),(27,42,'Study','2026-11-21 20:18:56'),(31,50,'Work','2026-11-22 08:02:05'),(32,50,'Personal','2026-11-22 08:02:05'),(33,50,'Study','2026-11-22 08:02:05'),(34,51,'Work','2026-11-22 09:07:11'),(35,51,'Personal','2026-11-22 09:07:11'),(36,51,'Study','2026-11-22 09:07:11'),(37,58,'Engineering','2026-11-22 10:35:01'),(38,58,'Design','2026-11-22 10:35:01'),(39,58,'Personal','2026-11-22 10:35:01');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`todo_backend`@`localhost`*/ /*!50003 TRIGGER trg_categories_before_delete
BEFORE DELETE ON categories
FOR EACH ROW
  UPDATE tasks SET category_id = NULL WHERE category_id = OLD.id */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `task_id` int(11) DEFAULT NULL,
  `assignment_id` int(11) DEFAULT NULL,
  `type` varchar(50) NOT NULL DEFAULT 'reminder',
  `title` varchar(150) NOT NULL,
  `message` text NOT NULL,
  `action_url` varchar(255) DEFAULT NULL,
  `actor_name` varchar(100) DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `read_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_notifications_task` (`task_id`),
  KEY `idx_notifications_user_read` (`user_id`,`is_read`,`created_at`),
  KEY `fk_notif_assignment` (`assignment_id`),
  CONSTRAINT `fk_notif_assignment` FOREIGN KEY (`assignment_id`) REFERENCES `task_assignments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_notifications_task` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=69 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,1,21,NULL,'reminder','Reminder: Sprint 7 Smart Productivity Testing','Task \'Sprint 7 Smart Productivity Testing\' deadline is approaching! Priority: High.',NULL,NULL,1,'2026-11-21 13:13:54','2026-11-21 18:43:54'),(22,8,NULL,5,'assignment','New Task Assigned: tgwr','Administrator 407 B-1 NITISH GUPTA assigned you: \'tgwr\'. Due: 2026-11-22 03:22','/app?tab=assigned&assignment_id=5','407 B-1 NITISH GUPTA',1,'2026-11-21 19:50:51','2026-11-22 01:21:00'),(23,8,NULL,5,'discussion','Message from 407 B-1 NITISH GUPTA on tgwr','eryherger','/admin/assignments?task_id=3','407 B-1 NITISH GUPTA',1,'2026-11-21 19:52:12','2026-11-22 01:22:24'),(24,42,NULL,6,'assignment','New Task Assigned: Throw some lines','Administrator 407 B-1 NITISH GUPTA assigned you: \'Throw some lines\'. Due: 2026-11-28 16:23','/app?tab=assigned&assignment_id=6','407 B-1 NITISH GUPTA',1,'2026-11-21 19:59:24','2026-11-22 01:48:39'),(25,42,NULL,6,'reminder','Reminder: Throw some lines','Reminder: Please update your progress on \"Throw some lines\". The deadline is approaching.','/app?tab=assigned&assignment_id=6','407 B-1 NITISH GUPTA',1,'2026-11-21 19:59:31','2026-11-22 01:48:38'),(26,42,NULL,6,'reminder','Reminder: Throw some lines','Reminder: Please update your progress on \"Throw some lines\". The deadline is approaching.','/app?tab=assigned&assignment_id=6','407 B-1 NITISH GUPTA',1,'2026-11-21 19:59:55','2026-11-22 01:48:39'),(34,42,NULL,9,'assignment','New Task Assigned: Throw some lines there','Administrator 407 B-1 NITISH GUPTA assigned you: \'Throw some lines there\'. Due: 2026-11-03 18:48','/app?tab=assigned&assignment_id=9','407 B-1 NITISH GUPTA',1,'2026-11-21 20:17:04','2026-11-22 01:48:41'),(35,42,NULL,9,'discussion','Admin message from 407 B-1 NITISH GUPTA','ethstrhyertgertg','/app?tab=assigned&assignment_id=9','407 B-1 NITISH GUPTA',1,'2026-11-21 20:17:26','2026-11-22 01:48:08'),(36,8,NULL,9,'progress_update','Rehan Malim completed: Throw some lines there','Rehan Malim reported: Updated status to Completed (100% completed).','/admin/assignments?task_id=6','Rehan Malim',1,'2026-11-21 20:18:29','2026-11-22 14:41:02'),(37,45,NULL,10,'assignment','New Task Assigned: Prepare Annual Strategic Review','Administrator Admin One assigned you: \'Prepare Annual Strategic Review\'. Due: 2026-11-25 17:30','/app?tab=assigned&assignment_id=10','Admin One',0,'2026-11-21 21:20:21',NULL),(38,46,NULL,11,'assignment','New Task Assigned: Prepare Annual Strategic Review','Administrator Admin One assigned you: \'Prepare Annual Strategic Review\'. Due: 2026-11-25 17:30','/app?tab=assigned&assignment_id=11','Admin One',0,'2026-11-21 21:20:21',NULL),(39,1,NULL,10,'progress_update','Update on Prepare Annual Strategic Review: User X','User X reported: Drafted initial KPI outline.','/admin/assignments?task_id=7','User X',0,'2026-11-21 21:20:21',NULL),(40,1,NULL,10,'progress_update','User X completed: Prepare Annual Strategic Review','User X reported: Finished report and submitted slides.','/admin/assignments?task_id=7','User X',0,'2026-11-21 21:20:22',NULL),(41,1,NULL,11,'discussion','Message from User Y on Prepare Annual Strategic Review','Should I include international market data?','/admin/assignments?task_id=7','User Y',0,'2026-11-21 21:20:22',NULL),(42,46,NULL,11,'discussion','Admin message from Admin One','Yes, include European and APAC regions please.','/app?tab=assigned&assignment_id=11','Admin One',0,'2026-11-21 21:20:22',NULL),(43,46,NULL,11,'reminder','Reminder: Prepare Annual Strategic Review','Please finalize your strategic review input by EOD.','/app?tab=assigned&assignment_id=11','Admin One',0,'2026-11-21 21:20:22',NULL),(44,47,NULL,12,'assignment','New Task Assigned: Prepare Annual Strategic Review','Administrator Admin One assigned you: \'Prepare Annual Strategic Review\'. Due: 2026-11-25 17:30','/app?tab=assigned&assignment_id=12','Admin One',0,'2026-11-21 22:15:36',NULL),(45,48,NULL,13,'assignment','New Task Assigned: Prepare Annual Strategic Review','Administrator Admin One assigned you: \'Prepare Annual Strategic Review\'. Due: 2026-11-25 17:30','/app?tab=assigned&assignment_id=13','Admin One',0,'2026-11-21 22:15:36',NULL),(46,1,NULL,12,'progress_update','Update on Prepare Annual Strategic Review: User X','User X reported: Drafted initial KPI outline.','/admin/assignments?task_id=8','User X',0,'2026-11-21 22:15:36',NULL),(47,1,NULL,12,'progress_update','User X completed: Prepare Annual Strategic Review','User X reported: Finished report and submitted slides.','/admin/assignments?task_id=8','User X',0,'2026-11-21 22:15:36',NULL),(48,1,NULL,13,'discussion','Message from User Y on Prepare Annual Strategic Review','Should I include international market data?','/admin/assignments?task_id=8','User Y',0,'2026-11-21 22:15:37',NULL),(49,48,NULL,13,'discussion','Admin message from Admin One','Yes, include European and APAC regions please.','/app?tab=assigned&assignment_id=13','Admin One',0,'2026-11-21 22:15:37',NULL),(50,48,NULL,13,'reminder','Reminder: Prepare Annual Strategic Review','Please finalize your strategic review input by EOD.','/app?tab=assigned&assignment_id=13','Admin One',0,'2026-11-21 22:15:37',NULL),(51,50,NULL,14,'assignment','New Task Assigned: rger','Administrator 407 B-1 NITISH GUPTA assigned you: \'rger\'. Due: 2026-10-27 15:42','/app?tab=assigned&assignment_id=14','407 B-1 NITISH GUPTA',1,'2026-11-22 08:10:46','2026-11-22 13:41:32'),(52,50,NULL,14,'reminder','Reminder: rger','Reminder: Please update your progress on \"rger\". The deadline is approaching.','/app?tab=assigned&assignment_id=14','407 B-1 NITISH GUPTA',1,'2026-11-22 08:11:03','2026-11-22 13:41:33'),(53,8,NULL,14,'progress_update','Saraswati completed: rger','Saraswati reported: 24efd [Blocker: ed32]','/admin/assignments?task_id=9','Saraswati',1,'2026-11-22 08:11:46','2026-11-22 14:41:01'),(54,42,NULL,15,'assignment','New Task Assigned: completebackend','Administrator 407 B-1 NITISH GUPTA assigned you: \'completebackend\'. Due: No deadline ','/app?tab=assigned&assignment_id=15','407 B-1 NITISH GUPTA',0,'2026-11-22 09:10:31',NULL),(55,50,NULL,16,'assignment','New Task Assigned: completebackend','Administrator 407 B-1 NITISH GUPTA assigned you: \'completebackend\'. Due: No deadline ','/app?tab=assigned&assignment_id=16','407 B-1 NITISH GUPTA',0,'2026-11-22 09:10:31',NULL),(56,51,NULL,17,'assignment','New Task Assigned: completebackend','Administrator 407 B-1 NITISH GUPTA assigned you: \'completebackend\'. Due: No deadline ','/app?tab=assigned&assignment_id=17','407 B-1 NITISH GUPTA',0,'2026-11-22 09:10:31',NULL),(57,42,NULL,15,'reminder','Reminder: completebackend','Reminder: Please update your progress on \"completebackend\". The deadline is approaching.','/app?tab=assigned&assignment_id=15','407 B-1 NITISH GUPTA',0,'2026-11-22 09:10:51',NULL),(58,50,NULL,16,'reminder','Reminder: completebackend','Reminder: Please update your progress on \"completebackend\". The deadline is approaching.','/app?tab=assigned&assignment_id=16','407 B-1 NITISH GUPTA',0,'2026-11-22 09:10:51',NULL),(59,51,NULL,17,'reminder','Reminder: completebackend','Reminder: Please update your progress on \"completebackend\". The deadline is approaching.','/app?tab=assigned&assignment_id=17','407 B-1 NITISH GUPTA',0,'2026-11-22 09:10:51',NULL),(60,52,NULL,18,'assignment','New Task Assigned: Prepare Annual Strategic Review','Administrator Admin One assigned you: \'Prepare Annual Strategic Review\'. Due: 2026-11-25 17:30','/app?tab=assigned&assignment_id=18','Admin One',0,'2026-11-22 10:17:24',NULL),(61,53,NULL,19,'assignment','New Task Assigned: Prepare Annual Strategic Review','Administrator Admin One assigned you: \'Prepare Annual Strategic Review\'. Due: 2026-11-25 17:30','/app?tab=assigned&assignment_id=19','Admin One',0,'2026-11-22 10:17:24',NULL),(62,1,NULL,18,'progress_update','Update on Prepare Annual Strategic Review: User X','User X reported: Drafted initial KPI outline.','/admin/assignments?task_id=11','User X',0,'2026-11-22 10:17:25',NULL),(63,1,NULL,18,'progress_update','User X completed: Prepare Annual Strategic Review','User X reported: Finished report and submitted slides.','/admin/assignments?task_id=11','User X',0,'2026-11-22 10:17:25',NULL),(64,1,NULL,19,'discussion','Message from User Y on Prepare Annual Strategic Review','Should I include international market data?','/admin/assignments?task_id=11','User Y',0,'2026-11-22 10:17:25',NULL),(65,53,NULL,19,'discussion','Admin message from Admin One','Yes, include European and APAC regions please.','/app?tab=assigned&assignment_id=19','Admin One',0,'2026-11-22 10:17:25',NULL),(66,53,NULL,19,'reminder','Reminder: Prepare Annual Strategic Review','Please finalize your strategic review input by EOD.','/app?tab=assigned&assignment_id=19','Admin One',0,'2026-11-22 10:17:25',NULL),(67,54,NULL,NULL,'reminder','Reminder: User A Secret Task 58164233','Task \'User A Secret Task 58164233\' deadline is approaching! Priority: High.',NULL,NULL,1,'2026-11-22 10:18:04','2026-11-22 15:48:04'),(68,56,NULL,NULL,'reminder','Reminder: User A Secret Task 72a0e158','Task \'User A Secret Task 72a0e158\' deadline is approaching! Priority: High.',NULL,NULL,1,'2026-11-22 10:19:13','2026-11-22 15:49:13');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reminders`
--

DROP TABLE IF EXISTS `reminders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `reminders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `task_id` int(11) NOT NULL,
  `remind_at` datetime NOT NULL,
  `status` enum('Pending','Triggered','Cancelled') NOT NULL DEFAULT 'Pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `triggered_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_reminders_task` (`task_id`),
  KEY `idx_reminders_due` (`remind_at`,`status`),
  KEY `idx_reminders_user_status` (`user_id`,`status`),
  CONSTRAINT `fk_reminders_task` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_reminders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reminders`
--

LOCK TABLES `reminders` WRITE;
/*!40000 ALTER TABLE `reminders` DISABLE KEYS */;
INSERT INTO `reminders` VALUES (1,1,21,'2026-11-21 13:08:54','Triggered','2026-11-21 13:13:54','2026-11-21 18:43:54');
/*!40000 ALTER TABLE `reminders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `schema_migrations`
--

DROP TABLE IF EXISTS `schema_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `schema_migrations` (
  `version` varchar(100) NOT NULL,
  `applied_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `description` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `schema_migrations`
--

LOCK TABLES `schema_migrations` WRITE;
/*!40000 ALTER TABLE `schema_migrations` DISABLE KEYS */;
INSERT INTO `schema_migrations` VALUES ('v1_baseline_schema','2026-11-22 10:14:28','Baseline users, categories, tasks tables'),('v2_smart_productivity','2026-11-22 10:14:28','Subtasks, tags, task_tags, reminders, notifications, activity logs, preferences'),('v3_team_collaboration','2026-11-22 10:14:28','Team tasks, task assignments, assignment discussions, exact deadline times');
/*!40000 ALTER TABLE `schema_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subtasks`
--

DROP TABLE IF EXISTS `subtasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `subtasks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `task_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `is_completed` tinyint(1) NOT NULL DEFAULT 0,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_subtasks_user` (`user_id`),
  KEY `idx_subtasks_task_order` (`task_id`,`sort_order`),
  CONSTRAINT `fk_subtasks_task` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_subtasks_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subtasks`
--

LOCK TABLES `subtasks` WRITE;
/*!40000 ALTER TABLE `subtasks` DISABLE KEYS */;
INSERT INTO `subtasks` VALUES (1,21,1,'Check database schema',1,0,'2026-11-21 13:13:54','2026-11-21 13:13:54'),(2,21,1,'Validate notifications bell',0,0,'2026-11-21 13:13:54','2026-11-21 13:13:54'),(17,83,58,'Check schema migrations v2 and v3',1,1,'2026-11-22 10:35:01','2026-11-22 10:35:01'),(18,83,58,'Confirm MySQL Workbench connection',1,2,'2026-11-22 10:35:01','2026-11-22 10:35:01'),(19,84,58,'Check schema migrations v2 and v3',1,1,'2026-11-22 10:35:01','2026-11-22 10:35:01'),(20,84,58,'Confirm MySQL Workbench connection',1,2,'2026-11-22 10:35:01','2026-11-22 10:35:01'),(21,85,58,'Check schema migrations v2 and v3',1,1,'2026-11-22 10:35:01','2026-11-22 10:35:01'),(22,85,58,'Confirm MySQL Workbench connection',1,2,'2026-11-22 10:35:01','2026-11-22 10:35:01');
/*!40000 ALTER TABLE `subtasks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tags`
--

DROP TABLE IF EXISTS `tags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tags` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `color` varchar(20) NOT NULL DEFAULT '#6366f1',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_tag` (`user_id`,`name`),
  CONSTRAINT `fk_tags_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=52 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tags`
--

LOCK TABLES `tags` WRITE;
/*!40000 ALTER TABLE `tags` DISABLE KEYS */;
INSERT INTO `tags` VALUES (1,1,'Frontend','#6366f1','2026-11-21 13:13:54'),(2,1,'Backend','#0ea5e9','2026-11-21 13:13:54'),(3,1,'Urgent','#ef4444','2026-11-21 13:13:54'),(4,1,'Design','#ec4899','2026-11-21 13:13:54'),(5,1,'A11y Review','#10b981','2026-11-21 13:13:54'),(13,8,'Frontend','#6366f1','2026-11-21 16:16:58'),(14,8,'Backend','#0ea5e9','2026-11-21 16:16:58'),(15,8,'Urgent','#ef4444','2026-11-21 16:16:58'),(16,8,'Design','#ec4899','2026-11-21 16:16:58'),(19,22,'Frontend','#6366f1','2026-11-21 17:15:11'),(20,22,'Backend','#0ea5e9','2026-11-21 17:15:11'),(21,22,'Urgent','#ef4444','2026-11-21 17:15:11'),(22,22,'Design','#ec4899','2026-11-21 17:15:11'),(31,42,'Frontend','#6366f1','2026-11-21 20:19:04'),(32,42,'Backend','#0ea5e9','2026-11-21 20:19:04'),(33,42,'Urgent','#ef4444','2026-11-21 20:19:04'),(34,42,'Design','#ec4899','2026-11-21 20:19:04'),(39,50,'Frontend','#6366f1','2026-11-22 08:02:05'),(40,50,'Backend','#0ea5e9','2026-11-22 08:02:05'),(41,50,'Urgent','#ef4444','2026-11-22 08:02:05'),(42,50,'Design','#ec4899','2026-11-22 08:02:05'),(43,51,'Frontend','#6366f1','2026-11-22 09:07:11'),(44,51,'Backend','#0ea5e9','2026-11-22 09:07:11'),(45,51,'Urgent','#ef4444','2026-11-22 09:07:11'),(46,51,'Design','#ec4899','2026-11-22 09:07:11'),(47,54,'TagA_58164233','#10b981','2026-11-22 10:18:04'),(48,56,'TagA_72a0e158','#10b981','2026-11-22 10:19:12'),(49,58,'Urgent','#ef4444','2026-11-22 10:35:01'),(50,58,'Sprint 7','#8b5cf6','2026-11-22 10:35:01'),(51,58,'Bug','#f59e0b','2026-11-22 10:35:01');
/*!40000 ALTER TABLE `tags` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `task_activity_logs`
--

DROP TABLE IF EXISTS `task_activity_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `task_activity_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `task_id` int(11) NOT NULL,
  `actor_user_id` int(11) NOT NULL,
  `action` varchar(50) NOT NULL,
  `changed_fields` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_activity_actor` (`actor_user_id`),
  KEY `idx_activity_task_created` (`task_id`,`created_at`),
  CONSTRAINT `fk_activity_actor` FOREIGN KEY (`actor_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_activity_task` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=121 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `task_activity_logs`
--

LOCK TABLES `task_activity_logs` WRITE;
/*!40000 ALTER TABLE `task_activity_logs` DISABLE KEYS */;
INSERT INTO `task_activity_logs` VALUES (1,21,1,'created','{\"title\": \"Sprint 7 Smart Productivity Testing\", \"priority\": \"High\", \"status\": \"InProgress\", \"due_date\": null}','2026-11-21 13:13:54'),(2,21,1,'subtask_created','{\"subtask_title\": \"Check database schema\"}','2026-11-21 13:13:54'),(3,21,1,'subtask_created','{\"subtask_title\": \"Validate notifications bell\"}','2026-11-21 13:13:54'),(4,21,1,'subtask_completed','{\"subtask_id\": 1, \"is_completed\": true}','2026-11-21 13:13:54'),(57,63,22,'created','{\"title\": \"Read\", \"priority\": \"Medium\", \"status\": \"InProgress\", \"due_date\": \"2026-11-22\"}','2026-11-21 18:26:51'),(58,63,22,'completed','{\"status\": {\"old\": \"InProgress\", \"new\": \"Completed\"}}','2026-11-21 18:27:07'),(59,63,22,'reopened','{\"status\": {\"old\": \"Completed\", \"new\": \"Pending\"}}','2026-11-21 18:27:10'),(60,63,22,'completed','{\"status\": {\"old\": \"Pending\", \"new\": \"Completed\"}}','2026-11-21 18:27:17'),(61,63,22,'reopened','{\"status\": {\"old\": \"Completed\", \"new\": \"Pending\"}}','2026-11-21 18:27:18'),(62,63,22,'completed','{\"status\": {\"old\": \"Pending\", \"new\": \"Completed\"}}','2026-11-21 18:27:43'),(63,63,22,'reopened','{\"status\": {\"old\": \"Completed\", \"new\": \"InProgress\"}}','2026-11-21 18:27:49'),(64,63,22,'status_changed','{\"status\": {\"old\": \"InProgress\", \"new\": \"Pending\"}}','2026-11-21 18:27:51'),(65,63,22,'completed','{\"status\": {\"old\": \"Pending\", \"new\": \"Completed\"}}','2026-11-21 18:29:41'),(66,64,22,'created','{\"title\": \"rfwer\", \"priority\": \"Medium\", \"status\": \"Pending\", \"due_date\": null}','2026-11-21 18:30:00'),(67,64,22,'completed','{\"status\": {\"old\": \"Pending\", \"new\": \"Completed\"}}','2026-11-21 18:30:05'),(68,63,22,'reopened','{\"status\": {\"old\": \"Completed\", \"new\": \"InProgress\"}}','2026-11-21 18:30:24'),(69,65,8,'created','{\"title\": \"readdddd\", \"priority\": \"High\", \"status\": \"Pending\", \"due_date\": \"2026-11-28\"}','2026-11-21 18:35:37'),(70,20,8,'completed','{\"status\": {\"old\": \"Pending\", \"new\": \"Completed\"}}','2026-11-21 18:35:54'),(71,65,8,'completed','{\"status\": {\"old\": \"Pending\", \"new\": \"Completed\"}}','2026-11-21 18:35:56'),(72,20,8,'reopened','{\"status\": {\"old\": \"Completed\", \"new\": \"Pending\"}}','2026-11-21 18:35:59'),(73,65,8,'reopened','{\"status\": {\"old\": \"Completed\", \"new\": \"Pending\"}}','2026-11-21 18:36:00'),(80,68,8,'created','{\"title\": \"rwew\", \"priority\": \"Medium\", \"status\": \"Pending\", \"due_date\": null}','2026-11-21 19:16:38'),(87,71,8,'created','{\"title\": \"killl\", \"priority\": \"High\", \"status\": \"InProgress\", \"due_date\": \"2026-11-22\"}','2026-11-21 19:47:49'),(88,71,8,'completed','{\"status\": {\"old\": \"InProgress\", \"new\": \"Completed\"}}','2026-11-21 19:51:12'),(89,68,8,'completed','{\"status\": {\"old\": \"Pending\", \"new\": \"Completed\"}}','2026-11-21 19:51:15'),(90,72,8,'created','{\"title\": \"Throw some lines\", \"priority\": \"Medium\", \"status\": \"Pending\", \"due_date\": null}','2026-11-21 19:58:44'),(91,65,8,'completed','{\"status\": {\"old\": \"Pending\", \"new\": \"Completed\"}}','2026-11-21 20:02:40'),(92,65,8,'reopened','{\"status\": {\"old\": \"Completed\", \"new\": \"Pending\"}}','2026-11-21 20:02:41'),(96,74,50,'created','{\"title\": \"sleep deep\", \"priority\": \"High\", \"status\": \"Pending\", \"due_date\": \"2026-11-23\"}','2026-11-22 08:02:33'),(97,74,50,'completed','{\"status\": {\"old\": \"Pending\", \"new\": \"Completed\"}}','2026-11-22 08:02:47'),(98,74,50,'reopened','{\"status\": {\"old\": \"Completed\", \"new\": \"Pending\"}}','2026-11-22 08:02:50'),(99,74,50,'status_changed','{\"status\": {\"old\": \"Pending\", \"new\": \"InProgress\"}}','2026-11-22 08:03:00'),(100,74,50,'completed','{\"status\": {\"old\": \"InProgress\", \"new\": \"Completed\"}}','2026-11-22 08:03:02'),(101,75,50,'created','{\"title\": \"dqwbldb\", \"priority\": \"Medium\", \"status\": \"Pending\", \"due_date\": \"2026-11-24\"}','2026-11-22 08:03:20'),(102,76,8,'created','{\"title\": \"uidcwdbcdcs\", \"priority\": \"Medium\", \"status\": \"Pending\", \"due_date\": \"2026-11-21\"}','2026-11-22 08:10:14'),(103,77,51,'created','{\"title\": \"Reading book\", \"priority\": \"Medium\", \"status\": \"InProgress\", \"due_date\": \"2026-11-22\"}','2026-11-22 09:07:42'),(104,77,51,'completed','{\"status\": {\"old\": \"InProgress\", \"new\": \"Completed\"}}','2026-11-22 09:08:16'),(105,77,51,'reopened','{\"status\": {\"old\": \"Completed\", \"new\": \"InProgress\"}}','2026-11-22 09:08:23'),(106,77,51,'status_changed','{\"status\": {\"old\": \"InProgress\", \"new\": \"Pending\"}}','2026-11-22 09:08:25'),(107,77,51,'completed','{\"status\": {\"old\": \"Pending\", \"new\": \"Completed\"}}','2026-11-22 09:08:27'),(108,78,51,'created','{\"title\": \"read mre\", \"priority\": \"Medium\", \"status\": \"Pending\", \"due_date\": \"2026-11-23\"}','2026-11-22 09:08:42'),(114,80,54,'created','{\"title\": \"Research Quantum Algorithms 58164233\", \"priority\": \"Low\", \"status\": \"Pending\", \"due_date\": \"2026-11-27\"}','2026-11-22 10:18:04'),(120,82,56,'created','{\"title\": \"Research Quantum Algorithms 72a0e158\", \"priority\": \"Low\", \"status\": \"Pending\", \"due_date\": \"2026-11-27\"}','2026-11-22 10:19:12');
/*!40000 ALTER TABLE `task_activity_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `task_assignments`
--

DROP TABLE IF EXISTS `task_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `task_assignments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `team_task_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `status` enum('Pending','InProgress','Completed') NOT NULL DEFAULT 'Pending',
  `progress_percent` int(11) NOT NULL DEFAULT 0,
  `assigned_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `started_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `last_activity_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `notes` text DEFAULT NULL,
  `blockers` text DEFAULT NULL,
  `checklist_state` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`checklist_state`)),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_team_task_user` (`team_task_id`,`user_id`),
  KEY `idx_ta_user_status` (`user_id`,`status`),
  KEY `idx_ta_team_task` (`team_task_id`),
  CONSTRAINT `fk_ta_team_task` FOREIGN KEY (`team_task_id`) REFERENCES `team_tasks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ta_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `task_assignments`
--

LOCK TABLES `task_assignments` WRITE;
/*!40000 ALTER TABLE `task_assignments` DISABLE KEYS */;
INSERT INTO `task_assignments` VALUES (5,3,8,'Completed',100,'2026-11-21 19:50:51',NULL,'2026-11-22 01:22:04','2026-11-21 19:52:04',NULL,NULL,'null'),(6,4,42,'Pending',0,'2026-11-21 19:59:24',NULL,NULL,'2026-11-21 19:59:24',NULL,NULL,'null'),(9,6,42,'Completed',100,'2026-11-21 20:17:04',NULL,'2026-11-22 01:48:29','2026-11-21 20:18:29',NULL,NULL,'null'),(10,7,45,'Completed',100,'2026-11-21 21:20:21','2026-11-22 02:50:21','2026-11-22 02:50:22','2026-11-21 21:20:22','Finished report and submitted slides.',NULL,'[{\"id\": 1, \"text\": \"Draft executive summary\", \"done\": false}, {\"id\": 2, \"text\": \"Review financial tables\", \"done\": false}, {\"id\": 3, \"text\": \"Compile slide deck\", \"done\": false}]'),(11,7,46,'Pending',0,'2026-11-21 21:20:21',NULL,NULL,'2026-11-21 21:20:21',NULL,NULL,'[{\"id\": 1, \"text\": \"Draft executive summary\", \"done\": false}, {\"id\": 2, \"text\": \"Review financial tables\", \"done\": false}, {\"id\": 3, \"text\": \"Compile slide deck\", \"done\": false}]'),(12,8,47,'Completed',100,'2026-11-21 22:15:36','2026-11-22 03:45:36','2026-11-22 03:45:36','2026-11-21 22:15:36','Finished report and submitted slides.',NULL,'[{\"id\": 1, \"text\": \"Draft executive summary\", \"done\": false}, {\"id\": 2, \"text\": \"Review financial tables\", \"done\": false}, {\"id\": 3, \"text\": \"Compile slide deck\", \"done\": false}]'),(13,8,48,'Pending',0,'2026-11-21 22:15:36',NULL,NULL,'2026-11-21 22:15:36',NULL,NULL,'[{\"id\": 1, \"text\": \"Draft executive summary\", \"done\": false}, {\"id\": 2, \"text\": \"Review financial tables\", \"done\": false}, {\"id\": 3, \"text\": \"Compile slide deck\", \"done\": false}]'),(14,9,50,'Completed',100,'2026-11-22 08:10:45',NULL,'2026-11-22 13:41:46','2026-11-22 08:11:47','24efd','ed32','null'),(15,10,42,'Pending',0,'2026-11-22 09:10:31',NULL,NULL,'2026-11-22 09:10:31',NULL,NULL,'null'),(16,10,50,'Pending',0,'2026-11-22 09:10:31',NULL,NULL,'2026-11-22 09:10:31',NULL,NULL,'null'),(17,10,51,'Pending',0,'2026-11-22 09:10:31',NULL,NULL,'2026-11-22 09:10:31',NULL,NULL,'null'),(18,11,52,'Completed',100,'2026-11-22 10:17:24','2026-11-22 15:47:25','2026-11-22 15:47:25','2026-11-22 10:17:25','Finished report and submitted slides.',NULL,'[{\"id\": 1, \"text\": \"Draft executive summary\", \"done\": false}, {\"id\": 2, \"text\": \"Review financial tables\", \"done\": false}, {\"id\": 3, \"text\": \"Compile slide deck\", \"done\": false}]'),(19,11,53,'Pending',0,'2026-11-22 10:17:24',NULL,NULL,'2026-11-22 10:17:24',NULL,NULL,'[{\"id\": 1, \"text\": \"Draft executive summary\", \"done\": false}, {\"id\": 2, \"text\": \"Review financial tables\", \"done\": false}, {\"id\": 3, \"text\": \"Compile slide deck\", \"done\": false}]'),(20,12,58,'InProgress',50,'2026-11-22 10:35:01',NULL,NULL,'2026-11-22 10:35:01','Testing assignment dashboard and discussion thread.',NULL,NULL),(21,12,59,'InProgress',50,'2026-11-22 10:35:01',NULL,NULL,'2026-11-22 10:35:01','Testing assignment dashboard and discussion thread.',NULL,NULL);
/*!40000 ALTER TABLE `task_assignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `task_tags`
--

DROP TABLE IF EXISTS `task_tags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `task_tags` (
  `task_id` int(11) NOT NULL,
  `tag_id` int(11) NOT NULL,
  PRIMARY KEY (`task_id`,`tag_id`),
  KEY `fk_tt_tag` (`tag_id`),
  CONSTRAINT `fk_tt_tag` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tt_task` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `task_tags`
--

LOCK TABLES `task_tags` WRITE;
/*!40000 ALTER TABLE `task_tags` DISABLE KEYS */;
INSERT INTO `task_tags` VALUES (21,2),(21,5),(63,21),(65,15),(71,15),(75,41),(76,15);
/*!40000 ALTER TABLE `task_tags` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tasks`
--

DROP TABLE IF EXISTS `tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tasks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `category_id` int(11) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('Pending','InProgress','Completed') NOT NULL DEFAULT 'Pending',
  `priority` enum('Low','Medium','High') NOT NULL DEFAULT 'Medium',
  `due_date` date DEFAULT NULL,
  `due_time` time DEFAULT NULL,
  `due_datetime` datetime DEFAULT NULL,
  `timezone` varchar(50) NOT NULL DEFAULT 'UTC',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_tasks_category_same_user` (`category_id`,`user_id`),
  KEY `idx_tasks_user_id` (`user_id`),
  KEY `idx_tasks_category_id` (`category_id`),
  KEY `idx_tasks_status` (`status`),
  KEY `idx_tasks_priority` (`priority`),
  KEY `idx_tasks_due_date` (`due_date`),
  KEY `idx_tasks_title` (`title`),
  KEY `idx_tasks_user_status` (`user_id`,`status`),
  KEY `idx_tasks_user_due` (`user_id`,`due_date`),
  CONSTRAINT `fk_tasks_category_same_user` FOREIGN KEY (`category_id`, `user_id`) REFERENCES `categories` (`id`, `user_id`),
  CONSTRAINT `fk_tasks_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `chk_tasks_title_not_blank` CHECK (char_length(trim(`title`)) > 0)
) ENGINE=InnoDB AUTO_INCREMENT=86 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tasks`
--

LOCK TABLES `tasks` WRITE;
/*!40000 ALTER TABLE `tasks` DISABLE KEYS */;
INSERT INTO `tasks` VALUES (1,2,1,'Finish DBMS assignment','Normalization exercises 1-5','InProgress','High','2026-12-05',NULL,NULL,'UTC','2026-11-21 08:37:55','2026-11-21 08:37:55'),(2,2,1,'Revise Operating Systems','Chapters 4 to 7','Pending','Medium','2026-12-10',NULL,NULL,'UTC','2026-11-21 08:37:55','2026-11-21 08:37:55'),(3,2,2,'Buy a birthday gift',NULL,'Pending','Low','2026-11-25',NULL,NULL,'UTC','2026-11-21 08:37:55','2026-11-21 08:37:55'),(4,2,NULL,'Renew library card','Uncategorized task example','Completed','Low',NULL,NULL,NULL,'UTC','2026-11-21 08:37:55','2026-11-21 08:37:55'),(5,3,3,'Design To-Do UI','Wireframes for dashboard','Completed','High','2026-11-15',NULL,NULL,'UTC','2026-11-21 08:37:55','2026-11-21 08:37:55'),(6,3,3,'Write API documentation','Document all endpoints','Pending','High','2026-12-01',NULL,NULL,'UTC','2026-11-21 08:37:55','2026-11-21 08:37:55'),(7,3,4,'Prepare for viva',NULL,'InProgress','Medium','2026-12-15',NULL,NULL,'UTC','2026-11-21 08:37:55','2026-11-21 08:37:55'),(8,3,NULL,'Pay hostel fees',NULL,'Pending','Medium','2026-11-30',NULL,NULL,'UTC','2026-11-21 08:37:55','2026-11-21 08:37:55'),(9,4,NULL,'Join coding club','No categories created yet','Pending','Low',NULL,NULL,NULL,'UTC','2026-11-21 08:37:55','2026-11-21 08:37:55'),(10,4,NULL,'Submit lab journal',NULL,'Completed','Medium','2026-11-10',NULL,NULL,'UTC','2026-11-21 08:37:55','2026-11-21 08:37:55'),(11,1,5,'Review user accounts','Monthly review','Pending','High','2026-12-20',NULL,NULL,'UTC','2026-11-21 08:37:55','2026-11-21 08:37:55'),(20,8,11,'sleep','joking','Pending','Low',NULL,NULL,NULL,'UTC','2026-11-21 12:38:52','2026-11-21 18:35:59'),(21,1,NULL,'Sprint 7 Smart Productivity Testing','End to end validation of subtasks, tags, reminders and logs','InProgress','High',NULL,NULL,NULL,'UTC','2026-11-21 13:13:54','2026-11-21 13:13:54'),(63,22,19,'Read','atomic habits','InProgress','Medium','2026-11-22',NULL,NULL,'UTC','2026-11-21 18:26:51','2026-11-21 18:30:24'),(64,22,18,'rfwer','werwer','Completed','Medium',NULL,NULL,NULL,'UTC','2026-11-21 18:30:00','2026-11-21 18:30:05'),(65,8,11,'readdddd','wrgergfdg','Pending','High','2026-11-28',NULL,NULL,'UTC','2026-11-21 18:35:37','2026-11-21 20:02:41'),(68,8,NULL,'rwew','wedfew','Completed','Medium',NULL,NULL,NULL,'UTC','2026-11-21 19:16:38','2026-11-21 19:51:15'),(71,8,11,'killl','with knife','Completed','High','2026-11-22','22:00:00','2026-11-22 22:00:00','UTC','2026-11-21 19:47:49','2026-11-21 19:51:12'),(72,8,NULL,'Throw some lines',NULL,'Pending','Medium',NULL,NULL,NULL,'UTC','2026-11-21 19:58:44','2026-11-21 19:58:44'),(74,50,32,'sleep deep','dont die','Completed','High','2026-11-23','22:00:00','2026-11-23 22:00:00','UTC','2026-11-22 08:02:32','2026-11-22 08:03:02'),(75,50,NULL,'dqwbldb','ede','Pending','Medium','2026-11-24',NULL,NULL,'UTC','2026-11-22 08:03:20','2026-11-22 08:03:20'),(76,8,10,'uidcwdbcdcs','d','Pending','Medium','2026-11-21','11:00:00','2026-11-21 11:00:00','UTC','2026-11-22 08:10:13','2026-11-22 08:10:13'),(77,51,36,'Reading book','ikigai','Completed','Medium','2026-11-22','15:00:00','2026-11-22 15:00:00','UTC','2026-11-22 09:07:42','2026-11-22 09:08:27'),(78,51,NULL,'read mre','443r','Pending','Medium','2026-11-23',NULL,NULL,'UTC','2026-11-22 09:08:42','2026-11-22 09:08:42'),(80,54,NULL,'Research Quantum Algorithms 58164233',NULL,'Pending','Low','2026-11-27',NULL,NULL,'UTC','2026-11-22 10:18:04','2026-11-22 10:18:04'),(82,56,NULL,'Research Quantum Algorithms 72a0e158',NULL,'Pending','Low','2026-11-27',NULL,NULL,'UTC','2026-11-22 10:19:12','2026-11-22 10:19:12'),(83,58,37,'Review 14 MySQL Database Tables & Foreign Keys','Verify ER diagram, cascading deletions, and composite constraints for viva.','Completed','High','2026-11-22','17:00:00',NULL,'UTC','2026-11-22 10:35:01','2026-11-22 10:35:01'),(84,58,37,'Prepare Planova Architecture Slide Deck','Summarize frontend React components, FastAPI REST endpoints and database schema.','InProgress','High','2026-11-24','17:00:00',NULL,'UTC','2026-11-22 10:35:01','2026-11-22 10:35:01'),(85,58,38,'Test Kanban Drag-and-Drop and Theme Switcher','Verify visual transitions and glare-free dark mode before live presentation.','Pending','Medium','2026-11-27','17:00:00',NULL,'UTC','2026-11-22 10:35:01','2026-11-22 10:35:01');
/*!40000 ALTER TABLE `tasks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `team_tasks`
--

DROP TABLE IF EXISTS `team_tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `team_tasks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `instructions` text DEFAULT NULL,
  `priority` enum('Low','Medium','High') NOT NULL DEFAULT 'Medium',
  `due_date` date DEFAULT NULL,
  `due_time` time DEFAULT NULL,
  `due_datetime` datetime DEFAULT NULL,
  `timezone` varchar(50) NOT NULL DEFAULT 'UTC',
  `checklist` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`checklist`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_team_tasks_admin` (`admin_id`),
  KEY `idx_team_tasks_due` (`due_datetime`),
  CONSTRAINT `fk_team_tasks_admin` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `team_tasks`
--

LOCK TABLES `team_tasks` WRITE;
/*!40000 ALTER TABLE `team_tasks` DISABLE KEYS */;
INSERT INTO `team_tasks` VALUES (1,1,'Prepare Annual Strategic Review','Consolidate KPI metrics, operational updates, and team goals.','Use the standardized Q4 slides template.','High','2026-11-25','17:30:00','2026-11-25 17:30:00','Asia/Kolkata','[{\"id\": 1, \"text\": \"Draft executive summary\", \"done\": false}, {\"id\": 2, \"text\": \"Review financial tables\", \"done\": false}, {\"id\": 3, \"text\": \"Compile slide deck\", \"done\": false}]','2026-11-21 19:11:56','2026-11-21 19:11:56'),(2,1,'Prepare Annual Strategic Review','Consolidate KPI metrics, operational updates, and team goals.','Use the standardized Q4 slides template.','High','2026-11-25','17:30:00','2026-11-25 17:30:00','Asia/Kolkata','[{\"id\": 1, \"text\": \"Draft executive summary\", \"done\": false}, {\"id\": 2, \"text\": \"Review financial tables\", \"done\": false}, {\"id\": 3, \"text\": \"Compile slide deck\", \"done\": false}]','2026-11-21 19:17:51','2026-11-21 19:17:51'),(3,8,'tgwr','wfsdf','sdfsdwf','Medium','2026-11-22','03:22:00','2026-11-22 03:22:00','Asia/Calcutta','null','2026-11-21 19:50:51','2026-11-21 19:50:51'),(4,8,'Throw some lines (Updated by Admin)','weqwe','wqdqqw','High','2026-11-28','16:23:00','2026-11-28 16:23:00','Asia/Calcutta','null','2026-11-21 19:59:24','2026-11-21 20:09:50'),(5,1,'Throw some lines (Updated by Admin)','Consolidate KPI metrics, operational updates, and team goals.','Use the standardized Q4 slides template.','High','2026-11-25','17:30:00','2026-11-25 17:30:00','Asia/Kolkata','[{\"id\": 1, \"text\": \"Draft executive summary\", \"done\": false}, {\"id\": 2, \"text\": \"Review financial tables\", \"done\": false}, {\"id\": 3, \"text\": \"Compile slide deck\", \"done\": false}]','2026-11-21 20:15:28','2026-11-21 20:16:54'),(6,8,'Throw some lines there','fwfw','rqerer','Medium','2026-11-03','18:48:00','2026-11-03 18:48:00','Asia/Calcutta','null','2026-11-21 20:17:04','2026-11-21 20:17:04'),(7,1,'Prepare Annual Strategic Review','Consolidate KPI metrics, operational updates, and team goals.','Use the standardized Q4 slides template.','High','2026-11-25','17:30:00','2026-11-25 17:30:00','Asia/Kolkata','[{\"id\": 1, \"text\": \"Draft executive summary\", \"done\": false}, {\"id\": 2, \"text\": \"Review financial tables\", \"done\": false}, {\"id\": 3, \"text\": \"Compile slide deck\", \"done\": false}]','2026-11-21 21:20:21','2026-11-21 21:20:21'),(8,1,'Prepare Annual Strategic Review','Consolidate KPI metrics, operational updates, and team goals.','Use the standardized Q4 slides template.','High','2026-11-25','17:30:00','2026-11-25 17:30:00','Asia/Kolkata','[{\"id\": 1, \"text\": \"Draft executive summary\", \"done\": false}, {\"id\": 2, \"text\": \"Review financial tables\", \"done\": false}, {\"id\": 3, \"text\": \"Compile slide deck\", \"done\": false}]','2026-11-21 22:15:36','2026-11-21 22:15:36'),(9,8,'rger','ger','gfer','Medium','2026-10-27','15:42:00','2026-10-27 15:42:00','Asia/Calcutta','null','2026-11-22 08:10:45','2026-11-22 08:10:45'),(10,8,'completebackend','sdgsdf','sdgs','Medium',NULL,NULL,NULL,'Asia/Calcutta','null','2026-11-22 09:10:31','2026-11-22 09:10:31'),(11,1,'Prepare Annual Strategic Review','Consolidate KPI metrics, operational updates, and team goals.','Use the standardized Q4 slides template.','High','2026-11-25','17:30:00','2026-11-25 17:30:00','Asia/Kolkata','[{\"id\": 1, \"text\": \"Draft executive summary\", \"done\": false}, {\"id\": 2, \"text\": \"Review financial tables\", \"done\": false}, {\"id\": 3, \"text\": \"Compile slide deck\", \"done\": false}]','2026-11-22 10:17:24','2026-11-22 10:17:24'),(12,1,'Sprint 7: Production Release & Mentor Demo Preparation','Final integration checklist for the academic review meeting.','1. Verify local server running.\n2. Review speaking points.\n3. Test assigning tasks in Admin Console.','High','2026-11-25','18:00:00',NULL,'UTC','[{\"item\": \"Check MySQL 13 tables\", \"completed\": true}, {\"item\": \"Verify Dark Mode toggle\", \"completed\": false}]','2026-11-22 10:35:01','2026-11-22 10:35:01');
/*!40000 ALTER TABLE `team_tasks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_preferences`
--

DROP TABLE IF EXISTS `user_preferences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_preferences` (
  `user_id` int(11) NOT NULL,
  `theme` varchar(20) NOT NULL DEFAULT 'light',
  `timezone` varchar(50) NOT NULL DEFAULT 'UTC',
  `notifications_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `default_task_view` varchar(20) NOT NULL DEFAULT 'dashboard',
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_pref_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_preferences`
--

LOCK TABLES `user_preferences` WRITE;
/*!40000 ALTER TABLE `user_preferences` DISABLE KEYS */;
INSERT INTO `user_preferences` VALUES (1,'light','UTC',1,'kanban','2026-11-21 13:13:54'),(8,'light','UTC',1,'dashboard','2026-11-21 16:17:38'),(22,'light','UTC',1,'dashboard','2026-11-21 17:10:00'),(42,'dark','UTC',1,'dashboard','2026-11-21 21:19:53'),(50,'light','UTC',1,'dashboard','2026-11-22 08:02:40'),(51,'dark','UTC',1,'dashboard','2026-11-22 09:09:07'),(54,'dark','Asia/Kolkata',1,'kanban','2026-11-22 10:18:04'),(56,'dark','Asia/Kolkata',1,'kanban','2026-11-22 10:19:13'),(58,'light','UTC',1,'dashboard','2026-11-22 10:34:33'),(59,'light','UTC',1,'dashboard','2026-11-22 10:34:33'),(60,'light','UTC',1,'dashboard','2026-11-22 10:34:33'),(61,'light','UTC',1,'dashboard','2026-11-22 10:34:33'),(62,'light','UTC',1,'dashboard','2026-11-22 10:34:33'),(63,'light','UTC',1,'dashboard','2026-11-22 10:34:33');
/*!40000 ALTER TABLE `user_preferences` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('User','Admin') NOT NULL DEFAULT 'User',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`),
  KEY `idx_users_role` (`role`),
  CONSTRAINT `chk_users_name_not_blank` CHECK (char_length(trim(`name`)) > 0)
) ENGINE=InnoDB AUTO_INCREMENT=64 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Admin One','admin@example.com','$argon2id$v=19$m=65536,t=3,p=4$4euzgy+b3SSQFHtanba5iA$vseNgNe8H0Dra4REJpt5yjuYPbk+IQy0o0qpx6KKkRg','Admin','2026-11-21 08:37:55','2026-11-22 10:21:29'),(2,'Alice Sharma','alice@example.com','$2b$10$DUMMYHASHALICE000000000000000000000000000000000000000','User','2026-11-21 08:37:55','2026-11-21 12:51:38'),(3,'Bob Patil','bob@example.com','$2b$10$DUMMYHASHBOB00000000000000000000000000000000000000000','User','2026-11-21 08:37:55','2026-11-21 08:37:55'),(4,'Charlie Joshi','charlie@example.com','$2b$10$DUMMYHASHCHARLIE0000000000000000000000000000000000000','User','2026-11-21 08:37:55','2026-11-21 08:37:55'),(5,'Nitish User','nitish@example.com','$argon2id$v=19$m=65536,t=3,p=4$Nkxr+kheDEU4JLCJf9RBKw$Veg+gHQhf4AzHbbqRkVKjVSofvi58Nqs4/XHLr0KDB8','User','2026-11-21 10:59:07','2026-11-21 10:59:07'),(8,'407 B-1 NITISH GUPTA','nitishgupta7009@gmail.com','$argon2id$v=19$m=65536,t=3,p=4$E8wskoaSqDFAgMfGX+Fnmg$VjyKmUx7lrUGJ4D/w8IOYxXlrNXS7ly362jTomWH5Vo','Admin','2026-11-21 12:00:46','2026-11-22 08:08:59'),(22,'407 B-1 NITISH GUPTA','ops@grandorchid.in','$argon2id$v=19$m=65536,t=3,p=4$gKdBYe6yUMCnB0EZvNX5qg$UYttr8IfbqTV8qEu/hIXKfHlamtQVA+2gZK+suCn4XE','User','2026-11-21 17:09:59','2026-11-21 17:09:59'),(42,'Rehan Malim','rehan@gmail.com','$argon2id$v=19$m=65536,t=3,p=4$u46xKS+71nhtOKE4uq12Ug$rtpIr8SxSzgqM7as8ZoVqucvtjEFmkl+v1VHYxxPu9U','User','2026-11-21 19:46:48','2026-11-21 19:46:48'),(45,'User X','collab_user_x_1795296019@planova.com','$argon2id$v=19$m=65536,t=3,p=4$lIBmvJVvMNdJuePgtkUfew$YpJ4piuyz4GleTAl7akOsm+jueyy9sHx1WkEmk8tomE','User','2026-11-21 21:20:19','2026-11-21 21:20:19'),(46,'User Y','collab_user_y_1795296019@planova.com','$argon2id$v=19$m=65536,t=3,p=4$V/FAmsdGRt9BVQIigcmpXg$NFg2oY6MKgA6fqSB6jxA6nN6e1FTmzp4+zZbbVVu4xw','User','2026-11-21 21:20:20','2026-11-21 21:20:20'),(47,'User X','collab_user_x_1795299336@planova.com','$argon2id$v=19$m=65536,t=3,p=4$b+CUcLgJatxKurt8z1u/bg$xboGIix482BPhyo3eEbbNVGePCH+MR+HPlYivgAqfe4','User','2026-11-21 22:15:36','2026-11-21 22:15:36'),(48,'User Y','collab_user_y_1795299336@planova.com','$argon2id$v=19$m=65536,t=3,p=4$D8WYlv01wtdq0dIMPLpc2Q$A+S/pyX1Furx4MwMRR6OmdrstgUsb2GsCwlIe0Z97EE','User','2026-11-21 22:15:36','2026-11-21 22:15:36'),(50,'Saraswati','she@gmail.com','$argon2id$v=19$m=65536,t=3,p=4$9+XyKTIAlc69vDJqy+M46g$wOBQKkIdDJo3kZytRZt0yx4MDMfPYGKnRTsddtgoaQ4','User','2026-11-22 08:01:48','2026-11-22 08:01:48'),(51,'Nitish','nitish@gmail.com','$argon2id$v=19$m=65536,t=3,p=4$1cUEzRzoSFmf4nxWDdJv9w$XpU4EUTsaWWRoTAisY9Fbc9IAY8Onh9ZNZqZOi4UCEc','User','2026-11-22 09:06:55','2026-11-22 09:06:55'),(52,'User X','collab_user_x_1795342642@planova.com','$argon2id$v=19$m=65536,t=3,p=4$3E8OuW7sBqb63hPMbUdGFw$r6Ozs6xq4glvbnlYHlyi46k4CVjJabxZmDOnjXZqqyo','User','2026-11-22 10:17:23','2026-11-22 10:17:23'),(53,'User Y','collab_user_y_1795342642@planova.com','$argon2id$v=19$m=65536,t=3,p=4$fgFnnmU/2/BiHhep0ApNWA$5PNrbIRFRZmI0aKk6Bu+tHXsHlJZv8h4grKs+thd/sE','User','2026-11-22 10:17:24','2026-11-22 10:17:24'),(54,'User Alpha','user_a_58164233@planova.com','$argon2id$v=19$m=65536,t=3,p=4$PK2y8Vn1fzrHtgFJSZi+Sg$lf62E6Lw2jJLY3sF4bHBptx38EMjRS2SwWuvmK18HG8','User','2026-11-22 10:18:02','2026-11-22 10:18:02'),(55,'User Beta','user_b_58164233@planova.com','$argon2id$v=19$m=65536,t=3,p=4$Y86fwT8UWSPV17AQV/4rQA$U6EnVg2lCAZU0V2B428/Q6ddmBxLmwChoV+HYgrbM7Y','User','2026-11-22 10:18:02','2026-11-22 10:18:03'),(56,'User Alpha','user_a_72a0e158@planova.com','$argon2id$v=19$m=65536,t=3,p=4$5W3HRH4WXIcsYWCRC+QS0Q$TZpjVChusfn5qk0CB7U1qLrPeT+54Iq5eocUamPM0KY','User','2026-11-22 10:19:06','2026-11-22 10:19:06'),(57,'User Beta','user_b_72a0e158@planova.com','$argon2id$v=19$m=65536,t=3,p=4$KwIU2h4VZHa2PgGSvrlEqw$L/P+ziBHu+H3ZSn5mqHCi2tCrqHbkEtDkfXkjuflaN4','User','2026-11-22 10:19:08','2026-11-22 10:19:11'),(58,'Sarthak Kene','sarthak@planova.com','$argon2id$v=19$m=65536,t=3,p=4$uAmsACxsE+WWgJUNfljLUw$VmXLyrdJdZqLlj0rRZzKlug5RmbStWG2rwZNb3OBc5A','User','2026-11-22 10:34:33','2026-11-22 10:34:33'),(59,'Rehan Malim','rehan@planova.com','$argon2id$v=19$m=65536,t=3,p=4$uAmsACxsE+WWgJUNfljLUw$VmXLyrdJdZqLlj0rRZzKlug5RmbStWG2rwZNb3OBc5A','User','2026-11-22 10:34:33','2026-11-22 10:34:33'),(60,'Sanskruti','sanskruti@planova.com','$argon2id$v=19$m=65536,t=3,p=4$uAmsACxsE+WWgJUNfljLUw$VmXLyrdJdZqLlj0rRZzKlug5RmbStWG2rwZNb3OBc5A','User','2026-11-22 10:34:33','2026-11-22 10:34:33'),(61,'Ishwari','ishwari@planova.com','$argon2id$v=19$m=65536,t=3,p=4$uAmsACxsE+WWgJUNfljLUw$VmXLyrdJdZqLlj0rRZzKlug5RmbStWG2rwZNb3OBc5A','User','2026-11-22 10:34:33','2026-11-22 10:34:33'),(62,'Sanyukta','sanyukta@planova.com','$argon2id$v=19$m=65536,t=3,p=4$uAmsACxsE+WWgJUNfljLUw$VmXLyrdJdZqLlj0rRZzKlug5RmbStWG2rwZNb3OBc5A','User','2026-11-22 10:34:33','2026-11-22 10:34:33'),(63,'Mohan','mohan@planova.com','$argon2id$v=19$m=65536,t=3,p=4$uAmsACxsE+WWgJUNfljLUw$VmXLyrdJdZqLlj0rRZzKlug5RmbStWG2rwZNb3OBc5A','User','2026-11-22 10:34:33','2026-11-22 10:34:33');
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

-- Dump completed on 2026-11-22 16:07:22
