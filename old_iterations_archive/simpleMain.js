import { Worker } from 'worker_threads';

function runService(workerData) {
  return new Promise((resolve, reject) => {
    const worker = new Worker('./simpleWorker.js', { workerData });
    worker.on('message', resolve);
    worker.on('error', reject);
    worker.on('exit', (code) => {
      if (code !== 0)
        reject(new Error(`Worker stopped with exit code ${code}`));
    });

    // Send the file path to the worker
    worker.postMessage('pre-processed_folder_test/con_law_questions_answers.txt');
  });
}

runService({}).then(result => {
  console.log(result);
}).catch(err => {
  console.error(err);
});
