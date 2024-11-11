self.onmessage = async function(e) {
    const { start, end, type } = e.data;
    const startTime = performance.now();    

    let result;
    if (type === 'float') {
        result = await computeLightFloatTask(start, end);
    } else if (type === 'int') {
        result = await computeHeavyIntTask(start, end);
    } else if (type === 'AES') {

        // 动态加载 crypto-js
        await loadCryptoJS();

        result = await testEncryption(start, end);
    } else if (type === 'pi') {

        // 动态加载 decimal-js
        await loadDecimalJS();

        result = await testPI(start, end);
    } else if (type === 'rw') {

        result = await testReadWriteSpeed();
    }

    self.postMessage({ result, startTime });
};

const dbName = 'TestDB';
const storeName = 'TestStore';
const dbVersion = 1;
const testDataSize = 50 * 1000 * 1000;
const testCount = 5;

let db;

function openDatabase() {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(dbName, dbVersion);
                request.onerror = (event) => reject(event.target.error);
                request.onsuccess = (event) => {
                    db = event.target.result;
                    resolve();
                };
                request.onupgradeneeded = (event) => {
                    db = event.target.result;
                    if (!db.objectStoreNames.contains(storeName)) {
                        db.createObjectStore(storeName);
                    }
                };
            });
}

function bytesToMB(bytes) {
            return (bytes / (1000 * 1000)).toFixed(2);
}

async function performSingleTest() {
            // 测试写入速度
            const writeStartTime = performance.now();
            const testData = "a".repeat(testDataSize); // 生成数据

            const writeTransaction = db.transaction([storeName], 'readwrite');
            const writeStore = writeTransaction.objectStore(storeName);
            const writeRequest = writeStore.put(testData, 'testData');

            let writeSuccess = false;
            writeRequest.onsuccess = () => {
                writeSuccess = true;
            };
            writeRequest.onerror = (event) => {
                console.error('写入失败:', event.target.error);
            };

            await new Promise((resolve) => {
                writeTransaction.oncomplete = resolve;
            });

            const writeEndTime = performance.now();
            if (!writeSuccess) {
                return { writeTime: -1, readTime: -1 };
            }

            // 测试读取速度
            const readStartTime = performance.now();

            const readTransaction = db.transaction([storeName], 'readonly');
            const readStore = readTransaction.objectStore(storeName);
            const readRequest = readStore.get('testData');

            let readSuccess = false;
            readRequest.onsuccess = (event) => {
                const testData = event.target.result;
                if (testData) {
                    readSuccess = true;
                }
            };
            readRequest.onerror = (event) => {
                console.error('读取失败:', event.target.error);
            };

            await new Promise((resolve) => {
                readTransaction.oncomplete = resolve;
            });

            const readEndTime = performance.now();
            if (!readSuccess) {
                return { writeTime: -1, readTime: -1 };
            }

            return { writeTime: writeEndTime - writeStartTime, readTime: readEndTime - readStartTime };
}

async function testReadWriteSpeed() {
            await openDatabase();

            // 预热
            for (let i = 0; i < 2; i++) {
                await performSingleTest();
            }

            let totalWriteTime = 0;
            let totalReadTime = 0;

            for (let i = 0; i < testCount; i++) {
                const { writeTime, readTime } = await performSingleTest();
                if (writeTime >= 0 && readTime >= 0) {
                    totalWriteTime += writeTime;
                    totalReadTime += readTime;
                } else {
                    console.error('测试失败，跳过本次结果');
                }
            }

            const averageWriteTime = totalWriteTime / testCount;
            const averageReadTime = totalReadTime / testCount;
            
            await clearTestData();

            return averageWriteTime + averageReadTime;
}

async function clearTestData() {
            await openDatabase();
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete('testData');
            
            request.onerror = (event) => {
                console.error('清理失败:', event.target.error);
            };
}

async function loadCryptoJS() {
    return new Promise((resolve, reject) => {
        try {
            importScripts('crypto-js.min.js');
            resolve();
        } catch (error) {
            console.error('Failed to load crypto-js.min.js:', error);
            reject(error);
        }
    });
}

async function loadDecimalJS() {
    return new Promise((resolve, reject) => {
        try {
            importScripts('decimal.min.js');
            resolve();
        } catch (error) {
            console.error('Failed to load decimal.min.js:', error);
            reject(error);
        }
    });
}

async function testPI(start, end) {
    Decimal.set({ precision: end + 1 });

        let a = new Decimal(1);
        let b = new Decimal(1).div(Decimal.sqrt(2));
        let t = new Decimal(1).div(4);
        let p = new Decimal(1);

        for (let i = 0; i < start; i++) {
            const aNext = a.plus(b).div(2);
            const bNext = Decimal.sqrt(a.mul(b));
            const tNext = t.minus(p.mul(a.minus(aNext).pow(2)));
            p = p.mul(2);

            a = aNext;
            b = bNext;
            t = tNext;
        }

        const pi = a.plus(b).pow(2).div(4).div(t);
        
        return pi.toDecimalPlaces(end).toString();
}

async function computeLightFloatTask(start, end) {
    let sum = 0;
    for (let i = start; i < end; i++) {
        sum += Math.sqrt(i);
    }
    return sum;
}

async function computeHeavyIntTask(start, end) {
    let sum = 0;
    for (let i = start; i < end; i++) {
        sum += i * i + (i % 2 ? i : 0);
    }
    return sum;
}

// 内置的测试数据
const testData = 'Hello, World!';

// 测试加密和解密的函数
async function testEncryption(start, end) {    
        const key = CryptoJS.lib.WordArray.random(32); // 256-bit key
        const iv = CryptoJS.lib.WordArray.random(16);  // 128-bit IV

        // 执行加密和解密循环
        for (let i = start; i < end; i++) {
            const encryptedData = await encrypt(testData, key, iv);
            await decrypt(encryptedData, key, iv);
        }
}

// 加密函数
function encrypt(data, key, iv) {
    return new Promise((resolve) => {
        const encrypted = CryptoJS.AES.encrypt(data, key, { iv: iv });
        resolve(encrypted.toString());
    });
}

// 解密函数
function decrypt(encryptedData, key, iv) {
    return new Promise((resolve) => {
        const decrypted = CryptoJS.AES.decrypt(encryptedData, key, { iv: iv });
        resolve(CryptoJS.enc.Utf8.stringify(decrypted));
    });
}