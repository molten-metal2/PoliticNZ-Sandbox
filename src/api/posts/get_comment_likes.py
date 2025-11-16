from utils.response_builder import (
    success_response,
    error_response,
    not_found_response,
    error_handler
)
from utils.helpers import (
    get_user_id_from_event,
    get_table
)

comments_table = get_table('COMMENTS_TABLE_NAME')
likes_table = get_table('LIKES_TABLE_NAME')

@error_handler
def lambda_handler(event, context):
    # Extract user_id from Cognito authorizer claims for authentication
    user_id = get_user_id_from_event(event)
    
    # Extract parameters
    post_id = event.get('pathParameters', {}).get('post_id')
    comment_id = event.get('pathParameters', {}).get('comment_id')
    
    if not post_id or not comment_id:
        return error_response('post_id and comment_id are required')
    
    # Check if comment exists
    comment_response = comments_table.get_item(
        Key={
            'post_id': post_id,
            'comment_id': comment_id
        }
    )
    if 'Item' not in comment_response:
        return not_found_response('Comment not found')
    
    # Query all likes for this comment
    response = likes_table.query(
        KeyConditionExpression='target_id = :target_id',
        ExpressionAttributeValues={
            ':target_id': comment_id
        }
    )
    
    likes = response.get('Items', [])
    
    # Filter to only comment likes
    comment_likes = [like for like in likes if like.get('target_type') == 'comment']
    
    # Return list of users who liked
    users = [{
        'user_id': like['user_id'],
        'display_name': like.get('display_name', 'Unknown User')
    } for like in comment_likes]
    
    return success_response({
        'likes': users,
        'count': len(users)
    })

