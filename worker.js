self.onmessage = async function(e) {
    const { start, end, type } = e.data;
    const startTime = performance.now();

    // 动态加载 crypto-js
    importScripts('crypto-js.min.js');

    let result;
    if (type === 'float') {
        result = await computeLightFloatTask(start, end);
    } else if (type === 'int') {
        result = await computeHeavyIntTask(start, end);
    } else if (type === 'AES') {
        result = await testEncryption(start, end);
    }

    self.postMessage({ result, startTime });
};

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