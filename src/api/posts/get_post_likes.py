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

posts_table = get_table('POSTS_TABLE_NAME')
likes_table = get_table('LIKES_TABLE_NAME')

@error_handler
def lambda_handler(event, context):
    # Extract user_id from Cognito authorizer claims for authentication
    user_id = get_user_id_from_event(event)
    
    # Extract post_id from path parameters
    post_id = event.get('pathParameters', {}).get('post_id')
    if not post_id:
        return error_response('post_id is required')
    
    # Check if post exists
    post_response = posts_table.get_item(Key={'post_id': post_id})
    if 'Item' not in post_response:
        return not_found_response('Post not found')
    
    # Query all likes for this post
    response = likes_table.query(
        KeyConditionExpression='target_id = :target_id',
        ExpressionAttributeValues={
            ':target_id': post_id
        }
    )
    
    likes = response.get('Items', [])
    
    # Filter to only post likes (in case we have comment likes with same target_id)
    post_likes = [like for like in likes if like.get('target_type') == 'post']
    
    # Return list of users who liked
    users = [{
        'user_id': like['user_id'],
        'display_name': like.get('display_name', 'Unknown User')
    } for like in post_likes]
    
    return success_response({
        'likes': users,
        'count': len(users)
    })

