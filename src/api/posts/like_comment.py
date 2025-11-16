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
profiles_table = get_table('PROFILES_TABLE_NAME')

@error_handler
def lambda_handler(event, context):
    # Extract user_id from Cognito authorizer claims
    user_id = get_user_id_from_event(event)
    
    # Extract parameters from path
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
    
    # Get user's profile to retrieve display_name
    profile_response = profiles_table.get_item(Key={'user_id': user_id})
    if 'Item' not in profile_response:
        return not_found_response('Profile not found. Please complete onboarding first.')
    display_name = profile_response['Item'].get('display_name', 'Unknown User')
    
    # Check if like already exists
    like_response = likes_table.get_item(
        Key={
            'target_id': comment_id,
            'user_id': user_id
        }
    )
    
    if 'Item' in like_response:
        # Unlike - delete the like
        likes_table.delete_item(
            Key={
                'target_id': comment_id,
                'user_id': user_id
            }
        )
        return success_response({'liked': False, 'message': 'Comment unliked'})
    else:
        # Like - create the like
        like_item = {
            'target_id': comment_id,
            'user_id': user_id,
            'target_type': 'comment',
            'display_name': display_name
        }
        likes_table.put_item(Item=like_item)
        return success_response({'liked': True, 'message': 'Comment liked'})

