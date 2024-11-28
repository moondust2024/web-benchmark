self.onmessage = async function(e) {
    const { start, end, type } = e.data;
    const startTime = performance.now();    

    try{
        let result;
        if (type === 'float') {
            result = await computeLightFloatTask(start, end);
        } else if (type === 'int') {
            result = await computeHeavyIntTask(start, end);
        } else if (type === 'AES') {
            await loadCryptoJS();
            result = await testEncryption(start, end);
        } else if (type === 'pi') {
            await loadDecimalJS();
            result = await testPI(start, end);
        } else if (type === 'rw') {
            result = await testReadWriteSpeed();
        } else if (type === 'matrix') {
            result = await testMatrixMultiplication(start, end);
        } else if (type === 'fibonacci') {
            result = await testRecursiveFibonacci(start, end);
        } else if (type === 'sorting') {
            result = await testSortingAlgorithm(start, end);
        }

        self.postMessage({ result, startTime });
    }
    catch (taskError) {
        console.error(`Error in task ${type}:`, taskError);
        self.postMessage({ 
            error: {
                message: taskError.message,
                stack: taskError.stack,
                type: type
            },
            startTime 
        });
    }

};

self.addEventListener('error', (event) => {
    console.error('Uncaught error in worker:', event.error);
});

const dbName = 'TestDB';
const storeName = 'TestStore';
const dbVersion = 1;
const testDataSize = 100 * 1000 * 1000;
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

            const writeTime = (writeEndTime - writeStartTime) / 1000; // 转换为秒
            const readTime = (readEndTime - readStartTime) / 1000; // 转换为秒
        
            const writeSpeed = testDataSize / (1024 * 1024) / writeTime; // MB/s
            const readSpeed = testDataSize / (1024 * 1024) / readTime; // MB/s
        
            return { writeSpeed, readSpeed };
}

async function testReadWriteSpeed() {
    await openDatabase();

    // 预热
    for (let i = 0; i < 2; i++) {
        await performSingleTest();
    }

    let totalWriteSpeed = 0;
    let totalReadSpeed = 0;
    let validTests = 0;

    for (let i = 0; i < testCount; i++) {
        const { writeSpeed, readSpeed } = await performSingleTest();
        if (writeSpeed >= 0 && readSpeed >= 0) {
            totalWriteSpeed += writeSpeed;
            totalReadSpeed += readSpeed;
            validTests++;
        } else {
            console.error('Error in testReadWriteSpeed');
        }
    }

    const averageReadSpeed = totalReadSpeed / validTests;
    const averageWriteSpeed = totalWriteSpeed / validTests;

    await clearTestData();

    return { averageReadSpeed, averageWriteSpeed };
}

async function clearTestData() {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();
    await new Promise((resolve, reject) => {
        request.onsuccess = resolve;
        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
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

async function testMatrixMultiplication(start, end) {
    const size = Math.floor(Math.sqrt(end - start));
    const matrix1 = new Array(size).fill(0).map(() => 
        new Array(size).fill(0).map(() => Math.random()));
    const matrix2 = new Array(size).fill(0).map(() => 
        new Array(size).fill(0).map(() => Math.random()));
    
    const result = new Array(size).fill(0).map(() => new Array(size).fill(0));
    
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            for (let k = 0; k < size; k++) {
                result[i][j] += matrix1[i][k] * matrix2[k][j];
            }
        }
    }
    
    return result;
}

async function testRecursiveFibonacci(start, end) {
    function fibonacci(n) {
        if (n <= 1) return n;
        return fibonacci(n - 1) + fibonacci(n - 2);
    }
    
    let sum = 0;
    for (let i = start; i < end; i++) {
        sum += fibonacci(i % 20);
    }
    return sum;
}

async function testSortingAlgorithm(start, end) {
    const size = end - start;
    const arr = Array.from({length: size}, () => Math.random());
    
    function quickSort(arr) {
        if (arr.length <= 1) return arr;
        
        const pivot = arr[Math.floor(arr.length / 2)];
        const left = arr.filter(x => x < pivot);
        const middle = arr.filter(x => x === pivot);
        const right = arr.filter(x => x > pivot);
        
        return [...quickSort(left), ...middle, ...quickSort(right)];
    }
    
    return quickSort(arr).length;
}