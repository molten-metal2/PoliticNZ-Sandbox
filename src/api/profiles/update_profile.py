import json
import os
import boto3
from datetime import datetime
from utils.response_builder import (
    success_response,
    error_response,
    not_found_response,
    error_handler
)
from utils.validators import validate_profile_data

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TABLE_NAME'])

@error_handler
def lambda_handler(event, context):
    """
    PUT /profile - Update user profile
    Authenticated endpoint - user_id extracted from Cognito JWT
    """
    # Extract user_id from Cognito authorizer claims
    user_id = event['requestContext']['authorizer']['claims']['sub']
    
    # Parse request body
    body = json.loads(event.get('body', '{}'))
    
    # Extract fields (allowing None for fields not being updated)
    display_name = body.get('display_name', '').strip() if body.get('display_name') else ''
    bio = body.get('bio', '').strip() if 'bio' in body else None
    political_alignment = body.get('political_alignment', '').strip() if 'political_alignment' in body else None
    
    # Validate all provided fields
    is_valid, error_msg = validate_profile_data(display_name, bio, political_alignment, for_update=True)
    if not is_valid:
        return error_response(error_msg)
    
    # Check if profile exists
    existing = table.get_item(Key={'user_id': user_id})
    if 'Item' not in existing:
        return not_found_response('Profile not found. Use POST to create.')
    
    # Build update expression dynamically
    update_expression = "SET updated_at = :updated_at"
    expression_values = {':updated_at': datetime.utcnow().isoformat()}
    
    if display_name:
        update_expression += ", display_name = :display_name"
        expression_values[':display_name'] = display_name
    
    if bio is not None:
        update_expression += ", bio = :bio"
        expression_values[':bio'] = bio
    
    if political_alignment is not None:
        update_expression += ", political_alignment = :political_alignment"
        expression_values[':political_alignment'] = political_alignment
    
    # Update profile
    response = table.update_item(
        Key={'user_id': user_id},
        UpdateExpression=update_expression,
        ExpressionAttributeValues=expression_values,
        ReturnValues='ALL_NEW'
    )
    
    return success_response(response['Attributes'])

