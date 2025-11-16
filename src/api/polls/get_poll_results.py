from utils.response_builder import (
    success_response,
    error_response,
    error_handler
)
from utils.helpers import (
    get_user_id_from_event,
    get_table,
    get_path_param
)

polls_table = get_table('POLLS_TABLE_NAME')
poll_votes_table = get_table('POLL_VOTES_TABLE_NAME')

@error_handler
def lambda_handler(event, context):
    # Extract user_id from Cognito authorizer claims
    user_id = get_user_id_from_event(event)
    
    # Get poll_id
    poll_id = get_path_param(event, 'poll_id')
    
    # Check if user has voted on this poll
    user_vote_response = poll_votes_table.get_item(
        Key={
            'poll_id': poll_id,
            'user_id': user_id
        }
    )
    if 'Item' not in user_vote_response:
        return error_response('You must vote before viewing results', 403)
    
    # Query all votes for this poll
    votes_response = poll_votes_table.query(
        KeyConditionExpression='poll_id = :poll_id',
        ExpressionAttributeValues={
            ':poll_id': poll_id
        }
    )
    votes = votes_response.get('Items', [])
    
    # Calculate results
    total_votes = len(votes)
    yes_votes = sum(1 for vote in votes if vote.get('answer') == 'Yes')
    no_votes = total_votes - yes_votes
    
    # Calculate percentages
    yes_percentage = round((yes_votes / total_votes * 100), 1) if total_votes > 0 else 0
    no_percentage = round((no_votes / total_votes * 100), 1) if total_votes > 0 else 0
    
    results = {
        'poll_id': poll_id,
        'total_votes': total_votes,
        'yes_votes': yes_votes,
        'no_votes': no_votes,
        'yes_percentage': yes_percentage,
        'no_percentage': no_percentage
    }
    
    return success_response(results)

