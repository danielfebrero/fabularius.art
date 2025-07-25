import yaml
import json

TEMPLATE_FILE = "template.yaml"
ENV_FILE = "backend/.env.local"
OUTPUT_ENV_JSON = "backend/.env.local.json"


# Patch PyYAML to ignore CloudFormation tags (!Sub, !Ref, etc.)
class NoTag(yaml.SafeLoader):
    pass


def unknown_tag(loader, tag_suffix, node):
    # Handle scalar values (e.g., !Ref, !Sub with string values)
    if isinstance(node, yaml.ScalarNode):
        return loader.construct_scalar(node)
    # Handle sequence values (e.g., !GetAtt with list values)
    elif isinstance(node, yaml.SequenceNode):
        return loader.construct_sequence(node)
    # Handle mapping values (e.g., complex intrinsic functions)
    elif isinstance(node, yaml.MappingNode):
        return loader.construct_mapping(node)
    return None


NoTag.add_multi_constructor("!", unknown_tag)

# Charger .env.local en dictionnaire
env_vars = {}
with open(ENV_FILE) as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, val = line.split("=", 1)
            env_vars[key.strip()] = val.strip()

# Charger tous les Logical IDs Lambda
with open(TEMPLATE_FILE) as f:
    template = yaml.load(f, Loader=NoTag)

resources = template.get("Resources", {})
lambda_ids = [
    logical_id
    for logical_id, props in resources.items()
    if props.get("Type") in ("AWS::Serverless::Function", "AWS::Lambda::Function")
]

env_json = {lid: env_vars for lid in lambda_ids}

with open(OUTPUT_ENV_JSON, "w") as f:
    json.dump(env_json, f, indent=2)

print(f"{len(lambda_ids)} functions updated, env file written to {OUTPUT_ENV_JSON}")
