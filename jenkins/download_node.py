import os
import os.path
import tempfile
import shutil
import zipfile
import subprocess
import requests

url = 'https://nodejs.org/dist/v8.9.3/node-v8.9.3-win-x64.zip'
filename = 'node-v8.9.3-win-x64.zip'
dirname = os.path.splitext(filename)[0]


def download(url, filename):
    if os.path.isfile(filename):
        return
    print('Downloading ' + url)
    r = requests.get(url, stream=True)
    r.raise_for_status()
    fd, tmp_path = tempfile.mkstemp()
    with os.fdopen(fd, 'wb') as f:
        for chunk in r.iter_content(chunk_size=1024):
            if chunk:  # filter out keep-alive new chunks
                f.write(chunk)
        # n.b. don't use f.tell(), since it will be wrong for Content-Encoding: gzip
        downloaded_octets = r.raw._fp_bytes_read
    if int(r.headers.get('content-length', downloaded_octets)) != downloaded_octets:
        os.unlink(tmp_path)
        raise ValueError('Download of {} was truncated: {}/{} bytes'.format(url, downloaded_octets, r.headers['content-length']))
    else:
        os.rename(tmp_path, filename)
        print('  => {}'.format(filename))


def decompress(filename, dirname):
    # n.b. `dirname` may exist with partial contents due to failed `git clean` ('Filename too long' errors)
    # if os.path.isdir(dirname):
    #    return
    if os.path.isfile(os.path.join(dirname, 'npm')):
       return
    print('Extracting ' + filename)
    for path in (unicode(dirname), u'tmp'):
        if os.path.isdir(path):
            # n.b. \\?\ is for MAXPATH workaround
            # n.b. unicode strings are required for os.listdir
            shutil.rmtree(u'\\\\?\\' + os.path.abspath(path))
    os.mkdir('tmp')
    with zipfile.ZipFile(filename, 'r', allowZip64=True) as zf:
        zf.extractall('\\\\?\\' + os.path.abspath('tmp'))
    os.rename(os.path.join('tmp', dirname), dirname)


if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    download(url, filename)
    decompress(filename, dirname)
