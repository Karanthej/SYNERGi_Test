import urllib.request
import urllib.error
import json
import sys
import time
import subprocess

BASE_URL = "http://localhost:1026/api/v1"

def print_step(msg):
    print(f"\n{'='*50}\n{msg}\n{'='*50}")

def make_request(method, url, data=None, token=None):
    req = urllib.request.Request(url, method=method)
    req.add_header('Content-Type', 'application/json')
    if token:
        req.add_header('Authorization', f'Bearer {token}')
    
    body = None
    if data is not None:
        body = json.dumps(data).encode('utf-8')
    
    try:
        response = urllib.request.urlopen(req, data=body)
        resp_body = response.read().decode('utf-8')
        return response.status, resp_body
    except urllib.error.HTTPError as e:
        resp_body = e.read().decode('utf-8')
        return e.code, resp_body
    except Exception as e:
        print(f"Error: {e}")
        return 0, str(e)

def get_db_otp(email):
    pass # we don't need this anymore

def register_user(email, name, role):
    print_step(f"Registering {role} - {email}")
    status, text = make_request("POST", f"{BASE_URL}/auth/register", data={
        "fullName": name,
        "email": email,
        "password": "Password@123",
        "role": role
    })
    print(status, text)
    if status != 200:
        return None
    return json.loads(text).get('data')

def verify_otp(email, otp):
    print_step(f"Verifying OTP for {email}")
    status, text = make_request("POST", f"{BASE_URL}/auth/register/verify", data={
        "email": email,
        "otpCode": otp
    })
    print(status, text)
    if status != 200:
        return None
    return json.loads(text).get('data', {}).get('accessToken')

def create_profile(token, is_founder):
    print_step(f"Creating Profile for {'FOUNDER' if is_founder else 'TALENT'}")
    profile_data = {
        "username": f"user_{int(time.time())}_{is_founder}",
        "bio": "I am a test user.",
        "skills": ["Java", "React"],
        "education": ["B.Tech in CS from Test University (2020)"],
        "experience": ["Software Engineer at Test Company (2 years)"],
    }
    if is_founder:
        profile_data["startupIdeas"] = "A new idea!"
    
    status, text = make_request("PUT", f"{BASE_URL}/profile", data=profile_data, token=token)
    print(status, text)
    return status == 200

def create_startup(token):
    print_step("Creating Startup")
    startup_data = {
        "name": f"Test Startup {int(time.time())}",
        "tagline": "We do cool stuff",
        "pitch": "It is cool.",
        "status": "PUBLISHED",
        "maxMembers": 10,
        "roles": ["Developer"],
        "skills": ["React"],
    }
    status, text = make_request("POST", f"{BASE_URL}/founder/startups", data=startup_data, token=token)
    print(status, text)
    if status != 200:
        return None
    return json.loads(text).get('data', {}).get('uuid')

def apply_to_startup(token, startup_uuid):
    print_step(f"Applying to Startup {startup_uuid}")
    application_data = {
        "preferredRole": "Developer",
        "introduction": "I am a great developer.",
        "whyJoin": "I like the idea.",
        "whyRightFit": "I know React.",
        "yearsExperience": "2",
        "skills": "React, Java",
        "hoursAvailable": "40"
    }
    status, text = make_request("POST", f"{BASE_URL}/talent/startups/{startup_uuid}/apply", data=application_data, token=token)
    print(status, text)
    return status == 200

def accept_application(token, startup_uuid):
    print_step(f"Accepting Application for Startup {startup_uuid}")
    status, text = make_request("GET", f"{BASE_URL}/founder/startups/{startup_uuid}/applications?page=0&size=10", token=token)
    print("Applications:", status, text)
    if status != 200:
        return None
    
    content = json.loads(text).get('data', {}).get('content', [])
    if not content:
        print("No applications found.")
        return None
    
    app_uuid = content[0].get('uuid')
    status, text = make_request("PUT", f"{BASE_URL}/founder/applications/{app_uuid}/status?status=ACCEPTED", token=token)
    print("Accept Res:", status, text)
    return status == 200

def verify_workspace(token, startup_uuid):
    print_step("Verifying Workspace")
    status, text = make_request("GET", f"{BASE_URL}/workspaces/{startup_uuid}/members", token=token)
    print("Workspace Members:", status, text)
    return status == 200

founder_email = f"founder_{int(time.time())}@test.com"
talent_email = f"talent_{int(time.time())}@test.com"

founder_otp = register_user(founder_email, "Test Founder", "FOUNDER")
if not founder_otp: sys.exit(1)
founder_token = verify_otp(founder_email, founder_otp)
if not founder_token: sys.exit(1)
if not create_profile(founder_token, True): sys.exit(1)

startup_uuid = create_startup(founder_token)
if not startup_uuid: sys.exit(1)

talent_otp = register_user(talent_email, "Test Talent", "TALENT")
if not talent_otp: sys.exit(1)
talent_token = verify_otp(talent_email, talent_otp)
if not talent_token: sys.exit(1)
if not create_profile(talent_token, False): sys.exit(1)

if not apply_to_startup(talent_token, startup_uuid): sys.exit(1)
if not accept_application(founder_token, startup_uuid): sys.exit(1)

print("\n--- Founder Workspace Check ---")
verify_workspace(founder_token, startup_uuid)

print("\n--- Talent Workspace Check ---")
verify_workspace(talent_token, startup_uuid)

print_step("E2E FLOW SUCCESSFUL")
