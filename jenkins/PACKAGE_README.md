Running the Remote Execution Server and Worker
==============================================

 1. Set up a user for the executor server:

        openmeta-executor-server.exe add-user <username>

    Replacing `<username>` with a username of your choice.  Enter
    a password when prompted.

 2. In one command prompt window, run the executor server:

        openmeta-executor-server.exe --ignore-job-labels

    To run with job labeling enabled, remove the `--ignore-job-labels` flag,
    and add a `--labels` option to the worker command as described in step 3.

 3. In another command prompt window, make sure the OpenMETA Python Scripts
    directory is in your PATH (python.exe should run without including the full
    path, and should point to the OpenMETA Python virtualenv), then run the
    worker:

        openmeta-executor-worker.exe <server-address> <worker-key>

    `<server-address>` should be the full URL to the executor server (e.g.
    `http://localhost:8080/` for a server running on your local machine); the
    value of `<worker-key>` can be found in `auth.json` in the server's working
    directory.

    If job labelling is enabled in the job server, append `--labels <list of labels>`
    to the end of the worker command, passing a comma-separated list of labels
    indicating which capabilities are available to this worker machine.  A list
    of labels currently used by each interpreter is shown below.  For example,
    if Simulink and CyPhy2CAD with Creo are supported on this worker, add:

        --labels Windows14.13,Simulink,Creo,CADCreoParametricAssembly.exev1.4

 4. Configure the Results Browser for remote execution:

     1. If it's not already running, run the Results Browser from the GME
        toolbar.

     2. In the Results Browser's status bar, click the Local Execution menu and
        select Remote Execution.

     3. In the dialog that appears, enter the full URL to the executor server,
        along with the username and password you configured in Step 1.

 5. Once the Results Browser is configured for remote execution and at least
    one worker is running, you can run jobs from the Master Interpreter as
    usual.  Note that not all interpreters are compatible with remote execution
    (the Simulink interpreter works well; try the SimulinkTestModel in Tonka's
    `models` directory).

Remote Executor Worker Labels
-----------------------------

  * **Default**: "Windows14.13"
  * CyPhy2CAD: "Creo, CADCreoParametricCreateAssembly.exev1.4, Windows14.13"
  * CyPhy2Modelica: "OpenModelica, py_modelica12.08"
      * or: "OpenModelica, py_modelica14.13"
  * CyPhyCADAnalysis: "Creo, CADCreoParametricCreateAssembly.exev1.4, CyPhyCADAnalysis14.13"
  * CyPhyPET: Takes label(s) from interpreters used in its testbench(es)
  * CyPhyPrepareIFab: "Creo, CADCreoParametricCreateAssembly.exev1.4, Windows14.13"
  * CyPhyReliabilityAnalysis: "Windows14.13"
  * CyPhySOT: Takes label(s) from interpreters
  * CyPhy2CADPCB: "Visualizer"
  * CyPhy2MfgBom: "Windows14.13"
  * CyPhy2PCBMfg:"Windows14.13"
  * CyPhy2RF: "RF"
  * CyPhy2Schematic: "Schematic"
  * CyPhy2Simulink: "Simulink"
