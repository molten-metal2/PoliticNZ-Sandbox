import json
import os
import boto3
import uuid
from datetime import datetime
from botocore.exceptions import ClientError

dynamodb = boto3.resource('dynamodb')
posts_table = dynamodb.Table(os.environ['POSTS_TABLE_NAME'])
profiles_table = dynamodb.Table(os.environ['PROFILES_TABLE_NAME'])

def lambda_handler(event, context):
    """
    POST /posts - Create a new post
    Authenticated endpoint - user_id extracted from Cognito JWT
    """
    try:
        # Extract user_id from Cognito authorizer claims
        user_id = event['requestContext']['authorizer']['claims']['sub']
        
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        
        # Validate content
        content = body.get('content', '').strip()
        if not content:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Content is required'})
            }
        
        # Limit content length to 280 characters
        if len(content) > 280:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Content must not exceed 280 characters'})
            }
        
        # Get user's profile to retrieve display_name
        try:
            profile_response = profiles_table.get_item(Key={'user_id': user_id})
            if 'Item' not in profile_response:
                return {
                    'statusCode': 404,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Profile not found. Please complete onboarding first.'})
                }
            display_name = profile_response['Item'].get('display_name', 'Unknown User')
        except ClientError as e:
            print(f"Error fetching profile: {str(e)}")
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Failed to retrieve user profile'})
            }
        
        # Create post
        timestamp = datetime.utcnow().isoformat()
        post_id = str(uuid.uuid4())
        
        post = {
            'post_id': post_id,
            'user_id': user_id,
            'display_name': display_name,
            'content': content,
            'created_at': timestamp,
            'updated_at': timestamp
        }
        
        # Save to DynamoDB
        posts_table.put_item(Item=post)
        
        return {
            'statusCode': 201,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(post)
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
        print(f"Unexpected error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Internal server error'})
        }

