provider "aws" {
  region = "ap-south-1"
}

# 🔐 Security Group
resource "aws_security_group" "ecs_sg" {
  name        = "ecs-security-group"
  description = "Allow HTTP traffic"

  ingress {
    from_port   = 5000
    to_port     = 5000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# 🚀 ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "runners-blog-cluster"
}

# 📡 Default VPC
data "aws_vpc" "default" {
  default = true
}

# 🌐 Subnets
data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# 🎯 Target Group - POSTS
resource "aws_lb_target_group" "posts_tg" {
  name        = "posts-target-group"
  port        = 5000
  protocol    = "HTTP"
  vpc_id      = data.aws_vpc.default.id
  target_type = "ip"

  health_check {
    path                = "/"
    port                = "5000"
    protocol            = "HTTP"
    matcher             = "200-399"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 2
  }
}

# 🎯 Target Group - AUTH
resource "aws_lb_target_group" "auth_tg" {
  name        = "auth-target-group"
  port        = 5000
  protocol    = "HTTP"
  vpc_id      = data.aws_vpc.default.id
  target_type = "ip"

  health_check {
    path                = "/"
    port                = "5000"
    protocol            = "HTTP"
    matcher             = "200-399"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 2
  }
}

# 🌍 Load Balancer
resource "aws_lb" "alb" {
  name               = "runners-blog-alb"
  internal           = false
  load_balancer_type = "application"
  subnets            = data.aws_subnets.default.ids
  security_groups    = [aws_security_group.ecs_sg.id]
}

# 🎧 Listener (default → auth)
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.alb.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.auth_tg.arn
  }
}

# 🔀 Rule → POSTS
resource "aws_lb_listener_rule" "posts_rule" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 1

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.posts_tg.arn
  }

  condition {
    path_pattern {
      values = ["/api/posts*"]
    }
  }
}

# 📦 POSTS TASK
resource "aws_ecs_task_definition" "posts_task" {
  family                   = "posts-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"

  execution_role_arn = "arn:aws:iam::195835301417:role/ecsTaskExecutionRole"

  container_definitions = jsonencode([
    {
      name      = "posts-container"
      image     = "195835301417.dkr.ecr.ap-south-1.amazonaws.com/posts-service:latest"
      essential = true

      portMappings = [
        {
          containerPort = 5000
          hostPort      = 5000
        }
      ]

      environment = [
        {
          name  = "PORT"
          value = "5000"
        }
      ]
    }
  ])
}

# 🔐 AUTH TASK
resource "aws_ecs_task_definition" "auth_task" {
  family                   = "auth-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"

  execution_role_arn = "arn:aws:iam::195835301417:role/ecsTaskExecutionRole"

  container_definitions = jsonencode([
    {
      name      = "auth-container"
      image     = "195835301417.dkr.ecr.ap-south-1.amazonaws.com/auth-service:latest"
      essential = true

      portMappings = [
        {
          containerPort = 5000
          hostPort      = 5000
        }
      ]

      environment = [
        {
          name  = "PORT"
          value = "5000"
        }
      ]
    }
  ])
}

# 🚀 ECS SERVICE - POSTS
resource "aws_ecs_service" "posts_service" {
  name            = "posts-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.posts_task.arn
  launch_type     = "FARGATE"
  desired_count   = 1

  network_configuration {
    subnets          = data.aws_subnets.default.ids
    security_groups  = [aws_security_group.ecs_sg.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.posts_tg.arn
    container_name   = "posts-container"
    container_port   = 5000
  }

  depends_on = [aws_lb_listener.http]
}

# 🔐 ECS SERVICE - AUTH
resource "aws_ecs_service" "auth_service" {
  name            = "auth-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.auth_task.arn
  launch_type     = "FARGATE"
  desired_count   = 1

  network_configuration {
    subnets          = data.aws_subnets.default.ids
    security_groups  = [aws_security_group.ecs_sg.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.auth_tg.arn
    container_name   = "auth-container"
    container_port   = 5000
  }

  depends_on = [aws_lb_listener.http]
}
