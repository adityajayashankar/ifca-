output "log_group_name" {
  value = aws_cloudwatch_log_group.app.name
}

output "cpu_alarm_name" {
  value = try(aws_cloudwatch_metric_alarm.ec2_cpu_high[0].alarm_name, null)
}
