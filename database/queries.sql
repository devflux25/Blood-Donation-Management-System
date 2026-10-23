-- ============================================================================
-- Blood Donation Management System (BDMS) - Essential Database Queries
-- Demonstrating DBMS concepts: aggregation, grouping, joins, subqueries, CTEs,
-- transactions, analytical views, and inventory tracking.
-- ============================================================================
USE `blood_donation_db`;

-- ----------------------------------------------------------------------------
-- 1. SELECT, WHERE, ORDER BY, DISTINCT: Available eligible donors in Metropolis
-- ----------------------------------------------------------------------------
SELECT DISTINCT 
  donor_code, 
  full_name, 
  blood_group, 
  phone, 
  city, 
  last_donation_date
FROM donors
WHERE is_eligible = TRUE 
  AND is_active = TRUE 
  AND city = 'Metropolis'
ORDER BY full_name ASC;

-- ----------------------------------------------------------------------------
-- 2. Aggregations (COUNT, SUM, AVG, MIN, MAX): Overall inventory statistics
-- ----------------------------------------------------------------------------
SELECT 
  COUNT(*) AS total_batches,
  SUM(CASE WHEN status = 'Available' THEN 1 ELSE 0 END) AS available_units,
  AVG(volume_ml) AS average_volume_ml,
  MIN(expiry_date) AS nearest_expiration,
  MAX(expiry_date) AS furthest_expiration
FROM blood_inventory;

-- ----------------------------------------------------------------------------
-- 3. GROUP BY and HAVING: Blood groups with low inventory count (< 3 units)
-- ----------------------------------------------------------------------------
SELECT 
  blood_group, 
  COUNT(*) AS unit_count
FROM blood_inventory
WHERE status = 'Available' AND expiry_date >= CURDATE()
GROUP BY blood_group
HAVING unit_count < 3
ORDER BY unit_count ASC;

-- ----------------------------------------------------------------------------
-- 4. Multi-Table INNER JOIN: Traceable completed donations with donor info
-- ----------------------------------------------------------------------------
SELECT 
  d.donation_code,
  d.donation_date,
  dnr.full_name AS donor_name,
  dnr.blood_group,
  d.component_type,
  d.screening_status,
  COALESCE(e.title, 'Walk-in Center') AS event_name,
  u.full_name AS recorded_by_staff
FROM donations d
INNER JOIN donors dnr ON d.donor_id = dnr.id
LEFT JOIN donation_events e ON d.event_id = e.id
LEFT JOIN users u ON d.recorded_by = u.id
WHERE d.status = 'Completed'
ORDER BY d.donation_date DESC;

-- ----------------------------------------------------------------------------
-- 5. LEFT JOIN: Hospitals with their request summary and fulfilled units
-- ----------------------------------------------------------------------------
SELECT 
  h.id AS hospital_id,
  h.name AS hospital_name,
  h.city,
  COUNT(r.id) AS total_requests,
  COALESCE(SUM(r.units_requested), 0) AS units_requested,
  COALESCE(SUM(r.units_fulfilled), 0) AS units_fulfilled,
  COALESCE(SUM(r.units_requested - r.units_fulfilled), 0) AS units_backlogged
FROM hospitals h
LEFT JOIN blood_requests r ON h.id = r.hospital_id
GROUP BY h.id, h.name, h.city
ORDER BY units_backlogged DESC;

-- ----------------------------------------------------------------------------
-- 6. Subqueries: Find donors who have never donated or whose last donation was >180 days ago
-- ----------------------------------------------------------------------------
SELECT 
  donor_code, 
  full_name, 
  blood_group, 
  phone, 
  last_donation_date
FROM donors
WHERE id NOT IN (
  SELECT DISTINCT donor_id 
  FROM donations 
  WHERE donation_date >= DATE_SUB(CURDATE(), INTERVAL 180 DAY)
)
AND is_active = TRUE;

-- ----------------------------------------------------------------------------
-- 7. Common Table Expression (CTE): Monthly donation counts and volume
-- ----------------------------------------------------------------------------
WITH MonthlyDonationSummary AS (
  SELECT 
    DATE_FORMAT(donation_date, '%Y-%m') AS donation_month,
    blood_group,
    COUNT(*) AS total_donations,
    SUM(units) AS total_units
  FROM donations
  WHERE status = 'Completed'
  GROUP BY DATE_FORMAT(donation_date, '%Y-%m'), blood_group
)
SELECT 
  donation_month,
  blood_group,
  total_donations,
  total_units
FROM MonthlyDonationSummary
ORDER BY donation_month DESC, blood_group ASC;

-- ----------------------------------------------------------------------------
-- 8. Event Participation and Capacity Utilization Query
-- ----------------------------------------------------------------------------
SELECT 
  e.event_code,
  e.title,
  e.event_date,
  e.capacity,
  COUNT(er.id) AS registered_count,
  ROUND((COUNT(er.id) / e.capacity) * 100, 1) AS capacity_percent
FROM donation_events e
LEFT JOIN event_registrations er ON e.id = er.event_id
GROUP BY e.id, e.event_code, e.title, e.event_date, e.capacity
ORDER BY e.event_date ASC;

-- ----------------------------------------------------------------------------
-- 9. Expiring-Soon Inventory Batches (Within 7 Days)
-- ----------------------------------------------------------------------------
SELECT 
  batch_number,
  blood_group,
  component_type,
  volume_ml,
  expiry_date,
  DATEDIFF(expiry_date, CURDATE()) AS days_to_expiry,
  storage_location
FROM blood_inventory
WHERE status = 'Available'
  AND expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
ORDER BY expiry_date ASC;

-- ----------------------------------------------------------------------------
-- 10. Data Modification with Safe Transaction (Simulating Blood Issuing)
-- ----------------------------------------------------------------------------
-- Explanation: To issue blood, we lock the batch, update batch status, insert 
-- an issue record, allocate the batch in blood_issue_items, and update request progress.
START TRANSACTION;

-- Step A: Select and lock available unit (FIFO: Earliest Expiry First)
SELECT id, batch_number, expiry_date 
FROM blood_inventory
WHERE blood_group = 'O+' 
  AND component_type = 'Whole Blood' 
  AND status = 'Available' 
  AND expiry_date >= CURDATE()
ORDER BY expiry_date ASC
LIMIT 1
FOR UPDATE;

-- Step B: Mark batch as Issued (Example ID: 1)
UPDATE blood_inventory 
SET status = 'Issued', updated_at = CURRENT_TIMESTAMP
WHERE id = 1 AND status = 'Available';

-- Step C: Record blood issue entry (Example request ID: 1)
INSERT INTO blood_issues (issue_code, request_id, units_issued, issued_by, recipient_name, notes)
VALUES ('ISS-TRAN-DEMO', 1, 1, 1, 'Emergency OT Staff', 'Allocated under ACID transaction');

-- Step D: Map inventory batch to blood issue item
INSERT INTO blood_issue_items (issue_id, inventory_id)
VALUES (LAST_INSERT_ID(), 1);

-- Step E: Update request fulfillment progress
UPDATE blood_requests
SET 
  units_fulfilled = units_fulfilled + 1,
  status = CASE WHEN units_fulfilled + 1 >= units_requested THEN 'Fulfilled' ELSE 'Partially Fulfilled' END
WHERE id = 1;

-- Commit transaction (or ROLLBACK if error occurs)
COMMIT;
