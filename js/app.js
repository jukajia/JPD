const $ = id => document.getElementById(id);

const CRITERIA = [
  {id:1,name:'ATENDIMENTO AO CLIENTE'},
  {id:2,name:'INICIATIVA A REPOSIÇÃO (PROCURA O QUE FAZER)'},
  {id:3,name:'INICIATIVA DE ORGANIZAÇÃO (INICIATIVA EM FAZER LAYOUT)'},
  {id:4,name:'TRABALHO EM EQUIPE'},
  {id:5,name:'INOVAÇÕES (IDEIAS NOVAS)'},
  {id:6,name:'AGILIDADE'},
  {id:7,name:'CUIDADOSO NO DESEMPENHO DA FUNÇÃO (SE DANIFICA PRODUTO)'},
  {id:8,name:'HONESTIDADE'},
  {id:9,name:'RESPEITO COM OS DEMAIS COLEGAS'},
  {id:10,name:'OBEDIENTE'},
  {id:11,name:'ATENTO (MANTÉM-SE FOCADO NA ATIVIDADE)'},
  {id:12,name:'SEGURANÇA EM REPASSAR O QUE SABE PARA OS COLEGAS'},
  {id:13,name:'SE PREOCUPA COM A LIMPEZA DOS PRODUTOS E AS SESSÕES'},
  {id:14,name:'SE PREOCUPA COM O P.V.P.S'},
  {id:15,name:'ORGANIZAÇÃO DO SEU DIA DE TRABALHO (CONSEGUE SE ORGANIZAR PARA FAZER TODO O TRABALHO DELEGADO DURANTE O DIA)'},
  {id:16,name:'DOMÍNIO DA FUNÇÃO'},
  {id:17,name:'CUIDADOSO COM PREÇOS NA SESSÃO'},
  {id:18,name:'RUPTURAS (MANTÉM A SESSÃO SEMPRE CHEIA)'},
  {id:19,name:'CONHECIMENTO DOS PRODUTOS'},
  {id:20,name:'PONTUALIDADE NO HORÁRIO'},
  {id:21,name:'CONSEGUE SE MANTER CALMO EM SITUAÇÕES DE ESTRESSE'}
];

const state = {employee:{},answers:{}};

function escapeHtml(value){
  return String(value ?? '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
}

function switchView(id){
  document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
  $(id).classList.add('active');
  window.scrollTo({top:0,behavior:'smooth'});
}

function renderCriteria(){
  $('criteria').innerHTML = CRITERIA.map(item => `
    <article class="criterion" id="criterion-${item.id}">
      <div class="ctop"><span class="num">${String(item.id).padStart(2,'0')}</span><div class="cname">${escapeHtml(item.name)}</div></div>
      <div class="choices">
        <button class="choice medium" data-id="${item.id}" data-value="medium">MÉDIO</button>
        <button class="choice good" data-id="${item.id}" data-value="good">BOM</button>
        <button class="choice great" data-id="${item.id}" data-value="great">ÓTIMO</button>
      </div>
    </article>
  `).join('');

  document.querySelectorAll('.choice').forEach(button => {
    button.addEventListener('click', () => answer(Number(button.dataset.id), button.dataset.value));
  });
}

function startEvaluation(){
  const name = $('name').value.trim();
  if(!name){showToast('Informe o nome do colaborador.');$('name').focus();return;}
  state.employee = {
    name,
    store:$('store').value.trim(),
    sector:$('sector').value.trim(),
    evaluator:$('evaluator').value.trim(),
    date:$('date').value
  };
  state.answers = {};
  $('personName').textContent = name;
  $('avatar').textContent = name.charAt(0).toUpperCase();
  $('personMeta').textContent = [state.employee.store,state.employee.sector].filter(Boolean).join(' • ') || 'Avaliação profissional';
  renderCriteria();
  updateCounters();
  switchView('evaluation');
}

function answer(id,value){
  state.answers[id] = value;
  const card = $('criterion-'+id);
  card.classList.add('answered');
  card.querySelectorAll('.choice').forEach(button => button.classList.toggle('selected',button.dataset.value===value));
  updateCounters();
}

function getCounts(){
  const counts={medium:0,good:0,great:0};
  Object.values(state.answers).forEach(value => counts[value]++);
  return counts;
}

function updateCounters(){
  const counts=getCounts();
  const answered=Object.keys(state.answers).length;
  const level=classify(counts.medium,counts.good,counts.great);
  $('cm').textContent=counts.medium;$('cb').textContent=counts.good;$('co').textContent=counts.great;
  $('prog').textContent=`${answered} / ${CRITERIA.length}`;
  $('bar').style.width=`${(answered/CRITERIA.length)*100}%`;
  $('level').textContent=answered?level:'—';
  $('level').style.color=level==='JÚNIOR'?'var(--red)':'var(--irani)';
  $('levelMsg').textContent=answered?message(level,counts.medium,counts.good,counts.great):'Responda os critérios para visualizar.';
}

function showResult(){
  const counts=getCounts();
  const answered=Object.keys(state.answers).length;
  if(answered<CRITERIA.length){
    const missing=CRITERIA.length-answered;
    showToast(`Faltam ${missing} competência(s).`);
    const firstMissing=CRITERIA.find(item=>!state.answers[item.id]);
    if(firstMissing)$('criterion-'+firstMissing.id).scrollIntoView({behavior:'smooth',block:'center'});
    return;
  }

  const level=classify(counts.medium,counts.good,counts.great);
  const score=((counts.medium*50+counts.good*75+counts.great*100)/CRITERIA.length);
  $('rname').textContent=state.employee.name;
  $('rmeta').textContent=[state.employee.store,state.employee.sector,formatDate(state.employee.date)].filter(Boolean).join(' • ');
  $('badge').textContent=level;
  $('badge').className='badge '+levelClass(level);
  $('percent').textContent=score.toFixed(1).replace('.',',')+'%';
  $('rm').textContent=counts.medium;$('rb').textContent=counts.good;$('ro').textContent=counts.great;
  $('rtitle').textContent=level==='SÊNIOR'?'Referência de desempenho':level==='PLENO'?'Bom nível, com espaço para evolução':'Momento de desenvolvimento';
  $('rmsg').textContent=message(level,counts.medium,counts.good,counts.great);

  const development=CRITERIA.filter(item=>state.answers[item.id]==='medium');
  $('dev').innerHTML=development.length?'<b>🎯 Pontos de desenvolvimento</b><br>'+development.map(item=>'• '+escapeHtml(item.name)).join('<br>'):'<b>✓ Nenhum Médio.</b><br>O requisito de ausência de Médio para Sênior foi atendido.';
  $('resultList').innerHTML=CRITERIA.map(item=>{
    const value=state.answers[item.id];
    const label=value==='medium'?'MÉDIO':value==='good'?'BOM':'ÓTIMO';
    return `<div class="result-row"><div class="result-name">${String(item.id).padStart(2,'0')} — ${escapeHtml(item.name)}</div><span class="pill ${value}">${label}</span></div>`;
  }).join('');
  switchView('result');
}

function resetEvaluation(){
  if(!confirm('Iniciar nova avaliação? Os dados atuais serão apagados.'))return;
  state.answers={};
  ['name','store','sector','evaluator'].forEach(id=>$(id).value='');
  $('date').value=new Date().toISOString().slice(0,10);
  switchView('start');
}

function formatDate(value){if(!value)return '';const parts=value.split('-');return `${parts[2]}/${parts[1]}/${parts[0]}`}
function showToast(text){const toast=$('toast');toast.textContent=text;toast.classList.add('show');clearTimeout(window.__toastTimer);window.__toastTimer=setTimeout(()=>toast.classList.remove('show'),2400)}

function exportPNG(){
  const counts=getCounts();
  const level=classify(counts.medium,counts.good,counts.great);
  const score=((counts.medium*50+counts.good*75+counts.great*100)/CRITERIA.length).toFixed(1).replace('.',',');
  const width=1400,height=1700;
  const rows=CRITERIA.map((item,index)=>{
    const y=410+index*55;const value=state.answers[item.id];
    const label=value==='medium'?'MÉDIO':value==='good'?'BOM':'ÓTIMO';
    const color=value==='medium'?'#c77a00':value==='good'?'#2677d9':'#269052';
    return `<text x="80" y="${y}" font-family="Poppins,Arial,sans-serif" font-size="21" fill="#17231b">${String(index+1).padStart(2,'0')} — ${escapeHtml(item.name)}</text><text x="1300" y="${y}" text-anchor="end" font-family="Poppins,Arial,sans-serif" font-size="16" font-weight="700" fill="${color}">${label}</text>`;
  }).join('');
  const levelColor=level==='SÊNIOR'?'#269052':level==='JÚNIOR'?'#ff0031':'#269052';
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}">
    <rect width="100%" height="100%" fill="#f6f9f7"/>
    <rect x="40" y="35" width="1320" height="1630" rx="28" fill="white" stroke="#dfe9e2"/>
    <text x="80" y="100" font-family="Poppins,Arial,sans-serif" font-size="20" font-weight="700" fill="#269052">JPS V2</text>
    <text x="80" y="150" font-family="Poppins,Arial,sans-serif" font-size="38" font-weight="800" fill="#17231b">Jornada de Performance e Desenvolvimento</text>
    <text x="80" y="215" font-family="Poppins,Arial,sans-serif" font-size="30" font-weight="800" fill="#17231b">${escapeHtml(state.employee.name)}</text>
    <text x="80" y="250" font-family="Poppins,Arial,sans-serif" font-size="17" fill="#69766e">${escapeHtml([state.employee.store,state.employee.sector,state.employee.evaluator].filter(Boolean).join(' • '))}</text>
    <text x="1080" y="230" font-family="Poppins,Arial,sans-serif" font-size="28" font-weight="800" fill="${levelColor}">${level}</text>
    <text x="80" y="320" font-family="Poppins,Arial,sans-serif" font-size="17" fill="#91a097">DESEMPENHO GERAL</text>
    <text x="80" y="360" font-family="Poppins,Arial,sans-serif" font-size="34" font-weight="800" fill="#269052">${score}%</text>
    ${rows}
    <text x="80" y="1585" font-family="Poppins,Arial,sans-serif" font-size="15" fill="#69766e">Avaliador: ${escapeHtml(state.employee.evaluator||'________________________________')}    Data: ${escapeHtml(formatDate(state.employee.date)||'____/____/______')}</text>
  </svg>`;
  const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));
  const image=new Image();
  image.onload=()=>{
    const canvas=document.createElement('canvas');canvas.width=width*1.3;canvas.height=height*1.3;
    const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0,canvas.width,canvas.height);URL.revokeObjectURL(url);
    const link=document.createElement('a');link.download='JPS_'+state.employee.name.replace(/[^a-z0-9]/gi,'_')+'.png';link.href=canvas.toDataURL('image/png');link.click();
  };
  image.onerror=()=>{URL.revokeObjectURL(url);showToast('Não foi possível gerar a imagem. Use Imprimir / Salvar PDF.');};
  image.src=url;
}

document.addEventListener('DOMContentLoaded',()=>{
  $('date').value=new Date().toISOString().slice(0,10);
  $('startBtn').addEventListener('click',startEvaluation);
  $('finish').addEventListener('click',showResult);
  $('edit').addEventListener('click',()=>switchView('evaluation'));
  $('print').addEventListener('click',()=>window.print());
  $('printTop').addEventListener('click',()=>window.print());
  $('png').addEventListener('click',exportPNG);
  $('new').addEventListener('click',resetEvaluation);
  $('newTop').addEventListener('click',resetEvaluation);
});
