output "security_logs_bucket" {
  value = aws_s3_bucket.security_logs.bucket
}

output "website_bucket" {
  value = aws_s3_bucket.website.bucket
}

output "cloudfront_domain_name" {
  value = aws_cloudfront_distribution.cdn.domain_name
}

output "cloudfront_url" {
  value = "https://${aws_cloudfront_distribution.cdn.domain_name}"
}

output "s3_website_endpoint" {
  value = aws_s3_bucket_website_configuration.website.website_endpoint
}
