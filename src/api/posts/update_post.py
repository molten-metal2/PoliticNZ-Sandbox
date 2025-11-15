import json
import os
import boto3
from datetime import datetime
from utils.response_builder import (
    success_response,
    error_response,
    not_found_response,
    forbidden_response,
    error_handler
)

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['POSTS_TABLE_NAME'])

@error_handler
def lambda_handler(event, context):
    """
    PUT /posts/{post_id} - Update a post
    Authenticated endpoint - only the post owner can update
    """
    # Extract user_id from Cognito authorizer claims
    user_id = event['requestContext']['authorizer']['claims']['sub']
    
    # Get post_id from path parameters
    post_id = event['pathParameters']['post_id']
    
    # Parse request body
    body = json.loads(event.get('body', '{}'))
    
    # Validate content
    content = body.get('content', '').strip()
    if not content:
        return error_response('Content is required')
    
    # Limit content length to 280 characters
    if len(content) > 280:
        return error_response('Content must not exceed 280 characters')
    
    # Get existing post to verify ownership
    existing = table.get_item(Key={'post_id': post_id})
    if 'Item' not in existing:
        return not_found_response('Post not found')
    
    # Verify ownership
    if existing['Item']['user_id'] != user_id:
        return forbidden_response('Forbidden - You can only edit your own posts')
    
    # Update post
    timestamp = datetime.utcnow().isoformat()
    
    response = table.update_item(
        Key={'post_id': post_id},
        UpdateExpression='SET content = :content, updated_at = :updated_at',
        ExpressionAttributeValues={
            ':content': content,
            ':updated_at': timestamp
        },
        ReturnValues='ALL_NEW'
    )
    
    return success_response(response['Attributes'])

