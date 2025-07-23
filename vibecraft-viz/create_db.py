import pandas as pd
import sqlite3

# Load the CSV data
csv_file = '/Users/infograb/Workspace/Personal/Competitions/vibecraft/vibecraft-agent-v4/vibecraft-viz/test_data/sales.csv'
df = pd.read_csv(csv_file)

# Rename columns to match the spec
df.columns = ['date', 'product', 'sales', 'units', 'region']

# Convert date column to datetime objects
df['date'] = pd.to_datetime(df['date'])

# Create a connection to the SQLite database
db_file = '/Users/infograb/Workspace/Personal/Competitions/vibecraft/vibecraft-agent-v4/vibecraft-viz/projects/20250722-002349-a7965293/output/public/data.sqlite'
conn = sqlite3.connect(db_file)

# Write the data to a table named 'data_table'
df.to_sql('data_table', conn, if_exists='replace', index=False)

# Close the connection
conn.close()

print(f"Successfully created {db_file} from {csv_file}")
