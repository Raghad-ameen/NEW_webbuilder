import sys
import time

def create_database():
    db_name = "website_builder"
    user = "postgres"
    password = "password123"
    host = "127.0.0.1"
    port = "5432"

    print("Connecting to PostgreSQL to check database...")
    
    # Try importing psycopg3 first, then psycopg2
    try:
        import psycopg
        conn_func = psycopg.connect
        print("Using psycopg (v3)")
    except ImportError:
        try:
            import psycopg2
            conn_func = psycopg2.connect
            print("Using psycopg2")
        except ImportError:
            print("Error: Neither psycopg nor psycopg2 is installed.")
            print("Please run this script inside the virtual environment with dependencies installed.")
            sys.exit(1)

    # Retry database connection a few times if needed
    for attempt in range(5):
        try:
            # Connect to default 'postgres' database to create the new one
            conn = conn_func(
                dbname="postgres",
                user=user,
                password=password,
                host=host,
                port=port
            )
            conn.autocommit = True
            cur = conn.cursor()
            
            # Check if database exists
            cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (db_name,))
            exists = cur.fetchone()
            
            if not exists:
                print(f"Database '{db_name}' does not exist. Creating it...")
                cur.execute(f"CREATE DATABASE {db_name}")
                print(f"Database '{db_name}' created successfully.")
            else:
                print(f"Database '{db_name}' already exists.")
            
            cur.close()
            conn.close()
            return
        except Exception as e:
            print(f"Attempt {attempt + 1}/5 failed to connect to PostgreSQL: {e}")
            time.sleep(2)
            
    print("Failed to connect to PostgreSQL after 5 attempts.")
    sys.exit(1)

if __name__ == "__main__":
    create_database()
