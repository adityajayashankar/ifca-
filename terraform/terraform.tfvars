project_name = "ifca"
aws_region = "eu-north-1"
environment = "dev"
instance_type = "t3.micro"
enable_ec2 = true
preferred_availability_zones = ["eu-north-1a", "eu-north-1b", "eu-north-1c"]
ingress_cidr_blocks = ["0.0.0.0/0"]
existing_ec2_key_pair_name = ""
website_block_public_access = true
force_destroy_site_bucket = true
log_retention_days = 30
ec2_root_volume_size = 8
bootstrap_index_html_base64 = "PCFET0NUWVBFIGh0bWw+DQo8aHRtbCBsYW5nPSJlbiI+DQogIDxoZWFkPg0KICAgIDxtZXRhIGNoYXJzZXQ9InV0Zi04IiAvPg0KICAgIDxsaW5rIHJlbD0iaWNvbiIgaHJlZj0iJVBVQkxJQ19VUkwlL2Zhdmljb24uaWNvIiAvPg0KICAgIDxtZXRhIG5hbWU9InZpZXdwb3J0IiBjb250ZW50PSJ3aWR0aD1kZXZpY2Utd2lkdGgsIGluaXRpYWwtc2NhbGU9MSIgLz4NCiAgICA8bGluayByZWw9InByZWNvbm5lY3QiIGhyZWY9Imh0dHBzOi8vZm9udHMuZ29vZ2xlYXBpcy5jb20iPjxsaW5rIHJlbD0icHJlY29ubmVjdCIgaHJlZj0iaHR0cHM6Ly9mb250cy5nc3RhdGljLmNvbSIgY3Jvc3NvcmlnaW4+DQogICAgPGxpbmsgaHJlZj0iaHR0cHM6Ly9mb250cy5nb29nbGVhcGlzLmNvbS9jc3MyP2ZhbWlseT1NYXZlbitQcm86d2dodEA0MDA7NTAwOzYwMDs3MDA7ODAwOzkwMCZkaXNwbGF5PXN3YXAiIHJlbD0ic3R5bGVzaGVldCI+DQogICAgPHRpdGxlPklGQ0E8L3RpdGxlPg0KICAgIDxzdHlsZT4NCiAgICAgIEBpbXBvcnQgdXJsKCdodHRwczovL2ZvbnRzLmdvb2dsZWFwaXMuY29tL2NzczI/ZmFtaWx5PU1hdmVuK1Bybzp3Z2h0QDQwMDs1MDA7NjAwOzcwMDs4MDA7OTAwJmRpc3BsYXk9c3dhcCcpOw0KDQogICAgICAqew0KICAgICAgICBmb250LWZhbWlseTogJ01hdmVuIFBybycsIHNhbnMtc2VyaWY7DQogICAgICB9DQogICAgPC9zdHlsZT4NCiAgPC9oZWFkPg0KICA8Ym9keT4NCiAgICA8bm9zY3JpcHQ+WW91IG5lZWQgdG8gZW5hYmxlIEphdmFTY3JpcHQgdG8gcnVuIHRoaXMgYXBwLjwvbm9zY3JpcHQ+DQogICAgPGRpdiBpZD0icm9vdCI+PC9kaXY+DQogIDwvYm9keT4NCiAgDQo8L2h0bWw+"

context_summary = <<-EOT
Q/A Summary: Q: What AWS region do you want to deploy in, and do you need multi-AZ resilience?
A: eu-north-1 (Stockholm), prefer eu-north-1a and fallback to eu-north-1b/eu-north-1c.

Q: For this repository, what runtime stack and entrypoint should run on EC2 (for example: Python + uvicorn, Node + pm2, Java + systemd)?
A: Python service, run with uvicorn using one process.

Q: How should code be built on the instance for large repos (build command, artifact path, and expected build time)?
A: Use minimal-cost default configuration.

Q: What baseline EC2 sizing do you expect for this repo (vCPU/RAM), and do you need burstable, compute-optimized, or memory-optimized instances?
A: Use t3.micro baseline only (Free Tier safe).

Q: What traffic/load profile do you expect (peak RPS, concurrent users, or batch throughput)?
A: Very low traffic, under 1M requests per month, single instance only.

Q: Do you need horizontal scaling now (ASG + ALB), or is a single-instance rollout acceptable for phase 1?
A: Single-instance rollout for phase 1.

Q: What storage footprint do you need on EC2/EBS (repo checkout size, generated artifacts, logs, and growth per month)?
A: Keep storage minimal: <=5GB website, <=5GB logs, and exactly 8GB EC2 root volume on gp3.

Q: Do any background jobs or long-running workers need separate process management from the web service?
A: No separate workers required initially.

Q: Which ports/protocols must be exposed publicly, and which should stay private within VPC only?
A: Expose only HTTP/HTTPS; keep all internal services private.

Q: Should this be internet-facing via CloudFront, and do you have a custom domain/certificate ready?
A: Internet-facing via EC2 public URL for phase 1; no custom domain yet.

Q: For S3 website hosting, should Block Public Access remain ON (recommended) or be turned OFF?
A: Keep Block Public Access ON.

Q: What secret/config strategy should be used (SSM Parameter Store, Secrets Manager, or env-only at runtime)?
A: Use environment variables for now; migrate to SSM later.

Q: What observability do you require at launch (CloudWatch metrics/log retention, alarms, dashboards, tracing)?
A: Basic CloudWatch logs and essential alarms only, short retention.

Q: Any strict compliance, backup/DR, or cost guardrails we must enforce before deployment?
A: Enforce AWS Free Tier constraints and hard low-cost posture.
Architecture Context: Q: What AWS region do you want to deploy in, and do you need multi-AZ resilience?
A: eu-north-1 (Stockholm), prefer eu-north-1a and fallback to eu-north-1b/eu-north-1c.

Q: For this repository, what runtime stack and entrypoint should run on EC2 (for example: Python + uvicorn, Node + pm2, Java + systemd)?
A: Python service, run with uvicorn using one process.

Q: How should code be built on the instance for large repos (build command, artifact path, and expected build time)?
A: Use minimal-cost default configuration.

Q: What baseline EC2 sizing do you expect for this repo (vCPU/RAM), and do you need burstable, compute-optimized, or memory-optimized instances?
A: Use t3.micro baseline only (Free Tier safe).

Q: What traffic/load profile do you expect (peak RPS, concurrent users, or batch throughput)?
A: Very low traffic, under 1M requests per month, single instance only.

Q: Do you need horizontal scaling now (ASG + ALB), or is a single-instance rollout acceptable for phase 1?
A: Single-instance rollout for phase 1.

Q: What storage footprint do you need on EC2/EBS (repo checkout size, generated artifacts, logs, and growth per month)?
A: Keep storage minimal: <=5GB website, <=5GB logs, and exactly 8GB EC2 root volume on gp3.

Q: Do any background jobs or long-running workers need separate process management from the web service?
A: No separate workers required initially.

Q: Which ports/protocols must be exposed publicly, and which should stay private within VPC only?
A: Expose only HTTP/HTTPS; keep all internal services private.

Q: Should this be internet-facing via CloudFront, and do you have a custom domain/certificate ready?
A: Internet-facing via EC2 public URL for phase 1; no custom domain yet.

Q: For S3 website hosting, should Block Public Access remain ON (recommended) or be turned OFF?
A: Keep Block Public Access ON.

Q: What secret/config strategy should be used (SSM Parameter Store, Secrets Manager, or env-only at runtime)?
A: Use environment variables for now; migrate to SSM later.

Q: What observability do you require at launch (CloudWatch metrics/log retention, alarms, dashboards, tracing)?
A: Basic CloudWatch logs and essential alarms only, short retention.

Q: Any strict compliance, backup/DR, or cost guardrails we must enforce before deployment?
A: Enforce AWS Free Tier constraints and hard low-cost posture.
Code Findings: 2874
Supply Findings: 196
Critical/High Supply: 100
High-impact CWE IDs: 798, 943, 134, 79, 918
EOT
