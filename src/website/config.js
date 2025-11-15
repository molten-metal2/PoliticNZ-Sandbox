// Cognito Configuration
// Update these values after running Terraform:
// 1. Run: terraform output -raw cognito_domain
// 2. Run: terraform output -raw cognito_client_id
// 3. Replace the values below

const CONFIG = {
  COGNITO_DOMAIN: 'politicnz-auth.auth.ap-southeast-2.amazoncognito.com',
  CLIENT_ID: 'REPLACE_WITH_TERRAFORM_OUTPUT_cognito_client_id'
};

