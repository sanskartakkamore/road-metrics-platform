"""
AWS Lambda functions for the Road Metrics API
These would be deployed as separate Lambda functions
"""

import json
import sqlite3
import boto3
from datetime import datetime
import os

# Database connection helper
def get_db_connection():
    """Get database connection - in production this would use RDS"""
    # In AWS Lambda, you'd use RDS connection
    # For demo purposes, using SQLite
    return sqlite3.connect('/tmp/road_metrics.db')

def lambda_handler_get_defects(event, context):
    """
    Lambda function to retrieve all defects
    GET /api/defects
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Parse query parameters
        query_params = event.get('queryStringParameters') or {}
        limit = int(query_params.get('limit', 100))
        offset = int(query_params.get('offset', 0))
        severity_filter = query_params.get('severity')
        type_filter = query_params.get('type')
        
        # Build query
        query = '''
            SELECT id, latitude, longitude, defect_type, severity, 
                   notes, vehicle_id, timestamp, created_at
            FROM defects
        '''
        params = []
        conditions = []
        
        if severity_filter:
            conditions.append('severity = ?')
            params.append(severity_filter)
        
        if type_filter:
            conditions.append('defect_type = ?')
            params.append(type_filter)
        
        if conditions:
            query += ' WHERE ' + ' AND '.join(conditions)
        
        query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?'
        params.extend([limit, offset])
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        
        # Convert to JSON format
        defects = []
        for row in rows:
            defects.append({
                'id': str(row[0]),
                'coordinates': [row[2], row[1]],  # [lng, lat] for frontend
                'defectType': row[3],
                'severity': row[4],
                'notes': row[5],
                'vehicleId': row[6],
                'timestamp': row[7],
                'createdAt': row[8]
            })
        
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': json.dumps({
                'defects': defects,
                'total': len(defects),
                'limit': limit,
                'offset': offset
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            })
        }

def lambda_handler_create_defect(event, context):
    """
    Lambda function to create a new defect report
    POST /api/defects
    """
    try:
        # Parse request body
        body = json.loads(event['body'])
        
        # Validate required fields
        required_fields = ['coordinates', 'defectType', 'severity']
        for field in required_fields:
            if field not in body:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'error': 'Missing required field',
                        'field': field
                    })
                }
        
        # Validate severity
        valid_severities = ['low', 'medium', 'high', 'critical']
        if body['severity'] not in valid_severities:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Invalid severity level',
                    'validValues': valid_severities
                })
            }
        
        # Insert into database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO defects (latitude, longitude, defect_type, severity, notes, vehicle_id, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            body['coordinates'][1],  # latitude
            body['coordinates'][0],  # longitude
            body['defectType'],
            body['severity'],
            body.get('notes'),
            body.get('vehicleId'),
            datetime.now().isoformat()
        ))
        
        defect_id = cursor.lastrowid
        
        # Update vehicle tracking if vehicle_id provided
        if body.get('vehicleId'):
            cursor.execute('''
                INSERT OR REPLACE INTO vehicles (vehicle_id, last_report_timestamp, total_reports)
                VALUES (?, ?, COALESCE((SELECT total_reports FROM vehicles WHERE vehicle_id = ?), 0) + 1)
            ''', (body['vehicleId'], datetime.now().isoformat(), body['vehicleId']))
        
        conn.commit()
        conn.close()
        
        return {
            'statusCode': 201,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'Defect reported successfully',
                'defectId': str(defect_id)
            })
        }
        
    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Invalid JSON in request body'
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            })
        }

def lambda_handler_bulk_upload(event, context):
    """
    Lambda function to handle bulk data upload
    POST /api/upload
    """
    try:
        # Parse request body
        body = json.loads(event['body'])
        
        # Handle both single object and array
        defects_data = body if isinstance(body, list) else [body]
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        inserted_count = 0
        errors = []
        
        for i, defect_data in enumerate(defects_data):
            try:
                # Validate required fields
                if 'coordinates' not in defect_data or 'defectType' not in defect_data:
                    errors.append(f"Record {i}: Missing required fields")
                    continue
                
                # Set defaults
                severity = defect_data.get('severity', 'medium')
                timestamp = defect_data.get('timestamp', datetime.now().isoformat())
                
                cursor.execute('''
                    INSERT INTO defects (latitude, longitude, defect_type, severity, notes, vehicle_id, timestamp)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (
                    defect_data['coordinates'][1],  # latitude
                    defect_data['coordinates'][0],  # longitude
                    defect_data['defectType'],
                    severity,
                    defect_data.get('notes'),
                    defect_data.get('vehicle_id'),
                    timestamp
                ))
                
                inserted_count += 1
                
                # Update vehicle tracking
                if defect_data.get('vehicle_id'):
                    cursor.execute('''
                        INSERT OR REPLACE INTO vehicles (vehicle_id, last_report_timestamp, total_reports)
                        VALUES (?, ?, COALESCE((SELECT total_reports FROM vehicles WHERE vehicle_id = ?), 0) + 1)
                    ''', (defect_data['vehicle_id'], timestamp, defect_data['vehicle_id']))
                
            except Exception as e:
                errors.append(f"Record {i}: {str(e)}")
        
        conn.commit()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'Bulk upload completed',
                'insertedCount': inserted_count,
                'totalRecords': len(defects_data),
                'errors': errors
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            })
        }

def lambda_handler_analytics(event, context):
    """
    Lambda function to get analytics data
    GET /api/analytics
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        analytics = {}
        
        # Total defects
        cursor.execute('SELECT COUNT(*) FROM defects')
        analytics['totalDefects'] = cursor.fetchone()[0]
        
        # Defects by type
        cursor.execute('SELECT defect_type, COUNT(*) FROM defects GROUP BY defect_type')
        analytics['defectsByType'] = dict(cursor.fetchall())
        
        # Defects by severity
        cursor.execute('SELECT severity, COUNT(*) FROM defects GROUP BY severity')
        analytics['defectsBySeverity'] = dict(cursor.fetchall())
        
        # Recent activity (last 7 days)
        from datetime import timedelta
        week_ago = (datetime.now() - timedelta(days=7)).isoformat()
        cursor.execute('SELECT COUNT(*) FROM defects WHERE timestamp >= ?', (week_ago,))
        analytics['recentDefects'] = cursor.fetchone()[0]
        
        # Top reporting vehicles
        cursor.execute('''
            SELECT vehicle_id, total_reports 
            FROM vehicles 
            ORDER BY total_reports DESC 
            LIMIT 5
        ''')
        analytics['topVehicles'] = [{'vehicleId': row[0], 'reports': row[1]} for row in cursor.fetchall()]
        
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(analytics)
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            })
        }
