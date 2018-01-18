import ExecutorClient from "./ExecutorClient";
import WorkerStateMachine from "./WorkerStateMachine";

const JOB_POLL_DELAY = 2*1000;
const ERROR_DELAY = 5*1000;

const app = (serverAddress, serverKey, labels) => {
  console.log("Executor worker launched");

  const client = new ExecutorClient(serverAddress, serverKey, labels);
  const stateMachine = new WorkerStateMachine(client);

  stateMachine.run().then(() => {
    // Nothing to do on state machine completion
  }).catch((err) => {
    console.log("A worker error occurred:");
    console.log(err);
  });
};

export default app;
