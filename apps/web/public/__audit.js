function oklabToRgb(L,a,b){const l_=L+0.3963377774*a+0.2158037573*b,m_=L-0.1055613458*a-0.0638541728*b,s_=L-0.0894841775*a-1.2914855480*b;const l=l_**3,m=m_**3,s=s_**3;return [4.0767416621*l-3.3077115913*m+0.2309699292*s,-1.2684380046*l+2.6097574011*m-0.3413193965*s,-0.0041960863*l-0.7034186147*m+1.7076147010*s].map(v=>{const c=v<=0.0031308?12.92*v:1.055*Math.pow(Math.max(v,0),1/2.4)-0.055;return Math.min(255,Math.max(0,c*255));});}
function parse(c){let m;if((m=c.match(/^oklab\(([\d.eE+-]+)\s+([\d.eE+-]+)\s+([\d.eE+-]+)(?:\s*\/\s*([\d.]+))?\)/))){const [r,g,b]=oklabToRgb(+m[1],+m[2],+m[3]);return{r,g,b,a:m[4]===undefined?1:+m[4]};}if((m=c.match(/^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)/))){return{r:+m[1]*255,g:+m[2]*255,b:+m[3]*255,a:m[4]===undefined?1:+m[4]};}const n=c.match(/[\d.]+/g)?.map(Number)??[0,0,0,0];return{r:n[0]||0,g:n[1]||0,b:n[2]||0,a:n[3]===undefined?1:n[3]};}
function lum({r,g,b}){const f=v=>{v/=255;return v<=0.03928?v/12.92:((v+0.055)/1.055)**2.4};return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b);}
function over(fg,bg){return{r:fg.r*fg.a+bg.r*(1-fg.a),g:fg.g*fg.a+bg.g*(1-fg.a),b:fg.b*fg.a+bg.b*(1-fg.a),a:1};}
function bgOf(el){let n=el;while(n){const c=parse(getComputedStyle(n).backgroundColor);if(c.a>0.9)return c;n=n.parentElement;}return{r:255,g:255,b:255,a:1};}
function ratio(a,b){const l1=lum(a),l2=lum(b);return (Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05);}
const malos=[];
for(const el of document.querySelectorAll('p,span,a,li,dt,dd,h1,h2,h3,h4,legend,button,label,th,td')){
  const t=el.textContent.trim(); if(!t||el.children.length>0)continue;
  const st=getComputedStyle(el);
  if(st.display==='none'||st.visibility==='hidden'||+st.opacity===0)continue;
  if(el.closest('[aria-hidden="true"]')||el.classList.contains('sr-only'))continue;
  const size=parseFloat(st.fontSize),weight=+st.fontWeight||400;
  const min=(size>=24||(size>=18.66&&weight>=700))?3:4.5;
  const bg=bgOf(el);
  const r=ratio(over(parse(st.color),bg),bg);
  if(r<min)malos.push({txt:t.slice(0,38),px:+size.toFixed(1),ratio:+r.toFixed(2),min});
}
const h1=document.querySelectorAll('h1').length;
const sinAlt=[...document.querySelectorAll('img')].filter(i=>i.alt===null).length;
const sinLabel=[...document.querySelectorAll('input,select,textarea')].filter(el=>!el.labels?.length&&!el.getAttribute('aria-label')&&el.type!=='hidden').length;
JSON.stringify({url:location.pathname,h1,sinAlt,sinLabel,reprobados:malos.length,detalle:malos.slice(0,6)});
