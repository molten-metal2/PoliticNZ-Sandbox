from utils.response_builder import (
    success_response,
    not_found_response,
    error_handler
)
from utils.helpers import (
    get_user_id_from_event,
    get_table,
    get_query_param
)

table = get_table('TABLE_NAME')


def filter_private_profile(profile, is_own_profile):
    # If viewing own profile or profile is not private, return full profile
    if is_own_profile or not profile.get('profile_private', False):
        return profile
    
    # For private profiles viewed by others, only show name and metadata
    return {
        'user_id': profile.get('user_id'),
        'display_name': profile.get('display_name'),
        'bio': '',
        'political_alignment': '',
        'profile_private': True,
        'created_at': profile.get('created_at'),
        'updated_at': profile.get('updated_at')
    }

@error_handler
def lambda_handler(event, context):
    """
    GET /profile - Retrieve user profile
    GET /profile?user_id={id} - Retrieve specific user's profile
    Authenticated endpoint - requires valid JWT token
    """
    # Extract authenticated user_id from Cognito authorizer claims (for authorization)
    auth_user_id = get_user_id_from_event(event)
    
    # Check if requesting another user's profile via query parameter
    target_user_id = get_query_param(event, 'user_id', auth_user_id)
    
    # Get profile from DynamoDB
    response = table.get_item(Key={'user_id': target_user_id})
    
    if 'Item' not in response:
        return not_found_response('Profile not found')
    
    # Determine if viewing own profile
    is_own_profile = auth_user_id == target_user_id
    
    # Filter profile data based on privacy settings
    filtered_profile = filter_private_profile(response['Item'], is_own_profile)
    
    return success_response(filtered_profile)

