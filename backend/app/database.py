import os
import json
import asyncio
from datetime import datetime
import uuid
from typing import List, Dict, Any, Optional
from backend.app.config import settings

# MongoDB Driver Imports
try:
    from motor.motor_asyncio import AsyncIOMotorClient
    from pymongo.errors import ConnectionFailure
    MONGODB_AVAILABLE = True
except ImportError:
    MONGODB_AVAILABLE = False

class JSONDatabase:
    """Fallback JSON-based File Database for standalone execution without MongoDB."""
    def __init__(self, filepath: str):
        self.filepath = filepath
        self.lock = asyncio.Lock()
        self._init_db()

    def _init_db(self):
        if not os.path.exists(self.filepath):
            data = {
                "users": [],
                "history": [],
                "logs": []
            }
            with open(self.filepath, 'w') as f:
                json.dump(data, f, indent=4)

    def _read(self) -> Dict[str, Any]:
        try:
            with open(self.filepath, 'r') as f:
                return json.load(f)
        except Exception:
            return {"users": [], "history": [], "logs": []}

    def _write(self, data: Dict[str, Any]):
        with open(self.filepath, 'w') as f:
            json.dump(data, f, indent=4)

    async def get_user(self, email: str) -> Optional[Dict[str, Any]]:
        async with self.lock:
            data = self._read()
            for user in data["users"]:
                if user["email"] == email:
                    return user
            return None

    async def create_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        async with self.lock:
            data = self._read()
            # Ensure email is unique
            for u in data["users"]:
                if u["email"] == user_data["email"]:
                    raise Exception("User already exists")
            
            user_data["id"] = str(uuid.uuid4())
            user_data["created_at"] = datetime.utcnow().isoformat()
            data["users"].append(user_data)
            self._write(data)
            return user_data

    async def get_users(self) -> List[Dict[str, Any]]:
        async with self.lock:
            data = self._read()
            return data["users"]

    async def update_user(self, email: str, update_data: Dict[str, Any]) -> bool:
        async with self.lock:
            data = self._read()
            for i, user in enumerate(data["users"]):
                if user["email"] == email:
                    data["users"][i].update(update_data)
                    self._write(data)
                    return True
            return False

    async def delete_user(self, email: str) -> bool:
        async with self.lock:
            data = self._read()
            initial_len = len(data["users"])
            data["users"] = [u for u in data["users"] if u["email"] != email]
            if len(data["users"]) < initial_len:
                self._write(data)
                return True
            return False

    async def save_otp(self, email: str, otp: str, expires_at_iso: str) -> bool:
        async with self.lock:
            data = self._read()
            for i, user in enumerate(data["users"]):
                if user["email"] == email:
                    data["users"][i]["otp_code"] = otp
                    data["users"][i]["otp_expires_at"] = expires_at_iso
                    self._write(data)
                    return True
            return False

    async def reset_password(self, email: str, password_hash: str) -> bool:
        async with self.lock:
            data = self._read()
            for i, user in enumerate(data["users"]):
                if user["email"] == email:
                    data["users"][i]["password_hash"] = password_hash
                    data["users"][i].pop("otp_code", None)
                    data["users"][i].pop("otp_expires_at", None)
                    self._write(data)
                    return True
            return False

    async def create_history_record(self, record: Dict[str, Any]) -> Dict[str, Any]:
        async with self.lock:
            data = self._read()
            record["id"] = str(uuid.uuid4())
            record["timestamp"] = datetime.utcnow().isoformat()
            record["downloads"] = 0
            data["history"].append(record)
            self._write(data)
            return record

    async def get_user_history(self, email: str, search_query: str = None) -> List[Dict[str, Any]]:
        async with self.lock:
            data = self._read()
            user_history = [h for h in data["history"] if h["user_email"] == email]
            
            if search_query:
                q = search_query.lower()
                user_history = [
                    h for h in user_history 
                    if q in h.get("original_filename", "").lower() or q in h.get("id", "").lower()
                ]
            
            # Sort by timestamp desc
            user_history.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
            return user_history

    async def get_all_history(self) -> List[Dict[str, Any]]:
        async with self.lock:
            data = self._read()
            return data["history"]

    async def delete_history_record(self, record_id: str, email: str) -> bool:
        async with self.lock:
            data = self._read()
            initial_len = len(data["history"])
            # Remove record from memory
            data["history"] = [h for h in data["history"] if not (h["id"] == record_id and h["user_email"] == email)]
            if len(data["history"]) < initial_len:
                self._write(data)
                return True
            return False

    async def increment_download_count(self, record_id: str) -> bool:
        async with self.lock:
            data = self._read()
            for h in data["history"]:
                if h["id"] == record_id:
                    h["downloads"] = h.get("downloads", 0) + 1
                    self._write(data)
                    return True
            return False

    async def add_log(self, level: str, message: str):
        async with self.lock:
            data = self._read()
            log_entry = {
                "id": str(uuid.uuid4()),
                "timestamp": datetime.utcnow().isoformat(),
                "level": level,
                "message": message
            }
            data["logs"].append(log_entry)
            # Keep only last 1000 logs
            if len(data["logs"]) > 1000:
                data["logs"] = data["logs"][-1000:]
            self._write(data)

    async def get_logs(self, limit: int = 100) -> List[Dict[str, Any]]:
        async with self.lock:
            data = self._read()
            logs = data.get("logs", [])
            logs.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
            return logs[:limit]


class DatabaseWrapper:
    """Wrapper that manages MongoDB operations with a transparent fallback to JSONDatabase."""
    def __init__(self):
        self.client = None
        self.db = None
        self.mode = "JSON"
        self.local_db = JSONDatabase(settings.LOCAL_DB_FILE)

    async def connect(self):
        if MONGODB_AVAILABLE and settings.MONGODB_URI:
            try:
                # Try to connect with 2 seconds timeout
                self.client = AsyncIOMotorClient(settings.MONGODB_URI, serverSelectionTimeoutMS=2000)
                await self.client.admin.command('ping')
                self.db = self.client[settings.DATABASE_NAME]
                self.mode = "MongoDB"
                await self.add_log("INFO", "Connected to MongoDB Atlas successfully.")
                print("Database mode: MongoDB Atlas")
                return
            except Exception as e:
                print(f"MongoDB connection failed: {e}. Falling back to Local JSON DB.")
        
        self.mode = "JSON"
        await self.add_log("INFO", "Initialized local JSON File database fallback.")
        print("Database mode: Fallback JSON Database")

    async def add_log(self, level: str, message: str):
        if self.mode == "MongoDB" and self.db is not None:
            try:
                log_entry = {
                    "timestamp": datetime.utcnow(),
                    "level": level,
                    "message": message
                }
                await self.db.logs.insert_one(log_entry)
                return
            except Exception:
                pass
        await self.local_db.add_log(level, message)

    async def get_logs(self, limit: int = 100) -> List[Dict[str, Any]]:
        if self.mode == "MongoDB" and self.db is not None:
            try:
                cursor = self.db.logs.find().sort("timestamp", -1).limit(limit)
                logs = []
                async for log in cursor:
                    log["id"] = str(log["_id"])
                    log["timestamp"] = log["timestamp"].isoformat()
                    del log["_id"]
                    logs.append(log)
                return logs
            except Exception:
                pass
        return await self.local_db.get_logs(limit)

    async def get_user(self, email: str) -> Optional[Dict[str, Any]]:
        if self.mode == "MongoDB" and self.db is not None:
            try:
                user = await self.db.users.find_one({"email": email})
                if user:
                    user["id"] = str(user["_id"])
                    del user["_id"]
                    return user
                return None
            except Exception:
                pass
        return await self.local_db.get_user(email)

    async def create_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        if self.mode == "MongoDB" and self.db is not None:
            try:
                # Check duplicate
                existing = await self.db.users.find_one({"email": user_data["email"]})
                if existing:
                    raise Exception("User already exists")
                user_data["created_at"] = datetime.utcnow()
                res = await self.db.users.insert_one(user_data)
                user_data["id"] = str(res.inserted_id)
                user_data["created_at"] = user_data["created_at"].isoformat()
                del user_data["_id"]
                return user_data
            except Exception as e:
                if "already exists" in str(e):
                    raise e
        return await self.local_db.create_user(user_data)

    async def get_users(self) -> List[Dict[str, Any]]:
        if self.mode == "MongoDB" and self.db is not None:
            try:
                cursor = self.db.users.find()
                users = []
                async for u in cursor:
                    u["id"] = str(u["_id"])
                    if isinstance(u.get("created_at"), datetime):
                        u["created_at"] = u["created_at"].isoformat()
                    del u["_id"]
                    users.append(u)
                return users
            except Exception:
                pass
        return await self.local_db.get_users()

    async def update_user(self, email: str, update_data: Dict[str, Any]) -> bool:
        if self.mode == "MongoDB" and self.db is not None:
            try:
                res = await self.db.users.update_one({"email": email}, {"$set": update_data})
                return res.modified_count > 0
            except Exception:
                pass
        return await self.local_db.update_user(email, update_data)

    async def delete_user(self, email: str) -> bool:
        if self.mode == "MongoDB" and self.db is not None:
            try:
                res = await self.db.users.delete_one({"email": email})
                return res.deleted_count > 0
            except Exception:
                pass
        return await self.local_db.delete_user(email)

    async def save_otp(self, email: str, otp: str, expires_at: datetime) -> bool:
        if self.mode == "MongoDB" and self.db is not None:
            try:
                res = await self.db.users.update_one(
                    {"email": email},
                    {"$set": {"otp_code": otp, "otp_expires_at": expires_at}}
                )
                return res.modified_count > 0
            except Exception:
                pass
        return await self.local_db.save_otp(email, otp, expires_at.isoformat())

    async def reset_password(self, email: str, password_hash: str) -> bool:
        if self.mode == "MongoDB" and self.db is not None:
            try:
                res = await self.db.users.update_one(
                    {"email": email},
                    {
                        "$set": {"password_hash": password_hash},
                        "$unset": {"otp_code": "", "otp_expires_at": ""}
                    }
                )
                return res.modified_count > 0
            except Exception:
                pass
        return await self.local_db.reset_password(email, password_hash)

    async def create_history_record(self, record: Dict[str, Any]) -> Dict[str, Any]:
        if self.mode == "MongoDB" and self.db is not None:
            try:
                record["timestamp"] = datetime.utcnow()
                record["downloads"] = 0
                res = await self.db.history.insert_one(record)
                record["id"] = str(res.inserted_id)
                record["timestamp"] = record["timestamp"].isoformat()
                del record["_id"]
                return record
            except Exception:
                pass
        return await self.local_db.create_history_record(record)

    async def get_user_history(self, email: str, search_query: str = None) -> List[Dict[str, Any]]:
        if self.mode == "MongoDB" and self.db is not None:
            try:
                query = {"user_email": email}
                if search_query:
                    # Case insensitive search
                    query["$or"] = [
                        {"original_filename": {"$regex": search_query, "$options": "i"}},
                        {"id": {"$regex": search_query, "$options": "i"}}
                    ]
                cursor = self.db.history.find(query).sort("timestamp", -1)
                history = []
                async for h in cursor:
                    h["id"] = str(h["_id"])
                    if isinstance(h.get("timestamp"), datetime):
                        h["timestamp"] = h["timestamp"].isoformat()
                    del h["_id"]
                    history.append(h)
                return history
            except Exception:
                pass
        return await self.local_db.get_user_history(email, search_query)

    async def delete_history_record(self, record_id: str, email: str) -> bool:
        if self.mode == "MongoDB" and self.db is not None:
            try:
                from bson.objectid import ObjectId
                res = await self.db.history.delete_one({"_id": ObjectId(record_id), "user_email": email})
                return res.deleted_count > 0
            except Exception:
                pass
        return await self.local_db.delete_history_record(record_id, email)

    async def increment_download_count(self, record_id: str) -> bool:
        if self.mode == "MongoDB" and self.db is not None:
            try:
                from bson.objectid import ObjectId
                res = await self.db.history.update_one({"_id": ObjectId(record_id)}, {"$inc": {"downloads": 1}})
                return res.modified_count > 0
            except Exception:
                pass
        return await self.local_db.increment_download_count(record_id)

    async def get_system_stats(self) -> Dict[str, Any]:
        """Calculates aggregations for Admin Dashboard."""
        users = await self.get_users()
        total_users = len(users)
        
        history_records = []
        if self.mode == "MongoDB" and self.db is not None:
            try:
                cursor = self.db.history.find()
                async for h in cursor:
                    history_records.append(h)
            except Exception:
                history_records = await self.local_db.get_all_history()
        else:
            history_records = await self.local_db.get_all_history()
            
        total_images = len(history_records)
        total_downloads = sum(h.get("downloads", 0) for h in history_records)
        
        # Calculate process time averages
        times = [h.get("processing_time", 0) for h in history_records if h.get("processing_time") is not None]
        avg_processing_time = round(sum(times) / len(times), 2) if times else 0.0
        
        return {
            "total_users": total_users,
            "total_images_processed": total_images,
            "total_downloads": total_downloads,
            "avg_processing_time_sec": avg_processing_time,
            "db_mode": self.mode
        }

db = DatabaseWrapper()
# Note: Connect should be called during app startup event
