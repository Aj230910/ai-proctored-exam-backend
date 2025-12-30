from pymongo import MongoClient

MONGO_URL = "mongodb+srv://ambrish_user:Ambrish12345@cluster0.nods8hr.mongodb.net/exam_proctor?retryWrites=true&w=majority"

client = MongoClient(MONGO_URL)

db = client["exam_proctor"]

sessions_col = db["sessions"]
violations_col = db["violations"]
