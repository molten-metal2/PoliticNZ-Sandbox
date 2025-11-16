import uuid
from utils.response_builder import (
    success_response,
    error_handler
)
from utils.helpers import (
    get_user_id_from_event,
    get_table,
    get_current_timestamp
)

polls_table = get_table('POLLS_TABLE_NAME')
poll_votes_table = get_table('POLL_VOTES_TABLE_NAME')

@error_handler
def lambda_handler(event, context):
    # Extract user_id from Cognito authorizer claims
    user_id = get_user_id_from_event(event)
    
    # For now, return hardcoded initial poll
    # In the future, this could query the polls table
    poll_id = "national-coalition-2024"
    
    poll = {
        'poll_id': poll_id,
        'question': 'Do you support the current government (National led coalition)?',
        'info_text': 'Current government includes; National, ACT, NZ First',
        'options': ['Yes', 'No'],
        'created_at': '2024-01-01T00:00:00.000000'
    }
    
    # Check if user has already voted on this poll
    vote_response = poll_votes_table.get_item(
        Key={
            'poll_id': poll_id,
            'user_id': user_id
        }
    )
    has_voted = 'Item' in vote_response
    if has_voted:
        poll['user_vote'] = {
            'answer': vote_response['Item'].get('answer'),
            'reason': vote_response['Item'].get('reason', ''),
            'voted_at': vote_response['Item'].get('voted_at')
        }
    
    poll['has_voted'] = has_voted
    
    # Return as array (for future expansion to multiple polls)
    return success_response([poll])
