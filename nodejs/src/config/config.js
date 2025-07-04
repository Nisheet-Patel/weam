require('dotenv').config();

let dbPort;
if (process.env.DB_PORT == '') {
    dbPort = process.env.DB_PORT;
} else if (process.env.DB_PORT) {
    dbPort = `:${process.env.DB_PORT}`;
} else {
    dbPort = ':27017';
}

module.exports = {
    SERVER: {
        PORT: process.env.SERVER_PORT || 4051,
        NODE_ENV: process.env.NODE_ENV,
        LOCAL_LOG: process.env.LOCAL_LOG
    },
    API: {
        PREFIX: process.env.API_PREFIX,
        BASIC_AUTH_USERNAME: process.env.API_BASIC_AUTH_USERNAME,
        BASIC_AUTH_PASSWORD: process.env.API_BASIC_AUTH_PASSWORD,
        PYTHON_API_PREFIX: process.env.PYTHON_API_PREFIX || 'api'
    },
    MONGODB: {
        DB_URI: process.env.MONOGODB_URI
    },
    LINK: {
        FRONT_URL: process.env.FRONT_URL,
        BASE_URL: process.env.BASE_URL,
        OPEN_AI_MODAL: process.env.OPEN_AI_MODAL,
        PYTHON_API_URL: process.env.PYTHON_API_URL,
        OPEN_AI_API_URL: process.env.OPEN_AI_API_URL,
        WEAM_OPEN_AI_KEY: process.env.WEAM_OPEN_AI_KEY,
        ANTHROPIC_AI_API_URL: process.env.ANTHROPIC_AI_API_URL,  
        WEAM_ANTHROPIC_KEY: process.env.WEAM_ANTHROPIC_API_KEY,
        WEAM_HUGGING_FACE_KEY: process.env.HUGGING_FACE_AUTH_TOKEN,
        WEAM_GEMINI_KEY: process.env.WEAM_GEMINI_KEY,
        GEMINI_API_URL: process.env.GEMINI_API_URL,
        PERPLEXITY_API_URL: process.env.PERPLEXITY_API_URL,
        OPEN_ROUTER_API_URL: process.env.OPEN_ROUTER_API_URL,
        WEAM_PERPLEXITY_KEY: process.env.WEAM_PERPLEXITY_KEY,
        WEAM_DEEPSEEK_KEY: process.env.WEAM_DEEPSEEK_KEY,
        WEAM_LLAMA4_KEY: process.env.WEAM_LLAMA4_KEY,
        WEAM_GROK_KEY: process.env.WEAM_OPEN_ROUTER_KEY,
        WEAM_QWEN_KEY: process.env.WEAM_OPEN_ROUTER_KEY        
    },
    AUTH: {
        JWT_SECRET: process.env.JWT_SECRET,
        JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
        JWT_ACCESS_EXPIRE: process.env.JWT_ACCESS_EXPIRE,
        JWT_REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE,
        QR_NAME: process.env.QR_NAME,
        CSRF_TOKEN_SECRET: process.env.CSRF_TOKEN_SECRET
    },
    REDIS: {
        HOST: process.env.REDIS_HOST,
        PORT: process.env.REDIS_PORT,
    },
    AWS_CONFIG: {
        BUCKET_TYPE: process.env.BUCKET_TYPE,
        AWS_S3_BUCKET_NAME: process.env.AWS_BUCKET,
        AWS_S3_URL: process.env.AWS_CDN_URL,
        AWS_S3_API_VERSION: process.env.AWS_S3_API_VERSION,
        AWS_ACCESS_ID: process.env.AWS_ACCESS_KEY_ID,
        AWS_SECRET_KEY: process.env.AWS_SECRET_KEY,
        REGION: process.env.AWS_REGION,
        MINIO_USE_SSL: false,
        ENDPOINT: process.env.MINIO_ENDPOINT,
    },
    FIREBASE: {
        PROJECT_TYPE: process.env.FIREBASE_PROJECT_TYPE,
        PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
        PRIVATE_KEY_ID: process.env.FIREBASE_PRIVATE_KEY_ID,
        PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
        PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
        CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
        CLIENT_ID: process.env.FIREBASE_CLIENT_ID,
        AUTH_URI: process.env.FIREBASE_AUTH_URI,
        TOKEN_URI: process.env.FIREBASE_TOKEN_URI,
        AUTH_PROVIDER: process.env.FIREBASE_AUTH_PROVIDER,
        CERT_URL: process.env.FIREBASE_CERT_URL,
        UNIVERSE_DOMAIN: process.env.FIREBASE_UNIVERSE_DOMAIN,
    },
    KAFKA: {
        PRIVATE_HOST: process.env.KAFKA_PRIVATE_HOST, 
        PRIVATE_PORT: process.env.KAFKA_PRIVATE_PORT, 
        CLIENT_ID: process.env.KAFKA_CLIENT_ID,
    },
    PINECORN: {
        API_KEY: process.env.PINECORN_API_KEY || 'm3NwQE4/JIHLt7GZfQQSWEamMdA1JtSLvi41oG1fHsA6Qox26eVt76elBxrbd5c0'
    },

    API_RATE_LIMIT: parseInt(process.env.API_RATE_LIMIT),
    SEED: process.env.SEED ?? 0,
    TZ: process.env.TZ ?? 'Asia/Kolkata',
    ENCRYPTION_KEY: process.env.SECURITY_KEY,
    SUPPORT_EMAIL: process.env.SUPPORT_EMAIL,
    FRESHDESK_SUPPORT_URL: process.env.FRESHDESK_SUPPORT_URL,
    EMAIL: {
        EMAIL_PROVIDER: process.env.EMAIL_PROVIDER,
        SMTP_SERVER: process.env.SMTP_SERVER,
        SMTP_PORT: process.env.SMTP_PORT,
        SMTP_USER: process.env.SMTP_USER,
        SMTP_PASSWORD: process.env.SMTP_PASSWORD,
        SENDER_EMAIL: process.env.SENDER_EMAIL,
    },
    FRESHSALES: {
        API_KEY: process.env.FRESHSALES_CRM_API_KEY,
        DOMAIN: process.env.FRESHSALES_CRM_DOMAIN_NAME
    }
};
