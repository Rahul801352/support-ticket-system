-- Support Ticket Management System Database Schema
-- Database Name: support_tickets

CREATE DATABASE IF NOT EXISTS support_tickets;
USE support_tickets;

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS ticket_comments;
DROP TABLE IF EXISTS tickets;
DROP TABLE IF EXISTS users;

-- 1. Users table (Stores both Customers and Support Agents)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('customer', 'agent') NOT NULL DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Tickets table (Stores support tickets raised by customers)
CREATE TABLE tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    subject VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    status ENUM('open', 'in_progress', 'closed') DEFAULT 'open',
    assigned_to INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_user_id (user_id),
    INDEX idx_assigned_to (assigned_to)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Ticket Comments table (Stores conversation thread/responses for tickets)
CREATE TABLE ticket_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    user_id INT NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_ticket_id (ticket_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
