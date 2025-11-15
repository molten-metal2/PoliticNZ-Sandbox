#####################################################################
# POSTS API FEATURE
# Complete post/feed system including:
# - DynamoDB table for post storage
# - IAM policies for Lambda execution
# - Lambda functions for post operations
# - API Gateway endpoints for /posts resource
#####################################################################

#####################################################################
# DYNAMODB TABLE FOR POSTS
#####################################################################

resource "aws_dynamodb_table" "posts" {
  name         = "politicnz-posts"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "post_id"

  attribute {
    name = "post_id"
    type = "S"
  }

  attribute {
    name = "user_id"
    type = "S"
  }

  attribute {
    name = "created_at"
    type = "S"
  }

  # Global Secondary Index for querying posts by user
  global_secondary_index {
    name            = "UserIdIndex"
    hash_key        = "user_id"
    range_key       = "created_at"
    projection_type = "ALL"
  }

  # Global Secondary Index for querying all posts sorted by timestamp (feed)
  global_secondary_index {
    name            = "TimestampIndex"
    hash_key        = "created_at"
    projection_type = "ALL"
  }
}

#####################################################################
# IAM POLICY FOR POSTS TABLE ACCESS
#####################################################################

resource "aws_iam_role_policy" "lambda_posts_dynamodb_policy" {
  name = "lambda-posts-dynamodb-policy"
  role = aws_iam_role.lambda_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          aws_dynamodb_table.posts.arn,
          "${aws_dynamodb_table.posts.arn}/index/*"
        ]
      }
    ]
  })
}

#####################################################################
# LAMBDA FUNCTIONS
#####################################################################

data "archive_file" "create_post_lambda" {
  type        = "zip"
  source_file = "${path.module}/../src/api/posts/create_post.py"
  output_path = "${path.module}/lambda_create_post.zip"
}

data "archive_file" "get_feed_lambda" {
  type        = "zip"
  source_file = "${path.module}/../src/api/posts/get_feed.py"
  output_path = "${path.module}/lambda_get_feed.zip"
}

data "archive_file" "get_user_posts_lambda" {
  type        = "zip"
  source_file = "${path.module}/../src/api/posts/get_user_posts.py"
  output_path = "${path.module}/lambda_get_user_posts.zip"
}

data "archive_file" "update_post_lambda" {
  type        = "zip"
  source_file = "${path.module}/../src/api/posts/update_post.py"
  output_path = "${path.module}/lambda_update_post.zip"
}

data "archive_file" "delete_post_lambda" {
  type        = "zip"
  source_file = "${path.module}/../src/api/posts/delete_post.py"
  output_path = "${path.module}/lambda_delete_post.zip"
}

resource "aws_lambda_function" "create_post" {
  filename         = data.archive_file.create_post_lambda.output_path
  function_name    = "politicnz-create-post"
  role            = aws_iam_role.lambda_execution.arn
  handler         = "create_post.lambda_handler"
  source_code_hash = data.archive_file.create_post_lambda.output_base64sha256
  runtime         = "python3.12"
  timeout         = 10

  environment {
    variables = {
      POSTS_TABLE_NAME    = aws_dynamodb_table.posts.name
      PROFILES_TABLE_NAME = aws_dynamodb_table.user_profiles.name
    }
  }
}

resource "aws_lambda_function" "get_feed" {
  filename         = data.archive_file.get_feed_lambda.output_path
  function_name    = "politicnz-get-feed"
  role            = aws_iam_role.lambda_execution.arn
  handler         = "get_feed.lambda_handler"
  source_code_hash = data.archive_file.get_feed_lambda.output_base64sha256
  runtime         = "python3.12"
  timeout         = 10

  environment {
    variables = {
      POSTS_TABLE_NAME = aws_dynamodb_table.posts.name
    }
  }
}

resource "aws_lambda_function" "get_user_posts" {
  filename         = data.archive_file.get_user_posts_lambda.output_path
  function_name    = "politicnz-get-user-posts"
  role            = aws_iam_role.lambda_execution.arn
  handler         = "get_user_posts.lambda_handler"
  source_code_hash = data.archive_file.get_user_posts_lambda.output_base64sha256
  runtime         = "python3.12"
  timeout         = 10

  environment {
    variables = {
      POSTS_TABLE_NAME = aws_dynamodb_table.posts.name
    }
  }
}

resource "aws_lambda_function" "update_post" {
  filename         = data.archive_file.update_post_lambda.output_path
  function_name    = "politicnz-update-post"
  role            = aws_iam_role.lambda_execution.arn
  handler         = "update_post.lambda_handler"
  source_code_hash = data.archive_file.update_post_lambda.output_base64sha256
  runtime         = "python3.12"
  timeout         = 10

  environment {
    variables = {
      POSTS_TABLE_NAME = aws_dynamodb_table.posts.name
    }
  }
}

resource "aws_lambda_function" "delete_post" {
  filename         = data.archive_file.delete_post_lambda.output_path
  function_name    = "politicnz-delete-post"
  role            = aws_iam_role.lambda_execution.arn
  handler         = "delete_post.lambda_handler"
  source_code_hash = data.archive_file.delete_post_lambda.output_base64sha256
  runtime         = "python3.12"
  timeout         = 10

  environment {
    variables = {
      POSTS_TABLE_NAME = aws_dynamodb_table.posts.name
    }
  }
}

#####################################################################
# API GATEWAY RESOURCES AND METHODS
#####################################################################

# /posts resource
resource "aws_api_gateway_resource" "posts" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "posts"
}

# POST /posts - Create post
resource "aws_api_gateway_method" "create_post" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.posts.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

resource "aws_api_gateway_integration" "create_post" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.posts.id
  http_method             = aws_api_gateway_method.create_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.create_post.invoke_arn
}

# GET /posts - Get feed
resource "aws_api_gateway_method" "get_feed" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.posts.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

resource "aws_api_gateway_integration" "get_feed" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.posts.id
  http_method             = aws_api_gateway_method.get_feed.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.get_feed.invoke_arn
}

# /posts/user resource
resource "aws_api_gateway_resource" "posts_user" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.posts.id
  path_part   = "user"
}

# GET /posts/user - Get user's posts
resource "aws_api_gateway_method" "get_user_posts" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.posts_user.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

resource "aws_api_gateway_integration" "get_user_posts" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.posts_user.id
  http_method             = aws_api_gateway_method.get_user_posts.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.get_user_posts.invoke_arn
}

# /posts/{post_id} resource
resource "aws_api_gateway_resource" "post_item" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.posts.id
  path_part   = "{post_id}"
}

# PUT /posts/{post_id} - Update post
resource "aws_api_gateway_method" "update_post" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.post_item.id
  http_method   = "PUT"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

resource "aws_api_gateway_integration" "update_post" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.post_item.id
  http_method             = aws_api_gateway_method.update_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.update_post.invoke_arn
}

# DELETE /posts/{post_id} - Delete post
resource "aws_api_gateway_method" "delete_post" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.post_item.id
  http_method   = "DELETE"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

resource "aws_api_gateway_integration" "delete_post" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.post_item.id
  http_method             = aws_api_gateway_method.delete_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.delete_post.invoke_arn
}

# CORS OPTIONS for /posts
resource "aws_api_gateway_method" "posts_options" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.posts.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "posts_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.posts.id
  http_method = aws_api_gateway_method.posts_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "posts_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.posts.id
  http_method = aws_api_gateway_method.posts_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }

  response_models = {
    "application/json" = "Empty"
  }
}

resource "aws_api_gateway_integration_response" "posts_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.posts.id
  http_method = aws_api_gateway_method.posts_options.http_method
  status_code = aws_api_gateway_method_response.posts_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  depends_on = [aws_api_gateway_integration.posts_options]
}

# CORS OPTIONS for /posts/user
resource "aws_api_gateway_method" "posts_user_options" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.posts_user.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "posts_user_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.posts_user.id
  http_method = aws_api_gateway_method.posts_user_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "posts_user_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.posts_user.id
  http_method = aws_api_gateway_method.posts_user_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }

  response_models = {
    "application/json" = "Empty"
  }
}

resource "aws_api_gateway_integration_response" "posts_user_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.posts_user.id
  http_method = aws_api_gateway_method.posts_user_options.http_method
  status_code = aws_api_gateway_method_response.posts_user_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  depends_on = [aws_api_gateway_integration.posts_user_options]
}

# CORS OPTIONS for /posts/{post_id}
resource "aws_api_gateway_method" "post_item_options" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.post_item.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "post_item_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.post_item.id
  http_method = aws_api_gateway_method.post_item_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "post_item_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.post_item.id
  http_method = aws_api_gateway_method.post_item_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }

  response_models = {
    "application/json" = "Empty"
  }
}

resource "aws_api_gateway_integration_response" "post_item_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.post_item.id
  http_method = aws_api_gateway_method.post_item_options.http_method
  status_code = aws_api_gateway_method_response.post_item_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'PUT,DELETE,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  depends_on = [aws_api_gateway_integration.post_item_options]
}

#####################################################################
# LAMBDA PERMISSIONS
#####################################################################

resource "aws_lambda_permission" "create_post" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.create_post.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "get_feed" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_feed.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "get_user_posts" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_user_posts.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "update_post" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.update_post.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "delete_post" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.delete_post.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

