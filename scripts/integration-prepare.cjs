const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),apps=path.join(root,'tests/integration/apps');
const runtime=path.join(apps,'node_modules/node/bin/node');
function run(command,args,cwd=root){
 const env={...process.env};
 if(fs.existsSync(runtime)) env.PATH=path.dirname(runtime)+path.delimiter+env.PATH;
 return execFileSync(command,args,{cwd,env,stdio:'inherit'});
}
run('npm',['run','build']);
const packed=JSON.parse(execFileSync('npm',['pack','--ignore-scripts','--json','--pack-destination',apps],{cwd:root,encoding:'utf8'}))[0];
fs.renameSync(path.join(apps,packed.filename),path.join(apps,'browser-guard.tgz'));
run('npm',['install','./browser-guard.tgz','--cache','/tmp/browser-guard-integration-npm'],apps);
run(runtime,['build.mjs'],apps);
