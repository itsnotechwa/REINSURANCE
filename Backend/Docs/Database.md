1. psql -U postgres -h localhost -W

2. CREATE ROLE reinsurance WITH LOGIN PASSWORD 'kenyare254!!';

3. ALTER ROLE reinsurance CREATEDB;

4. postgres=# CREATE DATABASE insurance_db OWNER reinsurance;

5. psql -U reinsurance -h localhost -d insurance_db -W

