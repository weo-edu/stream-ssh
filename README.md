stream-ssh
==========


## Example

```javascript
fs.createReadStream('./test.sh')
  .pipe(es.split())
  .pipe(sshStream({
    host: 'server.com',
    username: 'task',
    privateKey: fs.readFileSync(path.resolve(process.env.HOME, '.ssh/id_rsa'))
  }))
  .pipe(consoleStream());
```