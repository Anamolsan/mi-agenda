(function(){
'use strict';
var KEYS={tasks:'agenda_tasks',notes:'agenda_notes',events:'agenda_events',contacts:'agenda_contacts',reminders:'agenda_reminders',diary:'agenda_diary',theme:'agenda_theme',accent:'agenda_accent'};
function load(k){try{return JSON.parse(localStorage.getItem(k))||[]}catch(e){return[]}}
function save(k,d){localStorage.setItem(k,JSON.stringify(d))}

var state={tasks:load(KEYS.tasks),notes:load(KEYS.notes),events:load(KEYS.events),contacts:load(KEYS.contacts),reminders:load(KEYS.reminders),diary:load(KEYS.diary),activeSection:'secTareas',editingId:null,calYear:new Date().getFullYear(),calMonth:new Date().getMonth(),calSelectedDate:todayStr(),diaryMood:0,diaryRatings:{energy:0,sleep:0,anxiety:0,stress:0,motivation:0},diaryActiveTags:[]};

function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function esc(s){var d=document.createElement('div');d.textContent=s;return d.innerHTML}
function todayStr(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function dateStr(date){return date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0')}
function fmtShort(s){if(!s)return'';var p=s.split('-');return new Date(+p[0],+p[1]-1,+p[2]).toLocaleDateString('es-ES',{day:'numeric',month:'short'})}
function fmtLong(s){if(!s)return'';var p=s.split('-');return new Date(+p[0],+p[1]-1,+p[2]).toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'})}
function isOverdue(ds,ts){if(!ds)return false;return new Date()>new Date(ds+(ts?'T'+ts:'T23:59:59'))}
function pWeight(p){return{alta:3,media:2,baja:1}[p]||0}

var AVATAR_C=['#748ffc','#ff6b6b','#51cf66','#fcc419','#cc5de8','#22b8cf','#f06595','#ff922b'];
function avColor(n){var h=0;for(var i=0;i<n.length;i++)h=n.charCodeAt(i)+((h<<5)-h);return AVATAR_C[Math.abs(h)%AVATAR_C.length]}
function initials(n){var p=n.trim().split(/\s+/);return p.length>1?(p[0][0]+p[p.length-1][0]).toUpperCase():p[0].substring(0,2).toUpperCase()}

var MOOD_F=['','\u{1F622}','\u{1F615}','\u{1F610}','\u{1F642}','\u{1F604}'];
var MOOD_C=['','#ff6b6b','#ffa94d','#fcc419','#a9e34b','#51cf66'];
var REP_L={daily:'Cada dia',weekly:'Cada semana',monthly:'Cada mes'};
var WD=['L','M','X','J','V','S','D'];
var MO=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
var BAR_C={energy:'#fcc419',sleep:'#cc5de8',anxiety:'#ff6b6b',stress:'#f06595',motivation:'#51cf66'};
var RAT_L={energy:'Energia',sleep:'Sueno',anxiety:'Ansiedad',stress:'Estres',motivation:'Motivacion'};
var PRI_C={alta:'#ff6b6b',media:'#fcc419',baja:'#51cf66'};

var $=function(id){return document.getElementById(id)};
var greeting=$('greeting'),headerDate=$('headerDate');
var sections={secTareas:$('secTareas'),secNotas:$('secNotas'),secCalendario:$('secCalendario'),secContactos:$('secContactos'),secRecordatorios:$('secRecordatorios'),secDiario:$('secDiario')};
var taskList=$('taskList'),emptyTasks=$('emptyTasks'),emptyTasksText=$('emptyTasksText');
var searchTasks=$('searchTasks'),filterStatus=$('filterStatus'),filterPriority=$('filterPriority'),sortTasks=$('sortTasks');
var modalTask=$('modalTask'),modalTaskTitle=$('modalTaskTitle'),formTask=$('formTask');
var taskTitle=$('taskTitle'),taskDesc=$('taskDesc'),taskPriority=$('taskPriority'),taskCategory=$('taskCategory'),taskDueDate=$('taskDueDate'),taskDueTime=$('taskDueTime'),taskCatList=$('taskCatList');
var notesGrid=$('notesGrid'),emptyNotes=$('emptyNotes'),searchNotes=$('searchNotes');
var modalNote=$('modalNote'),modalNoteTitle=$('modalNoteTitle'),formNote=$('formNote');
var noteTitle=$('noteTitle'),noteContent=$('noteContent'),noteColorPicker=$('noteColorPicker');
var calTitle=$('calTitle'),calWeekdays=$('calWeekdays'),calGrid=$('calGrid');
var calPrev=$('calPrev'),calNext=$('calNext'),calDayTitle=$('calDayTitle');
var calDayItems=$('calDayItems'),emptyDayItems=$('emptyDayItems');
var modalEvent=$('modalEvent'),modalEventTitle=$('modalEventTitle'),formEvent=$('formEvent');
var eventTitle=$('eventTitle'),eventDate=$('eventDate'),eventStart=$('eventStart'),eventEnd=$('eventEnd'),eventNotes=$('eventNotes'),eventColorPicker=$('eventColorPicker');
var contactList=$('contactList'),emptyContacts=$('emptyContacts'),searchContacts=$('searchContacts');
var modalContact=$('modalContact'),modalContactTitle=$('modalContactTitle'),formContact=$('formContact');
var contactName=$('contactName'),contactPhone=$('contactPhone'),contactEmail=$('contactEmail'),contactAddress=$('contactAddress'),contactNotes=$('contactNotes');
var reminderList=$('reminderList'),emptyReminders=$('emptyReminders'),filterReminders=$('filterReminders');
var modalReminder=$('modalReminder'),modalReminderTitle=$('modalReminderTitle'),formReminder=$('formReminder');
var reminderTitle=$('reminderTitle'),reminderDate=$('reminderDate'),reminderTime=$('reminderTime'),reminderRepeat=$('reminderRepeat'),reminderNotes=$('reminderNotes');
var moodFaces=$('moodFaces'),diaryTags=$('diaryTags'),diaryNotesEl=$('diaryNotes'),btnSaveDiary=$('btnSaveDiary');
var diaryWeek=$('diaryWeek'),diaryAverages=$('diaryAverages'),diaryHistory=$('diaryHistory'),emptyDiary=$('emptyDiary'),diarySummary=$('diarySummary');
var settingsBtn=$('settingsBtn'),settingsPanel=$('settingsPanel'),themeToggle=$('themeToggle'),accentPicker=$('accentPicker');
var fab=$('fab'),confirmOverlay=$('confirmOverlay'),confirmText=$('confirmText'),confirmYes=$('confirmYes'),confirmNo=$('confirmNo'),confirmCb=null;

// SETTINGS
function initSettings(){
  var t=localStorage.getItem(KEYS.theme)||'light';
  var a=localStorage.getItem(KEYS.accent)||'#748ffc';
  applyTheme(t);applyAccent(a);
}
function applyTheme(t){
  document.documentElement.setAttribute('data-theme',t);
  localStorage.setItem(KEYS.theme,t);
  themeToggle.querySelectorAll('.theme-opt').forEach(function(b){b.classList.toggle('active',b.dataset.theme===t)});
}
function applyAccent(c){
  document.documentElement.style.setProperty('--primary',c);
  localStorage.setItem(KEYS.accent,c);
  accentPicker.querySelectorAll('.accent-dot').forEach(function(d){d.classList.toggle('active',d.dataset.accent===c)});
}
settingsBtn.addEventListener('click',function(){settingsPanel.hidden=!settingsPanel.hidden});
themeToggle.addEventListener('click',function(e){var b=e.target.closest('.theme-opt');if(b)applyTheme(b.dataset.theme)});
accentPicker.addEventListener('click',function(e){var d=e.target.closest('.accent-dot');if(d)applyAccent(d.dataset.accent)});
document.addEventListener('click',function(e){if(!settingsPanel.hidden&&!settingsPanel.contains(e.target)&&e.target!==settingsBtn&&!settingsBtn.contains(e.target))settingsPanel.hidden=true});

// GREETING
function updateGreeting(){
  var h=new Date().getHours();
  greeting.textContent=h<12?'Buenos dias':h<20?'Buenas tardes':'Buenas noches';
  headerDate.textContent=new Date().toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
}

// NAV
var navBtns=document.querySelectorAll('.nav-btn');
function switchSection(id){
  state.activeSection=id;
  Object.keys(sections).forEach(function(k){sections[k].hidden=k!==id});
  navBtns.forEach(function(b){b.classList.toggle('active',b.dataset.section===id)});
  fab.classList.toggle('fab-hidden',id==='secDiario');
}
navBtns.forEach(function(b){b.addEventListener('click',function(){switchSection(b.dataset.section)})});

// MODALS
function openModal(el){el.hidden=false}
function closeModal(el){el.hidden=true;state.editingId=null}
document.querySelectorAll('.modal-overlay').forEach(function(ov){ov.addEventListener('click',function(e){if(e.target===ov)closeModal(ov)})});
document.querySelectorAll('[data-close]').forEach(function(b){b.addEventListener('click',function(){closeModal($(b.dataset.close))})});
document.addEventListener('keydown',function(e){if(e.key==='Escape'){if(!confirmOverlay.hidden)closeModal(confirmOverlay);else document.querySelectorAll('.modal-overlay:not([hidden])').forEach(function(m){closeModal(m)})}});
function showConfirm(t,cb){confirmText.textContent=t;confirmCb=cb;confirmOverlay.hidden=false}
confirmNo.addEventListener('click',function(){closeModal(confirmOverlay)});
confirmYes.addEventListener('click',function(){if(confirmCb)confirmCb();closeModal(confirmOverlay)});

function setupCP(c){c.addEventListener('click',function(e){var d=e.target.closest('.color-dot');if(!d)return;c.querySelectorAll('.color-dot').forEach(function(x){x.classList.remove('selected')});d.classList.add('selected')})}
setupCP(noteColorPicker);setupCP(eventColorPicker);
function getCP(c){var s=c.querySelector('.color-dot.selected');return s?s.dataset.color:'#ffffff'}
function setCP(c,color){c.querySelectorAll('.color-dot').forEach(function(d){d.classList.toggle('selected',d.dataset.color===color)})}

fab.addEventListener('click',function(){
  var s=state.activeSection;
  if(s==='secTareas')openTaskModal(null);
  else if(s==='secNotas')openNoteModal(null);
  else if(s==='secCalendario')openEventModal(null);
  else if(s==='secContactos')openContactModal(null);
  else if(s==='secRecordatorios')openReminderModal(null);
});

var SVG_CHK='<svg viewBox="0 0 24 24" width="14" height="14"><polyline points="4,12 9,17 20,6" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
var SVG_EDT='<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
var SVG_DEL='<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>';
var SVG_PIN='<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M16 2l-4 4-4-2-5 5 3 3-4 6 6-4 3 3 5-5-2-4 4-4z"/></svg>';

// TASKS
function openTaskModal(t){
  if(t){state.editingId=t.id;modalTaskTitle.textContent='Editar tarea';taskTitle.value=t.title;taskDesc.value=t.description||'';taskPriority.value=t.priority;taskCategory.value=t.category||'';taskDueDate.value=t.dueDate||'';taskDueTime.value=t.dueTime||''}
  else{state.editingId=null;modalTaskTitle.textContent='Nueva tarea';formTask.reset();taskPriority.value='media'}
  var cats=new Set();state.tasks.forEach(function(x){if(x.category)cats.add(x.category)});
  taskCatList.innerHTML=Array.from(cats).sort().map(function(c){return'<option value="'+esc(c)+'">'}).join('');
  openModal(modalTask);taskTitle.focus();
}
formTask.addEventListener('submit',function(e){
  e.preventDefault();
  var d={title:taskTitle.value.trim(),description:taskDesc.value.trim(),priority:taskPriority.value,category:taskCategory.value.trim(),dueDate:taskDueDate.value,dueTime:taskDueTime.value};
  if(state.editingId){var t=state.tasks.find(function(x){return x.id===state.editingId});if(t){t.title=d.title;t.description=d.description;t.priority=d.priority;t.category=d.category;t.dueDate=d.dueDate;t.dueTime=d.dueTime}}
  else{d.id=uid();d.completed=false;d.createdAt=Date.now();state.tasks.unshift(d)}
  save(KEYS.tasks,state.tasks);closeModal(modalTask);renderTasks();
});
function renderTasks(){
  var s=searchTasks.value.toLowerCase().trim(),st=filterStatus.value,pr=filterPriority.value,so=sortTasks.value;
  var list=state.tasks.filter(function(t){
    if(s&&t.title.toLowerCase().indexOf(s)===-1&&(!t.description||t.description.toLowerCase().indexOf(s)===-1))return false;
    if(st==='pending'&&t.completed)return false;if(st==='completed'&&!t.completed)return false;
    if(pr!=='all'&&t.priority!==pr)return false;return true;
  });
  list.sort(function(a,b){if(so==='priority')return pWeight(b.priority)-pWeight(a.priority);if(so==='dueDate')return(a.dueDate||'9999').localeCompare(b.dueDate||'9999');if(so==='alpha')return a.title.localeCompare(b.title);return(b.createdAt||0)-(a.createdAt||0)});
  if(!list.length){taskList.innerHTML='';emptyTasks.hidden=false;emptyTasksText.textContent=state.tasks.length?'Sin resultados para esos filtros':'Sin tareas por ahora';return}
  emptyTasks.hidden=true;
  taskList.innerHTML=list.map(function(t){
    var ov=!t.completed&&isOverdue(t.dueDate,t.dueTime);
    var m='<span class="tag tag-'+t.priority+'">'+t.priority.charAt(0).toUpperCase()+t.priority.slice(1)+'</span>';
    if(t.category)m+='<span class="tag tag-cat">'+esc(t.category)+'</span>';
    if(t.dueDate)m+='<span class="tag '+(ov?'tag-overdue':'tag-date')+'">'+(ov?'Vencida: ':'')+fmtShort(t.dueDate)+(t.dueTime?' '+t.dueTime:'')+'</span>';
    return'<div class="task-card priority-'+t.priority+(t.completed?' completed':'')+'">'+'<div class="task-check" data-action="toggleTask" data-id="'+t.id+'">'+SVG_CHK+'</div>'+'<div class="task-body"><div class="task-title">'+esc(t.title)+'</div>'+(t.description?'<div class="task-desc">'+esc(t.description)+'</div>':'')+'<div class="task-meta">'+m+'</div></div>'+'<div class="item-actions"><button class="act-edit" data-action="editTask" data-id="'+t.id+'">'+SVG_EDT+'</button><button class="act-delete" data-action="deleteTask" data-id="'+t.id+'">'+SVG_DEL+'</button></div></div>';
  }).join('');
}
taskList.addEventListener('click',function(e){var b=e.target.closest('[data-action]');if(!b)return;var id=b.dataset.id,a=b.dataset.action;if(a==='toggleTask'){var t=state.tasks.find(function(x){return x.id===id});if(t){t.completed=!t.completed;save(KEYS.tasks,state.tasks);renderTasks()}}else if(a==='editTask'){var t=state.tasks.find(function(x){return x.id===id});if(t)openTaskModal(t)}else if(a==='deleteTask'){var t=state.tasks.find(function(x){return x.id===id});showConfirm('Eliminar "'+(t?t.title:'')+'"?',function(){state.tasks=state.tasks.filter(function(x){return x.id!==id});save(KEYS.tasks,state.tasks);renderTasks()})}});
searchTasks.addEventListener('input',renderTasks);filterStatus.addEventListener('change',renderTasks);filterPriority.addEventListener('change',renderTasks);sortTasks.addEventListener('change',renderTasks);

// NOTES
function openNoteModal(n){
  if(n){state.editingId=n.id;modalNoteTitle.textContent='Editar nota';noteTitle.value=n.title||'';noteContent.value=n.content;setCP(noteColorPicker,n.color||'#ffffff')}
  else{state.editingId=null;modalNoteTitle.textContent='Nueva nota';formNote.reset();setCP(noteColorPicker,'#ffffff')}
  openModal(modalNote);noteTitle.focus();
}
formNote.addEventListener('submit',function(e){
  e.preventDefault();var d={title:noteTitle.value.trim(),content:noteContent.value.trim(),color:getCP(noteColorPicker)};
  if(state.editingId){var n=state.notes.find(function(x){return x.id===state.editingId});if(n){n.title=d.title;n.content=d.content;n.color=d.color;n.updatedAt=Date.now()}}
  else{state.notes.unshift({id:uid(),pinned:false,createdAt:Date.now(),updatedAt:Date.now(),title:d.title,content:d.content,color:d.color})}
  save(KEYS.notes,state.notes);closeModal(modalNote);renderNotes();
});
function renderNotes(){
  var s=searchNotes.value.toLowerCase().trim();
  var list=state.notes.filter(function(n){if(!s)return true;return(n.title&&n.title.toLowerCase().indexOf(s)!==-1)||n.content.toLowerCase().indexOf(s)!==-1});
  list.sort(function(a,b){if(a.pinned&&!b.pinned)return-1;if(!a.pinned&&b.pinned)return 1;return(b.updatedAt||b.createdAt)-(a.updatedAt||a.createdAt)});
  if(!list.length){notesGrid.innerHTML='';emptyNotes.hidden=false;return}emptyNotes.hidden=true;
  notesGrid.innerHTML=list.map(function(n){var d=new Date(n.updatedAt||n.createdAt);var dk=dateStr(d);return'<div class="note-card" style="background:'+n.color+'" data-id="'+n.id+'">'+'<button class="note-pin '+(n.pinned?'pinned':'')+'" data-action="pinNote" data-id="'+n.id+'">'+SVG_PIN+'</button>'+(n.title?'<div class="note-card-title">'+esc(n.title)+'</div>':'')+'<div class="note-card-content">'+esc(n.content)+'</div>'+'<div class="note-card-footer"><span class="note-card-date">'+fmtShort(dk)+'</span><div class="item-actions"><button class="act-edit" data-action="editNote" data-id="'+n.id+'">'+SVG_EDT+'</button><button class="act-delete" data-action="deleteNote" data-id="'+n.id+'">'+SVG_DEL+'</button></div></div></div>'}).join('');
}
notesGrid.addEventListener('click',function(e){var b=e.target.closest('[data-action]');if(!b)return;var id=b.dataset.id;if(b.dataset.action==='pinNote'){var n=state.notes.find(function(x){return x.id===id});if(n){n.pinned=!n.pinned;save(KEYS.notes,state.notes);renderNotes()}}else if(b.dataset.action==='editNote'){var n=state.notes.find(function(x){return x.id===id});if(n)openNoteModal(n)}else if(b.dataset.action==='deleteNote'){showConfirm('Eliminar esta nota?',function(){state.notes=state.notes.filter(function(x){return x.id!==id});save(KEYS.notes,state.notes);renderNotes()})}});
searchNotes.addEventListener('input',renderNotes);

// CALENDAR
function openEventModal(ev){
  if(ev){state.editingId=ev.id;modalEventTitle.textContent='Editar evento';eventTitle.value=ev.title;eventDate.value=ev.date;eventStart.value=ev.startTime||'';eventEnd.value=ev.endTime||'';eventNotes.value=ev.notes||'';setCP(eventColorPicker,ev.color||'#748ffc')}
  else{state.editingId=null;modalEventTitle.textContent='Nuevo evento';formEvent.reset();eventDate.value=state.calSelectedDate;setCP(eventColorPicker,'#748ffc')}
  openModal(modalEvent);eventTitle.focus();
}
formEvent.addEventListener('submit',function(e){
  e.preventDefault();var d={title:eventTitle.value.trim(),date:eventDate.value,startTime:eventStart.value,endTime:eventEnd.value,notes:eventNotes.value.trim(),color:getCP(eventColorPicker)};
  if(state.editingId){var ev=state.events.find(function(x){return x.id===state.editingId});if(ev){ev.title=d.title;ev.date=d.date;ev.startTime=d.startTime;ev.endTime=d.endTime;ev.notes=d.notes;ev.color=d.color}}
  else{d.id=uid();d.createdAt=Date.now();state.events.push(d)}
  save(KEYS.events,state.events);closeModal(modalEvent);renderCalendar();
});
function renderCalendar(){
  calTitle.textContent=MO[state.calMonth]+' '+state.calYear;
  calWeekdays.innerHTML=WD.map(function(d){return'<span>'+d+'</span>'}).join('');
  var first=new Date(state.calYear,state.calMonth,1),sw=(first.getDay()+6)%7;
  var dim=new Date(state.calYear,state.calMonth+1,0).getDate();
  var pd=new Date(state.calYear,state.calMonth,0).getDate();
  var today=todayStr(),cells=[];
  for(var i=sw-1;i>=0;i--)cells.push({day:pd-i,cur:false,date:''});
  for(var d=1;d<=dim;d++){var ds=state.calYear+'-'+String(state.calMonth+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');cells.push({day:d,cur:true,date:ds,isToday:ds===today})}
  var rem=7-(cells.length%7);if(rem<7)for(var j=1;j<=rem;j++)cells.push({day:j,cur:false,date:''});
  var byDate={};
  state.events.forEach(function(ev){if(!byDate[ev.date])byDate[ev.date]=[];byDate[ev.date].push({t:'e',c:ev.color||'#748ffc'})});
  state.tasks.forEach(function(t){if(t.dueDate&&!t.completed){if(!byDate[t.dueDate])byDate[t.dueDate]=[];byDate[t.dueDate].push({t:'t',c:PRI_C[t.priority]||'#748ffc'})}});
  state.reminders.forEach(function(r){if(r.date&&!r.completed){if(!byDate[r.date])byDate[r.date]=[];byDate[r.date].push({t:'r',c:'#f06595'})}});
  calGrid.innerHTML=cells.map(function(c){
    var cls='cal-day'+(!c.cur?' other-month':'')+(c.isToday?' today':'')+(c.date===state.calSelectedDate?' selected':'');
    var dots='';if(c.date&&byDate[c.date])dots='<div class="cal-dots">'+byDate[c.date].slice(0,4).map(function(it){return'<span class="'+(it.t==='t'?'dot-task':'')+'" style="background:'+it.c+'"></span>'}).join('')+'</div>';
    return'<div class="'+cls+'" data-date="'+c.date+'">'+c.day+dots+'</div>';
  }).join('');
  renderDayItems();
}
function renderDayItems(){
  calDayTitle.textContent=state.calSelectedDate?fmtLong(state.calSelectedDate):'Selecciona un dia';
  var items=[];
  state.events.forEach(function(ev){if(ev.date===state.calSelectedDate){var t=ev.startTime?(ev.startTime+(ev.endTime?' - '+ev.endTime:'')):'';items.push({type:'e',sk:ev.startTime||'00:00',color:ev.color||'#748ffc',title:ev.title,sub:t,id:ev.id})}});
  state.tasks.forEach(function(t){if(t.dueDate===state.calSelectedDate)items.push({type:'t',sk:t.dueTime||'99:99',color:PRI_C[t.priority],title:t.title,sub:(t.dueTime?t.dueTime+' ':'')+'Tarea - '+t.priority,id:t.id})});
  state.reminders.forEach(function(r){if(r.date===state.calSelectedDate)items.push({type:'r',sk:r.time||'99:99',color:'#f06595',title:r.title,sub:(r.time||'')+' Recordatorio',id:r.id})});
  items.sort(function(a,b){return a.sk.localeCompare(b.sk)});
  if(!items.length){calDayItems.innerHTML='';emptyDayItems.hidden=false;return}emptyDayItems.hidden=true;
  calDayItems.innerHTML=items.map(function(it){
    var badge=it.type==='t'?'<span class="day-item-badge" style="background:#e8d5f5;color:#862e9c">Tarea</span>':it.type==='r'?'<span class="day-item-badge" style="background:#ffe0e6;color:#c92a2a">Alerta</span>':'';
    var acts=it.type==='e'?'<div class="item-actions"><button class="act-edit" data-action="editEvent" data-id="'+it.id+'">'+SVG_EDT+'</button><button class="act-delete" data-action="deleteEvent" data-id="'+it.id+'">'+SVG_DEL+'</button></div>':'';
    return'<div class="day-item'+(it.type==='t'?' day-item-task':'')+'" style="border-left-color:'+it.color+'"><div class="day-item-info"><div class="day-item-title">'+esc(it.title)+badge+'</div>'+(it.sub?'<div class="day-item-sub">'+esc(it.sub)+'</div>':'')+'</div>'+acts+'</div>';
  }).join('');
}
calGrid.addEventListener('click',function(e){var c=e.target.closest('.cal-day');if(c&&c.dataset.date){state.calSelectedDate=c.dataset.date;renderCalendar()}});
calPrev.addEventListener('click',function(){state.calMonth--;if(state.calMonth<0){state.calMonth=11;state.calYear--}renderCalendar()});
calNext.addEventListener('click',function(){state.calMonth++;if(state.calMonth>11){state.calMonth=0;state.calYear++}renderCalendar()});
calDayItems.addEventListener('click',function(e){var b=e.target.closest('[data-action]');if(!b)return;var id=b.dataset.id;if(b.dataset.action==='editEvent'){var ev=state.events.find(function(x){return x.id===id});if(ev)openEventModal(ev)}else if(b.dataset.action==='deleteEvent'){showConfirm('Eliminar este evento?',function(){state.events=state.events.filter(function(x){return x.id!==id});save(KEYS.events,state.events);renderCalendar()})}});

// CONTACTS
function openContactModal(c){
  if(c){state.editingId=c.id;modalContactTitle.textContent='Editar contacto';contactName.value=c.name;contactPhone.value=c.phone||'';contactEmail.value=c.email||'';contactAddress.value=c.address||'';contactNotes.value=c.notes||''}
  else{state.editingId=null;modalContactTitle.textContent='Nuevo contacto';formContact.reset()}
  openModal(modalContact);contactName.focus();
}
formContact.addEventListener('submit',function(e){
  e.preventDefault();var d={name:contactName.value.trim(),phone:contactPhone.value.trim(),email:contactEmail.value.trim(),address:contactAddress.value.trim(),notes:contactNotes.value.trim()};
  if(state.editingId){var c=state.contacts.find(function(x){return x.id===state.editingId});if(c){c.name=d.name;c.phone=d.phone;c.email=d.email;c.address=d.address;c.notes=d.notes}}
  else{d.id=uid();d.createdAt=Date.now();state.contacts.push(d)}
  save(KEYS.contacts,state.contacts);closeModal(modalContact);renderContacts();
});
function renderContacts(){
  var s=searchContacts.value.toLowerCase().trim();
  var list=state.contacts.filter(function(c){if(!s)return true;return c.name.toLowerCase().indexOf(s)!==-1||(c.email&&c.email.toLowerCase().indexOf(s)!==-1)||(c.phone&&c.phone.indexOf(s)!==-1)});
  list.sort(function(a,b){return a.name.localeCompare(b.name)});
  if(!list.length){contactList.innerHTML='';emptyContacts.hidden=false;return}emptyContacts.hidden=true;
  contactList.innerHTML=list.map(function(c){
    var det='';if(c.phone)det+='<a href="tel:'+esc(c.phone)+'">'+esc(c.phone)+'</a>';if(c.phone&&c.email)det+=' &middot; ';if(c.email)det+='<a href="mailto:'+esc(c.email)+'">'+esc(c.email)+'</a>';
    return'<div class="contact-card"><div class="contact-avatar" style="background:'+avColor(c.name)+'">'+initials(c.name)+'</div><div class="contact-info"><div class="contact-name">'+esc(c.name)+'</div>'+(det?'<div class="contact-detail">'+det+'</div>':'')+(c.address?'<div class="contact-detail">'+esc(c.address)+'</div>':'')+'</div><div class="item-actions"><button class="act-edit" data-action="editContact" data-id="'+c.id+'">'+SVG_EDT+'</button><button class="act-delete" data-action="deleteContact" data-id="'+c.id+'">'+SVG_DEL+'</button></div></div>';
  }).join('');
}
contactList.addEventListener('click',function(e){var b=e.target.closest('[data-action]');if(!b)return;var id=b.dataset.id;if(b.dataset.action==='editContact'){var c=state.contacts.find(function(x){return x.id===id});if(c)openContactModal(c)}else if(b.dataset.action==='deleteContact'){var c=state.contacts.find(function(x){return x.id===id});showConfirm('Eliminar "'+(c?c.name:'')+'"?',function(){state.contacts=state.contacts.filter(function(x){return x.id!==id});save(KEYS.contacts,state.contacts);renderContacts()})}});
searchContacts.addEventListener('input',renderContacts);

// REMINDERS
function openReminderModal(r){
  if(r){state.editingId=r.id;modalReminderTitle.textContent='Editar recordatorio';reminderTitle.value=r.title;reminderDate.value=r.date;reminderTime.value=r.time||'';reminderRepeat.value=r.repeat||'';reminderNotes.value=r.notes||''}
  else{state.editingId=null;modalReminderTitle.textContent='Nuevo recordatorio';formReminder.reset();reminderDate.value=todayStr()}
  openModal(modalReminder);reminderTitle.focus();
}
formReminder.addEventListener('submit',function(e){
  e.preventDefault();var d={title:reminderTitle.value.trim(),date:reminderDate.value,time:reminderTime.value,repeat:reminderRepeat.value,notes:reminderNotes.value.trim()};
  if(state.editingId){var r=state.reminders.find(function(x){return x.id===state.editingId});if(r){r.title=d.title;r.date=d.date;r.time=d.time;r.repeat=d.repeat;r.notes=d.notes}}
  else{d.id=uid();d.completed=false;d.createdAt=Date.now();state.reminders.push(d)}
  save(KEYS.reminders,state.reminders);closeModal(modalReminder);renderReminders();
});
function renderReminders(){
  var f=filterReminders.value;
  var list=state.reminders.filter(function(r){if(f==='pending')return!r.completed;if(f==='completed')return r.completed;return true});
  list.sort(function(a,b){if(a.completed!==b.completed)return a.completed?1:-1;return(a.date+(a.time||'')).localeCompare(b.date+(b.time||''))});
  if(!list.length){reminderList.innerHTML='';emptyReminders.hidden=false;return}emptyReminders.hidden=true;
  reminderList.innerHTML=list.map(function(r){
    var ov=!r.completed&&isOverdue(r.date,r.time);var w=fmtShort(r.date)+(r.time?' '+r.time:'');if(ov)w='Vencido: '+w;
    return'<div class="reminder-card'+(r.completed?' completed':'')+(ov?' overdue':'')+'">'+'<div class="reminder-check" data-action="toggleReminder" data-id="'+r.id+'">'+SVG_CHK+'</div>'+'<div class="reminder-body"><div class="reminder-title">'+esc(r.title)+'</div><div class="reminder-when">'+w+(r.repeat?' <span class="reminder-repeat">'+REP_L[r.repeat]+'</span>':'')+'</div>'+(r.notes?'<div class="task-desc">'+esc(r.notes)+'</div>':'')+'</div><div class="item-actions"><button class="act-edit" data-action="editReminder" data-id="'+r.id+'">'+SVG_EDT+'</button><button class="act-delete" data-action="deleteReminder" data-id="'+r.id+'">'+SVG_DEL+'</button></div></div>';
  }).join('');
}
reminderList.addEventListener('click',function(e){var b=e.target.closest('[data-action]');if(!b)return;var id=b.dataset.id;if(b.dataset.action==='toggleReminder'){var r=state.reminders.find(function(x){return x.id===id});if(r){r.completed=!r.completed;save(KEYS.reminders,state.reminders);renderReminders()}}else if(b.dataset.action==='editReminder'){var r=state.reminders.find(function(x){return x.id===id});if(r)openReminderModal(r)}else if(b.dataset.action==='deleteReminder'){showConfirm('Eliminar este recordatorio?',function(){state.reminders=state.reminders.filter(function(x){return x.id!==id});save(KEYS.reminders,state.reminders);renderReminders()})}});
filterReminders.addEventListener('change',renderReminders);

// DIARY
moodFaces.addEventListener('click',function(e){var f=e.target.closest('.mood-face');if(!f)return;moodFaces.querySelectorAll('.mood-face').forEach(function(x){x.classList.remove('selected')});f.classList.add('selected');state.diaryMood=parseInt(f.dataset.mood)});
document.querySelectorAll('.rating-dots').forEach(function(c){c.addEventListener('click',function(e){var d=e.target.closest('span[data-val]');if(!d)return;var v=parseInt(d.dataset.val);state.diaryRatings[c.dataset.field]=v;updDots(c,v)})});
function updDots(c,v){c.querySelectorAll('span').forEach(function(s){s.classList.toggle('filled',parseInt(s.dataset.val)<=v)})}
diaryTags.addEventListener('click',function(e){var t=e.target.closest('.diary-tag');if(!t)return;t.classList.toggle('active');var n=t.dataset.tag;var i=state.diaryActiveTags.indexOf(n);if(i===-1)state.diaryActiveTags.push(n);else state.diaryActiveTags.splice(i,1)});

function loadTodayEntry(){
  var entry=state.diary.find(function(e){return e.date===todayStr()});
  if(entry){
    state.diaryMood=entry.mood||0;
    state.diaryRatings={energy:entry.energy||0,sleep:entry.sleep||0,anxiety:entry.anxiety||0,stress:entry.stress||0,motivation:entry.motivation||0};
    state.diaryActiveTags=(entry.tags||[]).slice();diaryNotesEl.value=entry.notes||'';
    moodFaces.querySelectorAll('.mood-face').forEach(function(f){f.classList.toggle('selected',parseInt(f.dataset.mood)===state.diaryMood)});
    document.querySelectorAll('.rating-dots').forEach(function(c){updDots(c,state.diaryRatings[c.dataset.field]||0)});
    diaryTags.querySelectorAll('.diary-tag').forEach(function(t){t.classList.toggle('active',state.diaryActiveTags.indexOf(t.dataset.tag)!==-1)});
    btnSaveDiary.textContent='Actualizar entrada de hoy';
  }
}
btnSaveDiary.addEventListener('click',function(){
  if(!state.diaryMood){moodFaces.querySelectorAll('.mood-face').forEach(function(f){f.style.opacity='1'});setTimeout(function(){moodFaces.querySelectorAll('.mood-face').forEach(function(f){if(!f.classList.contains('selected'))f.style.opacity=''})},600);return}
  var today=todayStr(),ex=state.diary.find(function(e){return e.date===today});
  var entry={date:today,mood:state.diaryMood,energy:state.diaryRatings.energy,sleep:state.diaryRatings.sleep,anxiety:state.diaryRatings.anxiety,stress:state.diaryRatings.stress,motivation:state.diaryRatings.motivation,tags:state.diaryActiveTags.slice(),notes:diaryNotesEl.value.trim(),updatedAt:Date.now()};
  if(ex)Object.assign(ex,entry);else{entry.id=uid();entry.createdAt=Date.now();state.diary.unshift(entry)}
  save(KEYS.diary,state.diary);btnSaveDiary.textContent='Guardado!';setTimeout(function(){btnSaveDiary.textContent='Actualizar entrada de hoy'},1500);renderDiary();
});
function renderDiary(){
  var days=[];for(var i=6;i>=0;i--){var d=new Date();d.setDate(d.getDate()-i);days.push(dateStr(d))}
  var em={};state.diary.forEach(function(e){em[e.date]=e});var has=false;
  diaryWeek.innerHTML=days.map(function(ds){var d=new Date(ds+'T12:00:00');var wd=(d.getDay()+6)%7;var e=em[ds];if(e)has=true;return'<div class="diary-week-day"><div class="diary-week-day-label">'+WD[wd]+'</div><div class="diary-week-day-num">'+d.getDate()+'</div><div class="diary-week-day-mood'+(e?'':' empty')+'">'+(e?MOOD_F[e.mood]:'-')+'</div></div>'}).join('');
  if(!has){diarySummary.hidden=true}else{
    diarySummary.hidden=false;var we=days.map(function(ds){return em[ds]}).filter(Boolean);
    var fs=['energy','sleep','anxiety','stress','motivation'],ms=0,su={},co={};
    fs.forEach(function(f){su[f]=0;co[f]=0});
    we.forEach(function(e){ms+=e.mood;fs.forEach(function(f){if(e[f]){su[f]+=e[f];co[f]++}})});
    var ma=(ms/we.length).toFixed(1);
    diaryAverages.innerHTML='<div class="diary-avg-item"><div class="diary-avg-value" style="color:'+MOOD_C[Math.round(ma)]+'">'+ma+'</div><div class="diary-avg-label">Animo</div></div>'+fs.map(function(f){var a=co[f]>0?(su[f]/co[f]).toFixed(1):'-';return'<div class="diary-avg-item"><div class="diary-avg-value" style="color:'+BAR_C[f]+'">'+a+'</div><div class="diary-avg-label">'+RAT_L[f]+'</div></div>'}).join('');
  }
  var today=todayStr(),list=state.diary.filter(function(e){return e.date!==today});
  list.sort(function(a,b){return b.date.localeCompare(a.date)});
  if(!list.length&&!state.diary.find(function(e){return e.date===today})){diaryHistory.innerHTML='';emptyDiary.hidden=false;return}
  emptyDiary.hidden=true;
  if(!list.length){diaryHistory.innerHTML='<p style="color:var(--text-secondary);font-size:.85rem;padding:16px 0">Registra tu estado cada dia para ver el historial</p>';return}
  diaryHistory.innerHTML=list.map(function(e){
    var bars=['energy','sleep','anxiety','stress','motivation'].map(function(f){var v=e[f]||0;return'<div class="diary-bar"><span>'+RAT_L[f].substring(0,3)+'</span><div class="diary-bar-track"><div class="diary-bar-fill" style="width:'+(v/5*100)+'%;background:'+BAR_C[f]+'"></div></div><span>'+v+'</span></div>'}).join('');
    var tags=(e.tags||[]).map(function(t){return'<span class="diary-entry-tag">'+esc(t)+'</span>'}).join('');
    return'<div class="diary-entry"><div class="diary-entry-header"><span class="diary-entry-mood">'+MOOD_F[e.mood]+'</span><span class="diary-entry-date">'+fmtLong(e.date)+'</span></div><div class="diary-entry-bars">'+bars+'</div>'+(tags?'<div class="diary-entry-tags">'+tags+'</div>':'')+(e.notes?'<div class="diary-entry-notes">'+esc(e.notes)+'</div>':'')+'<div class="item-actions"><button class="act-delete" data-action="deleteDiary" data-id="'+e.id+'">'+SVG_DEL+'</button></div></div>';
  }).join('');
}
diaryHistory.addEventListener('click',function(e){var b=e.target.closest('[data-action="deleteDiary"]');if(!b)return;var id=b.dataset.id;showConfirm('Eliminar esta entrada?',function(){state.diary=state.diary.filter(function(x){return x.id!==id});save(KEYS.diary,state.diary);renderDiary()})});

// INIT
initSettings();updateGreeting();renderTasks();renderNotes();renderCalendar();renderContacts();renderReminders();loadTodayEntry();renderDiary();
})();
