import os
import boto3
from utils.response_builder import (
    success_response,
    not_found_response,
    error_handler
)

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TABLE_NAME'])

@error_handler
def lambda_handler(event, context):
    """
    GET /profile - Retrieve user profile
    GET /profile?user_id={id} - Retrieve specific user's profile
    Authenticated endpoint - requires valid JWT token
    """
    # Extract authenticated user_id from Cognito authorizer claims (for authorization)
    auth_user_id = event['requestContext']['authorizer']['claims']['sub']
    
    # Check if requesting another user's profile via query parameter
    query_params = event.get('queryStringParameters', {}) or {}
    target_user_id = query_params.get('user_id', auth_user_id)
    
    # Get profile from DynamoDB
    response = table.get_item(Key={'user_id': target_user_id})
    
    if 'Item' not in response:
        return not_found_response('Profile not found')
    
    return success_response(response['Item'])

