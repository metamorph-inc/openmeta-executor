import os
import os.path
import tempfile
import shutil
import zipfile
import subprocess
from urllib2 import urlopen, URLError, HTTPError

url = 'https://nodejs.org/dist/v10.16.2/node-v10.16.2-win-x64.zip'
filename = 'node-v10.16.2-win-x64.zip'
dirname = os.path.splitext(filename)[0]


def download(url, filename):
    if os.path.isfile(filename):
        return
    print('Downloading ' + url)

    try:
        f = urlopen(url)
        print "downloading " + url

        fd, tmp_path = tempfile.mkstemp()
        with os.fdopen(fd, 'wb') as local_file:
            local_file.write(f.read())

        os.rename(tmp_path, filename)
        print('  => {}'.format(filename))
    #handle errors
    except HTTPError, e:
        print "HTTP Error:", e.code, url
    except URLError, e:
        print "URL Error:", e.reason, url



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
