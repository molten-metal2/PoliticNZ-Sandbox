from utils.response_builder import (
    success_response,
    error_handler
)
from utils.helpers import (
    get_user_id_from_event,
    get_table,
    get_query_param
)

poll_votes_table = get_table('POLL_VOTES_TABLE_NAME')

@error_handler
def lambda_handler(event, context):
    # Extract authenticated user_id from Cognito authorizer claims
    auth_user_id = get_user_id_from_event(event)
    
    # Allow querying other users' votes (for profile viewing)
    target_user_id = get_query_param(event, 'user_id', auth_user_id)
    
    # Query votes by user using GSI
    votes_response = poll_votes_table.query(
        IndexName='UserVotesIndex',
        KeyConditionExpression='user_id = :user_id',
        ExpressionAttributeValues={
            ':user_id': target_user_id
        }
    )
    votes = votes_response.get('Items', [])
    
    # Enrich votes with poll questions (hardcoded for now)
    # In the future, this could query the polls table
    for vote in votes:
        if vote.get('poll_id') == 'national-coalition-2024':
            vote['question'] = 'Do you support the current government (National led coalition)?'
            vote['info_text'] = 'Current government includes; National, ACT, NZ First'
    
    return success_response(votes)

