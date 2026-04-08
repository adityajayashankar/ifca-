# IaC Bundle - ifca-

Generated from deployment_profile using the curated ECS module tree.

Repository summary:
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
A: Primary service

Q: What environment should we target for this node (express, nextjs, prisma, react) deployment?
A: Development

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
