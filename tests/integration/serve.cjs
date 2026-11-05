const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'apps/dist');
http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost').pathname;
 const prefix=url.startsWith('/dev/')?'/dev':url.startsWith('/stripped/')?'/stripped':'';
 const base=prefix?path.resolve(__dirname,'apps/dist-'+prefix.slice(1)):root;
 const file=path.resolve(base,'.'+url.slice(prefix.length));
 if(!file.startsWith(base+path.sep)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404).end();return;}
 res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(file));
}).listen(8771,'127.0.0.1');
