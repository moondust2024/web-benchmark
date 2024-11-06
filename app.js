document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('run-test').addEventListener('click', () => {
        runTest();
    });
    const threadCountElement = document.getElementById('thread-count');
    if (threadCountElement) {
        const threadCount = navigator.hardwareConcurrency || 'Unknown';
        threadCountElement.textContent = `Current Thread Count: ${threadCount}`;
    }
});

function runTest() {
    const progressElement = document.getElementById('progress');

    // 清空之前的测试结果
    clearResults();    
    clearPerformanceData();

    // 清空测试结果变量
    let domRenderTime, singleThreadFloatTime, multiThreadFloatTime, singleThreadIntTime, multiThreadIntTime;

    progressElement.textContent = 'Testing DOM Render...';
    setTimeout(() => {
        runDOMPerformanceTest()
            .then(time => {
                domRenderTime = time;
                updateResult('DOM Render result', domRenderTime);
                progressElement.textContent = 'Testing Single Thread Float...';

                runSingleThreadFloatTest().then(time => {
                    singleThreadFloatTime = time;
                    updateResult('Single Float result', singleThreadFloatTime);
                    progressElement.textContent = 'Testing Multi Thread Float...';

                    runMultiThreadFloatTest().then(time => {
                        multiThreadFloatTime = time;
                        updateResult('Multi Float result', multiThreadFloatTime);
                        progressElement.textContent = 'Testing Single Thread Int...';

                        runSingleThreadIntTest().then(time => {
                            singleThreadIntTime = time;
                            updateResult('Single Int result', singleThreadIntTime);
                            progressElement.textContent = 'Testing Multi Thread Int...';

                            runMultiThreadIntTest().then(time => {
                                multiThreadIntTime = time;
                                updateResult('Multi Int result', multiThreadIntTime);
                                progressElement.textContent = '';

                                const domRenderScore = calculateScore(domRenderTime, 600, 100);
                                const singleThreadFloatScore = calculateScore(singleThreadFloatTime, 2000, 100);
                                const multiThreadFloatScore = calculateScore(multiThreadFloatTime, 500, 100);
                                const singleThreadIntScore = calculateScore(singleThreadIntTime, 1200, 100);
                                const multiThreadIntScore = calculateScore(multiThreadIntTime, 400, 100);

                                const totalScore = (
                                    singleThreadFloatScore * 0.2 +
                                    multiThreadFloatScore * 0.15 +
                                    singleThreadIntScore * 0.25 +
                                    multiThreadIntScore * 0.15 +
                                    domRenderScore * 0.25
                                ).toFixed(2);
                                updateScore(totalScore);
                            });
                        });
                    });
                });
            });
    }, 200);
}

function runSingleThreadFloatTest() {
    return new Promise((resolve) => {
        

        const startTime = performance.now();
        const worker = new Worker('worker.js');
        worker.postMessage({ start: 0, end: 500000000, type: 'float' });

        worker.onmessage = (e) => {
            const endTime = performance.now();
            resolve(endTime - startTime);
            worker.terminate();
        };
    });
}

function runMultiThreadFloatTest() {
    return new Promise((resolve) => {
        

        const startTime = performance.now();
        const numWorkers = navigator.hardwareConcurrency || 4;
        const tasksPerWorker = 500000000 / numWorkers;
        const results = [];

        const workers = [];
        for (let j = 0; j < numWorkers; j++) {
            const worker = new Worker('worker.js');
            workers.push(worker);

            worker.postMessage({ start: j * tasksPerWorker, end: (j + 1) * tasksPerWorker, type: 'float' });

            worker.onmessage = (e) => {
                results.push(e.data);
                if (results.length === numWorkers) {
                    const finalResult = results.reduce((acc, val) => acc + val, 0);
                    workers.forEach(w => w.terminate());
                    const endTime = performance.now();
                    resolve(endTime - startTime);
                }
            };
        }
    });
}

function runSingleThreadIntTest() {
    return new Promise((resolve) => {
        

        const startTime = performance.now();
        const worker = new Worker('worker.js');
        worker.postMessage({ start: 0, end: 500000000, type: 'int' });

        worker.onmessage = (e) => {
            const endTime = performance.now();
            resolve(endTime - startTime);
            worker.terminate();
        };
    });
}

function runMultiThreadIntTest() {
    return new Promise((resolve) => {
        

        const startTime = performance.now();
        const numWorkers = navigator.hardwareConcurrency || 4;
        const tasksPerWorker = 500000000 / numWorkers;
        const results = [];

        const workers = [];
        for (let j = 0; j < numWorkers; j++) {
            const worker = new Worker('worker.js');
            workers.push(worker);

            worker.postMessage({ start: j * tasksPerWorker, end: (j + 1) * tasksPerWorker, type: 'int' });

            worker.onmessage = (e) => {
                results.push(e.data);
                if (results.length === numWorkers) {
                    const finalResult = results.reduce((acc, val) => acc + val, 0);
                    workers.forEach(w => w.terminate());
                    const endTime = performance.now();
                    resolve(endTime - startTime);
                }
            };
        }
    });
}

function runDOMPerformanceTest() {
    return new Promise((resolve) => {
        const startTime = performance.now();

        generateDOMElements(100000); 
        modifyDOMElements();
        removeDOMElements();

        const endTime = performance.now();
        resolve(endTime - startTime);
    });
}

function generateDOMElements(count) {
    const container = document.getElementById('container');
    container.innerHTML = ''; // 清空容器

    const fragment = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
        const div = document.createElement('div');
        div.className = 'element';
        div.textContent = `Element ${i}`;
        fragment.appendChild(div);
    }
    container.appendChild(fragment);
}

function modifyDOMElements() {
    const elements = document.querySelectorAll('#container .element');
    elements.forEach((element, index) => {
        element.textContent = `Modified Element ${index}`;
    });
}

function removeDOMElements() {
    const container = document.getElementById('container');
    container.innerHTML = ''; // 清空容器
}

function calculateScore(time, baseTime, baseScore) {
    return (baseScore * baseTime) / time;
}

function updateResult(testType, time) {
    const resultId = testType.toLowerCase().replace(/ /g, '-').replace(/\./g, '');
    const resultElement = document.getElementById(resultId);
    if (resultElement) {
        resultElement.innerHTML = `${testType}: Time taken: ${time.toFixed(2)} ms`;
    } else {
        console.error(`Element with ID '${resultId}' not found.`);
    }
}

function updateScore(score) {
    const resultElement = document.getElementById('score');
    if (resultElement) {
        resultElement.innerHTML = `Score: ${score}`;
    } else {
        console.error(`Element with ID 'score' not found.`);
    }
}

function clearResults() {
    const resultIds = [
        'dom-render-result',
        'single-float-result',
        'multi-float-result',
        'single-int-result',
        'multi-int-result',
        'score'
    ];

    resultIds.forEach(id => {
        const resultElement = document.getElementById(id);
        if (resultElement) {
            resultElement.innerHTML = '';
        }
    });
}

function clearPerformanceData() {
    performance.clearMeasures();
    performance.clearMarks();
}