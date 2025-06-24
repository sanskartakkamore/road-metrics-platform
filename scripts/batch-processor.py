"""
Batch processing Lambda function for data aggregation and maintenance
This would run on EC2 or as a scheduled Lambda function
"""

import sqlite3
import json
from datetime import datetime, timedelta
import boto3

def lambda_handler(event, context):
    """
    Batch processor for periodic data aggregation and maintenance
    """
    try:
        results = {
            'processed_at': datetime.now().isoformat(),
            'tasks_completed': []
        }
        
        # Task 1: Update analytics cache
        update_analytics_cache()
        results['tasks_completed'].append('analytics_cache_updated')
        
        # Task 2: Clean old data (older than 2 years)
        cleaned_records = cleanup_old_data()
        results['tasks_completed'].append(f'cleaned_{cleaned_records}_old_records')
        
        # Task 3: Generate heatmap data
        generate_heatmap_data()
        results['tasks_completed'].append('heatmap_data_generated')
        
        # Task 4: Update vehicle statistics
        update_vehicle_stats()
        results['tasks_completed'].append('vehicle_stats_updated')
        
        # Task 5: Generate daily/weekly reports
        generate_reports()
        results['tasks_completed'].append('reports_generated')
        
        return {
            'statusCode': 200,
            'body': json.dumps(results)
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Batch processing failed',
                'message': str(e)
            })
        }

def update_analytics_cache():
    """Update cached analytics data"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Clear old analytics
    cursor.execute('DELETE FROM analytics WHERE calculated_at < ?', 
                  ((datetime.now() - timedelta(hours=1)).isoformat(),))
    
    # Recalculate analytics
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
    
    # Geographic distribution
    cursor.execute('''
        SELECT 
            ROUND(latitude, 2) as lat_zone,
            ROUND(longitude, 2) as lng_zone,
            COUNT(*) as defect_count
        FROM defects 
        GROUP BY lat_zone, lng_zone
        HAVING defect_count > 0
        ORDER BY defect_count DESC
    ''')
    geo_data = [{'lat': row[0], 'lng': row[1], 'count': row[2]} for row in cursor.fetchall()]
    analytics_data.append(('geographic_distribution', json.dumps(geo_data)))
    
    # Insert new analytics
    cursor.executemany('''
        INSERT INTO analytics (metric_name, metric_value)
        VALUES (?, ?)
    ''', analytics_data)
    
    conn.commit()
    conn.close()

def cleanup_old_data():
    """Clean up data older than 2 years"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    two_years_ago = (datetime.now() - timedelta(days=730)).isoformat()
    
    cursor.execute('DELETE FROM defects WHERE timestamp < ?', (two_years_ago,))
    cleaned_count = cursor.rowcount
    
    conn.commit()
    conn.close()
    
    return cleaned_count

def generate_heatmap_data():
    """Generate optimized heatmap data for frontend"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Generate heatmap points with intensity
    cursor.execute('''
        SELECT 
            latitude,
            longitude,
            severity,
            COUNT(*) as intensity
        FROM defects 
        WHERE timestamp >= ?
        GROUP BY 
            ROUND(latitude, 3),
            ROUND(longitude, 3),
            severity
    ''', ((datetime.now() - timedelta(days=30)).isoformat(),))
    
    heatmap_data = []
    for row in cursor.fetchall():
        weight = {'low': 1, 'medium': 2, 'high': 3, 'critical': 4}.get(row[2], 1)
        heatmap_data.append({
            'lat': row[0],
            'lng': row[1],
            'intensity': row[3] * weight
        })
    
    # Store heatmap data
    cursor.execute('''
        INSERT OR REPLACE INTO analytics (metric_name, metric_value)
        VALUES ('heatmap_data', ?)
    ''', (json.dumps(heatmap_data),))
    
    conn.commit()
    conn.close()

def update_vehicle_stats():
    """Update vehicle reporting statistics"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Update vehicle statistics
    cursor.execute('''
        UPDATE vehicles 
        SET total_reports = (
            SELECT COUNT(*) 
            FROM defects 
            WHERE defects.vehicle_id = vehicles.vehicle_id
        ),
        last_report_timestamp = (
            SELECT MAX(timestamp) 
            FROM defects 
            WHERE defects.vehicle_id = vehicles.vehicle_id
        )
    ''')
    
    conn.commit()
    conn.close()

def generate_reports():
    """Generate daily and weekly summary reports"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Daily report
    today = datetime.now().date()
    cursor.execute('''
        SELECT 
            defect_type,
            severity,
            COUNT(*) as count
        FROM defects 
        WHERE DATE(timestamp) = ?
        GROUP BY defect_type, severity
    ''', (today.isoformat(),))
    
    daily_data = cursor.fetchall()
    daily_report = {
        'date': today.isoformat(),
        'summary': [{'type': row[0], 'severity': row[1], 'count': row[2]} for row in daily_data]
    }
    
    # Weekly report
    week_ago = today - timedelta(days=7)
    cursor.execute('''
        SELECT 
            DATE(timestamp) as report_date,
            COUNT(*) as daily_count
        FROM defects 
        WHERE DATE(timestamp) >= ?
        GROUP BY DATE(timestamp)
        ORDER BY report_date
    ''', (week_ago.isoformat(),))
    
    weekly_data = cursor.fetchall()
    weekly_report = {
        'week_ending': today.isoformat(),
        'daily_counts': [{'date': row[0], 'count': row[1]} for row in weekly_data]
    }
    
    # Store reports
    cursor.execute('''
        INSERT INTO analytics (metric_name, metric_value)
        VALUES ('daily_report', ?), ('weekly_report', ?)
    ''', (json.dumps(daily_report), json.dumps(weekly_report)))
    
    conn.commit()
    conn.close()

def get_db_connection():
    """Get database connection"""
    return sqlite3.connect('/tmp/road_metrics.db')

if __name__ == "__main__":
    # For local testing
    result = lambda_handler({}, {})
    print(json.dumps(result, indent=2))
