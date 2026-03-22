import os
from pymongo import MongoClient

def init_db():
    mongo_uri = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/')
    client = MongoClient(mongo_uri)
    db = client.road_maintenance
    return db
