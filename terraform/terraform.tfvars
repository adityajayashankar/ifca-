project_name = "ifca"
aws_region = "eu-north-1"
environment = "dev"
instance_type = "t3.micro"
enable_ec2 = true
existing_ec2_key_pair_name = ""
ingress_cidr_blocks = ["0.0.0.0/0"]
ssh_ingress_cidr_blocks = []
preferred_availability_zones = ["eu-north-1a", "eu-north-1b", "eu-north-1c"]
use_default_vpc = true
vpc_cidr_block = "10.42.0.0/16"
public_subnet_cidr = "10.42.1.0/24"
force_destroy_site_bucket = true
ec2_root_volume_size = 8
bootstrap_index_html_base64 = "PCFET0NUWVBFIGh0bWw+DQo8aHRtbCBsYW5nPSJlbiI+DQogIDxoZWFkPg0KICAgIDxtZXRhIGNoYXJzZXQ9InV0Zi04IiAvPg0KICAgIDxsaW5rIHJlbD0iaWNvbiIgaHJlZj0iJVBVQkxJQ19VUkwlL2Zhdmljb24uaWNvIiAvPg0KICAgIDxtZXRhIG5hbWU9InZpZXdwb3J0IiBjb250ZW50PSJ3aWR0aD1kZXZpY2Utd2lkdGgsIGluaXRpYWwtc2NhbGU9MSIgLz4NCiAgICA8bGluayByZWw9InByZWNvbm5lY3QiIGhyZWY9Imh0dHBzOi8vZm9udHMuZ29vZ2xlYXBpcy5jb20iPjxsaW5rIHJlbD0icHJlY29ubmVjdCIgaHJlZj0iaHR0cHM6Ly9mb250cy5nc3RhdGljLmNvbSIgY3Jvc3NvcmlnaW4+DQogICAgPGxpbmsgaHJlZj0iaHR0cHM6Ly9mb250cy5nb29nbGVhcGlzLmNvbS9jc3MyP2ZhbWlseT1NYXZlbitQcm86d2dodEA0MDA7NTAwOzYwMDs3MDA7ODAwOzkwMCZkaXNwbGF5PXN3YXAiIHJlbD0ic3R5bGVzaGVldCI+DQogICAgPHRpdGxlPklGQ0E8L3RpdGxlPg0KICAgIDxzdHlsZT4NCiAgICAgIEBpbXBvcnQgdXJsKCdodHRwczovL2ZvbnRzLmdvb2dsZWFwaXMuY29tL2NzczI/ZmFtaWx5PU1hdmVuK1Bybzp3Z2h0QDQwMDs1MDA7NjAwOzcwMDs4MDA7OTAwJmRpc3BsYXk9c3dhcCcpOw0KDQogICAgICAqew0KICAgICAgICBmb250LWZhbWlseTogJ01hdmVuIFBybycsIHNhbnMtc2VyaWY7DQogICAgICB9DQogICAgPC9zdHlsZT4NCiAgPC9oZWFkPg0KICA8Ym9keT4NCiAgICA8bm9zY3JpcHQ+WW91IG5lZWQgdG8gZW5hYmxlIEphdmFTY3JpcHQgdG8gcnVuIHRoaXMgYXBwLjwvbm9zY3JpcHQ+DQogICAgPGRpdiBpZD0icm9vdCI+PC9kaXY+DQogIDwvYm9keT4NCiAgDQo8L2h0bWw+"
context_summary = <<-EOT
Q/A Summary: Repository summary:
Runtime: node | Frameworks: express, nextjs, prisma, react | Data stores: postgresql, redis

Repository analysis details:
Runtime: node
Frameworks: nextjs, react, express, prisma, nextjs, react
Data stores: postgresql, redis
Build command: next build
Start command: next start
Health endpoint: /status
Processes: service: postgres | service: pgadmin | service: prisma-postgres-api

Repository analysis markdown:
# Repository Analysis — ifca-

## Detected Stack
- **Language:** javascript / node 
- **Build:** next build
- **Start:** next start
- **Dockerfile:** yes

## Frameworks
- **nextjs** (ssr_web_framework, high)
- **react** (spa_frontend, high)
- **express** (http_api_server, high)
- **prisma** (orm, high)
- **nextjs** (ssr_web_framework, high)
- **react** (spa_frontend, high)

## Data Stores
- **postgresql** (high) — compose_image:postgres:latest, config:backend/api/admin/admin.controller.js, config:backend/api/analytics/analytics.controller.js, config:backend/api/auth/auth.controller.js, config:backend/api/auth/auth.route.js, config:backend/api/auth/auth.service.js, config:backend/api/blog/blog.controller.js, config:backend/api/catchup/catchup.controller.js
- **redis** (high) — config:admin-frontend/components/blog/BlogMarkup.js, config:admin-frontend/components/chat/markup.js, config:admin-frontend/components/common/Navbar.js, config:frontend/components/chat/markup.js, config:frontend/components/common/Markup.js, queue_signal:admin-frontend/components/blog/BlogMarkup.js, queue_signal:admin-frontend/components/chat/markup.js, queue_signal:admin-frontend/components/common/Navbar.js

## Processes
- `service` — postgres
- `service` — pgadmin
- `service` — prisma-postgres-api

## Required Secrets
None detected

## Health Check
/status (high)

## Flags
- redis version not specified anywhere in repo
- No .env.example-style template found. Required secrets list may be incomplete

Q: This repository looks like a multi-service codebase. Which service scope should Terraform target?
A: All detected services

Q: What environment should we target for this node (express, nextjs, prisma, react) deployment?
A: Production

Q: How much traffic should this Terraform stack be sized for at launch?
A: Low

Q: Should the main application endpoint be publicly reachable on the internet?
A: Public

Q: The repository points to Redis. Which engine version should Terraform assume?
A: Redis 7.0

Q: The scanner found a SQL datastore. What database size/profile should Terraform provision?
A: 20 GB / 50 conns

Q: Should the primary SQL database be highly available (Multi-AZ)?
A: No

Q: Should Terraform create fresh AWS networking or assume an existing VPC?
A: Create new VPC
Architecture Context: Repository summary:
Runtime: node | Frameworks: express, nextjs, prisma, react | Data stores: postgresql, redis

Repository analysis details:
Runtime: node
Frameworks: nextjs, react, express, prisma, nextjs, react
Data stores: postgresql, redis
Build command: next build
Start command: next start
Health endpoint: /status
Processes: service: postgres | service: pgadmin | service: prisma-postgres-api

Repository analysis markdown:
# Repository Analysis — ifca-

## Detected Stack
- **Language:** javascript / node 
- **Build:** next build
- **Start:** next start
- **Dockerfile:** yes

## Frameworks
- **nextjs** (ssr_web_framework, high)
- **react** (spa_frontend, high)
- **express** (http_api_server, high)
- **prisma** (orm, high)
- **nextjs** (ssr_web_framework, high)
- **react** (spa_frontend, high)

## Data Stores
- **postgresql** (high) — compose_image:postgres:latest, config:backend/api/admin/admin.controller.js, config:backend/api/analytics/analytics.controller.js, config:backend/api/auth/auth.controller.js, config:backend/api/auth/auth.route.js, config:backend/api/auth/auth.service.js, config:backend/api/blog/blog.controller.js, config:backend/api/catchup/catchup.controller.js
- **redis** (high) — config:admin-frontend/components/blog/BlogMarkup.js, config:admin-frontend/components/chat/markup.js, config:admin-frontend/components/common/Navbar.js, config:frontend/components/chat/markup.js, config:frontend/components/common/Markup.js, queue_signal:admin-frontend/components/blog/BlogMarkup.js, queue_signal:admin-frontend/components/chat/markup.js, queue_signal:admin-frontend/components/common/Navbar.js

## Processes
- `service` — postgres
- `service` — pgadmin
- `service` — prisma-postgres-api

## Required Secrets
None detected

## Health Check
/status (high)

## Flags
- redis version not specified anywhere in repo
- No .env.example-style template found. Required secrets list may be incomplete

Q: This repository looks like a multi-service codebase. Which service scope should Terraform target?
A: All detected services

Q: What environment should we target for this node (express, nextjs, prisma, react) deployment?
A: Production

Q: How much traffic should this Terraform stack be sized for at launch?
A: Low

Q: Should the main application endpoint be publicly reachable on the internet?
A: Public

Q: The repository points to Redis. Which engine version should Terraform assume?
A: Redis 7.0

Q: The scanner found a SQL datastore. What database size/profile should Terraform provision?
A: 20 GB / 50 conns

Q: Should the primary SQL database be highly available (Multi-AZ)?
A: No

Q: Should Terraform create fresh AWS networking or assume an existing VPC?
A: Create new VPC
Code Findings: 0
Supply Findings: 0
Critical/High Supply: 0
High-impact CWE IDs: none
EOT
