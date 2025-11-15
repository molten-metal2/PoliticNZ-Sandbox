import json
import os
import boto3
from decimal import Decimal
from botocore.exceptions import ClientError

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['POSTS_TABLE_NAME'])

# Helper to convert Decimal to native Python types for JSON serialization
def decimal_default(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError

def lambda_handler(event, context):
    """
    GET /posts/user - Get all posts for the authenticated user
    GET /posts/user?user_id={id} - Get all posts for specific user
    Authenticated endpoint - requires valid JWT token
    """
    try:
        # Extract authenticated user_id from Cognito authorizer claims (for authorization)
        auth_user_id = event['requestContext']['authorizer']['claims']['sub']
        
        # Check if requesting another user's posts via query parameter
        query_params = event.get('queryStringParameters', {}) or {}
        target_user_id = query_params.get('user_id', auth_user_id)
        
        # Query posts by user_id using GSI
        response = table.query(
            IndexName='UserIdIndex',
            KeyConditionExpression='user_id = :user_id',
            ExpressionAttributeValues={
                ':user_id': target_user_id
            },
            ScanIndexForward=False  # Sort by created_at descending (newest first)
        )
        
        posts = response.get('Items', [])
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(posts, default=decimal_default)
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

