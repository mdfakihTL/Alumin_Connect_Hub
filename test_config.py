"""Test configuration loading"""
try:
    from app.core.config import settings
    print("✅ Configuration loaded successfully!")
    print(f"   Database URL: {settings.DATABASE_URL[:50]}...")
    print(f"   Secret Key: {'*' * 20}...{settings.SECRET_KEY[-10:] if len(settings.SECRET_KEY) > 10 else 'too short'}")
    print(f"   Allowed Extensions: {settings.ALLOWED_EXTENSIONS}")
    print(f"   CORS Origins: {settings.CORS_ORIGINS}")
except Exception as e:
    print(f"❌ Error loading configuration: {str(e)}")
    import traceback
    traceback.print_exc()

