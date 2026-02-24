module "vpc" {
  source         = "./modules/vpc"
  aws_region     = var.aws_region
  environment    = var.environment
  vpc_cidr       = var.vpc_cidr
  cluster_name   = var.cluster_name
  instance_type  = var.instance_type
  desired_capacity = var.desired_capacity
  max_capacity     = var.max_capacity
  min_capacity     = var.min_capacity
}

module "eks" {
  source            = "./modules/eks"
  aws_region        = var.aws_region
  cluster_name      = var.cluster_name
  environment       = var.environment
  vpc_id            = module.vpc.vpc_id
  private_subnets   = module.vpc.private_subnets
  vpc_cidr          = var.vpc_cidr
  instance_type     = var.instance_type
  desired_capacity  = var.desired_capacity
  max_capacity      = var.max_capacity
  min_capacity      = var.min_capacity
}