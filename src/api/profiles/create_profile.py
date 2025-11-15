import json
import os
import boto3
from datetime import datetime
from utils.response_builder import (
    success_response,
    error_response,
    error_handler
)
from utils.validators import validate_profile_data

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TABLE_NAME'])

@error_handler
def lambda_handler(event, context):
    """
    POST /profile - Create user profile
    Authenticated endpoint - user_id extracted from Cognito JWT
    """
    # Extract user_id from Cognito authorizer claims
    user_id = event['requestContext']['authorizer']['claims']['sub']
    
    # Parse request body
    body = json.loads(event.get('body', '{}'))
    
    # Extract and validate profile fields
    display_name = body.get('display_name', '').strip()
    bio = body.get('bio', '').strip()
    political_alignment = body.get('political_alignment', '').strip()
    
    # Validate all fields
    is_valid, error_msg = validate_profile_data(display_name, bio, political_alignment)
    if not is_valid:
        return error_response(error_msg)
    
    # Create profile item
    timestamp = datetime.utcnow().isoformat()
    profile = {
        'user_id': user_id,
        'display_name': display_name,
        'bio': bio,
        'political_alignment': political_alignment,
        'created_at': timestamp,
        'updated_at': timestamp
    }
    
    # Check if profile already exists
    existing = table.get_item(Key={'user_id': user_id})
    if 'Item' in existing:
        return error_response('Profile already exists. Use PUT to update.', 409)
    
    # Save to DynamoDB
    table.put_item(Item=profile)
    
    return success_response(profile, 201)

