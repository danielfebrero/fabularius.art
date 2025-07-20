#!/usr/bin/env python3

import boto3
import json
import requests
import sys


def signal_cfn_resource(
    stack_name, logical_resource_id, physical_resource_id, status="SUCCESS"
):
    """
    Signal a CloudFormation custom resource directly
    """
    # Get the stack events to find the response URL
    cf = boto3.client("cloudformation")

    try:
        # Get stack resources
        response = cf.describe_stack_resources(
            StackName=stack_name, LogicalResourceId=logical_resource_id
        )

        # This approach won't work directly since we need the original event data
        print(f"Resource found: {response['StackResources'][0]}")
        print(
            "Note: Direct signaling requires access to the original CloudFormation event which includes the ResponseURL"
        )
        print(
            "This is typically only available within the Lambda function context during execution."
        )

    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    if len(sys.argv) != 4:
        print(
            "Usage: python3 signal_cfn.py <stack-name> <logical-resource-id> <physical-resource-id>"
        )
        sys.exit(1)

    stack_name = sys.argv[1]
    logical_resource_id = sys.argv[2]
    physical_resource_id = sys.argv[3]

    signal_cfn_resource(stack_name, logical_resource_id, physical_resource_id)
