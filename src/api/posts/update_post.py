import json
import os
import boto3
from datetime import datetime
from botocore.exceptions import ClientError

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['POSTS_TABLE_NAME'])

def lambda_handler(event, context):
    """
    PUT /posts/{post_id} - Update a post
    Authenticated endpoint - only the post owner can update
    """
    try:
        # Extract user_id from Cognito authorizer claims
        user_id = event['requestContext']['authorizer']['claims']['sub']
        
        # Get post_id from path parameters
        post_id = event['pathParameters']['post_id']
        
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        
        # Validate content
        content = body.get('content', '').strip()
        if not content:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Content is required'})
            }
        
        # Limit content length to 280 characters
        if len(content) > 280:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Content must not exceed 280 characters'})
            }
        
        # Get existing post to verify ownership
        existing = table.get_item(Key={'post_id': post_id})
        if 'Item' not in existing:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Post not found'})
            }
        
        # Verify ownership
        if existing['Item']['user_id'] != user_id:
            return {
                'statusCode': 403,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Forbidden - You can only edit your own posts'})
            }
        
        # Update post
        timestamp = datetime.utcnow().isoformat()
        
        response = table.update_item(
            Key={'post_id': post_id},
            UpdateExpression='SET content = :content, updated_at = :updated_at',
            ExpressionAttributeValues={
                ':content': content,
                ':updated_at': timestamp
            },
            ReturnValues='ALL_NEW'
        )
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(response['Attributes'])
        }
        
    except Exception as e:
        print(f"Authorization error: Missing claim or parameter - {str(e)}")
        return {
            'statusCode': 401,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Unauthorized - Invalid token or missing parameters'})
        }
    
    except Exception as e:
        print(f"DynamoDB error: {e.response['Error']['Code']}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Internal server error'})
        }
    
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Internal server error'})
        }

