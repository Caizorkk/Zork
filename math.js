// Interpretador simples para calculadora e fórmulas de planilha. Não usa eval().
export function compute(input,resolve=()=>0){
 let s=String(input).replace(/\s+/g,'').replace(/,/g,'.');let pos=0;
 const fail=()=>{throw new Error('Expressão inválida')};
 const peek=()=>s[pos];
 function expr(){let v=term();while(peek()==='+'||peek()==='-'){let op=s[pos++];let x=term();v=op==='+'?v+x:v-x}return v}
 function term(){let v=power();while(peek()==='*'||peek()==='/'){let op=s[pos++];let x=power();v=op==='*'?v*x:v/x}return v}
 function power(){let v=unary();if(peek()==='^'){pos++;v=Math.pow(v,power())}return v}
 function unary(){if(peek()==='+'){pos++;return unary()}if(peek()==='-'){pos++;return -unary()}return primary()}
 function primary(){let v;if(peek()==='('){pos++;v=expr();if(s[pos++]!==')')fail()}else if(/[\d.]/.test(peek()||'')){const match=s.slice(pos).match(/^(?:\d+(?:\.\d*)?|\.\d+)/);if(!match)fail();pos+=match[0].length;v=Number(match[0])}else if(/[A-Za-z_]/.test(peek()||'')){
 const m=s.slice(pos).match(/^[A-Za-z_][A-Za-z_0-9]*/);const name=m[0].toUpperCase();pos+=m[0].length;
 if(peek()==='('){pos++;let args=[];while(peek()!==')'&&pos<s.length){const start=pos;let depth=0;while(pos<s.length){if(peek()==='(')depth++;if(peek()===')'){if(depth===0)break;depth--}if(peek()===','&&depth===0)break;pos++}const raw=s.slice(start,pos);const range=raw.match(/^([A-Z]+\d+):([A-Z]+\d+)$/);if(range){args.push(...resolve('RANGE',range[1],range[2]))}else args.push(compute(raw,resolve));if(peek()===',')pos++;else break}if(s[pos++]!==')')fail();if(name==='SUM'||name==='SOMA')v=args.reduce((a,b)=>a+b,0);else if(name==='AVERAGE'||name==='MEDIA'||name==='MÉDIA')v=args.length?args.reduce((a,b)=>a+b,0)/args.length:0;else if(name==='MIN')v=Math.min(...args);else if(name==='MAX')v=Math.max(...args);else if(name==='COUNT'||name==='CONT')v=args.length;else fail()
 }else v=resolve('CELL',name);
 }else fail();if(peek()==='%'){pos++;v/=100}return v}
 const out=expr();if(pos!==s.length||!Number.isFinite(out))fail();return Math.round(out*1e10)/1e10;
}
export function colName(index){let s='';for(let n=index+1;n;n=Math.floor((n-1)/26))s=String.fromCharCode(65+(n-1)%26)+s;return s}
export function colIndex(name){return [...name].reduce((n,c)=>n*26+c.charCodeAt(0)-64,0)-1}
export function cellValue(cells,addr,stack=new Set()){
 addr=addr.toUpperCase();if(stack.has(addr))return '#CICLO!';const raw=String(cells[addr]??'');if(!raw.startsWith('='))return raw;
 try{const next=new Set(stack);next.add(addr);const result=compute(raw.slice(1),(type,a,b)=>{
  const numeric=x=>{const v=cellValue(cells,x,next);if(typeof v==='string'&&v.startsWith('#'))throw Error(v);return Number(v)||0};
  if(type==='CELL')return numeric(a);
  const f=a.match(/^([A-Z]+)(\d+)$/),t=b.match(/^([A-Z]+)(\d+)$/);if(!f||!t)throw Error('Intervalo');const x1=colIndex(f[1]),x2=colIndex(t[1]),y1=Number(f[2]),y2=Number(t[2]);if(Math.abs(x2-x1+1)*Math.abs(y2-y1+1)>10000)throw Error('Intervalo grande');let out=[];for(let y=Math.min(y1,y2);y<=Math.max(y1,y2);y++)for(let x=Math.min(x1,x2);x<=Math.max(x1,x2);x++)out.push(numeric(colName(x)+y));return out;
 });return result}catch(e){return e.message==='#CICLO!'?'#CICLO!':'#ERRO!'}
}
export const money=n=>(Number(n)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
export function forecast({initial=0,monthly=0,months=12,annual=10.5}={}){const r=Math.pow(1+Number(annual)/100,1/12)-1;let total=Number(initial)||0;for(let m=0;m<months;m++)total=total*(1+r)+(Number(monthly)||0);const contributions=(Number(initial)||0)+(Number(monthly)||0)*months;const profit=total-contributions;const ir=months<=6?.225:months<=12?.20:months<=24?.175:.15;return {total,contributions,profit,net:total-Math.max(0,profit)*ir,estimatedIR:Math.max(0,profit)*ir,irRate:ir}}
export function annualRate(p){if(p.investType==='fixed')return Number(p.annualBase)||0;return (Number(p.annualBase)||0)*(Number(p.percentCDI)||0)/100}
export function csvEscape(v){const s=String(v??'');return /[",\n;]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s}
export function parseCSV(t){const delimiter=t.split(/\r?\n/,1)[0].includes(';')?';':',';const out=[];let row=[],s='',quoted=false;for(let i=0;i<t.length;i++){const c=t[i];if(c==='"'){if(quoted&&t[i+1]==='"'){s+='"';i++}else quoted=!quoted}else if(!quoted&&c===delimiter){row.push(s);s=''}else if(!quoted&&(c==='\n'||c==='\r')){if(c==='\r'&&t[i+1]==='\n')i++;row.push(s);if(row.some(Boolean))out.push(row);row=[];s=''}else s+=c}row.push(s);if(row.some(Boolean))out.push(row);return out}
