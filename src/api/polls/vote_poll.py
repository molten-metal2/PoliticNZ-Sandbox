from utils.response_builder import (
    success_response,
    error_response,
    not_found_response,
    error_handler
)
from utils.helpers import (
    get_user_id_from_event,
    get_table,
    get_current_timestamp,
    parse_request_body,
    get_path_param
)
from utils.validators import validate_poll_answer, validate_poll_reason

polls_table = get_table('POLLS_TABLE_NAME')
poll_votes_table = get_table('POLL_VOTES_TABLE_NAME')
profiles_table = get_table('PROFILES_TABLE_NAME')

@error_handler
def lambda_handler(event, context):
    # Extract user_id from Cognito authorizer claims
    user_id = get_user_id_from_event(event)
    
    # Get poll_id
    poll_id = get_path_param(event, 'poll_id')
    
    # Parse request body
    body = parse_request_body(event)
    
    # Validate answer
    answer = body.get('answer', '').strip()
    is_valid, error_msg = validate_poll_answer(answer)
    if not is_valid:
        return error_response(error_msg)
    
    # Validate optional reason
    reason = body.get('reason', '').strip()
    is_valid, error_msg = validate_poll_reason(reason)
    if not is_valid:
        return error_response(error_msg)
    
    # Check if user has already voted on this poll
    existing_vote = poll_votes_table.get_item(
        Key={
            'poll_id': poll_id,
            'user_id': user_id
        }
    )
    if 'Item' in existing_vote:
        return error_response('You have already voted on this poll', 400)
    
    # Get user's profile to retrieve display_name
    profile_response = profiles_table.get_item(Key={'user_id': user_id})
    if 'Item' not in profile_response:
        return not_found_response('Profile not found. Please complete onboarding first.')
    display_name = profile_response['Item'].get('display_name', 'Unknown User')
    
    # Create vote record
    timestamp = get_current_timestamp()
    
    vote = {
        'poll_id': poll_id,
        'user_id': user_id,
        'display_name': display_name,
        'answer': answer,
        'voted_at': timestamp
    }
    
    # Add reason if provided
    if reason:
        vote['reason'] = reason
    
    # Save vote to DynamoDB
    poll_votes_table.put_item(Item=vote)
    
    return success_response(vote, 201)

