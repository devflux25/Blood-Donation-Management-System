-- ============================================================================
-- Blood Donation Management System (BDMS) - Fictional Seed Data
-- ============================================================================
USE `blood_donation_db`;

-- Disable foreign key checks momentarily for idempotent clean seeding
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Initial Users (Passwords are bcrypt hashed 'Admin@123' and 'Staff@123')
INSERT INTO `users` (`id`, `full_name`, `email`, `hashed_password`, `role`, `is_active`)
VALUES
  (1, 'Administrator', 'admin@bloodbank.org', '$2b$12$WynhN.HmnBRo0i.037VgZuY/OkGHf31G9Pr/X46UT2T1Qh7gAZjny', 'admin', 1),
  (2, 'Sarah Jenkins', 's.jenkins@bloodbank.org', '$2b$12$XC9Mg8bdIxq04j8LIuM4xeJRnyjnu3abznc9yfgeDaV84tSSlZv02', 'staff', 1),
  (3, 'David Patel', 'd.patel@bloodbank.org', '$2b$12$XC9Mg8bdIxq04j8LIuM4xeJRnyjnu3abznc9yfgeDaV84tSSlZv02', 'staff', 1)
ON DUPLICATE KEY UPDATE `full_name` = VALUES(`full_name`), `hashed_password` = VALUES(`hashed_password`);

-- 2. Registered Donors
INSERT INTO `donors` (`id`, `donor_code`, `full_name`, `email`, `phone`, `date_of_birth`, `gender`, `blood_group`, `address`, `city`, `is_eligible`, `last_donation_date`)
VALUES
  (1, 'DNR-1001', 'Alexander Reed', 'alex.reed@example.com', '9876543210', '1992-05-14', 'Male', 'O+', '45 Greenfield Ave', 'Metropolis', 1, DATE_SUB(CURDATE(), INTERVAL 120 DAY)),
  (2, 'DNR-1002', 'Elena Rostova', 'elena.rostova@example.com', '9876543211', '1995-11-20', 'Female', 'A+', '12 High Street', 'Metropolis', 1, DATE_SUB(CURDATE(), INTERVAL 95 DAY)),
  (3, 'DNR-1003', 'Marcus Chen', 'marcus.c@example.com', '9876543212', '1988-03-30', 'Male', 'B-', '78 Riverside Dr', 'Riverdale', 1, DATE_SUB(CURDATE(), INTERVAL 140 DAY)),
  (4, 'DNR-1004', 'Priya Sharma', 'priya.s@example.com', '9876543213', '1997-08-15', 'Female', 'AB+', '9 Blossom Lane', 'Oakwood', 1, DATE_SUB(CURDATE(), INTERVAL 30 DAY)),
  (5, 'DNR-1005', 'Daniel Kim', 'daniel.kim@example.com', '9876543214', '1990-12-05', 'Male', 'O-', '23 Pinecrest Blvd', 'Metropolis', 1, DATE_SUB(CURDATE(), INTERVAL 105 DAY)),
  (6, 'DNR-1006', 'Fatima Zahra', 'fatima.z@example.com', '9876543215', '1994-07-22', 'Female', 'A-', '67 Cedar Court', 'Gotham', 1, DATE_SUB(CURDATE(), INTERVAL 180 DAY)),
  (7, 'DNR-1007', 'Liam O\'Connor', 'liam.oc@example.com', '9876543216', '1985-02-18', 'Male', 'B+', '104 Maple Way', 'Riverdale', 1, DATE_SUB(CURDATE(), INTERVAL 110 DAY)),
  (8, 'DNR-1008', 'Sophia Martinez', 'sophia.m@example.com', '9876543217', '1999-09-09', 'Female', 'AB-', '33 Elm Road', 'Oakwood', 1, NULL)
ON DUPLICATE KEY UPDATE `full_name` = VALUES(`full_name`);

-- 3. Partner Hospitals
INSERT INTO `hospitals` (`id`, `hospital_code`, `name`, `license_number`, `contact_person`, `phone`, `email`, `address`, `city`)
VALUES
  (1, 'HSP-01', 'City General Hospital', 'MED-LIC-88910', 'Dr. Robert Shaw', '011-2345678', 'emergency@citygeneral.org', '100 Medical Center Way', 'Metropolis'),
  (2, 'HSP-02', 'St. Jude Memorial Trauma Center', 'MED-LIC-77402', 'Dr. Claire Bennett', '011-8765432', 'bloodbank@stjudetrauma.org', '45 Crossroad Blvd', 'Riverdale'),
  (3, 'HSP-03', 'Sunrise Children\'s Specialty Hospital', 'MED-LIC-66291', 'Dr. Anita Desai', '011-3456789', 'pediatrics@sunrisehospital.org', '89 Hope Valley Rd', 'Oakwood'),
  (4, 'HSP-04', 'Apex Multi-Speciality Clinic', 'MED-LIC-55182', 'Dr. Vikram Malhotra', '011-9012345', 'desk@apexhospital.org', '12 Central Plaza', 'Gotham')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- 4. Donation Events
INSERT INTO `donation_events` (`id`, `event_code`, `title`, `organizer`, `venue`, `city`, `event_date`, `start_time`, `end_time`, `capacity`, `status`, `description`)
VALUES
  (1, 'EVT-2026-01', 'Metropolis University Youth Blood Drive', 'Red Cross Youth Chapter', 'Campus Auditorium Hall A', 'Metropolis', DATE_ADD(CURDATE(), INTERVAL 14 DAY), '09:00:00', '16:00:00', 120, 'Upcoming', 'Annual university campus mobilization camp with volunteer refreshments and certificates.'),
  (2, 'EVT-2026-02', 'Civic Center World Blood Donor Day Drive', 'Municipal Health Department', 'Downtown Town Hall', 'Riverdale', DATE_ADD(CURDATE(), INTERVAL 28 DAY), '10:00:00', '17:00:00', 200, 'Upcoming', 'Community open camp honoring repeat voluntary donors with on-site health checkup.'),
  (3, 'EVT-2026-03', 'Corporate Park Techies For Life Camp', 'Rotary Club City Central', 'Cyber Tower Atrium', 'Oakwood', DATE_SUB(CURDATE(), INTERVAL 7 DAY), '09:30:00', '15:30:00', 80, 'Completed', 'Corporate wellness initiative camp conducted with 65 volunteer donations collected.')
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

-- 5. Event Registrations
INSERT INTO `event_registrations` (`id`, `event_id`, `donor_id`, `status`)
VALUES
  (1, 1, 1, 'Registered'),
  (2, 1, 2, 'Registered'),
  (3, 1, 5, 'Registered'),
  (4, 2, 3, 'Registered'),
  (5, 3, 6, 'Attended')
ON DUPLICATE KEY UPDATE `status` = VALUES(`status`);

-- 6. Donations
INSERT INTO `donations` (`id`, `donation_code`, `donor_id`, `event_id`, `donation_date`, `blood_group`, `component_type`, `units`, `hemoglobin_g_dl`, `blood_pressure`, `pulse_rate`, `screening_status`, `status`, `inventory_generated`, `remarks`, `recorded_by`)
VALUES
  (1, 'DON-2026-001', 1, 3, DATE_SUB(CURDATE(), INTERVAL 20 DAY), 'O+', 'Whole Blood', 1, 14.5, '120/80', 72, 'Passed', 'Completed', 1, 'Routine voluntary donation; donor well hydrated.', 1),
  (2, 'DON-2026-002', 2, 3, DATE_SUB(CURDATE(), INTERVAL 18 DAY), 'A+', 'Whole Blood', 1, 13.8, '118/76', 70, 'Passed', 'Completed', 1, 'Standard donation without adverse reactions.', 2),
  (3, 'DON-2026-003', 3, NULL, DATE_SUB(CURDATE(), INTERVAL 15 DAY), 'B-', 'Whole Blood', 1, 15.1, '124/82', 74, 'Passed', 'Completed', 1, 'Walk-in donation at main blood center.', 1),
  (4, 'DON-2026-004', 5, NULL, DATE_SUB(CURDATE(), INTERVAL 10 DAY), 'O-', 'Whole Blood', 1, 14.2, '122/80', 68, 'Passed', 'Completed', 1, 'Universal donor emergency reserve unit.', 2),
  (5, 'DON-2026-005', 6, NULL, DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'A-', 'Whole Blood', 1, 13.5, '116/74', 72, 'Passed', 'Completed', 1, 'Clean draw, stored in refrigerator shelf B.', 1),
  (6, 'DON-2026-006', 7, NULL, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'B+', 'Whole Blood', 1, 14.9, '125/80', 76, 'Passed', 'Completed', 1, 'Scheduled center appointment.', 2),
  (7, 'DON-2026-007', 4, NULL, CURDATE(), 'AB+', 'Platelets', 1, 13.1, '115/75', 70, 'Passed', 'Scheduled', 0, 'Pre-donation check scheduled for afternoon session.', 1)
ON DUPLICATE KEY UPDATE `status` = VALUES(`status`);

-- 7. Blood Inventory Batches
INSERT INTO `blood_inventory` (`id`, `batch_number`, `donation_id`, `blood_group`, `component_type`, `volume_ml`, `collection_date`, `expiry_date`, `status`, `storage_location`)
VALUES
  (1, 'BATCH-O-POS-001', 1, 'O+', 'Whole Blood', 450, DATE_SUB(CURDATE(), INTERVAL 20 DAY), DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 20 DAY), INTERVAL 42 DAY), 'Available', 'Main Cold Room - Shelf A1'),
  (2, 'BATCH-A-POS-001', 2, 'A+', 'Whole Blood', 450, DATE_SUB(CURDATE(), INTERVAL 18 DAY), DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 18 DAY), INTERVAL 42 DAY), 'Available', 'Main Cold Room - Shelf A2'),
  (3, 'BATCH-B-NEG-001', 3, 'B-', 'Whole Blood', 450, DATE_SUB(CURDATE(), INTERVAL 15 DAY), DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 15 DAY), INTERVAL 42 DAY), 'Available', 'Main Cold Room - Shelf B1'),
  (4, 'BATCH-O-NEG-001', 4, 'O-', 'Whole Blood', 450, DATE_SUB(CURDATE(), INTERVAL 10 DAY), DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 10 DAY), INTERVAL 42 DAY), 'Available', 'Critical Storage Safe Box 1'),
  (5, 'BATCH-A-NEG-001', 5, 'A-', 'Whole Blood', 450, DATE_SUB(CURDATE(), INTERVAL 5 DAY), DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 5 DAY), INTERVAL 42 DAY), 'Available', 'Main Cold Room - Shelf B2'),
  (6, 'BATCH-B-POS-001', 6, 'B+', 'Whole Blood', 450, DATE_SUB(CURDATE(), INTERVAL 2 DAY), DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 2 DAY), INTERVAL 42 DAY), 'Available', 'Main Cold Room - Shelf A3'),
  (7, 'BATCH-AB-POS-001', NULL, 'AB+', 'Platelets', 300, DATE_SUB(CURDATE(), INTERVAL 1 DAY), DATE_ADD(CURDATE(), INTERVAL 4 DAY), 'Available', 'Agitator Unit 1'),
  (8, 'BATCH-AB-NEG-001', NULL, 'AB-', 'Whole Blood', 450, DATE_SUB(CURDATE(), INTERVAL 39 DAY), DATE_ADD(CURDATE(), INTERVAL 3 DAY), 'Available', 'Main Cold Room - Shelf C1'),
  (9, 'BATCH-OLD-EXP-01', NULL, 'O+', 'Whole Blood', 450, DATE_SUB(CURDATE(), INTERVAL 50 DAY), DATE_SUB(CURDATE(), INTERVAL 8 DAY), 'Expired', 'Quarantine Shelf Q1')
ON DUPLICATE KEY UPDATE `status` = VALUES(`status`);

-- 8. Hospital Blood Requests
INSERT INTO `blood_requests` (`id`, `request_code`, `hospital_id`, `patient_name`, `blood_group`, `component_type`, `units_requested`, `units_fulfilled`, `urgency`, `required_date`, `status`, `notes`)
VALUES
  (1, 'REQ-2026-101', 1, 'Grace Hopper', 'O+', 'Whole Blood', 2, 1, 'Critical', CURDATE(), 'Partially Fulfilled', 'Cardiac surgical backup required immediately.'),
  (2, 'REQ-2026-102', 2, 'Alan Turing', 'A+', 'Whole Blood', 1, 1, 'Normal', DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'Fulfilled', 'Orthopedic knee reconstruction operation.'),
  (3, 'REQ-2026-103', 3, 'Baby Leo', 'O-', 'Whole Blood', 1, 0, 'Critical', DATE_ADD(CURDATE(), INTERVAL 1 DAY), 'Approved', 'Pediatric ICU neonatal urgent exchange.'),
  (4, 'REQ-2026-104', 4, 'Margaret Hamilton', 'B+', 'Whole Blood', 3, 0, 'Urgent', DATE_ADD(CURDATE(), INTERVAL 2 DAY), 'Pending', 'Scheduled oncological surgery preparation.')
ON DUPLICATE KEY UPDATE `status` = VALUES(`status`);

-- 9. Blood Issues & Audit Items
INSERT INTO `blood_issues` (`id`, `issue_code`, `request_id`, `units_issued`, `issued_date`, `issued_by`, `recipient_name`, `notes`)
VALUES
  (1, 'ISS-2026-001', 2, 1, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 1, 'Nurse Sarah Adams', 'Delivered via temperature controlled cold transporter.'),
  (2, 'ISS-2026-002', 1, 1, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 2, 'EMT James Wright', 'First unit delivered for emergency bypass prep.')
ON DUPLICATE KEY UPDATE `recipient_name` = VALUES(`recipient_name`);

SET FOREIGN_KEY_CHECKS = 1;
