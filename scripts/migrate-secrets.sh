#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Define the environments to migrate
ENVIRONMENTS=("/prod" "/staging" "/dev")

# New prefix for the parameters
NEW_PREFIX="/pornspot-ai"

for env_path in "${ENVIRONMENTS[@]}"; do
  echo "Fetching parameters under path: $env_path"

  # Get all parameters under the current path.
  parameters=$(aws ssm get-parameters-by-path --path "$env_path" --recursive --query "Parameters[].Name" --output json)

  if [ -z "$parameters" ] || [ "$parameters" == "[]" ]; then
    echo "No parameters found for path: $env_path"
    continue
  fi

  # Loop through each parameter name
  for old_name in $(echo "${parameters}" | jq -r '.[]'); do
    echo "Processing parameter: $old_name"

    # Get the parameter's value and type
    parameter_details=$(aws ssm get-parameter --name "$old_name" --with-decryption --query "Parameter.{Value:Value,Type:Type}" --output json)
    value=$(echo "${parameter_details}" | jq -r '.Value')
    type=$(echo "${parameter_details}" | jq -r '.Type')

    # Construct the new parameter name
    new_name="${NEW_PREFIX}${old_name}"

    echo "Creating new parameter: $new_name"

    # Create the new parameter with the same value and type
    aws ssm put-parameter --name "$new_name" --value "$value" --type "$type" --overwrite

    echo "Successfully migrated $old_name to $new_name"
  done
done

echo "Secret migration completed."