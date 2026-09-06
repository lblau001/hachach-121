const TOPICS = DATA.topics, POLS = DATA.politicians, ISSUES = DATA.issues, GLOSSARY = DATA.glossary || {};

// ===== Avatar Builder =====
const SKINS = [
  {id:'s1',color:'#f4c9a5',label:'🏻'},{id:'s2',color:'#e8b088',label:'🏼'},
  {id:'s3',color:'#c68b5c',label:'🏽'},{id:'s4',color:'#8b5e3c',label:'🏾'},{id:'s5',color:'#5c3a1e',label:'🏿'}
];
const HAIRS = [
  {id:'short',label:'קצר'},{id:'long',label:'ארוך'},{id:'curly',label:'מתולתל'},
  {id:'kippah',label:'כיפה'},{id:'hijab',label:"חיג'אב"},{id:'bald',label:'קרח'}
];
const HAIR_COLORS = [
  {id:'hc1',color:'#1a1a1a',label:'שחור'},{id:'hc2',color:'#3a2418',label:'חום'},
  {id:'hc3',color:'#c8a832',label:'בלונד'},{id:'hc4',color:'#888',label:'אפור'},{id:'hc5',color:'#8b1a1a',label:'אדום'}
];
const CLOTHES = [
  {id:'cl1',color:'#2b4cff',label:'כחול'},{id:'cl2',color:'#ff5240',label:'אדום'},
  {id:'cl3',color:'#22c98e',label:'ירוק'},{id:'cl4',color:'#3a3a3a',label:'שחור'},{id:'cl5',color:'#b06bff',label:'סגול'}
];
const EYES_OPTS = [
  {id:'normal',label:'רגיל'},{id:'glasses',label:'משקפיים'},{id:'sunglasses',label:'משקפי שמש'}
];

function buildAvatarSvg(cfg, gnd) {
  var c = cfg || {}, gen = gnd || player.gender || 'm';
  var skin = c.skin || '#f4c9a5';
  var hairStyle = c.hair || 'short';
  var hairColor = c.hairColor || '#1a1a1a';
  var clothesColor = c.clothes || '#2b4cff';
  var eyeStyle = c.eyes || 'normal';

  var body = gen === 'f'
    ? '<path d="M20 96 Q20 68 50 68 Q80 68 80 96 Z" fill="'+clothesColor+'" stroke="#161310" stroke-width="2.5"/><path d="M38 68 Q50 80 62 68 Q56 76 44 76 Z" fill="#fff" stroke="#161310" stroke-width="1.5" opacity="0.7"/>'
    : '<path d="M20 96 Q20 68 50 68 Q80 68 80 96 Z" fill="'+clothesColor+'" stroke="#161310" stroke-width="2.5"/><path d="M42 68 L50 78 L58 68 L58 96 L42 96 Z" fill="#fff" stroke="#161310" stroke-width="2"/><path d="M50 72 L46 78 L47 92 L50 96 L53 92 L54 78 Z" fill="'+clothesColor+'" stroke="#161310" stroke-width="1.5"/>';

  var neck = '<rect x="45" y="60" width="10" height="10" fill="'+skin+'" stroke="#161310" stroke-width="2"/>';
  var face = '<circle cx="50" cy="42" r="20" fill="'+skin+'" stroke="#161310" stroke-width="2.5"/>';

  var hair = '';
  switch(hairStyle) {
    case 'short':
      hair = '<path d="M30 40 Q30 22 50 22 Q70 22 70 40 Q66 32 62 30 Q55 26 50 26 Q45 26 38 30 Q34 32 30 40 Z" fill="'+hairColor+'" stroke="#161310" stroke-width="2"/>'; break;
    case 'long':
      hair = '<path d="M30 40 Q30 22 50 22 Q70 22 70 40 Q66 32 62 30 Q55 26 50 26 Q45 26 38 30 Q34 32 30 40 Z" fill="'+hairColor+'" stroke="#161310" stroke-width="2"/>'
           + '<path d="M28 44 Q22 60 24 80 L30 90 L34 78 Q30 60 32 44 Z" fill="'+hairColor+'" stroke="#161310" stroke-width="1.5"/>'
           + '<path d="M72 44 Q78 60 76 80 L70 90 L66 78 Q70 60 68 44 Z" fill="'+hairColor+'" stroke="#161310" stroke-width="1.5"/>'; break;
    case 'curly':
      hair = '<path d="M28 42 Q26 22 50 20 Q74 22 72 42 Q72 56 65 62 Q60 65 50 65 Q40 65 35 62 Q28 56 28 42 Z" fill="'+hairColor+'" stroke="#161310" stroke-width="2"/>'
           + '<ellipse cx="50" cy="43" rx="16" ry="19" fill="'+skin+'" stroke="#161310" stroke-width="1.5"/>'
           + '<circle cx="30" cy="35" r="5" fill="'+hairColor+'" stroke="#161310" stroke-width="1.5"/>'
           + '<circle cx="70" cy="35" r="5" fill="'+hairColor+'" stroke="#161310" stroke-width="1.5"/>'
           + '<circle cx="36" cy="24" r="5" fill="'+hairColor+'" stroke="#161310" stroke-width="1.5"/>'
           + '<circle cx="64" cy="24" r="5" fill="'+hairColor+'" stroke="#161310" stroke-width="1.5"/>'
           + '<circle cx="50" cy="21" r="5" fill="'+hairColor+'" stroke="#161310" stroke-width="1.5"/>'; break;
    case 'kippah':
      hair = '<path d="M38 32 Q38 20 50 20 Q62 20 62 32 Z" fill="'+hairColor+'" stroke="#161310" stroke-width="2"/>'
           + '<ellipse cx="50" cy="32" rx="12" ry="3.5" fill="'+hairColor+'" stroke="#161310" stroke-width="1.5"/>'; break;
    case 'hijab':
      hair = '<path d="M28 46 Q26 22 50 20 Q74 22 72 46 Q72 72 50 72 Q28 72 28 46 Z" fill="'+hairColor+'" stroke="#161310" stroke-width="2"/>'
           + '<ellipse cx="50" cy="44" rx="17" ry="20" fill="'+skin+'" stroke="#161310" stroke-width="1.5"/>'; break;
    default: break;
  }

  var eyes = '';
  switch(eyeStyle) {
    case 'glasses':
      eyes = '<rect x="37" y="39" width="10" height="8" rx="1" fill="rgba(150,200,255,0.3)" stroke="#161310" stroke-width="2"/>'
           + '<rect x="53" y="39" width="10" height="8" rx="1" fill="rgba(150,200,255,0.3)" stroke="#161310" stroke-width="2"/>'
           + '<line x1="47" y1="43" x2="53" y2="43" stroke="#161310" stroke-width="2"/>'
           + '<line x1="27" y1="43" x2="37" y2="43" stroke="#161310" stroke-width="1.5"/>'
           + '<line x1="63" y1="43" x2="73" y2="43" stroke="#161310" stroke-width="1.5"/>'
           + '<circle cx="42" cy="43" r="1.5" fill="#161310"/><circle cx="58" cy="43" r="1.5" fill="#161310"/>'
           + '<path d="M39 37 Q43 36 47 37" stroke="#161310" stroke-width="1.5" fill="none"/>'
           + '<path d="M53 37 Q57 36 61 37" stroke="#161310" stroke-width="1.5" fill="none"/>'; break;
    case 'sunglasses':
      eyes = '<rect x="37" y="39" width="10" height="8" rx="1" fill="#1a1a1a" stroke="#161310" stroke-width="2"/>'
           + '<rect x="53" y="39" width="10" height="8" rx="1" fill="#1a1a1a" stroke="#161310" stroke-width="2"/>'
           + '<line x1="47" y1="43" x2="53" y2="43" stroke="#161310" stroke-width="2"/>'
           + '<line x1="27" y1="43" x2="37" y2="43" stroke="#161310" stroke-width="1.5"/>'
           + '<line x1="63" y1="43" x2="73" y2="43" stroke="#161310" stroke-width="1.5"/>'; break;
    default:
      eyes = '<ellipse cx="43" cy="42" rx="2" ry="2.5" fill="#161310"/><ellipse cx="57" cy="42" rx="2" ry="2.5" fill="#161310"/>'
           + '<path d="M39 37 Q43 36 47 37" stroke="#161310" stroke-width="1.5" fill="none"/>'
           + '<path d="M53 37 Q57 36 61 37" stroke="#161310" stroke-width="1.5" fill="none"/>'; break;
  }

  var nose = '<path d="M50 46 L48 51 L50 52 L52 51 Z" fill="none" stroke="#161310" stroke-width="1.2"/>';
  var mouth = '<path d="M44 55 Q50 58 56 55" stroke="#161310" stroke-width="1.5" fill="none"/>';
  var bg = '<rect x="4" y="4" width="92" height="92" fill="'+clothesColor+'" stroke="#161310" stroke-width="3" rx="12" opacity="0.15"/>';

  return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">'+bg+body+neck+face+hair+eyes+nose+mouth+'</svg>';
}
const STORAGE_KEY = 'khav-121-v3';
const COINS_PER_STEP = 25; // TF + bill + drag = 3 steps => 75 coins/issue; 16 issues => 1200 total

// ===== Player state =====
let player = { name:"", avatarId:AVATARS[0].id, gender:"" }; // gender: 'm' | 'f' | ''
let progress = {}; // topicId -> { issues: { issueId: {completed, coins, completedAt} } }
let totalCoins = 0;

// ===== Mobile viewport fix =====
function setVh(){ document.documentElement.style.setProperty('--vh', (window.innerHeight*0.01)+'px'); }
setVh();
window.addEventListener('resize', setVh);
window.addEventListener('orientationchange', () => setTimeout(setVh, 100));

// ===== Storage =====
function loadProgress(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw){ const p = JSON.parse(raw); if(p.player) player = Object.assign(player,p.player); if(p.progress) progress = p.progress; if(typeof p.totalCoins==='number') totalCoins = p.totalCoins; }
  }catch(e){}
}
function saveProgress(){
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify({player, progress, totalCoins})); }catch(e){}
}

// ===== Sound (synthetic WebAudio — no external files) =====
let audioCtx = null, muted = false;
function initAudio(){ if(!audioCtx){ try{ audioCtx = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} } }
function beep(freq, dur, type, vol){
  if(muted || !audioCtx) return;
  try{
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = type||'sine'; o.frequency.value = freq;
    g.gain.value = vol||0.06;
    o.connect(g); g.connect(audioCtx.destination);
    const t = audioCtx.currentTime;
    g.gain.setValueAtTime(vol||0.06, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + (dur||0.12));
    o.start(t); o.stop(t + (dur||0.12));
  }catch(e){}
}
function sfxTap(){ beep(420, 0.07, 'triangle', 0.05); }
function sfxCorrect(){ beep(660,0.09,'sine',0.06); setTimeout(()=>beep(880,0.12,'sine',0.06),90); navigator.vibrate&&navigator.vibrate(50); }
function sfxWrong(){ beep(200,0.16,'sawtooth',0.05); navigator.vibrate&&navigator.vibrate([50,40,80]); }
function sfxCoin(){ beep(1050,0.06,'square',0.04); setTimeout(()=>beep(1400,0.08,'square',0.04),60); }
function sfxWhoosh(){ beep(300,0.18,'sine',0.04); }
function sfxCelebrate(){ [523,659,784,1046].forEach((f,i)=>setTimeout(()=>beep(f,0.18,'triangle',0.06), i*120)); }
function toggleMute(){
  muted = !muted;
  document.querySelectorAll('.mute-btn').forEach(b=> b.textContent = muted ? '🔇' : '🔊');
  if(!muted){ initAudio(); sfxTap(); }
  saveMute();
}
function saveMute(){ try{ localStorage.setItem('khav-121-muted', muted?'1':'0'); }catch(e){} }
function loadMute(){ try{ muted = localStorage.getItem('khav-121-muted')==='1'; }catch(e){} }

// ===== Gender-aware phrasing =====
// g('אתה','את') returns correct form; default masculine if unset
function g(m, f){ return player.gender==='f' ? f : m; }

// ===== Navigation =====
function show(id){
  const prev=document.querySelector('.screen.active');
  const next=document.getElementById(id);
  if(prev===next){next.scrollTop=0;return;}
  if(prev){
    prev.classList.add('leaving');
    prev.classList.remove('active');
    const rm=()=>prev.classList.remove('leaving');
    prev.addEventListener('animationend',rm,{once:true});
    setTimeout(rm,400);
  }
  next.classList.add('active');
  next.scrollTop=0;
  // Show/hide chrome bars
  const showBars = id==='home';
  document.getElementById('appBar')?.classList.toggle('visible', showBars);
  document.getElementById('bottomNav')?.classList.toggle('visible', showBars);
  document.getElementById('home')?.classList.toggle('bars-visible', showBars);
}
function startFast(){ initAudio(); sfxTap(); trackEvent('game_start', {returning: !!player.name}); if(!player.name){ goAvatar(); } else { goHome(); } }
function goAvatar(){ renderAvatarBuilder(); renderGender(); document.getElementById('userName').value = player.name||''; show('avatar'); }
function confirmAvatar(){
  sfxTap();
  player.name = (document.getElementById('userName').value.trim() || g("אורח","אורחת"));
  if(!player.avatarCfg) player.avatarCfg = getDefaultCfg();
  if(!player.gender) player.gender='m';
  saveProgress(); trackEvent('avatar_complete', {gender: player.gender}); goHome();
}
function skipAvatar(){ sfxTap(); player.name = g("אורח","אורחת"); if(!player.gender) player.gender='m'; saveProgress(); trackEvent('avatar_skip', {}); goHome(); }
function goHome(){ renderHome(); show('home'); }
function backToHome(){ sfxWhoosh(); trackEvent('back_to_home', {topic: currentTopic&&currentTopic.id, step: currentStep}); goHome(); }

// ===== Avatar Builder =====
function getDefaultCfg(){ return {skin:'#f4c9a5',hair:'short',hairColor:'#1a1a1a',clothes:'#2b4cff',eyes:'normal'}; }
function getAvatarSvg(){ return buildAvatarSvg(player.avatarCfg || getDefaultCfg(), player.gender); }

function updateBuilderPreview(){
  var el = document.getElementById('builderPreview'); if(!el) return;
  el.innerHTML = buildAvatarSvg(player.avatarCfg || getDefaultCfg(), player.gender);
}

function renderAvatarBuilder(){
  if(!player.avatarCfg) player.avatarCfg = getDefaultCfg();
  updateBuilderPreview();
  buildChips('skinChips', SKINS, true,
    function(o){ return player.avatarCfg.skin === o.color; },
    function(o){ player.avatarCfg.skin = o.color; });
  buildChips('hairChips', HAIRS, false,
    function(o){ return player.avatarCfg.hair === o.id; },
    function(o){ player.avatarCfg.hair = o.id; updateHairColorVisibility(); });
  buildChips('hairColorChips', HAIR_COLORS, true,
    function(o){ return player.avatarCfg.hairColor === o.color; },
    function(o){ player.avatarCfg.hairColor = o.color; });
  buildChips('clothesChips', CLOTHES, true,
    function(o){ return player.avatarCfg.clothes === o.color; },
    function(o){ player.avatarCfg.clothes = o.color; });
  buildChips('eyesChips', EYES_OPTS, false,
    function(o){ return player.avatarCfg.eyes === o.id; },
    function(o){ player.avatarCfg.eyes = o.id; });
  updateHairColorVisibility();
}

function buildChips(containerId, opts, isColor, isSelected, onPick){
  var wrap = document.getElementById(containerId); if(!wrap) return;
  wrap.innerHTML='';
  opts.forEach(function(opt){
    var btn = document.createElement('button');
    btn.className = 'b-chip' + (isColor?' color':'') + (isSelected(opt)?' selected':'');
    if(isColor){ btn.style.background = opt.color; btn.setAttribute('title', opt.label); }
    else btn.textContent = opt.label;
    btn.onclick = function(){ sfxTap(); onPick(opt); renderAvatarBuilder(); };
    wrap.appendChild(btn);
  });
}

function updateHairColorVisibility(){
  var sec = document.getElementById('hairColorSection'); if(!sec) return;
  sec.style.display = (player.avatarCfg && (player.avatarCfg.hair==='bald'||player.avatarCfg.hair==='hijab')) ? 'none' : 'block';
}

function renderGender(){
  document.querySelectorAll('.gender-chip').forEach(function(chip){
    chip.classList.toggle('selected', chip.dataset.g===player.gender);
    chip.onclick = function(){ player.gender=chip.dataset.g; sfxTap(); renderGender(); updateBuilderPreview(); };
  });
}

// ===== Home =====
function renderHome(){
  const mini = document.getElementById('userMini');
  mini.innerHTML = getAvatarSvg() + '<span class="un">'+(player.name||g("אורח","אורחת"))+'</span>';
  document.getElementById('coinChip').innerHTML = '🪙 '+totalCoins;

  // Fast completion: one core issue per topic = 8 to finish the map
  const coreIssues = ISSUES.filter(i=>i.core);
  const totalCore = coreIssues.length;
  const doneCore = coreIssues.filter(i=>issueIsDone(i.topic,i.id)).length;
  document.getElementById('meterCount').textContent = doneCore+'/'+totalCore;
  const pct = Math.round(doneCore/totalCore*100);
  setTimeout(()=>document.getElementById('meterFill').style.width = pct+'%', 100);

  const sub = document.getElementById('meterSub');
  const left = totalCore-doneCore;
  if(doneCore===0) sub.textContent = g('בחר נושא ותתחיל לשחק 🚀','בחרי נושא ותתחילי לשחק 🚀');
  else if(doneCore===totalCore) sub.textContent = '🏆 סיימת את המפה! יש עוד סוגיות בונוס';
  else if(left===1) sub.textContent = 'עוד סוגיה אחת ואת/ה מסיים/ת! 🔥';
  else sub.textContent = 'עוד '+left+' סוגיות וסיימת 💪';

  const grid = document.getElementById('topicGrid'); grid.innerHTML='';
  TOPICS.forEach(t=>{
    const done = topicIsDone(t.id);
    const half = !done && topicHasProgress(t.id);
    const card = document.createElement('div');
    card.className = 'topic-card'+(done?' done':'');
    card.style.setProperty('--tc',t.color); card.style.setProperty('--tc2',t.color2);
    card.innerHTML =
      (done?'<div class="check">✔</div>':'') +
      '<div class="em">'+t.icon+'</div>' +
      '<div class="nm">'+t.label+'</div>' +
      '<div class="tsub">'+t.sub+'</div>' +
      '<div class="status">'+(done?'✓ הושלם':(half?'1/2 סוגיות':'2 סוגיות'))+'</div>';
    card.onclick = ()=>{ sfxTap(); enterTopic(t.id); };
    grid.appendChild(card);
  });

  // if all core issues done, offer celebration again
  if(doneCore===totalCore){
    const note = document.getElementById('allDoneNote');
    if(note) note.style.display='block';
  }
  updateAppBar();
}
function topicIsDone(id){ const p=progress[id]; if(!p||!p.issues) return false; return ISSUES.filter(i=>i.topic===id).every(i=>p.issues[i.id]&&p.issues[i.id].completed); }
function topicHasProgress(id){ const p=progress[id]; if(!p||!p.issues) return false; return Object.values(p.issues).some(x=>x.completed); }
function issueIsDone(topicId, issueId){ const p=progress[topicId]; return !!(p&&p.issues&&p.issues[issueId]&&p.issues[issueId].completed); }

// ===== Explain sheet & glossary =====
function openExplain(title, body, credit){
  document.getElementById('explainTitle').textContent = title;
  document.getElementById('explainBody').innerHTML = body;
  document.getElementById('explainCredit').textContent = credit || '📖 מבית המגדלור';
  document.getElementById('explainOverlay').classList.add('active');
  sfxTap();
}
function closeExplain(e){
  if(e && e.target.closest('.explain-sheet') && !e.target.classList.contains('close')) return;
  document.getElementById('explainOverlay').classList.remove('active');
}
function explainWord(w){ const d=GLOSSARY[w]; if(!d) return; openExplain(w, d, '📖 מילון · המגדלור'); }
function explainIssue(){
  if(!currentIssue) return;
  const t = currentTopic;
  let body = '<b>למה זה חשוב?</b><br>'+currentIssue.tf_explain+'<br><br><b>מה עמד להצבעה?</b><br>'+currentIssue.bill_title+' ('+currentIssue.bill_date+')<br>'+currentIssue.bill_summary;
  if(currentIssue.source && currentIssue.source.url){
    body += '<br><br><a class="src-link" href="'+currentIssue.source.url+'" target="_blank" rel="noopener">🔗 מקור: '+currentIssue.source.name+'</a>';
  }
  if(currentIssue.knesset_url){
    body += '<br><a class="src-link" href="'+currentIssue.knesset_url+'" target="_blank" rel="noopener">🏛️ הצבעה רשמית בכנסת (voteId '+currentIssue.voteId+')</a>';
  }
  openExplain(t.icon+' '+currentIssue.title, body, '📖 הסבר על הסוגיה');
}
function markupText(text){
  if(!text) return '';
  let out = text;
  const terms = Object.keys(GLOSSARY).sort((a,b)=>b.length-a.length);
  terms.forEach(term=>{
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    const regex = new RegExp('(^|[\\s"\'\\(])('+escaped+')(?=[\\s.,;:!?\\)"\']|$)','g');
    out = out.replace(regex, (match,before,m)=> before+'<span class="explain-word" onclick="event.stopPropagation();explainWord(\''+term.replace(/'/g,"\\'")+'\')">'+m+'</span>');
  });
  return out;
}

// ===== Avatar callouts (floating toast in the player's name) =====
let calloutTimer = null;
function callout(msg){
  const el = document.getElementById('callout');
  if(!el) return;
  el.querySelector('.ctxt').textContent = msg;
  el.querySelector('svg')?.remove();
  const wrap = document.createElement('div');
  wrap.innerHTML = getAvatarSvg();
  el.insertBefore(wrap.firstChild, el.firstChild);
  el.classList.add('show');
  clearTimeout(calloutTimer);
  calloutTimer = setTimeout(()=>el.classList.remove('show'), 2600);
}
function praiseName(){
  const nm = player.name && player.name!=='אורח' && player.name!=='אורחת' ? player.name : '';
  const opts = nm ? [
    'כל הכבוד '+nm+'! 👏',
    'יפה '+nm+', ממשיכים!',
    nm+', '+g('אתה','את')+' בכיוון טוב! 🔥',
  ] : ['כל הכבוד! 👏','יפה מאוד! 🔥','ממשיכים!'];
  callout(opts[Math.floor(Math.random()*opts.length)]);
}

// ===== Issue flow =====
let currentTopic=null, currentIssue=null, currentStep=0;
let userTfAnswer=null, userBillVote=null, dragState={}, dragRevealed=false;
let issueCoinsEarned=0;
let sampledPolitded=null;
let stepsAwarded=new Set();

function enterTopic(topicId){
  currentTopic = TOPICS.find(t=>t.id===topicId);
  const tIssues = ISSUES.filter(i=>i.topic===topicId);
  const p = progress[topicId]||{issues:{}};
  let next = tIssues.find(i=>!p.issues||!p.issues[i.id]||!p.issues[i.id].completed);
  if(!next) next = tIssues[0];
  trackEvent('topic_open', {topic: topicId, done: topicIsDone(topicId)});
  startIssue(next);
}
function startIssue(issue){
  currentIssue = issue; currentStep=0; userTfAnswer=null; userBillVote=null;
  dragState={}; dragRevealed=false; issueCoinsEarned=0; stepsAwarded=new Set();
  // sample politicians: always include key:true, then random fill up to 5
  const keyPols = issue.politicians.filter(p=>p.key);
  const rest = issue.politicians.filter(p=>!p.key).slice();
  for(let i=rest.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [rest[i],rest[j]]=[rest[j],rest[i]]; }
  const target = Math.min(5, issue.politicians.length);
  sampledPolitded = keyPols.concat(rest).slice(0, Math.max(target, keyPols.length));
  // keep original order by bill logic? shuffle final display
  for(let i=sampledPolitded.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [sampledPolitded[i],sampledPolitded[j]]=[sampledPolitded[j],sampledPolitded[i]]; }
  sampledPolitded.forEach(p=> dragState[p.id]='pool');
  show('issue'); renderIssueStep();
}
function renderStepBars(){
  const bars = document.getElementById('stepBars'); bars.innerHTML='';
  for(let s=0;s<3;s++){ const b=document.createElement('div'); b.className='step-bar'+(s<currentStep?' done':s===currentStep?' cur':''); bars.appendChild(b); }
  const bsb = document.getElementById('backStepBtn');
  if(bsb) bsb.style.display = (currentStep>0 && currentStep<4) ? 'block' : 'none';
  updateCoinDisplays();
}

function prevStep(){
  if(currentStep<=0 || currentStep>=4) return;
  if(currentStep===3){ scrollGuesses={}; scrollIdx=0; }
  if(currentStep===2){ userBillVote=null; }
  if(currentStep===1){ userTfAnswer=null; }
  currentStep--;
  renderIssueStep();
}
function renderIssueStep(){
  renderStepBars();
  const c = document.getElementById('issueContent');
  const header =
    '<div style="position:relative;padding-top:2px">'+
      '<button class="float-explain" onclick="explainIssue()">🤔 מה זה?</button>'+
      '<span class="issue-topic-tag">'+currentTopic.icon+' '+currentTopic.label+'</span>'+
      '<div class="issue-title">'+currentIssue.emoji+' '+currentIssue.title+'</div>'+
    '</div>';

  if(currentStep===0){
    c.innerHTML = header +
      '<div class="tf-card" id="tfCard">'+
        '<div>'+
          '<div class="tf-icon">'+currentIssue.emoji+'</div>'+
          '<div class="tf-question">אמת או שקר?</div>'+
          '<div class="tf-statement">"'+markupText(currentIssue.tf)+'"</div>'+
        '</div>'+
        '<div class="tf-hint">↔ '+g("החלק","החליקי")+' את הכרטיס או '+g("לחץ","לחצי")+' למטה</div>'+
        '<span class="tf-stamp true">אמת!</span>'+
        '<span class="tf-stamp false">שקר!</span>'+
      '</div>'+
      '<div class="tf-buttons">'+
        '<button class="tf-btn false" onclick="pickTF(\'false\')">❌ שקר</button>'+
        '<button class="tf-btn true" onclick="pickTF(\'true\')">✅ אמת</button>'+
      '</div>';
    setupTfSwipe();
  }
  else if(currentStep===1){
    const ans = currentIssue.tf_answer, guess = userTfAnswer;
    const isPartial = ans==='partial';
    const isCorrect = isPartial || guess===ans;
    const vTxt = ans==='true'?'אמת':ans==='false'?'שקר':'חלקית נכון';
    const vEmoji = ans==='true'?'✅':ans==='false'?'❌':'⚖️';
    let gm='', gc='';
    if(guess){ const gl = guess==='true'?'אמת':'שקר';
      if(isPartial){ gm='ניחשת: "'+gl+'" · 🤔 שאלה מורכבת — התשובה חלקית'; gc='partial-guess'; }
      else if(isCorrect){ gm='ניחשת: "'+gl+'" · ✓ '+g("צדקת","צדקת")+'!'; gc='right'; }
      else { gm='ניחשת: "'+gl+'" · ✗ '+g("טעית","טעית"); gc='wrong'; }
    }
    let srcLink = '';
    if(currentIssue.source && currentIssue.source.url){
      srcLink = '<a class="src-link" href="'+currentIssue.source.url+'" target="_blank" rel="noopener">🔗 מקור: '+currentIssue.source.name+'</a>';
    }
    if (currentIssue.knesset_url){
      srcLink += ' <a class="src-link" href="'+currentIssue.knesset_url+'" target="_blank" rel="noopener">🏛️ הצבעה רשמית בכנסת</a>';
    }
    c.innerHTML = header +
      '<div class="reveal-box" style="text-align:center">'+
        '<div class="verdict-emoji">'+vEmoji+'</div>'+
        '<div class="verdict '+ans+'">'+vTxt+'</div>'+
        '<div class="user-guess '+gc+'">'+gm+'</div>'+
        '<div class="coin-pop">🪙 +'+COINS_PER_STEP+' מטבעות</div>'+
        '<div class="explanation">'+markupText(currentIssue.tf_explain)+'<br>'+srcLink+'</div>'+
      '</div>'+
      '<button class="bigbtn next" style="margin-top:14px" onclick="nextStep()">'+g("בוא","בואי")+' נראה מה קרה בכנסת ›</button>';
  }
  else if(currentStep===2){
    const isStance = currentIssue.mode==='stance';
    c.innerHTML = header +
      '<div class="bill-card">'+
        '<div class="bill-label'+(isStance?' stance':'')+'">'+(isStance?'💭 עמדות מוצהרות':'🏛️ הצעה אמיתית בכנסת')+'</div>'+
        '<div class="bill-title">'+currentIssue.bill_title+'</div>'+
        '<div class="bill-year">'+currentIssue.bill_date+'</div>'+
        '<div class="bill-summary">'+markupText(currentIssue.bill_summary)+'</div>'+
      '</div>'+
      '<div class="vote-prompt">איך '+g("היית מצביע","היית מצביעה")+'?</div>'+
      '<div class="vote-buttons">'+
        '<button class="vote-btn for" onclick="pickBill(\'for\')">🟢 בעד</button>'+
        '<button class="vote-btn against" onclick="pickBill(\'against\')">🔴 נגד</button>'+
        '<button class="vote-btn abstain" onclick="pickBill(\'abstain\')">⚪ '+g("נמנע","נמנעת")+'</button>'+
      '</div>';
  }
  else if(currentStep===3){
    renderScrollGuess(header);
  }
  else if(currentStep===4){
    renderEndScreen(header);
  }
}

// ===== Step interactions =====
function pickTF(ans){
  userTfAnswer=ans;
  if(!stepsAwarded.has(0)){awardCoins();stepsAwarded.add(0);}
  const tfCorrect = ans===currentIssue.tf_answer||currentIssue.tf_answer==='partial';
  trackEvent('tf_answered', {issue: currentIssue.id, topic: currentTopic.id, answer: ans, correct: tfCorrect});
  tfCorrect?sfxCorrect():sfxWrong();
  const card=document.getElementById('tfCard');
  const btns=document.querySelector('.tf-buttons');
  if(btns) btns.style.pointerEvents='none';
  // card.style.opacity==='0' means it was already swiped away — skip flip
  const alreadySwiped = card && card.style.opacity==='0';
  if(card && !alreadySwiped){
    card.classList.add('flipping');
    setTimeout(()=>nextStep(), 340);
  } else {
    setTimeout(()=>nextStep(), 80);
  }
}
function pickBill(v){ userBillVote=v; if(!stepsAwarded.has(2)){awardCoins();stepsAwarded.add(2);} trackEvent('bill_voted', {issue: currentIssue.id, topic: currentTopic.id, vote: v}); sfxTap(); nextStep(); }
function awardCoins(){ issueCoinsEarned += COINS_PER_STEP; totalCoins += COINS_PER_STEP; sfxCoin(); updateCoinDisplays(); saveProgress(); }
function updateCoinDisplays(){
  const ic=document.getElementById('issueCoins'); if(ic) ic.innerHTML='🪙 '+totalCoins;
  const hc=document.getElementById('coinChip'); if(hc) hc.innerHTML='🪙 '+totalCoins;
  const ac=document.getElementById('appBarCoins'); if(ac) ac.innerHTML='🪙 '+totalCoins;
}
function updateAppBar(){
  const av=document.getElementById('appBarAvatar'); if(av) av.innerHTML=getAvatarSvg();
  updateCoinDisplays();
}
function nextStep(){ currentStep++; renderIssueStep(); }

function completeIssue(){
  if(!progress[currentTopic.id]) progress[currentTopic.id] = {issues:{}};
  const rec = progress[currentTopic.id].issues[currentIssue.id] || {};
  if(!rec.completed){
    rec.completed = true;
    rec.coins = issueCoinsEarned;
    rec.completedAt = Date.now();
    progress[currentTopic.id].issues[currentIssue.id] = rec;
    trackEvent('issue_complete', {issue: currentIssue.id, topic: currentTopic.id, coins: issueCoinsEarned});
  }
  saveProgress();
}

// ===== End screen (map-return, lock tooltip) =====
function renderEndScreen(header){
  completeIssue();
  const c = document.getElementById('issueContent');
  const isTopicDone = topicIsDone(currentTopic.id);
  const tIssues = ISSUES.filter(i=>i.topic===currentTopic.id);
  const other = tIssues.find(i=>i.id!==currentIssue.id);
  const otherDone = other && issueIsDone(currentTopic.id, other.id);
  // core progress
  const coreIssues = ISSUES.filter(i=>i.core);
  const doneCore = coreIssues.filter(i=>issueIsDone(i.topic,i.id)).length;
  const totalCore = coreIssues.length;
  const allCoreDone = doneCore>=totalCore;
  praiseName();

  // Find next unfinished CORE issue (fast path to finish the map)
  let nextCore = null;
  for(const t of TOPICS){
    const ci = ISSUES.find(i=>i.topic===t.id && i.core && !issueIsDone(t.id,i.id));
    if(ci){ nextCore=ci; break; }
  }

  let primary = '';
  if(nextCore){
    const nt = TOPICS.find(t=>t.id===nextCore.topic);
    primary = '<button class="bigbtn next" onclick="startIssue(ISSUES.find(i=>i.id===\''+nextCore.id+'\'))">🔥 '+g("בוא","בואי")+' לסוגיה הבאה: '+nt.icon+' '+nt.label+'</button>';
  } else if(!otherDone && other){
    primary = '<button class="bigbtn next" onclick="startIssue(ISSUES.find(i=>i.id===\''+other.id+'\'))">🎁 סוגיית בונוס בנושא הזה</button>';
  }

  const celebrate = allCoreDone ? '<button class="bigbtn next" onclick="openCelebration()">🎊 סיימת את המפה — לחגיגה!</button>' : '';

  c.innerHTML = header +
    '<div class="end-card">'+
      '<div class="end-big">🎉</div>'+
      '<div class="end-title">'+g("כל הכבוד","כל הכבוד")+'!</div>'+
      '<div class="end-coins">🪙 +'+issueCoinsEarned+' מטבעות · סה״כ '+totalCoins+'</div>'+
      '<div class="end-progress"><b>'+doneCore+' מתוך '+totalCore+'</b> נושאים הושלמו</div>'+
      '<div class="end-bar"><i style="width:'+Math.round(doneCore/totalCore*100)+'%"></i></div>'+
    '</div>'+
    '<div class="end-actions">'+
      primary +
      celebrate +
      '<button class="bigbtn home" onclick="goHome()">🗺️ חזרה למפה</button>'+
    '</div>';
  sfxTap();
}
function lockTip(){
  openExplain('🔒 הרחבה נעולה', 'ההרחבה על הנושא — עם קישורים למקורות, פרוטוקולים ומאמרים — תיפתח אחרי ש'+g("תסיים","תסיימי")+' את <b>שתי הסוגיות</b> בנושא. '+g("נשאר","נשארת")+' '+g("לך","לך")+' רק עוד סוגיה אחת!', '🔓 איך פותחים?');
}
function showExpansion(){
  let body = 'בגרסה הסופית יופיע כאן הסבר מעמיק על '+currentTopic.label+', עם קישורים לפרוטוקולי הכנסת, מאמרים באתר המגדלור ומקורות נוספים.';
  if(currentIssue.source && currentIssue.source.url){
    body += '<br><br><a class="src-link" href="'+currentIssue.source.url+'" target="_blank" rel="noopener">🔗 מקור לדוגמה: '+currentIssue.source.name+'</a>';
  }
  body += '<br><br><i>(פרוטוטייפ — התוכן יורחב על ידי צוות המגדלור)</i>';
  openExplain('📚 הרחבה: '+currentTopic.label, body, '📚 המגדלור');
}

// ===== TF swipe =====
function setupTfSwipe(){
  const el = document.getElementById('tfCard'); if(!el) return;
  const tS = el.querySelector('.tf-stamp.true'), fS = el.querySelector('.tf-stamp.false');
  let sx=0,dx=0,drag=false;
  const down = e=>{ if(e.target.closest('.explain-word')||e.target.closest('.float-explain')) return; drag=true; sx=e.touches?e.touches[0].clientX:e.clientX; el.style.transition='none'; };
  const move = e=>{ if(!drag) return; const cx=e.touches?e.touches[0].clientX:e.clientX; dx=cx-sx; el.style.transform='translate('+dx+'px,0) rotate('+(dx/25)+'deg)'; const o=Math.min(Math.abs(dx)/110,1); tS.style.opacity=dx>0?o:0; fS.style.opacity=dx<0?o:0; };
  const up = ()=>{ if(!drag) return; drag=false; el.style.transition='transform .3s ease, opacity .3s';
    if(Math.abs(dx)>110){ el.style.transform='translate('+(dx>0?600:-600)+'px,-20px) rotate('+(dx>0?25:-25)+'deg)'; el.style.opacity=0; sfxWhoosh(); setTimeout(()=>pickTF(dx>0?'true':'false'),220); }
    else { el.style.transform=''; tS.style.opacity=0; fS.style.opacity=0; } dx=0; };
  el.addEventListener('mousedown',down); el.addEventListener('mousemove',move); el.addEventListener('mouseup',up); el.addEventListener('mouseleave',up);
  el.addEventListener('touchstart',down,{passive:true}); el.addEventListener('touchmove',move,{passive:true}); el.addEventListener('touchend',up);
}


// ===== Scroll-based guessing (social-feed style) =====
// Flow: player's own vote card first, then scroll card-by-card through MKs,
// guessing each, then a "reveal results" button opens a summary modal.
let scrollGuesses = {};   // polId -> 'for'/'against'/'abstain'
let scrollIdx = 0;        // how many MK cards revealed so far

function renderScrollGuess(header){
  scrollGuesses = {}; scrollIdx = 0;
  const c = document.getElementById('issueContent');
  const pv = userBillVote; // player's own vote from step 2
  const pvTxt = pv==='for'?'🟢 בעד':pv==='against'?'🔴 נגד':'⚪ נמנע';
  c.innerHTML = header +
    '<div class="feed" id="feed">'+
      '<div class="feed-you card-in">'+
        '<div class="feed-tag">איך שאת/ה הצבעת</div>'+
        '<div class="feed-you-vote">'+pvTxt+'</div>'+
        '<div class="feed-you-sub">'+g("עכשיו בוא נראה","עכשיו בואי נראה")+' איך הצביעו הח״כים האמיתיים 👇</div>'+
      '</div>'+
      '<div id="feedCards"></div>'+
    '</div>';
  showNextMk(); // reveal first MK card
}

function guessMk(idx, vote){
  const p = sampledPolitded[idx];
  if(!p || scrollGuesses[p.id]) return; // already answered or invalid
  scrollGuesses[p.id]=vote;
  const card=document.getElementById('mk-'+idx);
  if(card){
    card.querySelectorAll('.feed-btn').forEach(b=>b.classList.add('locked'));
    const cls = vote==='for'?'f':vote==='against'?'a':'n';
    const chosen=card.querySelector('.feed-btn.'+cls);
    if(chosen) chosen.classList.add('chosen');
    card.classList.add('answered');
  }
  sfxTap();
  scrollIdx = Math.max(scrollIdx, idx+1);
  setTimeout(showNextMk, 260);
}
function showNextMk(){
  const pols = sampledPolitded;
  if(scrollIdx >= pols.length){ renderRevealButton(); return; }
  // guard: don't create a card that already exists
  if(document.getElementById('mk-'+scrollIdx)) return;
  const p = pols[scrollIdx];
  const pol = DATA.politicians[p.id];
  const wrap = document.getElementById('feedCards');
  if(!wrap) return;
  const card = document.createElement('div');
  card.className='feed-mk card-in';
  card.id='mk-'+scrollIdx;
  card.innerHTML =
    '<div class="feed-mk-top">'+
      mkAvatar(pol)+
      '<div class="feed-mk-id"><div class="feed-mk-name">'+pol.name+'</div>'+
        '<div class="feed-mk-party">'+pol.party+'</div></div>'+
    '</div>'+
    '<div class="feed-q">מה '+g("לדעתך הוא/היא","לדעתך הוא/היא")+' '+g("הצביע","הצביע/ה")+'?</div>'+
    '<div class="feed-btns">'+
      '<button class="feed-btn f" onclick="guessMk('+scrollIdx+',\'for\')">✔ בעד</button>'+
      '<button class="feed-btn a" onclick="guessMk('+scrollIdx+',\'against\')">✖ נגד</button>'+
      '<button class="feed-btn n" onclick="guessMk('+scrollIdx+',\'abstain\')">➖ נמנע</button>'+
    '</div>';
  wrap.appendChild(card);
  setTimeout(()=>card.scrollIntoView({behavior:'smooth',block:'center'}),80);
}

function renderRevealButton(){
  const wrap=document.getElementById('feedCards');
  const b=document.createElement('div');
  b.className='feed-reveal-wrap card-in';
  b.innerHTML='<button class="reveal-btn big" onclick="openResultsModal()">🏛️ '+g("חשוף","חשפי")+' את תוצאות ההצבעה</button>';
  wrap.appendChild(b);
  setTimeout(()=>b.scrollIntoView({behavior:'smooth',block:'center'}),80);
}

function mkAvatar(pol){
  // Uses official Knesset photo when a URL base is configured; falls back to initials badge.
  if(window.MK_PHOTO_BASE && pol.mk_id){
    const url = window.MK_PHOTO_BASE.replace('{id}', pol.mk_id);
    return '<div class="feed-mk-photo"><img src="'+url+'" alt="'+pol.name+'" '+
           'onerror="this.parentNode.innerHTML=\''+mkInitials(pol)+'\'"></div>';
  }
  return mkInitials(pol);
}
function mkInitials(pol){
  const parts=pol.name.split(' ');
  const ini=(parts[0][0]||'')+(parts[1]?parts[1][0]:'');
  return '<div class="feed-mk-photo initials">'+ini+'</div>';
}

function openResultsModal(){
  // compute how player voted vs the law outcome + per-MK accuracy
  const pols = sampledPolitded;
  let correct=0;
  pols.forEach(p=>{ if(scrollGuesses[p.id]===p.vote) correct++; });
  // award coins per correct guess
  const gained = correct * COINS_PER_STEP;
  issueCoinsEarned += gained; totalCoins += gained; updateCoinDisplays(); saveProgress();
  trackEvent('mk_guess_result', {issue: currentIssue.id, topic: currentTopic.id, score: correct, total: pols.length});
  if(correct>0) sfxCoin();

  // law outcome + player comparison
  const tally = currentIssue.knesset_url ? billOutcome() : null;
  const pv=userBillVote;
  const rows = pols.map(p=>{
    const pol=DATA.politicians[p.id];
    const guess=scrollGuesses[p.id];
    const ok = guess===p.vote;
    const vt=v=>v==='for'?'בעד':v==='against'?'נגד':'נמנע';
    return '<tr class="'+(ok?'ok':'no')+'">'+
      '<td class="rmk">'+pol.name+'</td>'+
      '<td>'+vt(guess||'—')+'</td>'+
      '<td><b>'+vt(p.vote)+'</b></td>'+
      '<td>'+(ok?'✅':'❌')+'</td>'+
    '</tr>';
  }).join('');

  // player-vs-knesset banner
  let pvBanner='';
  if(tally){
    const passed = tally.for>tall_against(tally);
    const playerMatch = (pv==='for'&&passed)||(pv==='against'&&!passed);
    pvBanner =
      '<div class="pv-compare '+(playerMatch?'match':'diff')+'">'+
        '<div>איך שהצבעת: <b>'+(pv==='for'?'בעד':pv==='against'?'נגד':'נמנע')+'</b></div>'+
        '<div>הכנסת: <b>'+(passed?'העבירה':'דחתה')+'</b> את ההצעה ('+tally.for+'-'+tally.against+')</div>'+
        '<div class="pv-verdict">'+(playerMatch?'🤝 הצבעת כמו רוב הכנסת':'🙃 הצבעת אחרת מרוב הכנסת')+'</div>'+
      '</div>';
  }

  const modal=document.getElementById('resultsModal');
  modal.querySelector('.rm-body').innerHTML =
    '<div class="rm-title">🏛️ תוצאות ההצבעה</div>'+
    pvBanner+
    '<div class="rm-score">ניחשת נכון <b>'+correct+'</b> מתוך '+pols.length+' · +'+gained+' 🪙</div>'+
    '<table class="rm-table"><tr><th>ח״כ</th><th>הניחוש שלך</th><th>הצביע/ה</th><th></th></tr>'+rows+'</table>'+
    '<button class="bigbtn next" onclick="closeResultsModal()">'+g("המשך","המשיכי")+' ←</button>';
  modal.classList.add('open');
  spawnConfetti();
}

function tall_against(t){ return t.against; }
function billOutcome(){
  // from stored data if available
  if(currentIssue._tally) return currentIssue._tally;
  return null;
}

function closeResultsModal(){
  document.getElementById('resultsModal').classList.remove('open');
  currentStep=4; renderIssueStep();
}


// ===== Drag politicians =====
function renderDragStep(header){
  const c = document.getElementById('issueContent');
  c.innerHTML = header +
    '<div class="drag-intro">👇 '+g("גרור","גררי")+' כל '+g("פוליטיקאי","פוליטיקאי/ת")+' לעמודה — לפי מה שאת/ה '+g("חושב","חושבת")+' שהוא/היא '+g("הצביע","הצביעה")+'</div>'+
    '<div class="drag-area">'+
      '<div class="pol-pool" id="polPool" data-col="pool"></div>'+
      '<div class="drop-columns">'+
        '<div class="drop-col for" data-col="for"><div class="drop-col-hdr">🟢 בעד</div></div>'+
        '<div class="drop-col against" data-col="against"><div class="drop-col-hdr">🔴 נגד</div></div>'+
        '<div class="drop-col abstain" data-col="abstain"><div class="drop-col-hdr">⚪ נמנע</div></div>'+
      '</div>'+
      '<button class="reveal-btn" id="revealBtn" onclick="revealVotes()" disabled>גילוי — איך הם '+g("הצביעו","הצביעו")+' באמת?</button>'+
      '<div id="scoreMsg"></div>'+
      '<div id="dragActions"></div>'+
    '</div>';
  renderPolCards(); updateRevealBtn();
}
function renderPolCards(){
  ['polPool','for','against','abstain'].forEach(col=>{
    const el = col==='polPool'?document.getElementById('polPool'):document.querySelector('.drop-col[data-col="'+col+'"]');
    if(col==='polPool') el.innerHTML='';
    else Array.from(el.children).forEach(ch=>{ if(!ch.classList.contains('drop-col-hdr')) ch.remove(); });
  });
  sampledPolitded.forEach(pol=>{
    const data = POLS[pol.id];
    const col = dragState[pol.id];
    const card = createPolCard(pol.id, data);
    (col==='pool'?document.getElementById('polPool'):document.querySelector('.drop-col[data-col="'+col+'"]')).appendChild(card);
  });
  const pool = document.getElementById('polPool');
  pool.classList.toggle('empty', pool.children.length===0);
}
function createPolCard(id, data){
  const card = document.createElement('div');
  card.className='pol-card'; card.dataset.polId=id;
  card.innerHTML = '<div class="pol-avatar">'+data.avatar+'</div><div class="pol-info"><div class="pn">'+data.name+'</div><div class="pp">'+data.party+'</div><div class="note"></div><div class="basis-tag"></div></div>';
  setupCardDrag(card);
  return card;
}
// single delegated listeners
let activeDragCard=null, dragGhost=null;
function onCardDragStart(card,e){
  if(dragRevealed) return;
  activeDragCard=card; const t=e.touches?e.touches[0]:e;
  card.classList.add('dragging');
  dragGhost=card.cloneNode(true);
  Object.assign(dragGhost.style,{position:'fixed',pointerEvents:'none',zIndex:'1000',opacity:'0.9',transform:'scale(1.1)',boxShadow:'3px 4px 0 var(--ink)'});
  const r=card.getBoundingClientRect();
  dragGhost.style.width=r.width+'px'; dragGhost.style.left=r.left+'px'; dragGhost.style.top=r.top+'px';
  document.body.appendChild(dragGhost); e.preventDefault();
}
function onCardDragMove(e){
  if(!activeDragCard) return; const t=e.touches?e.touches[0]:e;
  if(dragGhost){ const r=activeDragCard.getBoundingClientRect(); dragGhost.style.left=(t.clientX-r.width/2)+'px'; dragGhost.style.top=(t.clientY-r.height/2)+'px'; }
  const target=document.elementFromPoint(t.clientX,t.clientY);
  document.querySelectorAll('.drop-col, .pol-pool').forEach(c=>c.classList.remove('over'));
  const col=target?target.closest('.drop-col, .pol-pool'):null; if(col) col.classList.add('over');
  e.preventDefault();
}
function onCardDragEnd(e){
  if(!activeDragCard) return; const card=activeDragCard; activeDragCard=null;
  card.classList.remove('dragging'); if(dragGhost){ dragGhost.remove(); dragGhost=null; }
  document.querySelectorAll('.drop-col, .pol-pool').forEach(c=>c.classList.remove('over'));
  const t=e.changedTouches?e.changedTouches[0]:e;
  const target=document.elementFromPoint(t.clientX,t.clientY);
  const col=target?target.closest('.drop-col, .pol-pool'):null;
  if(col){ const cn=col.classList.contains('pol-pool')?'pool':col.dataset.col; dragState[card.dataset.polId]=cn; sfxTap(); renderPolCards(); updateRevealBtn(); }
}
window.addEventListener('mousemove',onCardDragMove); window.addEventListener('mouseup',onCardDragEnd);
window.addEventListener('touchmove',onCardDragMove,{passive:false}); window.addEventListener('touchend',onCardDragEnd);
function setupCardDrag(card){
  card.addEventListener('mousedown',e=>onCardDragStart(card,e));
  card.addEventListener('touchstart',e=>onCardDragStart(card,e),{passive:false});
}
function updateRevealBtn(){
  const btn=document.getElementById('revealBtn'); if(!btn) return;
  const all = sampledPolitded.every(p=>dragState[p.id]!=='pool');
  btn.disabled=!all;
  btn.textContent = all ? ('גילוי — איך הם '+g("הצביעו","הצביעו")+' באמת?') : ('גרור את כולם קודם...');
}
function revealVotes(){
  dragRevealed=true; let correct=0;
  sampledPolitded.forEach(pol=>{
    const guess=dragState[pol.id], real=pol.vote;
    const card=document.querySelector('.pol-card[data-pol-id="'+pol.id+'"]'); if(!card) return;
    const curCol=card.parentElement, rightCol=document.querySelector('.drop-col[data-col="'+real+'"]');
    const ok = guess===real; if(ok) correct++;
    card.querySelector('.note').textContent = pol.note;
    const bt = card.querySelector('.basis-tag');
    bt.textContent = pol.basis==='doc' ? '📌 מתועד' : '📊 לפי הצבעת הסיעה';
    card.classList.add('revealed');
    if(!ok && rightCol && curCol!==rightCol){ setTimeout(()=>{ rightCol.appendChild(card); card.classList.add('wrong'); },300); }
    else card.classList.add('correct');
  });
  const total=sampledPolitded.length;
  correct===total?sfxCorrect():sfxTap();
  // coins for drag step
  awardCoins();
  const msg=document.getElementById('scoreMsg');
  let txt = correct===total?('🏆 מושלם! '+correct+'/'+total+' — הכרת כל אחד!') : correct>=total/2?('👍 יפה! '+correct+'/'+total+' נכונים'):('📚 '+correct+'/'+total+' — '+g("למדת","למדת")+' משהו חדש');
  msg.innerHTML='<div class="score-msg">'+txt+'<br><span style="font-size:12px">🪙 +'+COINS_PER_STEP+' מטבעות</span></div>';
  document.getElementById('dragActions').innerHTML='<button class="bigbtn next" style="margin-top:12px" onclick="nextStep()">'+g("בוא","בואי")+' '+g("תמשיך","תמשיכי")+' ›</button>';
  document.getElementById('revealBtn').style.display='none';
}

// ===== Celebration & share =====
function openCelebration(){
  document.getElementById('celBudget').textContent = '🪙 '+totalCoins+' מטבעות';
  trackEvent('map_complete', {total_coins: totalCoins});
  show('celebrate');
  sfxCelebrate();
  spawnConfetti();
}
function spawnConfetti(){
  const colors=['#2b4cff','#ff5240','#ffd23f','#22c98e','#b06bff','#ff6b9d'];
  const app=document.querySelector('.app');
  for(let i=0;i<60;i++){
    const p=document.createElement('div'); p.className='confetti-piece';
    p.style.left=Math.random()*100+'%';
    p.style.background=colors[Math.floor(Math.random()*colors.length)];
    p.style.animationDuration=(2+Math.random()*2)+'s';
    p.style.animationDelay=(Math.random()*0.6)+'s';
    app.appendChild(p);
    setTimeout(()=>p.remove(),4600);
  }
}
// Basic profanity/racism filter (Hebrew + common). Prototype-level.
const BLOCKLIST = ['כושי','ערבוש','מוות לערבים','מוות ליהודים','נאצי','שרמוטה','זונה','בן זונה','מניאק','הומו','נאצים','תמותו'];
function containsBad(txt){
  const norm = (txt||'').replace(/[\s\u0591-\u05C7]/g,'').toLowerCase();
  return BLOCKLIST.some(w=> norm.includes(w.replace(/\s/g,'')));
}
function onShareInput(){
  const inp=document.getElementById('shareInput');
  document.getElementById('shareCount').textContent = inp.value.length+'/100';
  const warn=document.getElementById('shareWarn');
  warn.style.display = containsBad(inp.value) ? 'block' : 'none';
}
function _shareText(){
  const inp=document.getElementById('shareInput');
  const txt=(inp?inp.value.trim():'');
  if(containsBad(txt)){ const w=document.getElementById('shareWarn'); if(w) w.style.display='block'; sfxWrong(); return null; }
  const cause = txt || g("מה שחשוב לי","מה שחשוב לי");
  return 'שיחקתי "הח״כ ה-121" 🏛️ צברתי '+totalCoins+' מטבעות, ובחרתי: '+cause+' 💪 #המגדלור';
}
function shareTo(platform){
  const shareText = _shareText(); if(!shareText) return;
  const encoded = encodeURIComponent(shareText);
  const urls = {
    whatsapp:'https://wa.me/?text='+encoded,
    telegram:'https://t.me/share/url?text='+encoded,
    x:'https://twitter.com/intent/tweet?text='+encoded,
    facebook:'https://www.facebook.com/sharer/sharer.php?quote='+encoded
  };
  sfxTap();
  if(urls[platform]) window.open(urls[platform],'_blank');
  trackEvent('share_'+platform,{coins:totalCoins});
}
function copyShare(){
  const shareText = _shareText(); if(!shareText) return;
  sfxTap();
  try{ navigator.clipboard.writeText(shareText); callout(g("הועתק! הדבק ברשת 📋","הועתק! הדביקי ברשת 📋")); }
  catch(e){ openExplain('📤 שיתוף',shareText.replace(/\n/g,'<br>'),'📋 העתיקו והדביקו'); }
  trackEvent('share_copy',{coins:totalCoins});
}
async function doShare(){
  const txt=_shareText(); if(!txt) return;
  if(navigator.share){ try{ await navigator.share({text:txt}); return; }catch(e){} }
  copyShare();
}
function reportContent(){
  openExplain('🚩 דיווח על תוכן', 'תודה. בגרסה הסופית, דיווח על תוכן פוגעני יישלח אוטומטית לצוות המגדלור לבדיקה.<br><br><i>(פרוטוטייפ — מנגנון הדיווח יחובר למערכת שלכם)</i>', '🚩 מנגנון דיווח');
}

// ===== Analytics (GA4 + console fallback) =====
function trackEvent(name, params){
  if(window.gtag){ try{ gtag('event', name, params||{}); }catch(e){} }
  try{ console.log('[analytics]', name, params||{}); }catch(e){}
}
function openFeedbackForm(){
  // Placeholder — replace with your Google Form URL
  const FORM_URL = ''; // TODO: המגדלור — הכניסו כאן קישור לטופס גוגל
  if(FORM_URL){ window.open(FORM_URL,'_blank'); }
  else { openExplain('💬 משוב', 'כאן ייפתח טופס המשוב שלכם (Google Form).<br><br><b>למגדלור:</b> החליפו את המשתנה FORM_URL בקוד בקישור לטופס גוגל שלכם, וכל לחיצה תוביl אליו.', '💬 טופס משוב'); }
}

// ===== Init =====
(function init(){
  loadMute(); loadProgress();
  if(navigator.share) document.body.classList.add('has-native-share');
  document.querySelectorAll('.mute-btn').forEach(b=> b.textContent = muted?'🔇':'🔊');
  trackEvent('app_open', {});
  // self-tests
  const tests = [
    ['8 topics', TOPICS.length===8],
    ['16 issues', ISSUES.length===16],
    ['every topic has 2 issues', TOPICS.every(t=>ISSUES.filter(i=>i.topic===t.id).length===2)],
    ['every pol ref exists', ISSUES.every(i=>i.politicians.every(p=>POLS[p.id]))],
    ['every issue has key pol', ISSUES.every(i=>i.politicians.some(p=>p.key))],
    ['every issue has source', ISSUES.every(i=>i.source!==undefined)],
    ['glossary >15', Object.keys(GLOSSARY).length>15],
    ['8 avatars', AVATARS.length===8],
    ['localStorage', (function(){try{localStorage.setItem('__t','1');localStorage.removeItem('__t');return true}catch(e){return false}})()],
  ];
  let ok=true; tests.forEach(([n,v])=>{ if(!v) ok=false; console.log((v?'✓':'✗')+' '+n); });
  console.log(ok?'%c ALL TESTS PASSED ':'%c TESTS FAILED ','background:#22c98e;color:#fff;font-weight:bold;padding:2px 8px');
})();

