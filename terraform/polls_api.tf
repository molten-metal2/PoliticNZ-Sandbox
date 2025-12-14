#####################################################################
# POLLS API FEATURE
# Complete polling system including:
# - DynamoDB tables for polls and votes
# - IAM policies for Lambda execution
# - Lambda functions for poll operations
# - API Gateway endpoints for /polls resource
#####################################################################

#####################################################################
# DYNAMODB TABLE FOR POLLS
#####################################################################

resource "aws_dynamodb_table" "polls" {
  name         = "politicnz-polls"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "poll_id"

  attribute {
    name = "poll_id"
    type = "S"
  }

  attribute {
    name = "created_at"
    type = "S"
  }

  # Global Secondary Index for querying all polls sorted by timestamp
  global_secondary_index {
    name            = "TimestampIndex"
    hash_key        = "created_at"
    projection_type = "ALL"
  }
}

#####################################################################
# DYNAMODB TABLE FOR POLL VOTES
#####################################################################

resource "aws_dynamodb_table" "poll_votes" {
  name         = "politicnz-poll-votes"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "poll_id"
  range_key    = "user_id"

  attribute {
    name = "poll_id"
    type = "S"
  }

  attribute {
    name = "user_id"
    type = "S"
  }

  attribute {
    name = "voted_at"
    type = "S"
  }

  # Global Secondary Index for querying votes by user
  global_secondary_index {
    name            = "UserVotesIndex"
    hash_key        = "user_id"
    range_key       = "voted_at"
    projection_type = "ALL"
  }
}

#####################################################################
# IAM POLICY FOR POLLS TABLE ACCESS
#####################################################################

resource "aws_iam_role_policy" "lambda_polls_dynamodb_policy" {
  name = "lambda-polls-dynamodb-policy"
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
          aws_dynamodb_table.polls.arn,
          "${aws_dynamodb_table.polls.arn}/index/*",
          aws_dynamodb_table.poll_votes.arn,
          "${aws_dynamodb_table.poll_votes.arn}/index/*"
        ]
      }
    ]
  })
}

#####################################################################
# LAMBDA FUNCTIONS
#####################################################################

data "archive_file" "get_polls_lambda" {
  type        = "zip"
  source_dir  = "${path.module}/../src/api"
  output_path = "${path.module}/lambda_get_polls.zip"
}

data "archive_file" "vote_poll_lambda" {
  type        = "zip"
  source_dir  = "${path.module}/../src/api"
  output_path = "${path.module}/lambda_vote_poll.zip"
}

data "archive_file" "get_poll_results_lambda" {
  type        = "zip"
  source_dir  = "${path.module}/../src/api"
  output_path = "${path.module}/lambda_get_poll_results.zip"
}

data "archive_file" "get_user_poll_votes_lambda" {
  type        = "zip"
  source_dir  = "${path.module}/../src/api"
  output_path = "${path.module}/lambda_get_user_poll_votes.zip"
}

resource "aws_lambda_function" "get_polls" {
  filename         = data.archive_file.get_polls_lambda.output_path
  function_name    = "politicnz-get-polls"
  role            = aws_iam_role.lambda_execution.arn
  handler         = "polls/get_polls.lambda_handler"
  source_code_hash = data.archive_file.get_polls_lambda.output_base64sha256
  runtime         = "python3.12"
  timeout         = 10

  environment {
    variables = {
      POLLS_TABLE_NAME = aws_dynamodb_table.polls.name
      POLL_VOTES_TABLE_NAME = aws_dynamodb_table.poll_votes.name
    }
  }
}

resource "aws_lambda_function" "vote_poll" {
  filename         = data.archive_file.vote_poll_lambda.output_path
  function_name    = "politicnz-vote-poll"
  role            = aws_iam_role.lambda_execution.arn
  handler         = "polls/vote_poll.lambda_handler"
  source_code_hash = data.archive_file.vote_poll_lambda.output_base64sha256
  runtime         = "python3.12"
  timeout         = 10

  environment {
    variables = {
      POLLS_TABLE_NAME = aws_dynamodb_table.polls.name
      POLL_VOTES_TABLE_NAME = aws_dynamodb_table.poll_votes.name
      PROFILES_TABLE_NAME = aws_dynamodb_table.user_profiles.name
    }
  }
}

resource "aws_lambda_function" "get_poll_results" {
  filename         = data.archive_file.get_poll_results_lambda.output_path
  function_name    = "politicnz-get-poll-results"
  role            = aws_iam_role.lambda_execution.arn
  handler         = "polls/get_poll_results.lambda_handler"
  source_code_hash = data.archive_file.get_poll_results_lambda.output_base64sha256
  runtime         = "python3.12"
  timeout         = 10

  environment {
    variables = {
      POLLS_TABLE_NAME = aws_dynamodb_table.polls.name
      POLL_VOTES_TABLE_NAME = aws_dynamodb_table.poll_votes.name
    }
  }
}

resource "aws_lambda_function" "get_user_poll_votes" {
  filename         = data.archive_file.get_user_poll_votes_lambda.output_path
  function_name    = "politicnz-get-user-poll-votes"
  role            = aws_iam_role.lambda_execution.arn
  handler         = "polls/get_user_poll_votes.lambda_handler"
  source_code_hash = data.archive_file.get_user_poll_votes_lambda.output_base64sha256
  runtime         = "python3.12"
  timeout         = 10

  environment {
    variables = {
      POLLS_TABLE_NAME = aws_dynamodb_table.polls.name
      POLL_VOTES_TABLE_NAME = aws_dynamodb_table.poll_votes.name
    }
  }
}

#####################################################################
# API GATEWAY RESOURCES AND METHODS
#####################################################################

# /polls resource
resource "aws_api_gateway_resource" "polls" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "polls"
}

# GET /polls - Get all polls
resource "aws_api_gateway_method" "get_polls" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.polls.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

resource "aws_api_gateway_integration" "get_polls" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.polls.id
  http_method             = aws_api_gateway_method.get_polls.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.get_polls.invoke_arn
}

# /polls/{poll_id} resource
resource "aws_api_gateway_resource" "poll_item" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.polls.id
  path_part   = "{poll_id}"
}

# /polls/{poll_id}/vote resource
resource "aws_api_gateway_resource" "poll_vote" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.poll_item.id
  path_part   = "vote"
}

# POST /polls/{poll_id}/vote - Submit vote
resource "aws_api_gateway_method" "vote_poll" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.poll_vote.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

resource "aws_api_gateway_integration" "vote_poll" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.poll_vote.id
  http_method             = aws_api_gateway_method.vote_poll.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.vote_poll.invoke_arn
}

# /polls/{poll_id}/results resource
resource "aws_api_gateway_resource" "poll_results" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.poll_item.id
  path_part   = "results"
}

# GET /polls/{poll_id}/results - Get poll results
resource "aws_api_gateway_method" "get_poll_results" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.poll_results.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

resource "aws_api_gateway_integration" "get_poll_results" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.poll_results.id
  http_method             = aws_api_gateway_method.get_poll_results.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.get_poll_results.invoke_arn
}

# /polls/user resource
resource "aws_api_gateway_resource" "polls_user" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.polls.id
  path_part   = "user"
}

# /polls/user/votes resource
resource "aws_api_gateway_resource" "user_poll_votes" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.polls_user.id
  path_part   = "votes"
}

# GET /polls/user/votes - Get user's poll votes
resource "aws_api_gateway_method" "get_user_poll_votes" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.user_poll_votes.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

resource "aws_api_gateway_integration" "get_user_poll_votes" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.user_poll_votes.id
  http_method             = aws_api_gateway_method.get_user_poll_votes.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.get_user_poll_votes.invoke_arn
}

#####################################################################
# CORS CONFIGURATION
#####################################################################

# CORS OPTIONS for /polls
resource "aws_api_gateway_method" "polls_options" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.polls.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "polls_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.polls.id
  http_method = aws_api_gateway_method.polls_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "polls_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.polls.id
  http_method = aws_api_gateway_method.polls_options.http_method
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

resource "aws_api_gateway_integration_response" "polls_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.polls.id
  http_method = aws_api_gateway_method.polls_options.http_method
  status_code = aws_api_gateway_method_response.polls_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  depends_on = [aws_api_gateway_integration.polls_options]
}

# CORS OPTIONS for /polls/{poll_id}/vote
resource "aws_api_gateway_method" "poll_vote_options" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.poll_vote.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "poll_vote_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.poll_vote.id
  http_method = aws_api_gateway_method.poll_vote_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "poll_vote_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.poll_vote.id
  http_method = aws_api_gateway_method.poll_vote_options.http_method
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

resource "aws_api_gateway_integration_response" "poll_vote_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.poll_vote.id
  http_method = aws_api_gateway_method.poll_vote_options.http_method
  status_code = aws_api_gateway_method_response.poll_vote_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  depends_on = [aws_api_gateway_integration.poll_vote_options]
}

# CORS OPTIONS for /polls/{poll_id}/results
resource "aws_api_gateway_method" "poll_results_options" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.poll_results.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "poll_results_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.poll_results.id
  http_method = aws_api_gateway_method.poll_results_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "poll_results_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.poll_results.id
  http_method = aws_api_gateway_method.poll_results_options.http_method
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

resource "aws_api_gateway_integration_response" "poll_results_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.poll_results.id
  http_method = aws_api_gateway_method.poll_results_options.http_method
  status_code = aws_api_gateway_method_response.poll_results_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  depends_on = [aws_api_gateway_integration.poll_results_options]
}

# CORS OPTIONS for /polls/user/votes
resource "aws_api_gateway_method" "user_poll_votes_options" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.user_poll_votes.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "user_poll_votes_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.user_poll_votes.id
  http_method = aws_api_gateway_method.user_poll_votes_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "user_poll_votes_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.user_poll_votes.id
  http_method = aws_api_gateway_method.user_poll_votes_options.http_method
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

resource "aws_api_gateway_integration_response" "user_poll_votes_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.user_poll_votes.id
  http_method = aws_api_gateway_method.user_poll_votes_options.http_method
  status_code = aws_api_gateway_method_response.user_poll_votes_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  depends_on = [aws_api_gateway_integration.user_poll_votes_options]
}

#####################################################################
# LAMBDA PERMISSIONS
#####################################################################

resource "aws_lambda_permission" "get_polls" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_polls.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "vote_poll" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.vote_poll.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "get_poll_results" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_poll_results.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "get_user_poll_votes" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_user_poll_votes.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

