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
    GET /posts - Get all posts sorted by timestamp (newest first)
    Authenticated endpoint
    """
    try:
        # Extract user_id from Cognito authorizer claims for authentication
        user_id = event['requestContext']['authorizer']['claims']['sub']
        
        # Scan all posts (for small scale app)
        # For production with many posts, consider using pagination or DynamoDB Streams
        response = table.scan()
        posts = response.get('Items', [])
        
        # Sort by created_at timestamp in descending order (newest first)
        posts.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        
        # Limit to most recent 100 posts
        posts = posts[:100]
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(posts, default=decimal_default)
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

