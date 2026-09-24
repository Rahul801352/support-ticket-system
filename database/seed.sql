-- Support Ticket Management System Seed Data
-- Run after schema.sql

USE support_tickets;

-- Clear existing data
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE ticket_comments;
TRUNCATE TABLE tickets;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- Password for all seed users is: Password123!
-- Bcrypt Hash: $2b$10$M/UzByRg2fLnKyRee1Y5e.Li77aZdk/RyoRKbKcAqmdCMCRta3Afe (Password123!)
-- 1. Insert seed users (2 Customers, 2 Support Agents)
INSERT INTO users (id, name, email, password_hash, role) VALUES
(1, 'John Doe', 'john@example.com', '$2b$10$M/UzByRg2fLnKyRee1Y5e.Li77aZdk/RyoRKbKcAqmdCMCRta3Afe', 'customer'),
(2, 'Jane Smith', 'jane@example.com', '$2b$10$M/UzByRg2fLnKyRee1Y5e.Li77aZdk/RyoRKbKcAqmdCMCRta3Afe', 'customer'),
(3, 'Sarah Connor', 'agent.sarah@example.com', '$2b$10$M/UzByRg2fLnKyRee1Y5e.Li77aZdk/RyoRKbKcAqmdCMCRta3Afe', 'agent'),
(4, 'Mike Ross', 'agent.mike@example.com', '$2b$10$M/UzByRg2fLnKyRee1Y5e.Li77aZdk/RyoRKbKcAqmdCMCRta3Afe', 'agent');

-- 2. Insert sample tickets
INSERT INTO tickets (id, user_id, subject, description, priority, status, assigned_to) VALUES
(1, 1, 'Cannot connect to company VPN', 'Whenever I launch the VPN client, it gets stuck at 80% authenticating and then times out.', 'high', 'open', NULL),
(2, 1, 'Password reset request for Portal', 'I forgot my password for the customer portal and the email reset link has expired.', 'medium', 'in_progress', 3),
(3, 2, 'Billing inquiry for March invoice', 'My invoice shows an unexpected charge of $49.99 for extra usage. Please explain.', 'low', 'open', NULL),
(4, 2, 'System crash during report export', 'Exporting CSV report larger than 5000 rows causes a 504 Gateway Timeout error.', 'high', 'closed', 4);

-- 3. Insert sample comments
INSERT INTO ticket_comments (id, ticket_id, user_id, comment) VALUES
(1, 2, 1, 'I tried clicking the link again this morning but still getting expired message.'),
(2, 2, 3, 'Hi John, I have generated a new temporary reset link and sent it to your registered email.'),
(3, 4, 2, 'The report export issue is resolved after the latest system patch.'),
(4, 4, 4, 'Marking this ticket as closed as verified by customer.');

-- Mandatory Assessment Query Example:
-- Query returning all open tickets along with customer name and email:
-- SELECT tickets.id, tickets.subject, tickets.status, users.name AS customer_name, users.email
-- FROM tickets
-- JOIN users ON tickets.user_id = users.id
-- WHERE tickets.status = 'open';
