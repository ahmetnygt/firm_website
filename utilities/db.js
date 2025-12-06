import { Sequelize } from "sequelize";

// Firma DB bağlantısı
export const firmDb = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 3306,
        dialect: process.env.DB_DIALECT || "mysql",
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false,
            },
        },
        logging: false,
    }
);

// Götür ana DB bağlantısı
export const goturDb = new Sequelize(
    process.env.GOTUR_DB_NAME,
    process.env.GOTUR_DB_USER,
    process.env.GOTUR_DB_PASS,
    {
        host: process.env.GOTUR_DB_HOST,
        port: process.env.GOTUR_DB_PORT || 3306,
        dialect: process.env.GOTUR_DB_DIALECT || "mysql",
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false,
            },
        },
        logging: false,
    }
);

export async function connectDbs() {
    try {
        await firmDb.authenticate();
        console.log("✅ Firma DB bağlantısı başarılı.");

        await goturDb.authenticate();
        console.log("✅ Götür DB bağlantısı başarılı.");
    } catch (err) {
        console.error("❌ DB bağlantı hatası:", err.message);
    }
}