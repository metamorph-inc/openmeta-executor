python download_node.py

PATH=%CD%\node-v8.9.3-win-x64\;%PATH%

npm install -g yarn@1.3.2

pushd ..\executor-server
call yarn && call yarn run package
popd

pushd ..\executor-worker
call yarn && call yarn run package
popd

mkdir remote-executor
copy ..\executor-server\package\* remote-executor\
copy ..\executor-worker\package\* remote-executor\

python -m zipfile -c remote-executor.zip remote-executor\
