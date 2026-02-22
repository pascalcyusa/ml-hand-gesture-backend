
from sqlalchemy import create_engine, text
import os

# Database URL
# Helper to try connecting
def try_connect(url):
    try:
        engine = create_engine(url)
        with engine.connect() as connection:
            return engine
    except Exception as e:
        print(f"Failed to connect with {url}: {e}")
        return None

# List of potential URLs to try
param_url = os.getenv("DATABASE_URL")
candidates = [
    param_url,
    "postgresql://postgres:postgres@localhost:5432/ml_hand_gesture_db",
    "postgresql://localhost:5432/ml_hand_gesture_db",  # Try default user (OS user)
    f"postgresql://{os.environ.get('USER', 'pascal')}@localhost:5432/ml_hand_gesture_db"
]

engine = None
for url in candidates:
    if not url: continue
    print(f"Trying {url}...")
    engine = try_connect(url)
    if engine:
        print(f"Connected successfully using {url}")
        break

if not engine:
    print("Could not connect to database with any candidate URL.")
    exit(1)

def run_migration():
    with engine.connect() as connection:
        # Transaction is automatic with execute for DDL in some configurations,
        # but to be safe and explicit we can just run raw SQL.
        # Check if column exists or just try adding it (Postgres will error if exists, catch it)
        
        try:
            print("Adding is_public to piano_sequences...")
            connection.execute(text("ALTER TABLE piano_sequences ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;"))
            print("Success.")
        except Exception as e:
            print(f"Error updating piano_sequences: {e}")

        try:
            print("Adding is_public to motor_configs...")
            connection.execute(text("ALTER TABLE motor_configs ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;"))
            print("Success.")
        except Exception as e:
            print(f"Error updating motor_configs: {e}")
            
        # Commit if needed, though DDL often auto-commits or requires it
        connection.commit()

if __name__ == "__main__":
    run_migration()
