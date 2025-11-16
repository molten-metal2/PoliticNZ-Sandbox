import uuid
from utils.response_builder import (
    success_response,
    error_response,
    not_found_response,
    error_handler
)
from utils.validators import validate_comment_content
from utils.helpers import (
    get_user_id_from_event,
    get_table,
    get_current_timestamp,
    parse_request_body
)

posts_table = get_table('POSTS_TABLE_NAME')
comments_table = get_table('COMMENTS_TABLE_NAME')
profiles_table = get_table('PROFILES_TABLE_NAME')

@error_handler
def lambda_handler(event, context):
    # Extract user_id from Cognito authorizer claims
    user_id = get_user_id_from_event(event)
    
    # Extract post_id from path parameters
    post_id = event.get('pathParameters', {}).get('post_id')
    if not post_id:
        return error_response('post_id is required')
    
    # Parse request body
    body = parse_request_body(event)
    
    # Validate content
    content = body.get('content', '').strip()
    is_valid, error_msg = validate_comment_content(content)
    if not is_valid:
        return error_response(error_msg)
    
    # Check if post exists
    post_response = posts_table.get_item(Key={'post_id': post_id})
    if 'Item' not in post_response:
        return not_found_response('Post not found')
    
    # Get user's profile to retrieve display_name
    profile_response = profiles_table.get_item(Key={'user_id': user_id})
    if 'Item' not in profile_response:
        return not_found_response('Profile not found. Please complete onboarding first.')
    display_name = profile_response['Item'].get('display_name', 'Unknown User')
    
    # Create comment
    timestamp = get_current_timestamp()
    comment_id = str(uuid.uuid4())
    
    comment = {
        'comment_id': comment_id,
        'post_id': post_id,
        'user_id': user_id,
        'display_name': display_name,
        'content': content,
        'created_at': timestamp
    }
    
    # Save to DynamoDB
    comments_table.put_item(Item=comment)
    
    return success_response(comment, 201)
