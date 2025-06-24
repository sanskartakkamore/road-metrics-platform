"""
Database setup script for Road Metrics Platform
Creates tables for storing road defect data
"""

import sqlite3
from datetime import datetime

def create_database():
    """Create database and tables for the Road Metrics platform"""
    
    # Connect to SQLite database (creates file if doesn't exist)
    conn = sqlite3.connect('road_metrics.db')
    cursor = conn.cursor()
    
    # Create defects table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS defects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            defect_type VARCHAR(50) NOT NULL,
            severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
            notes TEXT,
            vehicle_id VARCHAR(50),
            timestamp DATETIME NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create index for better query performance
    cursor.execute('''
        CREATE INDEX IF NOT EXISTS idx_defects_location 
        ON defects (latitude, longitude)
    ''')
    
    cursor.execute('''
        CREATE INDEX IF NOT EXISTS idx_defects_timestamp 
        ON defects (timestamp)
    ''')
    
    cursor.execute('''
        CREATE INDEX IF NOT EXISTS idx_defects_severity 
        ON defects (severity)
    ''')
    
    # Create analytics table for aggregated data
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS analytics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            metric_name VARCHAR(100) NOT NULL,
            metric_value TEXT NOT NULL,
            calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create vehicles table for tracking reporting vehicles
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS vehicles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            vehicle_id VARCHAR(50) UNIQUE NOT NULL,
            last_report_timestamp DATETIME,
            total_reports INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()
    
    print("Database and tables created successfully!")
    print("Tables created:")
    print("- defects: Main table for storing road defect reports")
    print("- analytics: Table for storing calculated metrics")
    print("- vehicles: Table for tracking reporting vehicles")

if __name__ == "__main__":
    create_database()
