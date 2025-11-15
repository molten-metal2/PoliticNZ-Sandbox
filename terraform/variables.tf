variable "bucket_name" {
  description = "Name of the S3 bucket for website hosting"
  type        = string
  default     = "politicnz-website"
}

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "ap-southeast-2"
}

variable "cognito_domain_prefix" {
  description = "Prefix for Cognito hosted UI domain"
  type        = string
  default     = "politicnz-auth"
}

variable "politicnz_sandbox_google_client_id" {
  description = "Google OAuth Client ID (will be added after Google Console setup)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "politicnz_sandbox_google_client_secret" {
  description = "Google OAuth Client Secret (will be added after Google Console setup)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "environment" {
  description = "Environment name for API Gateway stage"
  type        = string
  default     = "sandbox"
}

