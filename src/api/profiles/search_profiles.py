from utils.response_builder import (
    success_response,
    error_response,
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
    GET /profile/search?query={search_term} - Search profiles by display name
    Authenticated endpoint - requires valid JWT token
    """
    # Extract authenticated user_id from Cognito authorizer claims
    auth_user_id = get_user_id_from_event(event)
    
    # Get search query from query parameters
    query = get_query_param(event, 'query', '').strip()
    
    # Return empty results if query is empty
    if not query:
        return success_response({'profiles': [], 'count': 0})
    
    # Perform case-insensitive scan on DynamoDB
    # Note: For production with large datasets, consider using DynamoDB indexes or a dedicated search service like OpenSearch
    response = table.scan(
        FilterExpression='contains(#dn, :query)',
        ExpressionAttributeNames={
            '#dn': 'display_name'
        },
        ExpressionAttributeValues={
            ':query': query
        }
    )
    
    profiles = response.get('Items', [])
    
    # Filter profiles based on privacy settings and limit results
    filtered_profiles = []
    for profile in profiles:
        # Determine if this is the user's own profile
        is_own_profile = auth_user_id == profile.get('user_id')
        filtered_profile = filter_private_profile(profile, is_own_profile)
        filtered_profiles.append(filtered_profile)
        
        # Limit to 10 results
        if len(filtered_profiles) >= 10:
            break
    
    return success_response({'profiles': filtered_profiles, 'count': len(filtered_profiles)})


