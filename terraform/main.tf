# Create a new VPC
resource "aws_vpc" "ifca" {
  cidr_block = "10.0.0.0/16"
}

# Create a new subnet
resource "aws_subnet" "ifca" {
  vpc_id            = aws_vpc.ifca.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "us-west-2a"
}

# Create a new security group
resource "aws_security_group" "ifca" {
  name        = "ifca-sg"
  description = "Allow inbound traffic on port 80 and 443"
  vpc_id      = aws_vpc.ifca.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Create a new PostgreSQL database
resource "aws_db_instance" "ifca" {
  allocated_storage    = 20
  engine               = "postgres"
  engine_version       = "14.3"
  instance_class       = "db.t3.small"
  name                 = "ifca"
  username             = "ifca"
  password             = "ifca"
  vpc_security_group_ids = [aws_security_group.ifca.id]
  publicly_accessible  = true
}

# Create a new Redis cache
resource "aws_elasticache_cluster" "ifca" {
  cluster_id           = "ifca-redis"
  engine               = "redis"
  engine_version       = "7.0"
  node_type            = "cache.t3.small"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
}

# Create a new ECS cluster
resource "aws_ecs_cluster" "ifca" {
  name = "ifca-ecs"
}

# Create a new ECS task definition
resource "aws_ecs_task_definition" "ifca" {
  family                = "ifca-task"
  network_mode          = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                  = 512
  execution_role_arn     = aws_iam_role.ifca.arn
  container_definitions = jsonencode([
    {
      name      = "ifca"
      image      = "ifca:latest"
      cpu        = 256
      memory     = 512
      essential = true
      portMappings = [
        {
          containerPort = 80
          hostPort      = 80
          protocol      = "tcp"
        }
      ]
    }
  ])
}

# Create a new ECS service
resource "aws_ecs_service" "ifca" {
  name            = "ifca-service"
  cluster         = aws_ecs_cluster.ifca.name
  task_definition = aws_ecs_task_definition.ifca.arn
  desired_count   = 1
  launch_type      = "FARGATE"
  network_configuration {
    subnets          = [aws_subnet.ifca.id]
    security_groups = [aws_security_group.ifca.id]
    assign_public_ip = "ENABLED"
  }
}

# Create a new ALB
resource "aws_alb" "ifca" {
  name            = "ifca-alb"
  subnets         = [aws_subnet.ifca.id]
  security_groups = [aws_security_group.ifca.id]
}

# Create a new ALB target group
resource "aws_alb_target_group" "ifca" {
  name     = "ifca-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.ifca.id
}

# Create a new ALB listener
resource "aws_alb_listener" "ifca" {
  load_balancer_arn = aws_alb.ifca.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    target_group_arn = aws_alb_target_group.ifca.arn
    type              = "forward"
  }
}
