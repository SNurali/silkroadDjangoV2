from django.contrib.auth import get_user_model, authenticate
User = get_user_model()
try:
    u = User.objects.get(email='agent_test@example.com')
    print(f"User: {u}, Active: {u.is_active}, PwdUsable: {u.has_usable_password()}")
    auth_user = authenticate(username='agent_test@example.com', password='password123')
    print(f"Auth Check 1: {auth_user}")
    
    if not auth_user:
        print("Resetting password...")
        u.set_password('password123')
        u.save()
        print(f"Auth Check 2: {authenticate(username='agent_test@example.com', password='password123')}")
except User.DoesNotExist:
    print("User does not exist")
