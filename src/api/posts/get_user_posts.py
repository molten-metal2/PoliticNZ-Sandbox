import os
import boto3
from utils.response_builder import success_response, error_handler

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['POSTS_TABLE_NAME'])

@error_handler
def lambda_handler(event, context):
    """
    GET /posts/user - Get all posts for the authenticated user
    GET /posts/user?user_id={id} - Get all posts for specific user
    Authenticated endpoint - requires valid JWT token
    """
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
    
    return success_response(posts)

