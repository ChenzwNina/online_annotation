import requests
import json

# Replace with your details
account_id = "0a54c51ce4290ec2bb59f10871e4e25d"
namespace_id = "c28baadd734c4edf85d40b9746e88e78"
api_token = "P47X1jny8fMsUTJyaERprv9R9mgZgWvYEt_YN8Xj"

# Base URL
url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/storage/kv/namespaces/{namespace_id}/keys"

# Headers
headers = {
    "Authorization": f"Bearer {api_token}",
    "Content-Type": "application/json",
}

# Pagination support
cursor = None
all_keys = []

while True:
    
    params = {"cursor": cursor} if cursor else {}
    response = requests.get(url, headers=headers, params=params)
    data = response.json()
    if not data["success"]:
        print(f"Error: {data['errors']}")
        break
    else:
        print(f"Downloading {cursor}")
    all_keys.extend(data["result"])
    cursor = data.get("result_info", {}).get("cursor")
    if not cursor:
        break
print(f"Downloaded {cursor}")
# Fetch values for each key
kv_pairs = []
for key in all_keys:
    key_name = key["name"]
    value_url = f"{url.replace('keys', 'values')}/{key_name}"
    value_response = requests.get(value_url, headers=headers)
    print(f'Downloaded {value_url}')
    
    if value_response.status_code == 200:
        kv_pairs.append({key_name: value_response.json()})

# Save to a file
with open("kv_pairs.json", "w") as file:
    json.dump(kv_pairs, file, indent=2)

print("KV pairs downloaded and saved to kv_pairs.json.")
