C:\Python27\python.exe download_node.py || exit /b !ERRORLEVEL!

PATH=%CD%\node-v10.16.2-win-x64.zip\;%PATH%

call npm install -g yarn@1.3.2 || exit /b !ERRORLEVEL!

pushd ..\executor-server || exit /b !ERRORLEVEL!
call yarn && call yarn run package || exit /b !ERRORLEVEL!
popd || exit /b !ERRORLEVEL!

pushd ..\executor-worker || exit /b !ERRORLEVEL!
call yarn && call yarn run package || exit /b !ERRORLEVEL!
popd || exit /b !ERRORLEVEL!

rmdir /s /q remote-executor
mkdir remote-executor

copy ..\executor-server\package\* remote-executor\ || exit /b !ERRORLEVEL!
copy ..\executor-worker\package\* remote-executor\ || exit /b !ERRORLEVEL!
copy PACKAGE_README.md remote-executor\README.md || exit /b !ERRORLEVEL!

C:\Python27\python.exe -m zipfile -c remote-executor.zip remote-executor\ || exit /b !ERRORLEVEL!
