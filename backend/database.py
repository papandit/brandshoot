from pymongo import MongoClient
from config import config

client = MongoClient(config.MONGO_URL)
db = client[config.DB_NAME]

generations_col = db[config.GENERATIONS_COLLECTION]
models_col = db[config.MODELS_COLLECTION]
users_col = db[config.USERS_COLLECTION]
admin_settings_col = db["admin_settings"]
categories_col = db[config.CATEGORIES_COLLECTION]
app_models_col = db[config.APP_MODELS_COLLECTION]
branding_bg_col = db[config.BRANDING_BG_COLLECTION]
prompt_templates_col = db[config.PROMPT_TEMPLATES_COLLECTION]
api_keys_col = db[config.API_KEYS_COLLECTION]

