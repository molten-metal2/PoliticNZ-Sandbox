from utils.response_builder import success_response, error_handler
from utils.helpers import get_user_id_from_event, get_table, get_query_param

posts_table = get_table('POSTS_TABLE_NAME')
likes_table = get_table('LIKES_TABLE_NAME')
comments_table = get_table('COMMENTS_TABLE_NAME')

@error_handler
def lambda_handler(event, context):
    # Extract authenticated user_id from Cognito authorizer claims (for authorization)
    auth_user_id = get_user_id_from_event(event)
    
    # Check if requesting another user's posts via query parameter
    target_user_id = get_query_param(event, 'user_id', auth_user_id)
    
    # Query posts by user_id using GSI
    response = posts_table.query(
        IndexName='UserIdIndex',
        KeyConditionExpression='user_id = :user_id',
        ExpressionAttributeValues={
            ':user_id': target_user_id
        },
        ScanIndexForward=False  # Sort by created_at descending (newest first)
    )
    
    posts = response.get('Items', [])
    
    # For each post, add like and comment counts
    for post in posts:
        post_id = post['post_id']
        
        # Get like count
        likes_response = likes_table.query(
            KeyConditionExpression='target_id = :target_id',
            ExpressionAttributeValues={
                ':target_id': post_id
            }
        )
        post_likes = [like for like in likes_response.get('Items', []) if like.get('target_type') == 'post']
        post['like_count'] = len(post_likes)
        
        # Check if current user liked this post
        post['liked_by_user'] = any(like['user_id'] == auth_user_id for like in post_likes)
        
        # Get comment count
        comments_response = comments_table.query(
            KeyConditionExpression='post_id = :post_id',
            ExpressionAttributeValues={
                ':post_id': post_id
            },
            Select='COUNT'
        )
        post['comment_count'] = comments_response.get('Count', 0)
    
    return success_response(posts)

