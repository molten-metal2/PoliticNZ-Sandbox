from utils.response_builder import (
    success_response,
    error_response,
    not_found_response,
    forbidden_response,
    error_handler
)
from utils.validators import validate_post_content
from utils.helpers import (
    get_user_id_from_event,
    get_table,
    get_current_timestamp,
    parse_request_body,
    get_path_param
)

table = get_table('POSTS_TABLE_NAME')

@error_handler
def lambda_handler(event, context):
    """
    PUT /posts/{post_id} - Update a post
    Authenticated endpoint - only the post owner can update
    """
    # Extract user_id from Cognito authorizer claims
    user_id = get_user_id_from_event(event)
    
    # Get post_id from path parameters
    post_id = get_path_param(event, 'post_id')
    
    # Parse request body
    body = parse_request_body(event)
    
    # Validate content
    content = body.get('content', '').strip()
    is_valid, error_msg = validate_post_content(content)
    if not is_valid:
        return error_response(error_msg)
    
    # Get existing post to verify ownership
    existing = table.get_item(Key={'post_id': post_id})
    if 'Item' not in existing:
        return not_found_response('Post not found')
    
    # Verify ownership
    if existing['Item']['user_id'] != user_id:
        return forbidden_response('Forbidden - You can only edit your own posts')
    
    # Update post
    timestamp = get_current_timestamp()
    
    response = table.update_item(
        Key={'post_id': post_id},
        UpdateExpression='SET content = :content, updated_at = :updated_at',
        ExpressionAttributeValues={
            ':content': content,
            ':updated_at': timestamp
        },
        ReturnValues='ALL_NEW'
    )
    
    return success_response(response['Attributes'])

