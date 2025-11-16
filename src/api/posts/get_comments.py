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
comments_table = get_table('COMMENTS_TABLE_NAME')
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
    
    # Query all comments for this post using GSI
    response = comments_table.query(
        IndexName='PostCommentsIndex',
        KeyConditionExpression='post_id = :post_id',
        ExpressionAttributeValues={
            ':post_id': post_id
        },
        ScanIndexForward=True  # Sort by created_at ascending (oldest first)
    )
    
    comments = response.get('Items', [])
    
    # For each comment, get like count and whether current user liked it
    for comment in comments:
        comment_id = comment['comment_id']
        
        # Get like count for this comment
        likes_response = likes_table.query(
            KeyConditionExpression='target_id = :target_id',
            ExpressionAttributeValues={
                ':target_id': comment_id
            }
        )
        comment_likes = [like for like in likes_response.get('Items', []) if like.get('target_type') == 'comment']
        comment['like_count'] = len(comment_likes)
        
        # Check if current user liked this comment
        comment['liked_by_user'] = any(like['user_id'] == user_id for like in comment_likes)
    
    return success_response(comments)

