import time
import random
import os
import math
from pymongo import MongoClient
from bson.objectid import ObjectId

# --- Setup System ---
# NOTE: In Docker, env vars are passed directly via docker-compose.yml
# We read MONGODB_URI from the environment
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
print(f"🔗 Connecting to MongoDB at: {MONGODB_URI}")

client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=10000)
try:
    # Actual connectivity test (ping)
    client.admin.command('ping')
    db = client['sector7']
    vehicles_collection = db['vehicles']
    incidents_collection = db['incidents']
    print("✅ Connected to MongoDB Tactical Grid")
except Exception as e:
    print(f"❌ Failed to connect to MongoDB: {e}")
    exit(1)

# --- Initial Seed ---
INITIAL_VEHICLES = {
    'FIRE-X9': {'type': 'firetruck', 'pos': [17.5234, 78.6734], 'status': 'Available', 'color': '#ef4444'},
    'AMB-041': {'type': 'ambulance', 'pos': [17.5180, 78.6620], 'status': 'Available', 'color': '#7bd0ff'},
    'PD-SEC7': {'type': 'police', 'pos': [17.5100, 78.6500], 'status': 'Patrolling', 'color': '#b7c8e1'},
    'AMB-099': {'type': 'ambulance', 'pos': [17.5300, 78.6800], 'status': 'Available', 'color': '#7bd0ff'},
    'FIRE-V2': {'type': 'firetruck', 'pos': [17.5100, 78.6400], 'status': 'Available', 'color': '#ef4444'},
    'PD-SEC9': {'type': 'police', 'pos': [17.5400, 78.6500], 'status': 'Patrolling', 'color': '#b7c8e1'}
}

# Prime the database if empty
if vehicles_collection.count_documents({}) == 0:
    for v_name, v_data in INITIAL_VEHICLES.items():
        vehicles_collection.update_one(
            {'id': v_name},
            {'$set': {'id': v_name, 'name': v_name, 'type': v_data['type'], 'status': v_data['status'], 'position': v_data['pos'], 'color': v_data['color']}},
            upsert=True
        )

def simulate_movement():
    """
    🌪️ Tactical Movement Engine
    Reads Live State from Mongo, calculates physics, and updates positions.
    """
    print("📡 Tactical Movement Engine Online - Keesara Mandal")
    
    while True:
        try:
            # READ from Mongo to see if AI Backend auto-dispatched someone!
            vehicles = list(vehicles_collection.find({}))
            
            for v in vehicles:
                # IMPORTANT: Make a mutable copy of position (BSON list must be copied)
                raw_pos = v.get('position', [17.52, 78.67])
                pos = [float(raw_pos[0]), float(raw_pos[1])]
                status = v.get('status', 'Available')
                target_id = v.get('targetIncident')
                
                # 🚗 TACTICAL DRIVING LOGIC (If AI assigned this vehicle to an incident)
                if status == 'Responding' and target_id:
                    try:
                        incident = incidents_collection.find_one({'_id': ObjectId(target_id)})
                        if incident and 'position' in incident:
                            target_lat, target_lng = incident['position']
                            
                            # Vector math to drive towards the incident coordinates!
                            d_lat = target_lat - pos[0]
                            d_lng = target_lng - pos[1]
                            dist = math.sqrt(d_lat**2 + d_lng**2)
                            
                            if dist > 0.0003: # Arrival threshold
                                # Fast tactical speed: 0.002 units/tick @ 1s = ~220km/h
                                speed = min(0.002, dist)
                                pos[0] += (d_lat / dist) * speed
                                pos[1] += (d_lng / dist) * speed
                                print(f"🚚 {v['id']} → target (Dist: {dist:.5f})")
                            else:
                                # Arrived on scene (micro-vibrations to keep icon alive)
                                pos[0] = target_lat + (random.random() - 0.5) * 0.00005
                                pos[1] = target_lng + (random.random() - 0.5) * 0.00005
                                print(f"🏁 {v['id']} arrived at scene.")
                        else:
                            print(f"⚠️ {v['id']} has target {target_id} but incident not found or has no position.")
                                
                    except Exception as e:
                        print(f"❌ Movement calculation error for {v['id']}: {e}")
                
                # 🚶 IDLE / PATROLLING LOGIC (No active crisis)
                else: 
                     # Slower, more natural patrol movement
                     pos[0] += (random.random() - 0.5) * 0.0002
                     pos[1] += (random.random() - 0.5) * 0.0002
                
                # Push calculated GPS back to MongoDB
                vehicles_collection.update_one(
                    {'_id': v['_id']},
                    {'$set': {
                        'position': pos,
                        'speed': random.randint(40, 90),
                        'timestamp': time.time()
                    }}
                )
            
            # Pulse rate — 1 second for fast map updates
            time.sleep(1)
            
        except Exception as e:
            print(f"📡 Simulation Link Fault: {e}")
            time.sleep(5)

if __name__ == "__main__":
    simulate_movement()
