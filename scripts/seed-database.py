"""
Seed script to populate the database with sample data
"""

import sqlite3
import json
from datetime import datetime, timedelta
import random

def seed_database():
    """Populate database with sample defect data"""
    
    conn = sqlite3.connect('road_metrics.db')
    cursor = conn.cursor()
    
    # Sample data
    defect_types = ['pothole', 'crack', 'minor_pothole', 'surface_damage', 'road_marking_fade', 'debris', 'water_damage']
    severities = ['low', 'medium', 'high', 'critical']
    severity_weights = [0.4, 0.3, 0.2, 0.1]  # More low severity issues
    
    # Bangalore coordinates range
    lat_range = (12.8, 13.1)
    lng_range = (77.4, 77.8)
    
    sample_defects = []
    
    # Generate 50 sample defects
    for i in range(50):
        # Random location in Bangalore
        lat = random.uniform(*lat_range)
        lng = random.uniform(*lng_range)
        
        # Random defect type and severity
        defect_type = random.choice(defect_types)
        severity = random.choices(severities, weights=severity_weights)[0]
        
        # Random timestamp within last 30 days
        days_ago = random.randint(0, 30)
        hours_ago = random.randint(0, 23)
        timestamp = datetime.now() - timedelta(days=days_ago, hours=hours_ago)
        
        # Optional vehicle ID (70% chance)
        vehicle_id = f"V{random.randint(100, 999)}" if random.random() < 0.7 else None
        
        # Optional notes (40% chance)
        notes = None
        if random.random() < 0.4:
            note_templates = [
                f"Large {defect_type} affecting traffic flow",
                f"Multiple {defect_type}s in this area",
                f"Urgent repair needed for this {defect_type}",
                f"Safety hazard - {defect_type} causing vehicle damage",
                f"Weather-related {defect_type} formation"
            ]
            notes = random.choice(note_templates)
        
        sample_defects.append((
            lat, lng, defect_type, severity, notes, vehicle_id, timestamp.isoformat()
        ))
    
    # Insert sample data
    cursor.executemany('''
        INSERT INTO defects (latitude, longitude, defect_type, severity, notes, vehicle_id, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', sample_defects)
    
    # Update vehicle tracking
    vehicle_reports = {}
    for defect in sample_defects:
        if defect[5]:  # vehicle_id exists
            vehicle_id = defect[5]
            if vehicle_id not in vehicle_reports:
                vehicle_reports[vehicle_id] = {'count': 0, 'last_timestamp': defect[6]}
            vehicle_reports[vehicle_id]['count'] += 1
            if defect[6] > vehicle_reports[vehicle_id]['last_timestamp']:
                vehicle_reports[vehicle_id]['last_timestamp'] = defect[6]
    
    # Insert vehicle data
    for vehicle_id, data in vehicle_reports.items():
        cursor.execute('''
            INSERT OR REPLACE INTO vehicles (vehicle_id, last_report_timestamp, total_reports)
            VALUES (?, ?, ?)
        ''', (vehicle_id, data['last_timestamp'], data['count']))
    
    # Calculate and store analytics
    analytics_data = []
    
    # Total defects
    cursor.execute('SELECT COUNT(*) FROM defects')
    total_defects = cursor.fetchone()[0]
    analytics_data.append(('total_defects', str(total_defects)))
    
    # Defects by type
    cursor.execute('SELECT defect_type, COUNT(*) FROM defects GROUP BY defect_type')
    type_counts = dict(cursor.fetchall())
    analytics_data.append(('defects_by_type', json.dumps(type_counts)))
    
    # Defects by severity
    cursor.execute('SELECT severity, COUNT(*) FROM defects GROUP BY severity')
    severity_counts = dict(cursor.fetchall())
    analytics_data.append(('defects_by_severity', json.dumps(severity_counts)))
    
    # Recent activity (last 7 days)
    week_ago = (datetime.now() - timedelta(days=7)).isoformat()
    cursor.execute('SELECT COUNT(*) FROM defects WHERE timestamp >= ?', (week_ago,))
    recent_count = cursor.fetchone()[0]
    analytics_data.append(('recent_defects_7d', str(recent_count)))
    
    # Insert analytics
    cursor.executemany('''
        INSERT INTO analytics (metric_name, metric_value)
        VALUES (?, ?)
    ''', analytics_data)
    
    conn.commit()
    conn.close()
    
    print(f"Database seeded successfully!")
    print(f"Inserted {len(sample_defects)} defect records")
    print(f"Tracked {len(vehicle_reports)} vehicles")
    print(f"Calculated {len(analytics_data)} analytics metrics")

if __name__ == "__main__":
    seed_database()
