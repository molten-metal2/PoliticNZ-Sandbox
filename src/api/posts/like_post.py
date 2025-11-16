from utils.response_builder import (
    success_response,
    error_response,
    not_found_response,
    server_error_response,
    error_handler
)
from utils.helpers import (
    get_user_id_from_event,
    get_table
)

posts_table = get_table('POSTS_TABLE_NAME')
likes_table = get_table('LIKES_TABLE_NAME')
profiles_table = get_table('PROFILES_TABLE_NAME')

@error_handler
def lambda_handler(event, context):
    """
    POST /posts/{post_id}/like - Toggle like on a post
    Authenticated endpoint - user_id extracted from Cognito JWT
    """
    # Extract user_id from Cognito authorizer claims
    user_id = get_user_id_from_event(event)
    
    # Extract post_id from path parameters
    post_id = event.get('pathParameters', {}).get('post_id')
    if not post_id:
        return error_response('post_id is required')
    
    # Check if post exists
    post_response = posts_table.get_item(Key={'post_id': post_id})
    if 'Item' not in post_response:
        return not_found_response('Post not found')
    
    # Get user's profile to retrieve display_name
    profile_response = profiles_table.get_item(Key={'user_id': user_id})
    if 'Item' not in profile_response:
        return not_found_response('Profile not found. Please complete onboarding first.')
    display_name = profile_response['Item'].get('display_name', 'Unknown User')
    
    # Check if like already exists
    like_response = likes_table.get_item(
        Key={
            'target_id': post_id,
            'user_id': user_id
        }
    )
    
    if 'Item' in like_response:
        # Unlike - delete the like
        likes_table.delete_item(
            Key={
                'target_id': post_id,
                'user_id': user_id
            }
        )
        return success_response({'liked': False, 'message': 'Post unliked'})
    else:
        # Like - create the like
        like_item = {
            'target_id': post_id,
            'user_id': user_id,
            'target_type': 'post',
            'display_name': display_name
        }
        likes_table.put_item(Item=like_item)
        return success_response({'liked': True, 'message': 'Post liked'})

