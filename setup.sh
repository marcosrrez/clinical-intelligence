#!/bin/bash

# Backend Setup
echo "Setting up backend..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..

# Frontend Setup
echo "Setting up frontend..."
cd frontend
npm install
cd ..

echo "Setup complete. To start:"
echo "Backend: cd backend && source venv/bin/activate && python main.py"
echo "Frontend: cd frontend && npm run dev"
