import json
import os
import boto3
from datetime import datetime
from botocore.exceptions import ClientError

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TABLE_NAME'])

def lambda_handler(event, context):
    """
    POST /profile - Create user profile
    Authenticated endpoint - user_id extracted from Cognito JWT
    """
    try:
        # Extract user_id from Cognito authorizer claims
        user_id = event['requestContext']['authorizer']['claims']['sub']
        
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        
        # Validate required fields
        display_name = body.get('display_name', '').strip()
        if not display_name or len(display_name) < 2:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'display_name must be at least 2 characters'})
            }
        
        # Limit display_name length
        if len(display_name) > 20:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'display_name must not exceed 20 characters'})
            }
        
        # Optional bio field with validation
        bio = body.get('bio', '').strip()
        if len(bio) > 500:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'bio must not exceed 500 characters'})
            }
        
        # Optional political alignment field with validation
        political_alignment = body.get('political_alignment', '').strip()
        valid_alignments = ['National', 'Labour', 'Independent', '']
        if political_alignment not in valid_alignments:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'political_alignment must be National, Labour, or Independent'})
            }
        
        # Create profile item
        timestamp = datetime.utcnow().isoformat()
        profile = {
            'user_id': user_id,
            'display_name': display_name,
            'bio': bio,
            'political_alignment': political_alignment,
            'created_at': timestamp,
            'updated_at': timestamp
        }
        
        # Check if profile already exists
        existing = table.get_item(Key={'user_id': user_id})
        if 'Item' in existing:
            return {
                'statusCode': 409,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Profile already exists. Use PUT to update.'})
            }
        
        # Save to DynamoDB
        table.put_item(Item=profile)
        
        return {
            'statusCode': 201,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(profile)
        }
        
    except Exception as e:
        print(f"Authorization error: Missing claim in token - {str(e)}")
        return {
            'statusCode': 401,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Unauthorized - Invalid token'})
        }
    
    except Exception as e:
        print(f"DynamoDB error: {e.response['Error']['Code']}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Internal server error'})
        }
    
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Internal server error'})
        }

