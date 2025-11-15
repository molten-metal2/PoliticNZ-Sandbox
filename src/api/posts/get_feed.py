import os
import boto3
from utils.response_builder import success_response, error_handler

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['POSTS_TABLE_NAME'])

@error_handler
def lambda_handler(event, context):
    """
    GET /posts - Get all posts sorted by timestamp (newest first)
    Authenticated endpoint
    """
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
    
    return success_response(posts)

