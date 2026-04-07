# --- STAGE 1: NEURAL CORE (Python AI) ---
FROM python:3.9-slim

WORKDIR /app

# Install Tactical dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy Tactical logic (Gemini triage)
COPY . .

# Expose Tactical API Port
EXPOSE 8000

# Start Neural Link
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
