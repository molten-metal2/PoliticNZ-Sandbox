import os
import boto3
from utils.response_builder import (
    success_response,
    not_found_response,
    forbidden_response,
    error_handler
)

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['POSTS_TABLE_NAME'])

@error_handler
def lambda_handler(event, context):
    """
    DELETE /posts/{post_id} - Delete a post
    Authenticated endpoint - only the post owner can delete
    """
    # Extract user_id from Cognito authorizer claims
    user_id = event['requestContext']['authorizer']['claims']['sub']
    
    # Get post_id from path parameters
    post_id = event['pathParameters']['post_id']
    
    # Get existing post to verify ownership
    existing = table.get_item(Key={'post_id': post_id})
    if 'Item' not in existing:
        return not_found_response('Post not found')
    
    # Verify ownership
    if existing['Item']['user_id'] != user_id:
        return forbidden_response('Forbidden - You can only delete your own posts')
    
    # Delete post
    table.delete_item(Key={'post_id': post_id})
    
    return success_response({'message': 'Post deleted successfully'})

