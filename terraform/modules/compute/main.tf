locals {
  web_services = [for svc in var.services : svc if try(svc.port, 0) > 0]
  web_service  = length(local.web_services) > 0 ? local.web_services[0] : var.services[0]
  log_group_name = coalesce(var.log_group_override, var.desired_log_group_name, "/deplai/ifca")
}

resource "aws_ecr_repository" "app" {
  name                 = var.ecr_repository_name
  image_tag_mutability = "MUTABLE"
  tags                 = var.common_tags
}

resource "aws_cloudwatch_log_group" "ecs" {
  name              = local.log_group_name
  retention_in_days = var.log_retention_days
  tags              = var.common_tags
}

resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-cluster"
  tags = var.common_tags
}

resource "aws_lb" "main" {
  count              = var.load_balancer_enabled ? 1 : 0
  name               = substr("${var.project_name}-alb", 0, 32)
  internal           = false
  load_balancer_type = "application"
  security_groups    = [var.alb_security_group_id]
  subnets            = var.public_subnet_ids
  tags               = var.common_tags
}

resource "aws_lb_target_group" "app" {
  count       = var.load_balancer_enabled ? 1 : 0
  name_prefix = "tg-"
  port        = try(local.web_service.port, 3000)
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = var.vpc_id
  health_check {
    path                = "/"
    matcher             = "200-399"
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }
}

resource "aws_lb_listener" "http" {
  count             = var.load_balancer_enabled ? 1 : 0
  load_balancer_arn = aws_lb.main[0].arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app[0].arn
  }
}

resource "aws_ecs_task_definition" "service" {
  for_each                 = { for svc in var.services : svc.id => svc }
  family                   = "${var.project_name}-${each.key}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = tostring(try(each.value.cpu, 512))
  memory                   = tostring(try(each.value.memory, 1024))
  execution_role_arn       = var.ecs_execution_role_arn
  task_role_arn            = var.ecs_task_role_arn

  container_definitions = jsonencode([{ 
    name      = each.key
    image     = aws_ecr_repository.app.repository_url
    essential = true
    command   = try(each.value.command, null)
    portMappings = try(each.value.port, 0) > 0 ? [{
      containerPort = try(each.value.port, 3000)
      hostPort      = try(each.value.port, 3000)
      protocol      = "tcp"
    }] : []
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = aws_cloudwatch_log_group.ecs.name
        awslogs-region        = var.aws_region
        awslogs-stream-prefix = each.key
      }
    }
  }])
}

resource "aws_ecs_service" "service" {
  for_each        = { for svc in var.services : svc.id => svc }
  name            = "${var.project_name}-${each.key}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.service[each.key].arn
  launch_type     = "FARGATE"
  desired_count   = try(each.value.desired_count, 1)

  network_configuration {
    assign_public_ip = false
    subnets          = var.private_subnet_ids
    security_groups  = [var.app_security_group_id]
  }

  dynamic "load_balancer" {
    for_each = var.load_balancer_enabled && try(each.value.port, 0) > 0 && each.key == local.web_service.id ? [1] : []
    content {
      target_group_arn = aws_lb_target_group.app[0].arn
      container_name   = each.key
      container_port   = try(each.value.port, 3000)
    }
  }

  depends_on = var.load_balancer_enabled ? [aws_lb_listener.http[0]] : []
}
