import time
import random
import os
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, db

# --- Setup System ---
load_dotenv()
firebase_cred = credentials.Certificate("./serviceAccountKey.json")
firebase_admin.initialize_app(firebase_cred, {
    'databaseURL': os.getenv('FIREBASE_DATABASE_URL')
})

# --- Initial Tactical Responders ---
VEHICLES = {
    'FIRE-X9': {'type': 'firetruck', 'pos': [17.5234, 78.6734], 'status': 'Responding'},
    'AMB-041': {'type': 'ambulance', 'pos': [17.5180, 78.6620], 'status': 'Standby'},
    'PD-SEC7': {'type': 'police', 'pos': [17.5100, 78.6500], 'status': 'Patrolling'},
    'AMB-099': {'type': 'ambulance', 'pos': [17.5300, 78.6800], 'status': 'Available'},
    'FIRE-V2': {'type': 'firetruck', 'pos': [17.5100, 78.6400], 'status': 'Available'},
    'PD-SEC9': {'type': 'police', 'pos': [17.5400, 78.6500], 'status': 'Patrolling'}
}

def simulate_movement():
    """
    🌪️ Tactical Movement Simulation (Sector 7)
    - Updates vehicle GPS every 2 seconds
    - Broadcasts to Firebase Tactical Grid
    """
    print("📡 Tactical Simulation Sequence Initialized - Keesara Mandal")
    
    while True:
        try:
            for v_name, v_data in VEHICLES.items():
                # Random drift for simulation
                v_data['pos'][0] += (random.random() - 0.5) * 0.002
                v_data['pos'][1] += (random.random() - 0.5) * 0.002
                
                # Push real-time to Firebase
                db.reference(f'vehicles/{v_name}').set({
                    'id': v_name,
                    'name': v_name,
                    'type': v_data['type'],
                    'status': v_data['status'],
                    'position': [v_data['pos'][0], v_data['pos'][1]],
                    'speed': random.randint(30, 90),
                    'timestamp': time.time()
                })
            
            print(f"[{time.strftime('%H:%M:%S')}] GPS Pulse Broadcasted: Node-Mumbai-7")
            time.sleep(2)
            
        except Exception as e:
            print(f"📡 Simulation Link Fault: {e}")
            time.sleep(5)

if __name__ == "__main__":
    simulate_movement()
