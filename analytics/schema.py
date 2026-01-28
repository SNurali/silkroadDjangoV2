from clickhouse_driver import Client
from django.conf import settings

def get_client():
    return Client(
        host=settings.CLICKHOUSE_HOST or 'localhost',
        port=settings.CLICKHOUSE_PORT or 9000,
        user=settings.CLICKHOUSE_USERNAME or 'default',
        password=settings.CLICKHOUSE_PASSWORD or '',
        database=settings.CLICKHOUSE_DATABASE or 'default'
    )

def init_schema():
    client = get_client()
    
    # 1. booking_events
    client.execute('''
        CREATE TABLE IF NOT EXISTS booking_events (
            event_time DateTime,
            booking_id Int64,
            user_id Int32,
            vendor_id Int32,
            booking_type String,
            status String,
            amount Float64,
            currency String,
            region String,
            created_at DateTime
        ) ENGINE = MergeTree()
        ORDER BY (event_time, vendor_id)
    ''')
    
    # 2. ticket_sales_events
    client.execute('''
        CREATE TABLE IF NOT EXISTS ticket_sales_events (
            event_time DateTime,
            ticket_sale_id Int64,
            vendor_id Int32,
            service_id Int32,
            customer_id Int32,
            amount Float64,
            currency String,
            quantity Int32,
            region String
        ) ENGINE = MergeTree()
        ORDER BY (event_time, vendor_id)
    ''')
    print("ClickHouse schema initialized successfully.")

if __name__ == "__main__":
    init_schema()
