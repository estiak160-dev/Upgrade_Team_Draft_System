let teams = JSON.parse(localStorage.getItem('teams')) || [];
let previewDraft = [];
let draggedPlayer = null;
const teamColors = ['#FF5722','#4CAF50','#2196F3','#9C27B0','#FFC107','#E91E63','#00BCD4','#FF9800','#3F51B5','#009688'];
let teamScoreHistory = {};
let playerScores = {};
let teamChart = null;
let topPlayersChart = null;

// --- Helper Functions ---
function saveData() { localStorage.setItem('teams', JSON.stringify(teams)); }
function getRandomAvatar(){ const avatarId = Math.floor(Math.random()*70)+1; return `https://i.pravatar.cc/50?img=${avatarId}`; }

// --- CRUD Operations ---
function addTeam(){
  const teamName = document.getElementById('teamName').value.trim();
  if(!teamName) return alert('Enter a team name.');
  if(teams.some(t => t.name.toLowerCase()===teamName.toLowerCase())) return alert('Team exists!');
  teams.push({ name:teamName, players:[], color: teamColors[teams.length % teamColors.length] });
  document.getElementById('teamName').value='';
  updateTeamSelect(); updateSimulatorSelects(); updateManualMatchSelects();
  displayTeams(); saveData();
}

function addPlayer(){
  const teamName = document.getElementById('teamSelect').value;
  const playerName = document.getElementById('playerName').value.trim();
  if(!teamName) return alert('Select a team.');
  if(!playerName) return alert('Enter a player name.');
  const team = teams.find(t=>t.name===teamName);
  team.players.push({name:playerName, notes:'', avatar:getRandomAvatar()});
  document.getElementById('playerName').value='';
  displayTeams(); saveData();
}

function editPlayer(teamIndex, playerIndex){
  const player=teams[teamIndex].players[playerIndex];
  const newName=prompt("Edit player name:",player.name);
  if(newName && newName.trim()!=='') player.name=newName.trim();
  const newNotes=prompt("Edit player notes:",player.notes);
  if(newNotes!==null) player.notes=newNotes.trim();
  displayTeams(); saveData();
}

function deletePlayer(teamIndex, playerIndex){ if(confirm('Delete player?')) { teams[teamIndex].players.splice(playerIndex,1); displayTeams(); saveData(); } }
function deleteTeam(teamIndex){ if(confirm('Delete team?')) { teams.splice(teamIndex,1); updateTeamSelect(); updateSimulatorSelects(); updateManualMatchSelects(); displayTeams(); saveData(); } }

// --- Display Functions ---
function displayTeams(){
  const teamList = document.getElementById('teamList');
  teamList.innerHTML='';
  teams.forEach((team,teamIndex)=>{
    const div = document.createElement('div'); div.className='team'; div.style.borderColor=team.color;
    div.innerHTML=`
      <div class="team-header"><h3>${team.name}</h3><button onclick="deleteTeam(${teamIndex})">Delete Team</button></div>
      <div class="player-list">
        ${team.players.map((p,playerIndex)=>`
          <div class="player" draggable="true">
            <span><span class="player-avatar" style="background-image:url('${p.avatar}')"></span>${p.name}${p.notes?` - (${p.notes})`:''}</span>
            <div class="actions">
              <button class="edit" onclick="editPlayer(${teamIndex},${playerIndex})">Edit</button>
              <button onclick="deletePlayer(${teamIndex},${playerIndex})">Delete</button>
            </div>
          </div>
        `).join('')}
      </div>`;
    teamList.appendChild(div);
  });
  enableDragAndDrop();
}

// --- Search & Sort ---
function searchPlayer(){
  const search=document.getElementById('searchPlayer').value.toLowerCase();
  document.querySelectorAll('.player').forEach(p=>{
    p.classList.remove('highlight');
    if(p.innerText.toLowerCase().includes(search)) p.classList.add('highlight');
  });
}

function sortTeams(){ teams.sort((a,b)=>a.name.localeCompare(b.name)); displayTeams(); updateTeamSelect(); updateSimulatorSelects(); updateManualMatchSelects(); saveData(); }
function sortPlayers(){ teams.forEach(t=>t.players.sort((a,b)=>a.name.localeCompare(b.name))); displayTeams(); saveData(); }

// --- Team Select Update ---
function updateTeamSelect(){
  const select = document.getElementById('teamSelect');
  select.innerHTML='<option value="">Select Team</option>';
  teams.forEach(t=>{ const option=document.createElement('option'); option.value=t.name; option.textContent=t.name; select.appendChild(option); });
}
function updateSimulatorSelects(){
  const sim1=document.getElementById('simTeam1'); const sim2=document.getElementById('simTeam2');
  [sim1,sim2].forEach(select=>{ select.innerHTML='<option value="">Select Team</option>'; teams.forEach(t=>{ const option=document.createElement('option'); option.value=t.name; option.textContent=t.name; select.appendChild(option); }); });
}
function updateManualMatchSelects(){
  const manual1 = document.getElementById('manualTeam1');
  const manual2 = document.getElementById('manualTeam2');
  [manual1, manual2].forEach(select=>{
    select.innerHTML='<option value="">Select Team</option>';
    teams.forEach(t=>{ const option=document.createElement('option'); option.value=t.name; option.textContent=t.name; select.appendChild(option); });
  });
}

// --- Drag & Drop ---
function enableDragAndDrop(){
  document.querySelectorAll('.player').forEach(playerDiv=>{
    playerDiv.addEventListener('dragstart',e=>{ draggedPlayer=e.currentTarget; e.currentTarget.style.opacity='0.5'; });
    playerDiv.addEventListener('dragend',e=>{ draggedPlayer.style.opacity='1'; draggedPlayer=null; });
    playerDiv.addEventListener('dragover',e=>e.preventDefault());
    playerDiv.addEventListener('drop',e=>{
      e.preventDefault();
      if(!draggedPlayer||draggedPlayer===e.currentTarget) return;
      const teamDiv=e.currentTarget.closest('.team');
      const teamIndex=Array.from(document.getElementById('teamList').children).indexOf(teamDiv);
      const playerList=teams[teamIndex].players;
      const draggedIndex=Array.from(teamDiv.querySelectorAll('.player')).indexOf(draggedPlayer);
      const targetIndex=Array.from(teamDiv.querySelectorAll('.player')).indexOf(e.currentTarget);
      const temp=playerList[draggedIndex]; playerList.splice(draggedIndex,1); playerList.splice(targetIndex,0,temp);
      displayTeams(); saveData();
    });
  });
}

// --- Draft Preview ---
function draftPlayersPreview(){
  previewDraft = JSON.parse(JSON.stringify(teams));
  const previewDiv=document.getElementById('previewList');
  previewDiv.innerHTML='';
  previewDraft.forEach(team=>{
    const teamDiv=document.createElement('div'); teamDiv.className='preview-team'; teamDiv.style.borderColor=team.color;
    teamDiv.innerHTML=`<h4>${team.name}</h4>${team.players.map(p=>`<div class="preview-player"><span class="player-avatar" style="background-image:url('${p.avatar}')"></span>${p.name}${p.notes?` (${p.notes})`:''}</div>`).join('')}`;
    previewDiv.appendChild(teamDiv);
  });
  document.getElementById('draftPreview').style.display='flex';
}
function confirmDraft(){ teams.forEach((team,i)=>{ team.players=[...previewDraft[i].players]; }); displayTeams(); saveData(); closePreview(); alert("Draft applied!"); }
function closePreview(){ document.getElementById('draftPreview').style.display='none'; }
function resetDraft(){ if(confirm("Reset drafts?")){ teams=JSON.parse(localStorage.getItem('teams'))||[]; updateTeamSelect(); displayTeams(); updateSimulatorSelects(); updateManualMatchSelects(); alert("Teams restored!"); } }

// --- CSV Export/Import ---
function exportCSV(){
  if(teams.length===0) return alert("No teams!"); let csvContent="Team,Player,Notes\n";
  teams.forEach(team=>{
    if(team.players.length===0){ csvContent+=`${team.name},,\n`; } else { team.players.forEach(p=>{ csvContent+=`${team.name},${p.name},${p.notes}\n`; }); }
  });
  const encodedUri=encodeURI("data:text/csv;charset=utf-8,"+csvContent);
  const link=document.createElement("a");
  const now=new Date(); link.setAttribute("href",encodedUri); link.setAttribute("download",`teams_export_${now.toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link); link.click(); document.body.removeChild(link);
}

function importCSV(){
  const fileInput=document.getElementById('csvFile'); const file=fileInput.files[0]; if(!file) return alert("Select a CSV file!");
  const reader=new FileReader();
  reader.onload=function(e){
    const lines=e.target.result.split(/\r?\n/).filter(l=>l.trim()!==''); const importedTeams={};
    lines.forEach((line,index)=>{ if(index===0 && line.toLowerCase().startsWith("team,player")) return; const [teamName,playerName,notes]=line.split(',').map(s=>s.trim()); if(!teamName) return; if(!importedTeams[teamName]) importedTeams[teamName]=[]; if(playerName) importedTeams[teamName].push({name:playerName,notes:notes||'',avatar:getRandomAvatar()}); });
    for(const [teamName,players] of Object.entries(importedTeams)){
      const existingTeam=teams.find(t=>t.name.toLowerCase()===teamName.toLowerCase());
      if(existingTeam){ existingTeam.players=existingTeam.players.concat(players); } else { teams.push({name:teamName,players,color: teamColors[teams.length % teamColors.length]}); }
    }
    updateTeamSelect(); displayTeams(); updateSimulatorSelects(); updateManualMatchSelects(); saveData(); fileInput.value=''; alert("Teams imported!");
  };
  reader.readAsText(file);
}

// --- Match Simulator ---
function simulateMatch(){
  const team1Name=document.getElementById('simTeam1').value;
  const team2Name=document.getElementById('simTeam2').value;
  if(!team1Name||!team2Name) return alert("Select both teams!");
  if(team1Name===team2Name) return alert("Select two different teams!");
  const team1=teams.find(t=>t.name===team1Name);
  const team2=teams.find(t=>t.name===team2Name);
  const scoreTeam1=team1.players.reduce((acc,p)=>acc+Math.floor(Math.random()*10+1),0);
  const scoreTeam2=team2.players.reduce((acc,p)=>acc+Math.floor(Math.random()*10+1),0);
  const winnerName = scoreTeam1>scoreTeam2?team1Name:scoreTeam2>scoreTeam1?team2Name:"Draw";

  const resultDiv=document.getElementById('matchResult');
  resultDiv.innerHTML=`
    <h3>Match: ${team1Name} vs ${team2Name}</h3>
    <p>${team1Name}: ${scoreTeam1} vs ${team2Name}: ${scoreTeam2}</p>
    <h3>Winner: <span class="winner">${winnerName}</span></h3>
  `;

  const playerStats=document.createElement('div'); playerStats.innerHTML='<h4>Player Performance</h4>';
  team1.players.forEach(p=>{
    const stat=Math.floor(Math.random()*10+1);
    p.lastScore=stat;
    playerScores[p.name]=(playerScores[p.name]||0)+stat;
    const div=document.createElement('div'); div.className='sim-player';
    div.innerHTML=`<span class="player-avatar" style="background-image:url('${p.avatar}')"></span>${p.name}: ${stat} pts`;
    playerStats.appendChild(div);
  });
  team2.players.forEach(p=>{
    const stat=Math.floor(Math.random()*10+1);
    p.lastScore=stat;
    playerScores[p.name]=(playerScores[p.name]||0)+stat;
    const div=document.createElement('div'); div.className='sim-player';
    div.innerHTML=`<span class="player-avatar" style="background-image:url('${p.avatar}')"></span>${p.name}: ${stat} pts`;
    playerStats.appendChild(div);
  });
  resultDiv.appendChild(playerStats);

  const historyDiv=document.getElementById('matchHistory');
  const entry=document.createElement('div'); entry.className='match-entry';
  entry.innerHTML=`<h4>${team1Name} (${scoreTeam1}) vs ${team2Name} (${scoreTeam2}) - Winner: <span class="winner">${winnerName}</span></h4>`;
  historyDiv.prepend(entry);

  if(!teamScoreHistory[team1.name]) teamScoreHistory[team1.name]=[];
  if(!teamScoreHistory[team2.name]) teamScoreHistory[team2.name]=[];
  teamScoreHistory[team1.name].push(scoreTeam1);
  teamScoreHistory[team2.name].push(scoreTeam2);

  drawTeamChart();
  drawTopPlayersChart();
}

// --- Manual Match ---
function addManualMatch(){
  const team1Name = document.getElementById('manualTeam1').value;
  const team2Name = document.getElementById('manualTeam2').value;
  const score1 = parseInt(document.getElementById('manualScore1').value);
  const score2 = parseInt(document.getElementById('manualScore2').value);
  const playerPerf = document.getElementById('manualPlayerPerformance').value.trim();

  if(!team1Name || !team2Name) return alert("Select both teams.");
  if(team1Name === team2Name) return alert("Choose different teams.");
  if(isNaN(score1) || isNaN(score2)) return alert("Enter valid scores.");

  const winnerName = score1>score2?team1Name:score2>score1?team2Name:"Draw";

  const historyDiv = document.getElementById('matchHistory');
  const entry = document.createElement('div'); entry.className='match-entry';
  entry.innerHTML = `<h4>${team1Name} (${score1}) vs ${team2Name} (${score2}) - Winner: <span class="winner">${winnerName}</span></h4>`;

  if(playerPerf){
    const playerDiv = document.createElement('div');
    playerDiv.innerHTML = "<strong>Player Performance:</strong><br>" + playerPerf.replace(/\n/g,'<br>');
    entry.appendChild(playerDiv);
    playerPerf.split("\n").forEach(line=>{
      const [pName, pts] = line.split(':');
      if(pName && pts) playerScores[pName.trim()] = (playerScores[pName.trim()] || 0) + parseInt(pts);
    });
  }
  historyDiv.prepend(entry);

  if(!teamScoreHistory[team1Name]) teamScoreHistory[team1Name]=[];
  if(!teamScoreHistory[team2Name]) teamScoreHistory[team2Name]=[];
  teamScoreHistory[team1Name].push(score1);
  teamScoreHistory[team2Name].push(score2);

  drawTeamChart();
  drawTopPlayersChart();

  alert("Manual match added!");
  document.getElementById('manualScore1').value = '';
  document.getElementById('manualScore2').value = '';
  document.getElementById('manualPlayerPerformance').value = '';
  document.getElementById('manualTeam1').value='';
  document.getElementById('manualTeam2').value='';
}

// --- Charts ---
function drawTeamChart(){
  const ctx=document.getElementById('teamChart').getContext('2d');
  const labels=Array.from({length:Math.max(...Object.values(teamScoreHistory).map(a=>a.length))},(_,i)=>`Match ${i+1}`);
  const datasets=Object.entries(teamScoreHistory).map(([teamName,scores])=>({
    label:teamName,
    data:scores,
    borderColor:teams.find(t=>t.name===teamName)?.color||'#fff',
    backgroundColor:teams.find(t=>t.name===teamName)?.color+'55',
    tension:0.3,
    fill:true
  }));
  if(teamChart) teamChart.destroy();
  teamChart=new Chart(ctx,{type:'line',data:{labels,datasets},options:{responsive:true,plugins:{legend:{labels:{color:'#fff'}}},scales:{x:{ticks:{color:'#fff'}},y:{ticks:{color:'#fff'}}}}});
}

function drawTopPlayersChart(){
  const ctx=document.getElementById('topPlayersChart').getContext('2d');
  const sortedPlayers=Object.entries(playerScores).sort((a,b)=>b[1]-a[1]).slice(0,10);
  const labels=sortedPlayers.map(p=>p[0]);
  const data=sortedPlayers.map(p=>p[1]);
  if(topPlayersChart) topPlayersChart.destroy();
  topPlayersChart = new Chart(ctx,{
    type:'bar',
    data:{ labels, datasets:[{label:'Top Players', data, backgroundColor:labels.map(l=>{ const team=teams.find(t=>t.players.some(p=>p.name===l)); return team?team.color+'aa':'#fff'; }) }] },
    options:{ responsive:true, plugins:{legend:{display:false},tooltip:{enabled:true}}, scales:{x:{ticks:{color:'#fff'}},y:{ticks:{color:'#fff'}}} }
  });
}

// --- Initialize ---
updateTeamSelect(); displayTeams(); updateSimulatorSelects(); updateManualMatchSelects();
