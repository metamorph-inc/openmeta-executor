OpenMETA Remote Execution Service
=================================

The OpenMETA Remote Execution Service provides a job server and remote worker,
enabling remote job execution from the OpenMETA Job Manager.

The `executor-server` is a server that receives and manages analysis jobs.
It is accessible via a REST API. That REST API is documented in
[`executor-server/HOWTO.md`](executor-server/HOWTO.md).

The `executor-worker` is a client process that runs on the machines that will
actually run the analysis. It may be run on multiple machines simultaneously,
and different machines can support different "tags" for specialized capabilities.

For build and development instructions, see `README.md` in the `executor-server`
and `executor-worker` directories.  For end-user documentation, see
[`PACKAGE_README.md`](jenkins/PACKAGE_README.md) in the `jenkins` directory
(this document is included in the packaged ZIP file built by Jenkins).
