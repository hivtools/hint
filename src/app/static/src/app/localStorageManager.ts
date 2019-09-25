export class LocalStorageManager {

    setItem = (key: string, value: any) => {
        if (value) {
            window.localStorage.setItem(key, JSON.stringify(value));
        } else {
            this.removeItem(key);
        }
    };

    removeItem = (key: string) => {
        window.localStorage.removeItem(key);
    };

    getString = (key: string): string | null => {
        return window.localStorage.getItem(key);
    };

    getInt = (key: string): number | null => {
        const item = this.getString(key);
        return item ? parseInt(item) : null
    };

    getItem = <T>(key: string): T | null => {
        const item = this.getString(key);
        if (item) {
            return JSON.parse(item) as T;
        }
        else {
            return null;
        }
    };
}

export const localStorageManager = new LocalStorageManager();
