import json
import os
import boto3
from botocore.exceptions import ClientError

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['POSTS_TABLE_NAME'])

def lambda_handler(event, context):
    """
    DELETE /posts/{post_id} - Delete a post
    Authenticated endpoint - only the post owner can delete
    """
    try:
        # Extract user_id from Cognito authorizer claims
        user_id = event['requestContext']['authorizer']['claims']['sub']
        
        # Get post_id from path parameters
        post_id = event['pathParameters']['post_id']
        
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
                'body': json.dumps({'error': 'Forbidden - You can only delete your own posts'})
            }
        
        # Delete post
        table.delete_item(Key={'post_id': post_id})
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'message': 'Post deleted successfully'})
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

