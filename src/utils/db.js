// src/utils/db.js
class DatabaseManager {
    constructor() {
        this.dbName = 'scheduleDB';
        this.version = 1;
    }

    async initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('scheduleData')) {
                    db.createObjectStore('scheduleData');
                }
            };
        });
    }

    async saveData(key, data) {
        const db = await this.initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['scheduleData'], 'readwrite');
            const store = transaction.objectStore('scheduleData');
            const request = store.put(data, key);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    async getData(key) {
        const db = await this.initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['scheduleData'], 'readonly');
            const store = transaction.objectStore('scheduleData');
            const request = store.get(key);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    async removeData(key) {
        const db = await this.initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['scheduleData'], 'readwrite');
            const store = transaction.objectStore('scheduleData');
            const request = store.delete(key);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }
}

export const db = new DatabaseManager();