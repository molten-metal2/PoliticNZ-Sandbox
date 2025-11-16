from utils.response_builder import (
    success_response,
    error_response,
    not_found_response,
    forbidden_response,
    error_handler
)
from utils.helpers import (
    get_user_id_from_event,
    get_table
)

comments_table = get_table('COMMENTS_TABLE_NAME')

@error_handler
def lambda_handler(event, context):
    # Extract user_id from Cognito authorizer claims
    user_id = get_user_id_from_event(event)
    
    # Extract parameters
    post_id = event.get('pathParameters', {}).get('post_id')
    comment_id = event.get('pathParameters', {}).get('comment_id')
    
    if not post_id or not comment_id:
        return error_response('post_id and comment_id are required')
    
    # Get the comment
    response = comments_table.get_item(
        Key={
            'post_id': post_id,
            'comment_id': comment_id
        }
    )
    
    if 'Item' not in response:
        return not_found_response('Comment not found')
    
    comment = response['Item']
    
    # Check if user is the comment owner
    if comment['user_id'] != user_id:
        return forbidden_response('You can only delete your own comments')
    
    # Delete the comment
    comments_table.delete_item(
        Key={
            'post_id': post_id,
            'comment_id': comment_id
        }
    )
    
    return success_response({'message': 'Comment deleted successfully'})

