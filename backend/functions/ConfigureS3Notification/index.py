import boto3
import json
import cfnresponse
import traceback


def handler(event, context):
    print("ConfigureS3NotificationFunction: Handler entry.")
    print(f"Received event: {json.dumps(event)}")
    s3 = boto3.client("s3")
    bucket_name = event["ResourceProperties"]["BucketName"]
    function_arn = event["ResourceProperties"]["FunctionArn"]

    try:
        if event["RequestType"] == "Delete":
            print(f"Removing S3 notification configuration for bucket: {bucket_name}")
            try:
                s3.put_bucket_notification_configuration(
                    Bucket=bucket_name, NotificationConfiguration={}
                )
                print("Successfully removed notification configuration.")
                cfnresponse.send(event, context, cfnresponse.SUCCESS, {})
            except Exception as inner_e:
                print("Error while removing notification configuration:")
                print(traceback.format_exc())
                cfnresponse.send(
                    event, context, cfnresponse.FAILED, {"Error": str(inner_e)}
                )
        else:
            print(
                f"Adding S3 notification configuration for bucket: {bucket_name}, target function: {function_arn}"
            )
            notification_config = {
                "LambdaFunctionConfigurations": [
                    {
                        "Id": "ProcessMediaUploadTrigger",
                        "LambdaFunctionArn": function_arn,
                        "Events": ["s3:ObjectCreated:*"],
                        "Filter": {
                            "Key": {
                                "FilterRules": [{"Name": "prefix", "Value": "albums/"}]
                            }
                        },
                    },
                    {
                        "Id": "ProcessAvatarUploadTrigger",
                        "LambdaFunctionArn": function_arn,
                        "Events": ["s3:ObjectCreated:*"],
                        "Filter": {
                            "Key": {
                                "FilterRules": [{"Name": "prefix", "Value": "users/"}]
                            }
                        },
                    },
                ]
            }
            print(
                f"Notification configuration payload: {json.dumps(notification_config)}"
            )
            try:
                s3.put_bucket_notification_configuration(
                    Bucket=bucket_name, NotificationConfiguration=notification_config
                )
                print("Successfully added notification configuration.")
                cfnresponse.send(event, context, cfnresponse.SUCCESS, {})
            except Exception as inner_e:
                print("Error while adding notification configuration:")
                print(traceback.format_exc())
                cfnresponse.send(
                    event, context, cfnresponse.FAILED, {"Error": str(inner_e)}
                )
    except Exception as e:
        print("Unhandled exception in ConfigureS3NotificationFunction:")
        print(traceback.format_exc())
        # Surfaces error to CloudFormation stack events
        cfnresponse.send(event, context, cfnresponse.FAILED, {"Error": str(e)})
