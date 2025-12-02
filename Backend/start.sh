#!/bin/bash
cd /home/ubuntu/reinsurance/Backend
export FLASK_APP=run.py
export FLASK_ENV=development
python3.11 -m flask run --host=0.0.0.0 --port=5000
