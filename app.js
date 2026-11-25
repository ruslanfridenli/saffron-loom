const I18N={"en":{"dataset":"Dataset","query":"Query","run":"▶ Run","schema":"▤ Schema","stats":"rows","ph":"pick a dataset and run a query — real sqlite in your browser via sql.js"},"de":{"dataset":"Datensatz","query":"Abfrage","run":"▶ Ausführen","schema":"▤ Schema","stats":"Zeilen","ph":"datensatz wählen und abfrage ausführen — echtes sqlite im browser via sql.js"}};
let lang=localStorage.getItem('lang')||'en';
const t=k=>I18N[lang][k]||k;
function applyLang(){document.documentElement.lang=lang;document.querySelectorAll('[data-i]').forEach(el=>el.textContent=t(el.dataset.i));document.querySelectorAll('.lang button').forEach(b=>b.classList.toggle('on',b.dataset.lang===lang));}
document.querySelectorAll('.lang button').forEach(b=>b.onclick=()=>{lang=b.dataset.lang;localStorage.setItem('lang',lang);applyLang();});

const $=id=>document.getElementById(id);let db=null,SQL=null;
const DBSQL={"music":"create table artists(id integer primary key,name text,genre text);create table tracks(id integer primary key,title text,artist_id int,duration int,plays int);insert into artists values(1,'daft punk','electronic'),(2,'radiohead','rock'),(3,'beyonce','pop'),(4,'aphex twin','idm'),(5,'nirvana','grunge');insert into tracks values(1,'around the world',1,426,1200000),(2,'paranoid android',2,383,980000),(3,'halo',3,253,2100000),(4,'xtal',4,312,450000),(5,'smells like teen spirit',5,279,3000000),(6,'one more time',1,320,1500000),(7,'karma police',2,263,1750000),(8,'single ladies',3,194,2600000);","crypto":"create table coins(id integer primary key,symbol text,name text);create table prices(coin_id int,day text,price real,volume real);insert into coins values(1,'BTC','Bitcoin'),(2,'ETH','Ethereum'),(3,'SOL','Solana'),(4,'DOGE','Dogecoin');insert into prices values(1,'2026-11-01',98000,32000000000),(1,'2026-11-08',102000,41000000000),(1,'2026-11-15',97000,38000000000),(2,'2026-11-01',3400,15000000000),(2,'2026-11-08',3650,19000000000),(2,'2026-11-15',3520,17000000000),(3,'2026-11-01',210,800000000),(3,'2026-11-08',228,950000000),(3,'2026-11-15',219,880000000),(4,'2026-11-01',0.32,2000000000),(4,'2026-11-08',0.35,2400000000),(4,'2026-11-15',0.33,2100000000);","library":"create table books(id integer primary key,title text,author text,year int,pages int);insert into books values(1,'dune','frank herbert',1965,412),(2,'neuromancer','william gibson',1984,271),(3,'the left hand of darkness','ursula k. le guin',1969,304),(4,'foundation','isaac asimov',1951,255),(5,'snow crash','neal stephenson',1992,470),(6,'the martian','andy weir',2014,369),(7,'hyperion','dan simmons',1989,482);create table loans(book_id int,member text,day text);insert into loans values(1,'alex','2026-11-10'),(3,'sam','2026-11-12'),(5,'alex','2026-11-15');"};
const NAMES=["music","crypto","library"];
const SAMPLES={music:'select a.name, count(*) as tracks from artists a join tracks t on t.artist_id=a.id group by a.id order by tracks desc;',crypto:'select c.symbol, p.price, p.day from prices p join coins c on c.id=p.coin_id order by p.day desc, c.symbol;',library:'select b.title, b.author, count(l.member) as loans from books b left join loans l on l.book_id=b.id group by b.id order by loans desc;'};
const LABELS={music:'music store',crypto:'crypto prices',library:'library'};
async function boot(){
  SQL=await initSqlJs({locateFile:f=>'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/'+f});
  const dw=$('dsets');NAMES.forEach(n=>{const b=document.createElement('button');b.textContent=LABELS[n];b.onclick=()=>loadDb(n);dw.appendChild(b);});
  loadDb(NAMES[0]);
}
function loadDb(name){
  db=new SQL.Database();
  db.run(DBSQL[name]);
  $('q').value=SAMPLES[name];
  $('q').dataset.name=name;
  run();
}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function run(){
  const res=$('res');res.innerHTML='';
  try{
    const stmt=db.prepare($('q').value);
    const cols=stmt.getColumnNames();
    const rows=[];
    while(stmt.step())rows.push(stmt.get());
    stmt.free();
    if(!rows.length){res.innerHTML='<p class="ph">'+t('stats')+': 0</p>';return;}
    let html='<table><tr>'+cols.map(c=>'<th>'+esc(c)+'</th>').join('')+'</tr>';
    rows.slice(0,500).forEach(r=>{html+='<tr>'+r.map(c=>'<td>'+esc(c??'null')+'</td>').join('')+'</tr>';});
    html+='</table>';res.innerHTML=html;
    $('stats').innerHTML='<b>'+rows.length+'</b> '+t('stats');
  }catch(e){res.innerHTML='<div class="err">'+esc(e.message)+'</div>';}
}
$('run').onclick=run;
$('schema').onclick=()=>{try{const r=db.exec("select name, sql from sqlite_master where type='table'");let h='<table><tr><th>name</th><th>sql</th></tr>';r.forEach(x=>x.values.forEach(v=>{h+='<tr><td>'+esc(v[0])+'</td><td style="white-space:pre-wrap">'+esc(v[1])+'</td></tr>';}));h+='</table>';$('res').innerHTML=h;}catch(e){}};
$('q').addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter')run();});
boot().catch(e=>{$('res').innerHTML='<div class="err">sql.js failed to load: '+e.message+'</div>';});applyLang();