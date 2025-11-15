import json
import os
import boto3
from datetime import datetime
from botocore.exceptions import ClientError

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TABLE_NAME'])

def lambda_handler(event, context):
    """
    PUT /profile - Update user profile
    Authenticated endpoint - user_id extracted from Cognito JWT
    """
    try:
        # Extract user_id from Cognito authorizer claims
        user_id = event['requestContext']['authorizer']['claims']['sub']
        
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        
        # Validate display_name if provided
        display_name = body.get('display_name', '').strip()
        if display_name:
            if len(display_name) < 2:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'display_name must be at least 2 characters'})
                }
            if len(display_name) > 20:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'display_name must not exceed 20 characters'})
                }
        
        # Validate bio if provided
        bio = body.get('bio', '').strip() if 'bio' in body else None
        if bio is not None and len(bio) > 500:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'bio must not exceed 500 characters'})
            }
        
        # Validate political_alignment if provided
        political_alignment = body.get('political_alignment', '').strip() if 'political_alignment' in body else None
        if political_alignment is not None:
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
        
        # Check if profile exists
        existing = table.get_item(Key={'user_id': user_id})
        if 'Item' not in existing:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Profile not found. Use POST to create.'})
            }
        
        # Build update expression dynamically
        update_expression = "SET updated_at = :updated_at"
        expression_values = {':updated_at': datetime.utcnow().isoformat()}
        
        if display_name:
            update_expression += ", display_name = :display_name"
            expression_values[':display_name'] = display_name
        
        if bio is not None:
            update_expression += ", bio = :bio"
            expression_values[':bio'] = bio
        
        if political_alignment is not None:
            update_expression += ", political_alignment = :political_alignment"
            expression_values[':political_alignment'] = political_alignment
        
        # Update profile
        response = table.update_item(
            Key={'user_id': user_id},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_values,
            ReturnValues='ALL_NEW'
        )
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(response['Attributes'])
        }
        
    except Exception as e:
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

