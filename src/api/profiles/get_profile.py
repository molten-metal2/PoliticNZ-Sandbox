import json
import os
import boto3
from botocore.exceptions import ClientError

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TABLE_NAME'])

def lambda_handler(event, context):
    """
    GET /profile - Retrieve user profile
    GET /profile?user_id={id} - Retrieve specific user's profile
    Authenticated endpoint - requires valid JWT token
    """
    try:
        # Extract authenticated user_id from Cognito authorizer claims (for authorization)
        auth_user_id = event['requestContext']['authorizer']['claims']['sub']
        
        # Check if requesting another user's profile via query parameter
        query_params = event.get('queryStringParameters', {}) or {}
        target_user_id = query_params.get('user_id', auth_user_id)
        
        # Get profile from DynamoDB
        response = table.get_item(Key={'user_id': target_user_id})
        
        if 'Item' not in response:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Profile not found'})
            }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(response['Item'])
        }
        
    except KeyError as e:
        print(f"Authorization error: Missing claim in token - {str(e)}")
        return {
            'statusCode': 401,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Unauthorized - Invalid token'})
        }
    
    except ClientError as e:
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

