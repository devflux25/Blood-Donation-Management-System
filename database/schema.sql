-- ============================================================================
-- Blood Donation Management System (BDMS) - MySQL Relational Database Schema
-- Compatible with MySQL 8.0+
-- Database: blood_donation_db
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `blood_donation_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `blood_donation_db`;

-- Drop tables in reverse foreign-key dependency order if safe re-creation is needed
-- (Disabled by default to avoid accidental data loss)

-- ----------------------------------------------------------------------------
-- 1. Table: users
-- Application administrators, managers, and staff members
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `full_name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(120) NOT NULL UNIQUE,
  `hashed_password` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'staff') NOT NULL DEFAULT 'staff',
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 2. Table: donors
-- Registered blood donors with contact, medical eligibility flag, and history
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `donors` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `donor_code` VARCHAR(20) NOT NULL UNIQUE,
  `full_name` VARCHAR(120) NOT NULL,
  `email` VARCHAR(120) NULL,
  `phone` VARCHAR(25) NOT NULL,
  `date_of_birth` DATE NOT NULL,
  `gender` ENUM('Male', 'Female', 'Other') NOT NULL,
  `blood_group` ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') NOT NULL,
  `address` VARCHAR(255) NULL,
  `city` VARCHAR(80) NOT NULL,
  `is_eligible` BOOLEAN NOT NULL DEFAULT TRUE,
  `last_donation_date` DATE NULL,
  `notes` TEXT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_donors_blood_group` (`blood_group`),
  INDEX `idx_donors_phone` (`phone`),
  INDEX `idx_donors_eligibility` (`is_eligible`, `is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 3. Table: hospitals
-- Partner hospitals, trauma centers, and medical institutions requesting blood
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `hospitals` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `hospital_code` VARCHAR(20) NOT NULL UNIQUE,
  `name` VARCHAR(150) NOT NULL,
  `license_number` VARCHAR(50) NOT NULL UNIQUE,
  `contact_person` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(25) NOT NULL,
  `email` VARCHAR(120) NOT NULL,
  `address` VARCHAR(255) NOT NULL,
  `city` VARCHAR(80) NOT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_hospitals_city` (`city`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 4. Table: donation_events
-- Blood donation camps and community mobilization events
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `donation_events` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `event_code` VARCHAR(20) NOT NULL UNIQUE,
  `title` VARCHAR(150) NOT NULL,
  `organizer` VARCHAR(120) NOT NULL,
  `venue` VARCHAR(255) NOT NULL,
  `city` VARCHAR(80) NOT NULL,
  `event_date` DATE NOT NULL,
  `start_time` TIME NOT NULL,
  `end_time` TIME NOT NULL,
  `capacity` INT NOT NULL DEFAULT 100,
  `status` ENUM('Upcoming', 'Ongoing', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Upcoming',
  `description` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_events_date` (`event_date`),
  INDEX `idx_events_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 5. Table: event_registrations
-- Donor pre-registrations for specific donation events
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `event_registrations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `event_id` INT NOT NULL,
  `donor_id` INT NOT NULL,
  `registered_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` ENUM('Registered', 'Attended', 'Cancelled') NOT NULL DEFAULT 'Registered',
  CONSTRAINT `fk_reg_event` FOREIGN KEY (`event_id`) REFERENCES `donation_events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_reg_donor` FOREIGN KEY (`donor_id`) REFERENCES `donors` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `uq_event_donor` UNIQUE (`event_id`, `donor_id`),
  INDEX `idx_reg_event` (`event_id`),
  INDEX `idx_reg_donor` (`donor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 6. Table: donations
-- Individual donation records with medical screening checks
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `donations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `donation_code` VARCHAR(25) NOT NULL UNIQUE,
  `donor_id` INT NOT NULL,
  `event_id` INT NULL,
  `donation_date` DATE NOT NULL,
  `blood_group` ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') NOT NULL,
  `component_type` ENUM('Whole Blood', 'Red Blood Cells', 'Platelets', 'Plasma') NOT NULL DEFAULT 'Whole Blood',
  `units` INT NOT NULL DEFAULT 1,
  `hemoglobin_g_dl` DECIMAL(4, 1) NULL,
  `blood_pressure` VARCHAR(20) NULL,
  `pulse_rate` INT NULL,
  `screening_status` ENUM('Passed', 'Failed', 'Deferred') NOT NULL DEFAULT 'Passed',
  `status` ENUM('Scheduled', 'Completed', 'Rejected', 'Cancelled') NOT NULL DEFAULT 'Scheduled',
  `inventory_generated` BOOLEAN NOT NULL DEFAULT FALSE,
  `remarks` TEXT NULL,
  `recorded_by` INT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_donations_donor` FOREIGN KEY (`donor_id`) REFERENCES `donors` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_donations_event` FOREIGN KEY (`event_id`) REFERENCES `donation_events` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_donations_user` FOREIGN KEY (`recorded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  INDEX `idx_donations_donor` (`donor_id`),
  INDEX `idx_donations_date` (`donation_date`),
  INDEX `idx_donations_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 7. Table: blood_inventory
-- Traceable individual inventory batches generated from completed donations
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `blood_inventory` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `batch_number` VARCHAR(30) NOT NULL UNIQUE,
  `donation_id` INT NULL,
  `blood_group` ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') NOT NULL,
  `component_type` ENUM('Whole Blood', 'Red Blood Cells', 'Platelets', 'Plasma') NOT NULL DEFAULT 'Whole Blood',
  `volume_ml` INT NOT NULL DEFAULT 450,
  `collection_date` DATE NOT NULL,
  `expiry_date` DATE NOT NULL,
  `status` ENUM('Available', 'Reserved', 'Issued', 'Expired', 'Discarded') NOT NULL DEFAULT 'Available',
  `storage_location` VARCHAR(50) NOT NULL DEFAULT 'Main Cold Room - Shelf A',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_inventory_donation` FOREIGN KEY (`donation_id`) REFERENCES `donations` (`id`) ON DELETE SET NULL,
  INDEX `idx_inv_group_status` (`blood_group`, `status`),
  INDEX `idx_inv_expiry` (`expiry_date`),
  INDEX `idx_inv_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 8. Table: blood_requests
-- Requests raised by hospitals for emergency or scheduled surgeries
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `blood_requests` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `request_code` VARCHAR(25) NOT NULL UNIQUE,
  `hospital_id` INT NOT NULL,
  `patient_name` VARCHAR(100) NULL,
  `blood_group` ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') NOT NULL,
  `component_type` ENUM('Whole Blood', 'Red Blood Cells', 'Platelets', 'Plasma') NOT NULL DEFAULT 'Whole Blood',
  `units_requested` INT NOT NULL,
  `units_fulfilled` INT NOT NULL DEFAULT 0,
  `urgency` ENUM('Normal', 'Urgent', 'Critical') NOT NULL DEFAULT 'Normal',
  `required_date` DATE NOT NULL,
  `status` ENUM('Pending', 'Approved', 'Partially Fulfilled', 'Fulfilled', 'Rejected', 'Cancelled') NOT NULL DEFAULT 'Pending',
  `notes` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `chk_units_requested_positive` CHECK (`units_requested` > 0),
  CONSTRAINT `chk_units_fulfilled_valid` CHECK (`units_fulfilled` >= 0 AND `units_fulfilled` <= `units_requested`),
  CONSTRAINT `fk_requests_hospital` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`id`) ON DELETE RESTRICT,
  INDEX `idx_requests_hospital` (`hospital_id`),
  INDEX `idx_requests_status` (`status`),
  INDEX `idx_requests_urgency` (`urgency`),
  INDEX `idx_requests_blood_group` (`blood_group`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 9. Table: blood_issues
-- Blood issue transactions linked to an approved hospital request
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `blood_issues` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `issue_code` VARCHAR(25) NOT NULL UNIQUE,
  `request_id` INT NOT NULL,
  `units_issued` INT NOT NULL,
  `issued_date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `issued_by` INT NULL,
  `recipient_name` VARCHAR(100) NOT NULL,
  `notes` TEXT NULL,
  CONSTRAINT `chk_issue_units_positive` CHECK (`units_issued` > 0),
  CONSTRAINT `fk_issues_request` FOREIGN KEY (`request_id`) REFERENCES `blood_requests` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_issues_user` FOREIGN KEY (`issued_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  INDEX `idx_issues_request` (`request_id`),
  INDEX `idx_issues_date` (`issued_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 10. Table: blood_issue_items
-- Batch-level allocation for full traceability from donor batch to hospital
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `blood_issue_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `issue_id` INT NOT NULL,
  `inventory_id` INT NOT NULL,
  CONSTRAINT `fk_issue_items_issue` FOREIGN KEY (`issue_id`) REFERENCES `blood_issues` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_issue_items_inv` FOREIGN KEY (`inventory_id`) REFERENCES `blood_inventory` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `uq_issue_inventory` UNIQUE (`inventory_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 11. Table: system_settings
-- Configurable software operational rules (thresholds, deferral periods)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `system_settings` (
  `setting_key` VARCHAR(50) PRIMARY KEY,
  `setting_value` VARCHAR(255) NOT NULL,
  `description` VARCHAR(255) NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default system settings safely
INSERT INTO `system_settings` (`setting_key`, `setting_value`, `description`)
VALUES
  ('low_stock_threshold', '5', 'Warning threshold in units per blood group'),
  ('expiring_soon_days', '7', 'Number of days ahead to flag inventory as expiring soon'),
  ('min_donation_gap_days', '90', 'Minimum required gap in days between consecutive blood donations'),
  ('whole_blood_shelf_life_days', '42', 'Shelf life of whole blood units in days')
ON DUPLICATE KEY UPDATE `description` = VALUES(`description`);

-- ----------------------------------------------------------------------------
-- 12. Helpful Database Views for Reporting
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW `vw_available_stock_by_group` AS
SELECT 
  `blood_group`,
  `component_type`,
  COUNT(*) AS `available_units`,
  MIN(`expiry_date`) AS `earliest_expiry`
FROM `blood_inventory`
WHERE `status` = 'Available' AND `expiry_date` >= CURDATE()
GROUP BY `blood_group`, `component_type`;

CREATE OR REPLACE VIEW `vw_hospital_demand_summary` AS
SELECT
  h.`id` AS `hospital_id`,
  h.`name` AS `hospital_name`,
  h.`city`,
  COUNT(r.`id`) AS `total_requests`,
  COALESCE(SUM(r.`units_requested`), 0) AS `total_units_requested`,
  COALESCE(SUM(r.`units_fulfilled`), 0) AS `total_units_fulfilled`,
  SUM(CASE WHEN r.`status` = 'Pending' THEN 1 ELSE 0 END) AS `pending_requests`
FROM `hospitals` h
LEFT JOIN `blood_requests` r ON h.`id` = r.`hospital_id`
GROUP BY h.`id`, h.`name`, h.`city`;
