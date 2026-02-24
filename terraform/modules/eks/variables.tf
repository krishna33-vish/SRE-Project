variable "aws_region" {}
variable "environment" {}
variable "cluster_name" {}
variable "vpc_cidr" {}
variable "instance_type" {}
variable "desired_capacity" {}
variable "max_capacity" {}
variable "min_capacity" {}
variable "private_subnets" {
  type = list(string)
}

variable "vpc_id" {
  type = string
}