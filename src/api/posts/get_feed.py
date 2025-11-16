from utils.response_builder import success_response, error_handler
from utils.helpers import get_user_id_from_event, get_table

posts_table = get_table('POSTS_TABLE_NAME')
likes_table = get_table('LIKES_TABLE_NAME')
comments_table = get_table('COMMENTS_TABLE_NAME')

@error_handler
def lambda_handler(event, context):
    # Extract user_id from Cognito authorizer claims for authentication
    user_id = get_user_id_from_event(event)
    
    # Scan all posts (for small scale app)
    # For production with many posts, consider using pagination or DynamoDB Streams
    response = posts_table.scan()
    posts = response.get('Items', [])
    
    # Sort by created_at timestamp in descending order (newest first)
    posts.sort(key=lambda x: x.get('created_at', ''), reverse=True)
    
    # Limit to most recent 100 posts
    posts = posts[:100]
    
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
        post['liked_by_user'] = any(like['user_id'] == user_id for like in post_likes)
        
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
