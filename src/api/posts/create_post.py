import uuid
from botocore.exceptions import ClientError
from utils.response_builder import (
    success_response,
    error_response,
    not_found_response,
    server_error_response,
    error_handler
)
from utils.validators import validate_post_content
from utils.helpers import (
    get_user_id_from_event,
    get_table,
    get_current_timestamp,
    parse_request_body
)

posts_table = get_table('POSTS_TABLE_NAME')
profiles_table = get_table('PROFILES_TABLE_NAME')

@error_handler
def lambda_handler(event, context):
    """
    POST /posts - Create a new post
    Authenticated endpoint - user_id extracted from Cognito JWT
    """
    # Extract user_id from Cognito authorizer claims
    user_id = get_user_id_from_event(event)
    
    # Parse request body
    body = parse_request_body(event)
    
    # Validate content
    content = body.get('content', '').strip()
    is_valid, error_msg = validate_post_content(content)
    if not is_valid:
        return error_response(error_msg)
    
    # Get user's profile to retrieve display_name
    try:
        profile_response = profiles_table.get_item(Key={'user_id': user_id})
        if 'Item' not in profile_response:
            return not_found_response('Profile not found. Please complete onboarding first.')
        display_name = profile_response['Item'].get('display_name', 'Unknown User')
    except ClientError as e:
        print(f"Error fetching profile: {str(e)}")
        return server_error_response('Failed to retrieve user profile')
    
    # Create post
    timestamp = get_current_timestamp()
    post_id = str(uuid.uuid4())
    
    post = {
        'post_id': post_id,
        'user_id': user_id,
        'display_name': display_name,
        'content': content,
        'created_at': timestamp,
        'updated_at': timestamp
    }
    
    # Save to DynamoDB
    posts_table.put_item(Item=post)
    
    return success_response(post, 201)

