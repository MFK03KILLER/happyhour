import paramiko
import sys
import os

HOST = '92.42.207.118'
USER = 'root'
PASS = '86qRHdzi9unm'
PUBKEY = open(os.path.expanduser('~/.ssh/id_ed25519.pub')).read().strip()

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

print(f'Connecting to {USER}@{HOST}...')
client.connect(HOST, username=USER, password=PASS, timeout=30, allow_agent=False, look_for_keys=False)
print('Connected.')

cmd = f'mkdir -p ~/.ssh && chmod 700 ~/.ssh && grep -qxF "{PUBKEY}" ~/.ssh/authorized_keys 2>/dev/null || echo "{PUBKEY}" >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && echo OK_KEY_ADDED && cat /etc/os-release | head -3 && uname -a'

stdin, stdout, stderr = client.exec_command(cmd, timeout=30)
out = stdout.read().decode()
err = stderr.read().decode()
print('STDOUT:', out)
if err: print('STDERR:', err)
client.close()
print('Done.')
