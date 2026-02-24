terraform {
  backend "s3" {
    bucket         = "sre-terraform-state-33"
    key            = "eks/dev/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}