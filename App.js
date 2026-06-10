import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, StatusBar, ScrollView, Alert, Vibration, Share, Animated } from 'react-native';

const { width: W, height: H } = Dimensions.get('window');
const GROUND_Y = H - 220;
const GRAVITY = 1.5;
const JUMP_FORCE = -26;
const MAX_JUMPS = 2;
const CHAR_X = W * 0.15;
const CHAR_W = 50;
const CHAR_H = 50;
const LOOP_MS = 16;
const COIN_SIZE = 24;
const MAGNET_RANGE = 130;

const POWERUPS = [
  { id:'shield',      emoji:'🛡️', color:'#00acc1', label:'Shield',     frames:180, shopCoins:50  },
  { id:'magnet',      emoji:'🧲', color:'#e91e63', label:'Magnet',     frames:300, shopCoins:75  },
  { id:'slowmo',      emoji:'⏰', color:'#7c4dff', label:'Slow Mo',    frames:200, shopCoins:120 },
  { id:'jetpack',     emoji:'🚀', color:'#ff6d00', label:'Jetpack',    frames:220, shopCoins:150 },
  { id:'doublescore', emoji:'⭐', color:'#ffd740', label:'2x Score',   frames:360, shopCoins:100 },
  { id:'speedboost',  emoji:'⚡', color:'#69f0ae', label:'SpeedBoost', frames:180, shopCoins:80  },
  { id:'extralife',   emoji:'❤️', color:'#f44336', label:'Extra Life', frames:300, shopCoins:60  },
  { id:'invincible',  emoji:'🌟', color:'#ffeb3b', label:'Invincible', frames:240, shopCoins:100 },
];

const CHARACTERS = [
  { id:'ninja',   emoji:'🥷', label:'Ninja',   color:'#e53935', bg:'#b71c1c', coins:0,    score:0   },
  { id:'dino',    emoji:'🦕', label:'Dino',    color:'#43a047', bg:'#1b5e20', coins:50,   score:0   },
  { id:'robot',   emoji:'🤖', label:'Robot',   color:'#1e88e5', bg:'#0d47a1', coins:80,   score:0   },
  { id:'alien',   emoji:'👽', label:'Alien',   color:'#00acc1', bg:'#006064', coins:100,  score:0   },
  { id:'dragon',  emoji:'🐉', label:'Dragon',  color:'#e65100', bg:'#bf360c', coins:150,  score:50  },
  { id:'ghost',   emoji:'👻', label:'Ghost',   color:'#9e9e9e', bg:'#424242', coins:150,  score:50  },
  { id:'wizard',  emoji:'🧙', label:'Wizard',  color:'#6a1b9a', bg:'#4a148c', coins:200,  score:80  },
  { id:'panda',   emoji:'🐼', label:'Panda',   color:'#455a64', bg:'#263238', coins:200,  score:80  },
  { id:'fire',    emoji:'🔥', label:'Fire',    color:'#ff7043', bg:'#bf360c', coins:250,  score:100 },
  { id:'skull',   emoji:'💀', label:'Skull',   color:'#546e7a', bg:'#37474f', coins:300,  score:100 },
  { id:'unicorn', emoji:'🦄', label:'Unicorn', color:'#ec407a', bg:'#880e4f', coins:350,  score:150 },
  { id:'cat',     emoji:'😺', label:'Cat',     color:'#ff8f00', bg:'#e65100', coins:400,  score:150 },
  { id:'shark',   emoji:'🦈', label:'Shark',   color:'#1565c0', bg:'#0d47a1', coins:450,  score:200 },
  { id:'thunder', emoji:'⚡', label:'Thunder', color:'#f9a825', bg:'#f57f17', coins:500,  score:200 },
  { id:'crown',   emoji:'👑', label:'Crown',   color:'#ffd740', bg:'#ff8f00', coins:1000, score:300 },
];

const GROUND_OBS = [
  { emoji:'🌵', color:'#388e3c', w:28, h:60 },
  { emoji:'🔺', color:'#e53935', w:32, h:44 },
  { emoji:'🛢', color:'#8d6e63', w:34, h:38 },
  { emoji:'🪨', color:'#546e7a', w:40, h:32 },
  { emoji:'🔥', color:'#ff7043', w:30, h:42 },
  { emoji:'📦', color:'#7b1fa2', w:36, h:36 },
];

const FLY_OBS = [
  { emoji:'🦅', color:'#795548', w:38, h:28, flyY: GROUND_Y-90  },
  { emoji:'🚁', color:'#1565c0', w:40, h:30, flyY: GROUND_Y-115 },
  { emoji:'🦇', color:'#4a148c', w:34, h:26, flyY: GROUND_Y-70  },
];

const WORLDS = [
  { id:'day',    label:'🌤️ Day',    sky:'#87CEEB', ground:'#4caf50', isNight:false },
  { id:'night',  label:'🌙 Night',  sky:'#0d0d2b', ground:'#1a237e', isNight:true  },
  { id:'desert', label:'🏜️ Desert', sky:'#ff8f00', ground:'#d84315', isNight:false },
  { id:'jungle', label:'🌲 Jungle', sky:'#1b5e20', ground:'#33691e', isNight:false },
  { id:'snow',   label:'❄️ Snow',   sky:'#e3f2fd', ground:'#90caf9', isNight:false },
  { id:'space',  label:'🌌 Space',  sky:'#000022', ground:'#1a237e', isNight:true  },
];

const DAILY_REWARDS = [
  { day:1, reward:10,  type:'coins', label:'🪙 10 Coins'  },
  { day:2, reward:20,  type:'coins', label:'🪙 20 Coins'  },
  { day:3, reward:30,  type:'coins', label:'🪙 30 Coins'  },
  { day:4, reward:50,  type:'coins', label:'🪙 50 Coins'  },
  { day:5, reward:75,  type:'coins', label:'🪙 75 Coins'  },
  { day:6, reward:100, type:'coins', label:'🪙 100 Coins' },
  { day:7, reward:0,   type:'skin',  label:'🎁 Rare Skin' },
];

const MISSIONS = [
  { id:'m1', label:'🎯 Score 50',       check:(s,c,g,p)=>s>=50  },
  { id:'m2', label:'🪙 100 Coins',      check:(s,c,g,p)=>c>=100 },
  { id:'m3', label:'🎮 5 Games',        check:(s,c,g,p)=>g>=5   },
  { id:'m4', label:'🏃 Score 100',      check:(s,c,g,p)=>s>=100 },
  { id:'m5', label:'💰 200 Coins',      check:(s,c,g,p)=>c>=200 },
  { id:'m6', label:'⚡ Use 3 Powerups', check:(s,c,g,p)=>p>=3   },
  { id:'m7', label:'👹 Defeat Boss',    check:(s,c,g,p)=>s>=100 },
];

const ACHIEVEMENTS = [
  { id:'a1', label:'🐣 First Game', check:(s,c,g)=>g>=1   },
  { id:'a2', label:'⚡ Speedster',  check:(s,c,g)=>s>=50  },
  { id:'a3', label:'🏆 Champion',   check:(s,c,g)=>s>=100 },
  { id:'a4', label:'👑 Legend',     check:(s,c,g)=>s>=200 },
  { id:'a5', label:'🪙 Rich',       check:(s,c,g)=>c>=100 },
  { id:'a6', label:'💎 Elite',      check:(s,c,g)=>c>=500 },
  { id:'a7', label:'🎮 Addicted',   check:(s,c,g)=>g>=10  },
];

const LEVELS = [
  { level:1,  label:'🐣 Rookie',  xpNeeded:0    },
  { level:5,  label:'🏃 Runner',  xpNeeded:500  },
  { level:10, label:'🥷 Ninja',   xpNeeded:1000 },
  { level:20, label:'⚡ Master',  xpNeeded:2000 },
  { level:50, label:'👑 Legend',  xpNeeded:5000 },
];

const COMBO_LABELS = ['','GOOD!','AWESOME!','PERFECT!','LEGENDARY!','GODLIKE!'];

// Stars for night sky
const STARS = Array.from({length:40},(_,i)=>({
  x:`${(i*37+7)%100}%`, y:`${(i*23+5)%60}%`,
  size: i%5===0?3:i%3===0?2:1,
  opacity: 0.4+Math.random()*0.6,
}));

// Clouds for day sky
const CLOUDS = [
  {x:10,y:8,size:1.2},{x:35,y:5,size:0.9},{x:60,y:10,size:1.4},
  {x:80,y:6,size:1.0},{x:50,y:3,size:0.8},{x:20,y:12,size:1.1},
];

export default function App() {
  const [screen, setScreen] = useState('menu');
  const [coins, setCoins] = useState(0);
  const [totalCoins, setTotalCoins] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [ownedChars, setOwnedChars] = useState(['ninja']);
  const [activeChar, setActiveChar] = useState(0);
  const [unlockedAch, setUnlockedAch] = useState([]);
  const [doneMissions, setDoneMissions] = useState([]);
  const [dailyDay, setDailyDay] = useState(0);
  const [dailyDone, setDailyDone] = useState(false);
  const [worldIdx, setWorldIdx] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const [xp, setXp] = useState(0);
  const [powerupsUsed, setPowerupsUsed] = useState(0);
  const [leaderboard, setLeaderboard] = useState([
    {name:'Ali',score:180},{name:'Sara',score:145},
    {name:'Ahmed',score:120},{name:'You',score:0},
  ]);
  const [uiScore, setUiScore] = useState(0);
  const [uiCoins, setUiCoins] = useState(0);
  const [uiJumps, setUiJumps] = useState(MAX_JUMPS);
  const [uiSpeed, setUiSpeed] = useState(3);
  const [charY, setCharY] = useState(GROUND_Y);
  const [isJumping, setIsJumping] = useState(false);
  const [obsArr, setObsArr] = useState([]);
  const [flyArr, setFlyArr] = useState([]);
  const [coinArr, setCoinArr] = useState([]);
  const [puPickups, setPuPickups] = useState([]);
  const [activePUs, setActivePUs] = useState({});
  const [particles, setParticles] = useState([]);
  const [dustParticles, setDustParticles] = useState([]);
  const [shake, setShake] = useState(false);
  const [deadScore, setDeadScore] = useState(0);
  const [deadCoins, setDeadCoins] = useState(0);
  const [bossActive, setBossActive] = useState(false);
  const [bossX, setBossX] = useState(W);
  const [bossHp, setBossHp] = useState(3);
  const [combo, setCombo] = useState(0);
  const [comboLabel, setComboLabel] = useState('');
  const [spinResult, setSpinResult] = useState('');
  const [cloudOffset, setCloudOffset] = useState(0);
  const [starTwinkle, setStarTwinkle] = useState(false);

  // Animated values
  const charRotate = useRef(new Animated.Value(0)).current;
  const charScale  = useRef(new Animated.Value(1)).current;
  const moonGlow   = useRef(new Animated.Value(0.7)).current;
  const sunGlow    = useRef(new Animated.Value(0.8)).current;
  const cloudAnim  = useRef(new Animated.Value(0)).current;

  const running=useRef(false), loop=useRef(null), playerY=useRef(GROUND_Y);
  const velY=useRef(0), jumpsLeft=useRef(MAX_JUMPS), scoreRef=useRef(0);
  const speedRef=useRef(3), coinsRef=useRef(0), frameRef=useRef(0);
  const obsRef=useRef([]), flyRef=useRef([]), coinRef=useRef([]);
  const puRef=useRef([]), activePRef=useRef({});
  const particleId=useRef(0), objId=useRef(0);
  const shieldOn=useRef(false), extraLife=useRef(false), usedExtra=useRef(false);
  const bossRef=useRef(false), bossXRef=useRef(W), bossHpRef=useRef(3);
  const comboRef=useRef(0), puUsedRef=useRef(0);
  const wasOnGround=useRef(true);

  const world=WORLDS[worldIdx], char=CHARACTERS[activeChar];
  const currentLevel=LEVELS.filter(l=>xp>=l.xpNeeded).pop()||LEVELS[0];
  const isNightWorld=world.isNight;

  // Moon glow animation
  useEffect(()=>{
    if(isNightWorld){
      Animated.loop(Animated.sequence([
        Animated.timing(moonGlow,{toValue:1,duration:2000,useNativeDriver:true}),
        Animated.timing(moonGlow,{toValue:0.6,duration:2000,useNativeDriver:true}),
      ])).start();
    }
    Animated.loop(Animated.sequence([
      Animated.timing(sunGlow,{toValue:1,duration:3000,useNativeDriver:true}),
      Animated.timing(sunGlow,{toValue:0.7,duration:3000,useNativeDriver:true}),
    ])).start();
    // Cloud animation
    Animated.loop(Animated.timing(cloudAnim,{toValue:W,duration:30000,useNativeDriver:true})).start();
    // Star twinkle
    const t=setInterval(()=>setStarTwinkle(s=>!s),1500);
    return()=>clearInterval(t);
  },[isNightWorld]);

  function hasPU(id){return (activePRef.current[id]||0)>0;}

  function activatePU(id){
    const pu=POWERUPS.find(p=>p.id===id); if(!pu)return;
    if(id==='shield')shieldOn.current=true;
    if(id==='extralife'){extraLife.current=true;usedExtra.current=false;}
    activePRef.current={...activePRef.current,[id]:pu.frames};
    setActivePUs({...activePRef.current});
    puUsedRef.current++;
    setPowerupsUsed(p=>p+1);
    spawnParticles(CHAR_X+25,playerY.current,pu.color,12);
    if(soundOn) Vibration.vibrate(50);
  }

  function tickPUs(){
    const upd={};
    Object.entries(activePRef.current).forEach(([id,t])=>{
      if(t>1)upd[id]=t-1;
      else{
        if(id==='shield')shieldOn.current=false;
        if(id==='extralife')extraLife.current=false;
      }
    });
    activePRef.current=upd;
    setActivePUs({...upd});
  }

  function spawnParticles(x,y,color='#ffd740',count=7){
    const ps=Array.from({length:count},()=>({
      id:particleId.current++,x,y,
      vx:(Math.random()-0.5)*9,vy:-Math.random()*7-2,
      color,size:4+Math.random()*7,
    }));
    setParticles(p=>[...p,...ps]);
    setTimeout(()=>setParticles(p=>p.filter(pt=>!ps.find(n=>n.id===pt.id))),600);
  }

  function spawnDust(x,y){
    const ds=Array.from({length:6},()=>({
      id:particleId.current++,x:x+(Math.random()-0.5)*20,y,
      vx:(Math.random()-0.5)*4,vy:-Math.random()*3-1,
      color:'#d4a57a',size:3+Math.random()*5,
    }));
    setDustParticles(p=>[...p,...ds]);
    setTimeout(()=>setDustParticles(p=>p.filter(pt=>!ds.find(n=>n.id===pt.id))),400);
  }

  function doShake(){
    setShake(true);
    if(soundOn) Vibration.vibrate([0,80,40,120]);
    setTimeout(()=>setShake(false),350);
  }

  function showCombo(c){
    const label=COMBO_LABELS[Math.min(c,COMBO_LABELS.length-1)];
    if(label){setComboLabel(label);setTimeout(()=>setComboLabel(''),1000);}
  }

  function animateJump(){
    Animated.sequence([
      Animated.timing(charRotate,{toValue:-15,duration:100,useNativeDriver:true}),
      Animated.timing(charRotate,{toValue:0,duration:200,useNativeDriver:true}),
    ]).start();
    Animated.sequence([
      Animated.timing(charScale,{toValue:1.3,duration:100,useNativeDriver:true}),
      Animated.timing(charScale,{toValue:1,duration:200,useNativeDriver:true}),
    ]).start();
  }

  function startGame(){
    playerY.current=GROUND_Y; velY.current=0; jumpsLeft.current=MAX_JUMPS;
    scoreRef.current=0; speedRef.current=3; coinsRef.current=0; frameRef.current=0;
    obsRef.current=[]; flyRef.current=[]; coinRef.current=[];
    puRef.current=[]; activePRef.current={};
    shieldOn.current=false; extraLife.current=false; usedExtra.current=false;
    bossRef.current=false; bossXRef.current=W; bossHpRef.current=3;
    comboRef.current=0; puUsedRef.current=0; wasOnGround.current=true;
    running.current=true;
    setCharY(GROUND_Y); setObsArr([]); setFlyArr([]);
    setCoinArr([]); setPuPickups([]); setParticles([]); setDustParticles([]);
    setActivePUs({}); setUiScore(0); setUiCoins(0);
    setUiJumps(MAX_JUMPS); setUiSpeed(3); setIsJumping(false);
    setBossActive(false); setBossX(W); setBossHp(3);
    setCombo(0); setComboLabel('');
    setGamesPlayed(g=>g+1); setScreen('game');
    clearInterval(loop.current);
    loop.current=setInterval(tick,LOOP_MS);
  }

  function jump(){
    if(!running.current)return;
    if(hasPU('jetpack')){velY.current=-18;animateJump();return;}
    if(jumpsLeft.current>0){
      velY.current=JUMP_FORCE;
      if(!wasOnGround.current){
        comboRef.current++;
        setCombo(comboRef.current);
        showCombo(comboRef.current);
      }
      wasOnGround.current=false;
      jumpsLeft.current--;
      setUiJumps(jumpsLeft.current);
      setIsJumping(true);
      animateJump();
      if(soundOn) Vibration.vibrate(30);
    }
  }

  function tick(){
    if(!running.current)return;
    frameRef.current++; const f=frameRef.current;
    tickPUs();
    const slow=hasPU('slowmo'),boost=hasPU('speedboost');
    const effSp=speedRef.current*(slow?0.4:boost?1.6:1.0);

    const wasGrounded=playerY.current>=GROUND_Y;

    if(hasPU('jetpack')){
      playerY.current=Math.max(GROUND_Y-200,playerY.current-4); velY.current=0;
    } else {
      velY.current+=GRAVITY*(slow?0.5:1); playerY.current+=velY.current;
      if(playerY.current>=GROUND_Y){
        if(!wasGrounded){
          // Just landed — spawn dust
          spawnDust(CHAR_X+25,GROUND_Y+CHAR_H);
          setIsJumping(false);
        }
        playerY.current=GROUND_Y; velY.current=0;
        jumpsLeft.current=MAX_JUMPS; setUiJumps(MAX_JUMPS);
        wasOnGround.current=true; comboRef.current=0; setCombo(0);
      }
    }

    const sc2x=hasPU('doublescore')?2:1;
    if(f%8===0){
      scoreRef.current+=sc2x; setUiScore(scoreRef.current);
      const s=scoreRef.current;
      const newSpeed=s<20?3:s<50?4:s<100?5:s<200?6:s<300?8:Math.min(3+s/40,18);
      speedRef.current=newSpeed;
      setUiSpeed(parseFloat(newSpeed.toFixed(1)));
      if((s===100||s===250||s===500)&&!bossRef.current){
        bossRef.current=true; bossXRef.current=W;
        const hp=s===500?5:s===250?4:3;
        bossHpRef.current=hp;
        setBossActive(true); setBossX(W); setBossHp(hp);
      }
    }

    const s=scoreRef.current;
    const spawnRate=s<10?0:s<30?120:s<60?90:s<100?70:Math.max(45,90-Math.floor(s/3));
    if(spawnRate>0&&f%spawnRate===0&&!bossRef.current){
      const count=Math.random()<0.25&&s>50?2:1;
      for(let i=0;i<count;i++){
        const t=GROUND_OBS[Math.floor(Math.random()*GROUND_OBS.length)];
        obsRef.current.push({...t,id:objId.current++,x:W+i*60});
      }
    }
    const flyRate=s<30?0:Math.max(80,160-Math.floor(s/3));
    if(flyRate>0&&f%flyRate===40&&!bossRef.current){
      const fe=FLY_OBS[Math.floor(Math.random()*FLY_OBS.length)];
      flyRef.current.push({...fe,id:objId.current++,x:W});
    }
    if(f%55===27){
      const fly=Math.random()<0.4;
      coinRef.current.push({id:objId.current++,x:W,y:fly?GROUND_Y-80-Math.random()*50:GROUND_Y+5,collected:false});
    }
    if(f%300===150){
      const pu=POWERUPS[Math.floor(Math.random()*POWERUPS.length)];
      puRef.current.push({...pu,id:objId.current++,x:W,y:GROUND_Y-70});
    }
    if(bossRef.current){
      bossXRef.current-=effSp*0.7;
      if(bossXRef.current<W*0.55)bossXRef.current=W*0.55;
      setBossX(bossXRef.current);
    }
    obsRef.current=obsRef.current.map(o=>({...o,x:o.x-effSp})).filter(o=>o.x>-70);
    flyRef.current=flyRef.current.map(e=>({...e,x:e.x-effSp})).filter(e=>e.x>-60);
    coinRef.current=coinRef.current.map(c=>({...c,x:c.x-effSp})).filter(c=>c.x>-40);
    puRef.current=puRef.current.map(p=>({...p,x:p.x-effSp})).filter(p=>p.x>-50);

    const cL=CHAR_X+6,cR=CHAR_X+CHAR_W-6,cT=playerY.current+5,cB=playerY.current+CHAR_H-4;
    const magnetOn=hasPU('magnet');
    coinRef.current.forEach(c=>{
      if(c.collected)return;
      if(magnetOn){
        const dist=Math.hypot((c.x+12)-(CHAR_X+25),(c.y+12)-(playerY.current+25));
        if(dist<MAGNET_RANGE){
          const ang=Math.atan2((playerY.current+25)-(c.y+12),(CHAR_X+25)-(c.x+12));
          c.x+=Math.cos(ang)*9; c.y+=Math.sin(ang)*9;
        }
      }
      if(c.x+COIN_SIZE>cL&&c.x<cR&&c.y+COIN_SIZE>cT&&c.y<cB){
        c.collected=true; coinsRef.current++;
        setUiCoins(coinsRef.current);
        spawnParticles(c.x+12,c.y,'#ffd740',8);
        if(soundOn) Vibration.vibrate(20);
      }
    });
    coinRef.current=coinRef.current.filter(c=>!c.collected);
    puRef.current.forEach(p=>{
      if(p.picked)return;
      if(p.x+32>cL&&p.x<cR&&p.y+32>cT&&p.y<cB){p.picked=true;activatePU(p.id);}
    });
    puRef.current=puRef.current.filter(p=>!p.picked);

    const immune=hasPU('invincible')||hasPU('jetpack');
    let hit=false;
    if(!immune){
      obsRef.current.forEach(o=>{if(cR>o.x+4&&cL<o.x+o.w-4&&cB>GROUND_Y+4&&cT<GROUND_Y+o.h-4)hit=true;});
      flyRef.current.forEach(e=>{if(cR>e.x+4&&cL<e.x+e.w-4&&cB>e.flyY+4&&cT<e.flyY+e.h-4)hit=true;});
      if(bossRef.current){
        if(cR>bossXRef.current&&cL<bossXRef.current+70&&cB>GROUND_Y-80&&cT<GROUND_Y+60)hit=true;
      }
    }
    if(hit){
      if(shieldOn.current){
        shieldOn.current=false; activePRef.current={...activePRef.current,shield:0};
        setActivePUs({...activePRef.current}); doShake();
        spawnParticles(CHAR_X+25,playerY.current,'#00acc1',14);
      } else if(extraLife.current&&!usedExtra.current){
        usedExtra.current=true; extraLife.current=false; doShake();
        spawnParticles(CHAR_X+25,playerY.current,'#f44336',14);
      } else { endGame(); return; }
    }
    setCharY(playerY.current);
    setObsArr([...obsRef.current]);
    setFlyArr([...flyRef.current]);
    setCoinArr([...coinRef.current]);
    setPuPickups([...puRef.current]);
  }

  function endGame(){
    running.current=false; clearInterval(loop.current); doShake();
    const s=scoreRef.current,c=coinsRef.current;
    setDeadScore(s); setDeadCoins(c);
    if(s>highScore){
      setHighScore(s);
      setLeaderboard(lb=>lb.map(e=>e.name==='You'?{...e,score:s}:e).sort((a,b)=>b.score-a.score));
    }
    setCoins(prev=>prev+c);
    const newTotal=totalCoins+c; setTotalCoins(newTotal);
    setXp(prev=>prev+s);
    ACHIEVEMENTS.forEach(a=>{if(!unlockedAch.includes(a.id)&&a.check(s,newTotal,gamesPlayed))setUnlockedAch(prev=>[...prev,a.id]);});
    MISSIONS.forEach(m=>{if(!doneMissions.includes(m.id)&&m.check(s,newTotal,gamesPlayed,puUsedRef.current))setDoneMissions(prev=>[...prev,m.id]);});
    setScreen('dead');
  }

  function watchAdExtraLife(){
    Alert.alert('📺 Watch Ad','You get a free Extra Life!',[{text:'OK',onPress:()=>{
      extraLife.current=true; usedExtra.current=false; running.current=true;
      loop.current=setInterval(tick,LOOP_MS); setScreen('game');
    }}]);
  }

  function watchAdDoubleCoins(){
    Alert.alert('📺 Watch Ad','Double coins added!',[{text:'OK',onPress:()=>{
      const b=deadCoins; setCoins(c=>c+b); setDeadCoins(d=>d+b);
    }}]);
  }

  function claimDaily(){
    const nextDay=(dailyDay%7)+1;
    const reward=DAILY_REWARDS[nextDay-1];
    if(reward.type==='coins') setCoins(c=>c+reward.reward);
    else {
      const locked=CHARACTERS.filter(c=>!ownedChars.includes(c.id));
      if(locked.length>0){
        const skin=locked[Math.floor(Math.random()*locked.length)];
        setOwnedChars(prev=>[...prev,skin.id]);
        Alert.alert('🎁 Rare Skin!',`Unlocked ${skin.emoji} ${skin.label}!`);
      }
    }
    setDailyDay(nextDay); setDailyDone(true);
    Alert.alert('🎁 Day '+nextDay+' Reward!',reward.label+' claimed!');
    setScreen('menu');
  }

  function doSpin(){
    const rewards=['🪙 50 Coins','🪙 100 Coins','🪙 200 Coins','🛡️ Shield','🧲 Magnet','🌟 Invincible','🦕 Rare Skin!','🪙 30 Coins'];
    const r=rewards[Math.floor(Math.random()*rewards.length)];
    setSpinResult(r);
    if(r.includes('Coins')){const amt=parseInt(r.replace(/\D/g,''));setCoins(c=>c+(isNaN(amt)?50:amt));}
    else if(r.includes('Shield'))activatePU('shield');
    else if(r.includes('Magnet'))activatePU('magnet');
    else if(r.includes('Invincible'))activatePU('invincible');
    else if(r.includes('Skin')){
      const locked=CHARACTERS.filter(c=>!ownedChars.includes(c.id));
      if(locked.length>0){const skin=locked[Math.floor(Math.random()*locked.length)];setOwnedChars(prev=>[...prev,skin.id]);}
    }
    if(soundOn) Vibration.vibrate([0,50,30,100]);
  }

  async function shareScore(){
    try{await Share.share({message:`🎮 I scored ${deadScore} in Jump Dash! Beat me! #JumpDash`});}catch(e){}
  }

  function buyChar(i){
    const c=CHARACTERS[i];
    if(ownedChars.includes(c.id)){setActiveChar(i);return;}
    if(coins>=c.coins&&highScore>=c.score){
      setCoins(prev=>prev-c.coins); setOwnedChars(prev=>[...prev,c.id]); setActiveChar(i);
    } else Alert.alert('🔒 Locked',`Need: 🪙${c.coins}${c.score>0?` + Score ${c.score}`:''}`);
  }

  function buyPowerup(pu){
    if(coins>=pu.shopCoins){
      setCoins(prev=>prev-pu.shopCoins);
      Alert.alert('✅ Bought!',`${pu.emoji} ${pu.label} ready!`);
    } else Alert.alert('❌ Not enough',`Need 🪙${pu.shopCoins}`);
  }

  const puList=Object.entries(activePUs).filter(([,t])=>t>0);
  const charRotateDeg=charRotate.interpolate({inputRange:[-15,0,15],outputRange:['-15deg','0deg','15deg']});

  // ── NIGHT SKY RENDERER ──
  function renderNightSky(){
    return(
      <>
        {STARS.map((star,i)=>(
          <View key={i} style={{
            position:'absolute', left:star.x, top:star.y,
            width:star.size, height:star.size, borderRadius:star.size,
            backgroundColor:'white',
            opacity: starTwinkle && i%3===0 ? star.opacity*0.4 : star.opacity,
          }}/>
        ))}
        {/* Moon */}
        <Animated.View style={{
          position:'absolute', top:40, right:40,
          opacity:moonGlow,
        }}>
          <Text style={{fontSize:44}}>🌕</Text>
          <View style={{position:'absolute',top:-5,right:-5,width:60,height:60,borderRadius:30,backgroundColor:'rgba(255,255,200,0.1)'}}/>
        </Animated.View>
      </>
    );
  }

  // ── DAY SKY RENDERER ──
  function renderDaySky(){
    return(
      <>
        {/* Sun */}
        <Animated.View style={{position:'absolute',top:35,right:35,opacity:sunGlow}}>
          <Text style={{fontSize:40}}>☀️</Text>
          <View style={{position:'absolute',top:-8,left:-8,width:56,height:56,borderRadius:28,backgroundColor:'rgba(255,220,0,0.15)'}}/>
        </Animated.View>
        {/* Moving Clouds */}
        {CLOUDS.map((cloud,i)=>(
          <Animated.View key={i} style={{
            position:'absolute',
            left:`${cloud.x}%`,
            top:`${cloud.y}%`,
            transform:[{translateX:cloudAnim.interpolate({
              inputRange:[0,W],
              outputRange:[0,-W*0.3*(i%2===0?1:-0.5)],
            })}],
          }}>
            <Text style={{fontSize:cloud.size*22,opacity:0.7}}>☁️</Text>
          </Animated.View>
        ))}
      </>
    );
  }

  // ══════════════════════════════════════
  // SCREENS
  // ══════════════════════════════════════

  if(screen==='menu')return(
    <View style={[S.bg,{backgroundColor:world.sky}]}>
      <StatusBar hidden/>
      {isNightWorld ? renderNightSky() : renderDaySky()}
      <Text style={[S.menuTitle,{color:isNightWorld?'#e3f2fd':'#1a237e'}]}>JUMP DASH</Text>
      <Text style={[S.menuSub,{color:isNightWorld?'#90caf9':'#37474f'}]}>Double Jump • Power-Ups • Boss Fights!</Text>
      <Text style={{color:'#ffd740',fontSize:12,marginBottom:4}}>{currentLevel.label} • XP: {xp}</Text>
      <View style={[S.charBox,{backgroundColor:char.bg}]}>
        <Text style={{fontSize:52}}>{char.emoji}</Text>
        <Text style={{color:'white',fontWeight:'700',marginTop:4,fontSize:13}}>{char.label}</Text>
      </View>
      <TouchableOpacity style={[S.btn,{backgroundColor:'#5c6bc0'}]} onPress={startGame}>
        <Text style={S.btnTxt}>▶ PLAY NOW</Text>
      </TouchableOpacity>
      <View style={S.menuGrid}>
        {[
          {icon:'🛒',label:'Shop',sc:'shop'},
          {icon:'🏆',label:'Scores',sc:'board'},
          {icon:'🎖️',label:'Achiev.',sc:'ach'},
          {icon:'🎯',label:'Missions',sc:'missions'},
          {icon:'🌍',label:'World',sc:'worlds'},
          {icon:'🎰',label:'Spin',sc:'spin'},
          {icon:'⚙️',label:'Settings',sc:'settings'},
        ].map(item=>(
          <TouchableOpacity key={item.sc} style={S.menuCard} onPress={()=>setScreen(item.sc)}>
            <Text style={{fontSize:22}}>{item.icon}</Text>
            <Text style={{color:'white',fontSize:10,fontWeight:'700',marginTop:2}}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {!dailyDone&&(
        <TouchableOpacity style={[S.btn,{backgroundColor:'#f9a825',marginTop:6}]} onPress={()=>setScreen('daily')}>
          <Text style={S.btnTxt}>🎁 Daily Reward! Day {(dailyDay%7)+1}</Text>
        </TouchableOpacity>
      )}
      <Text style={{color:isNightWorld?'#90caf9':'#37474f',marginTop:8,fontSize:12}}>🪙 {coins} • Best: {highScore} • Games: {gamesPlayed}</Text>
    </View>
  );

  if(screen==='game')return(
    <TouchableOpacity style={[S.bg,{backgroundColor:world.sky,transform:shake?[{translateX:6}]:[]}]} onPress={jump} activeOpacity={1}>
      <StatusBar hidden/>
      {isNightWorld ? renderNightSky() : renderDaySky()}
      <View style={[S.ground,{backgroundColor:world.ground}]}/>
      <View style={S.hud}>
        <View>
          <Text style={S.hudScore}>🏆 {uiScore}</Text>
          <Text style={S.hudSub}>⚡ {uiSpeed}x</Text>
        </View>
        <View style={{alignItems:'center'}}>
          <Text style={{fontSize:15}}>{Array.from({length:MAX_JUMPS}).map((_,i)=>i<uiJumps?'🟢':'⚫').join('')}</Text>
          {bossActive&&<Text style={{color:'#f44336',fontWeight:'900',fontSize:10}}>👹 BOSS!</Text>}
          {combo>1&&<Text style={{color:'#ffd740',fontWeight:'900',fontSize:10}}>x{combo} COMBO!</Text>}
        </View>
        <View style={{alignItems:'flex-end'}}>
          <Text style={{color:'#ffd740',fontWeight:'700',fontSize:12}}>🪙 {uiCoins}</Text>
          <TouchableOpacity style={S.stopBtn} onPress={()=>{running.current=false;clearInterval(loop.current);setScreen('menu');}}>
            <Text style={{color:'white',fontSize:10,fontWeight:'700'}}>■ Stop</Text>
          </TouchableOpacity>
        </View>
      </View>

      {comboLabel!==''&&(
        <View style={S.comboPopup}>
          <Text style={S.comboTxt}>{comboLabel}</Text>
        </View>
      )}

      {puList.length>0&&(
        <View style={S.puBadges}>
          {puList.map(([id,t])=>{
            const def=POWERUPS.find(p=>p.id===id);
            return def?(<View key={id} style={[S.puBadge,{borderColor:def.color}]}>
              <Text style={{fontSize:11}}>{def.emoji}</Text>
              <Text style={{color:def.color,fontSize:9}}>{t>60?`${Math.ceil(t/60)}s`:'!'}</Text>
            </View>):null;
          })}
        </View>
      )}

      {obsArr.map(o=>(<View key={o.id} style={[S.obs,{left:o.x,top:GROUND_Y,width:o.w,height:o.h,backgroundColor:o.color}]}><Text style={{fontSize:15,textAlign:'center'}}>{o.emoji}</Text></View>))}
      {flyArr.map(e=>(<View key={e.id} style={[S.obs,{left:e.x,top:e.flyY,width:e.w,height:e.h,backgroundColor:e.color,borderRadius:8}]}><Text style={{fontSize:16,textAlign:'center'}}>{e.emoji}</Text></View>))}
      {coinArr.map(c=>(<Text key={c.id} style={[S.coin,{left:c.x,top:c.y}]}>🪙</Text>))}
      {puPickups.map(p=>(<View key={p.id} style={[S.puPickup,{left:p.x,top:p.y,borderColor:p.color}]}><Text style={{fontSize:17}}>{p.emoji}</Text></View>))}
      {bossActive&&(<View style={[S.boss,{left:bossX}]}><Text style={{fontSize:46}}>👹</Text><Text style={{color:'red',fontWeight:'900',fontSize:10}}>{'❤️'.repeat(bossHp)}</Text></View>)}

      {/* Dust particles */}
      {dustParticles.map(p=>(<View key={p.id} style={{position:'absolute',left:p.x,top:p.y,width:p.size,height:p.size,borderRadius:p.size/2,backgroundColor:p.color,opacity:0.7}}/>))}

      {/* Character with animation */}
      <Animated.View style={[S.char,{
        top:charY, left:CHAR_X,
        backgroundColor:char.color,
        transform:[{rotate:charRotateDeg},{scale:charScale}],
        shadowColor:hasPU('invincible')?'#ffeb3b':hasPU('shield')?'#00acc1':'#000',
        shadowRadius:(hasPU('invincible')||hasPU('shield'))?20:4,
        shadowOpacity:0.9,
      }]}>
        <Text style={{fontSize:26}}>{hasPU('jetpack')?'🚀':hasPU('invincible')?'🌟':char.emoji}</Text>
        {hasPU('shield')&&<Text style={S.charBadge}>🛡️</Text>}
        {hasPU('magnet')&&<Text style={[S.charBadge,{left:-8}]}>🧲</Text>}
      </Animated.View>

      {particles.map(p=>(<View key={p.id} style={{position:'absolute',left:p.x,top:p.y,width:p.size,height:p.size,borderRadius:p.size/2,backgroundColor:p.color,opacity:0.85}}/>))}
    </TouchableOpacity>
  );

  if(screen==='dead')return(
    <View style={S.overlay}>
      <StatusBar hidden/>
      <Text style={{fontSize:56}}>💥</Text>
      <Text style={S.deadTitle}>Game Over!</Text>
      <View style={S.scoreCard}>
        <Text style={S.scoreRow}>🏆 Score: <Text style={{color:'#ffd740'}}>{deadScore}</Text></Text>
        <Text style={S.scoreRow}>🥇 Best: <Text style={{color:'#69f0ae'}}>{highScore}</Text></Text>
        <Text style={S.scoreRow}>🪙 Coins: <Text style={{color:'#ffd740'}}>{deadCoins}</Text></Text>
        <Text style={S.scoreRow}>⚡ XP: <Text style={{color:'#90caf9'}}>+{deadScore}</Text></Text>
        {deadScore>=highScore&&deadScore>0&&<Text style={{color:'#ffd740',textAlign:'center',marginTop:4,fontWeight:'700'}}>🎉 New Record!</Text>}
      </View>
      <TouchableOpacity style={[S.btn,{backgroundColor:'#5c6bc0'}]} onPress={startGame}><Text style={S.btnTxt}>🔄 Try Again</Text></TouchableOpacity>
      <View style={{flexDirection:'row',gap:8,marginTop:8}}>
        <TouchableOpacity style={[S.btnSm,{backgroundColor:'#e53935'}]} onPress={watchAdExtraLife}><Text style={S.btnTxt}>📺 Extra Life</Text></TouchableOpacity>
        <TouchableOpacity style={[S.btnSm,{backgroundColor:'#f9a825'}]} onPress={watchAdDoubleCoins}><Text style={S.btnTxt}>📺 2x Coins</Text></TouchableOpacity>
      </View>
      <TouchableOpacity style={[S.btnSm,{backgroundColor:'#1565c0',marginTop:6}]} onPress={shareScore}><Text style={S.btnTxt}>📤 Share Score</Text></TouchableOpacity>
      <TouchableOpacity style={[S.btn,{backgroundColor:'#37474f',marginTop:6}]} onPress={()=>setScreen('menu')}><Text style={S.btnTxt}>🏠 Menu</Text></TouchableOpacity>
    </View>
  );

  if(screen==='shop')return(
    <View style={[S.bg,{backgroundColor:'#0d0d2b'}]}>
      <StatusBar hidden/>
      <Text style={S.pageTitle}>🛒 Shop</Text>
      <Text style={{color:'#ffd740',textAlign:'center',marginBottom:4}}>🪙 {coins} • Best: {highScore}</Text>
      <ScrollView style={{width:'100%',paddingHorizontal:14}} showsVerticalScrollIndicator={false}>
        <Text style={{color:'white',fontWeight:'900',fontSize:15,marginVertical:8}}>⚡ Power-Ups</Text>
        {POWERUPS.map(pu=>(
          <TouchableOpacity key={pu.id} style={[S.shopItem,{borderColor:pu.color+'55'}]} onPress={()=>buyPowerup(pu)}>
            <Text style={{fontSize:24,width:38,textAlign:'center'}}>{pu.emoji}</Text>
            <View style={{flex:1,marginLeft:10}}>
              <Text style={{color:'white',fontWeight:'700',fontSize:14}}>{pu.label}</Text>
              <Text style={{color:'#90a4ae',fontSize:11}}>🪙 {pu.shopCoins} coins</Text>
            </View>
            <View style={[S.shopBtn,{backgroundColor:pu.color+'99'}]}>
              <Text style={{color:'white',fontWeight:'700',fontSize:12}}>Buy</Text>
            </View>
          </TouchableOpacity>
        ))}
        <Text style={{color:'white',fontWeight:'900',fontSize:15,marginVertical:8}}>🎮 Characters</Text>
        {CHARACTERS.map((c,i)=>{
          const owned=ownedChars.includes(c.id),active=activeChar===i,canBuy=coins>=c.coins&&highScore>=c.score;
          return(<TouchableOpacity key={c.id} style={[S.shopItem,{borderColor:active?'#5c6bc0':'rgba(255,255,255,0.12)',opacity:owned||canBuy?1:0.5}]} onPress={()=>buyChar(i)}>
            <View style={[S.shopEmoji,{backgroundColor:c.bg}]}><Text style={{fontSize:24}}>{c.emoji}</Text></View>
            <View style={{flex:1,marginLeft:10}}>
              <Text style={{color:'white',fontWeight:'700',fontSize:14}}>{c.label}</Text>
              <Text style={{color:'#90a4ae',fontSize:11}}>{owned?(active?'Active ✓':'Owned'):`🪙${c.coins}${c.score>0?` + Score ${c.score}`:''}`}</Text>
            </View>
            <View style={[S.shopBtn,{backgroundColor:active?'#388e3c':owned?'#1565c0':canBuy?'#7b1fa2':'#37474f'}]}>
              <Text style={{color:'white',fontWeight:'700',fontSize:11}}>{active?'✓ On':owned?'Use':canBuy?'Buy':'🔒'}</Text>
            </View>
          </TouchableOpacity>);
        })}
        <View style={{height:20}}/>
      </ScrollView>
      <TouchableOpacity style={[S.btn,{backgroundColor:'#37474f',margin:10}]} onPress={()=>setScreen('menu')}><Text style={S.btnTxt}>← Back</Text></TouchableOpacity>
    </View>
  );

  if(screen==='board')return(
    <View style={[S.bg,{backgroundColor:'#0d0d2b',padding:20}]}>
      <StatusBar hidden/>
      <Text style={S.pageTitle}>🏆 Leaderboard</Text>
      {leaderboard.map((e,i)=>(
        <View key={i} style={[S.lbRow,{borderColor:i===0?'#ffd740':'rgba(255,255,255,0.1)'}]}>
          <Text style={{color:['#ffd740','#b0bec5','#ff8a65'][i]||'#546e7a',fontSize:20,width:30,fontWeight:'900'}}>{['🥇','🥈','🥉'][i]||(i+1)}</Text>
          <Text style={{color:e.name==='You'?'#90caf9':'white',flex:1,fontWeight:'700'}}>{e.name}{e.name==='You'?' (Me)':''}</Text>
          <Text style={{color:i===0?'#ffd740':'white',fontWeight:'700',fontSize:16}}>{e.score}</Text>
        </View>
      ))}
      <TouchableOpacity style={[S.btn,{backgroundColor:'#37474f',marginTop:14}]} onPress={()=>setScreen('menu')}><Text style={S.btnTxt}>← Back</Text></TouchableOpacity>
    </View>
  );

  if(screen==='ach')return(
    <View style={[S.bg,{backgroundColor:'#0d0d2b',padding:20}]}>
      <StatusBar hidden/>
      <Text style={S.pageTitle}>🎖️ Achievements</Text>
      <Text style={{color:'#90a4ae',textAlign:'center',marginBottom:12}}>{unlockedAch.length}/{ACHIEVEMENTS.length} unlocked</Text>
      {ACHIEVEMENTS.map(a=>{
        const done=unlockedAch.includes(a.id);
        return(<View key={a.id} style={[S.achItem,{borderColor:done?'#388e3c':'rgba(255,255,255,0.1)',opacity:done?1:0.5}]}><Text style={{fontSize:22}}>{done?'✅':'🔒'}</Text><Text style={{color:'white',fontWeight:'700',marginLeft:12,fontSize:13}}>{a.label}</Text></View>);
      })}
      <TouchableOpacity style={[S.btn,{backgroundColor:'#37474f',marginTop:14}]} onPress={()=>setScreen('menu')}><Text style={S.btnTxt}>← Back</Text></TouchableOpacity>
    </View>
  );

  if(screen==='missions')return(
    <View style={[S.bg,{backgroundColor:'#0d0d2b',padding:20}]}>
      <StatusBar hidden/>
      <Text style={S.pageTitle}>🎯 Missions</Text>
      <Text style={{color:'#90a4ae',textAlign:'center',marginBottom:12}}>{doneMissions.length}/{MISSIONS.length} done</Text>
      {MISSIONS.map(m=>{
        const done=doneMissions.includes(m.id);
        return(<View key={m.id} style={[S.achItem,{borderColor:done?'#f9a825':'rgba(255,255,255,0.1)',opacity:done?1:0.55}]}><Text style={{fontSize:22}}>{done?'✅':'🎯'}</Text><Text style={{color:'white',fontWeight:'700',marginLeft:12,fontSize:13}}>{m.label}</Text></View>);
      })}
      <TouchableOpacity style={[S.btn,{backgroundColor:'#37474f',marginTop:14}]} onPress={()=>setScreen('menu')}><Text style={S.btnTxt}>← Back</Text></TouchableOpacity>
    </View>
  );

  if(screen==='worlds')return(
    <View style={[S.bg,{backgroundColor:'#0d0d2b',padding:20}]}>
      <StatusBar hidden/>
      <Text style={S.pageTitle}>🌍 Choose World</Text>
      {WORLDS.map((w,i)=>(
        <TouchableOpacity key={w.id} style={[S.lbRow,{borderColor:worldIdx===i?'#5c6bc0':'rgba(255,255,255,0.1)',backgroundColor:worldIdx===i?'rgba(92,107,192,0.2)':'transparent'}]} onPress={()=>{setWorldIdx(i);setScreen('menu');}}>
          <Text style={{fontSize:24,marginRight:10}}>{w.label.split(' ')[0]}</Text>
          <Text style={{color:'white',fontWeight:'700',flex:1,fontSize:14}}>{w.label}</Text>
          {worldIdx===i&&<Text style={{color:'#5c6bc0',fontWeight:'900'}}>✓</Text>}
        </TouchableOpacity>
      ))}
      <TouchableOpacity style={[S.btn,{backgroundColor:'#37474f',marginTop:14}]} onPress={()=>setScreen('menu')}><Text style={S.btnTxt}>← Back</Text></TouchableOpacity>
    </View>
  );

  if(screen==='spin')return(
    <View style={S.overlay}>
      <StatusBar hidden/>
      <Text style={{fontSize:56}}>🎰</Text>
      <Text style={S.deadTitle}>Lucky Spin!</Text>
      <Text style={{color:'#90a4ae',textAlign:'center',marginBottom:10,fontSize:13}}>Spin to win coins, power-ups or rare skins!</Text>
      {spinResult!==''&&(
        <View style={S.scoreCard}>
          <Text style={{color:'#ffd740',fontSize:20,fontWeight:'900',textAlign:'center'}}>🎉 {spinResult}</Text>
        </View>
      )}
      <TouchableOpacity style={[S.btn,{backgroundColor:'#7b1fa2'}]} onPress={doSpin}>
        <Text style={S.btnTxt}>🎰 SPIN!</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[S.btn,{backgroundColor:'#37474f',marginTop:10}]} onPress={()=>setScreen('menu')}><Text style={S.btnTxt}>← Back</Text></TouchableOpacity>
    </View>
  );

  if(screen==='settings')return(
    <View style={[S.bg,{backgroundColor:'#0d0d2b',padding:20}]}>
      <StatusBar hidden/>
      <Text style={S.pageTitle}>⚙️ Settings</Text>
      <View style={[S.lbRow,{borderColor:'rgba(255,255,255,0.1)'}]}>
        <Text style={{color:'white',fontWeight:'700',flex:1,fontSize:15}}>🔊 Sound & Vibration</Text>
        <TouchableOpacity style={[S.shopBtn,{backgroundColor:soundOn?'#388e3c':'#37474f'}]} onPress={()=>setSoundOn(s=>!s)}>
          <Text style={{color:'white',fontWeight:'700'}}>{soundOn?'ON':'OFF'}</Text>
        </TouchableOpacity>
      </View>
      <View style={[S.scoreCard,{marginTop:14}]}>
        <Text style={{color:'white',fontWeight:'700',fontSize:14,marginBottom:8}}>📊 Your Stats</Text>
        <Text style={{color:'#90a4ae',marginBottom:4}}>🎮 Games Played: {gamesPlayed}</Text>
        <Text style={{color:'#90a4ae',marginBottom:4}}>🪙 Total Coins: {totalCoins}</Text>
        <Text style={{color:'#90a4ae',marginBottom:4}}>🏆 Best Score: {highScore}</Text>
        <Text style={{color:'#90a4ae',marginBottom:4}}>⚡ Total XP: {xp}</Text>
        <Text style={{color:'#90a4ae'}}>👑 Level: {currentLevel.label}</Text>
      </View>
      <TouchableOpacity style={[S.btn,{backgroundColor:'#37474f',marginTop:14}]} onPress={()=>setScreen('menu')}><Text style={S.btnTxt}>← Back</Text></TouchableOpacity>
    </View>
  );

  if(screen==='daily')return(
    <View style={S.overlay}>
      <StatusBar hidden/>
      <Text style={{fontSize:56}}>🎁</Text>
      <Text style={S.deadTitle}>Daily Rewards!</Text>
      <ScrollView style={{width:'90%',maxHeight:300}} showsVerticalScrollIndicator={false}>
        {DAILY_REWARDS.map((r,i)=>(
          <View key={i} style={[S.lbRow,{borderColor:(dailyDay%7)+1===r.day?'#f9a825':'rgba(255,255,255,0.1)',backgroundColor:(dailyDay%7)+1===r.day?'rgba(249,168,37,0.15)':'transparent'}]}>
            <Text style={{color:'white',fontWeight:'700',width:44,fontSize:13}}>Day {r.day}</Text>
            <Text style={{color:'#ffd740',flex:1,fontWeight:'700',fontSize:13}}>{r.label}</Text>
            {dailyDay>=r.day&&<Text style={{color:'#388e3c',fontSize:16}}>✅</Text>}
          </View>
        ))}
      </ScrollView>
      {!dailyDone&&(
        <TouchableOpacity style={[S.btn,{backgroundColor:'#f9a825',marginTop:10}]} onPress={claimDaily}>
          <Text style={S.btnTxt}>🎁 Claim Day {(dailyDay%7)+1}!</Text>
        </TouchableOpacity>
      )}
      {dailyDone&&<Text style={{color:'#90a4ae',marginTop:10,fontSize:13}}>Come back tomorrow! 🌅</Text>}
      <TouchableOpacity style={[S.btn,{backgroundColor:'#37474f',marginTop:8}]} onPress={()=>setScreen('menu')}><Text style={S.btnTxt}>← Back</Text></TouchableOpacity>
    </View>
  );

  return null;
}

const S=StyleSheet.create({
  bg:{flex:1,alignItems:'center',justifyContent:'center',position:'relative',overflow:'hidden'},
  overlay:{flex:1,backgroundColor:'rgba(0,0,0,0.88)',alignItems:'center',justifyContent:'center',gap:6,paddingVertical:20},
  ground:{position:'absolute',bottom:140,left:0,right:0,height:5},
  hud:{position:'absolute',top:0,left:0,right:0,flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:10,paddingTop:12,backgroundColor:'rgba(0,0,0,0.45)',zIndex:10},
  hudScore:{color:'white',fontWeight:'900',fontSize:20},
  hudSub:{color:'#90a4ae',fontSize:10},
  comboPopup:{position:'absolute',top:H/3,left:0,right:0,alignItems:'center',zIndex:20},
  comboTxt:{color:'#ffd740',fontSize:30,fontWeight:'900',textShadowColor:'#000',textShadowRadius:8},
  puBadges:{position:'absolute',top:72,right:10,gap:3,zIndex:10},
  puBadge:{flexDirection:'row',alignItems:'center',gap:2,borderWidth:1.5,borderRadius:10,paddingHorizontal:5,paddingVertical:2,backgroundColor:'rgba(0,0,0,0.6)'},
  char:{position:'absolute',width:CHAR_W,height:CHAR_H,alignItems:'center',justifyContent:'center',borderRadius:12,elevation:8},
  charBadge:{position:'absolute',top:-10,right:-6,fontSize:11},
  obs:{position:'absolute',alignItems:'center',justifyContent:'center',elevation:6},
  coin:{position:'absolute',fontSize:17},
  puPickup:{position:'absolute',width:32,height:32,borderRadius:16,borderWidth:2,alignItems:'center',justifyContent:'center',backgroundColor:'rgba(0,0,0,0.5)'},
  boss:{position:'absolute',top:GROUND_Y-90,width:70,height:90,alignItems:'center',justifyContent:'center'},
  stopBtn:{backgroundColor:'rgba(211,47,47,0.85)',paddingHorizontal:8,paddingVertical:3,borderRadius:8,marginTop:3},
  btn:{paddingVertical:13,paddingHorizontal:34,borderRadius:13,alignItems:'center',minWidth:196,elevation:6},
  btnSm:{paddingVertical:10,paddingHorizontal:15,borderRadius:10,alignItems:'center',elevation:4},
  btnTxt:{color:'white',fontWeight:'700',fontSize:14},
  menuTitle:{fontSize:34,fontWeight:'900',letterSpacing:2,marginBottom:2},
  menuSub:{fontSize:12,marginBottom:6},
  charBox:{borderRadius:18,padding:14,alignItems:'center',marginBottom:12,width:100},
  menuGrid:{flexDirection:'row',flexWrap:'wrap',justifyContent:'center',gap:8,marginVertical:8},
  menuCard:{width:66,height:66,borderRadius:14,alignItems:'center',justifyContent:'center',backgroundColor:'rgba(255,255,255,0.18)',elevation:4},
  deadTitle:{color:'white',fontSize:28,fontWeight:'900'},
  scoreCard:{backgroundColor:'rgba(255,255,255,0.1)',borderRadius:14,padding:16,width:'85%',marginVertical:8,gap:5},
  scoreRow:{color:'white',fontSize:15,fontWeight:'700'},
  pageTitle:{color:'white',fontSize:24,fontWeight:'900',textAlign:'center',marginBottom:8,marginTop:12},
  shopItem:{flexDirection:'row',alignItems:'center',backgroundColor:'rgba(255,255,255,0.06)',borderWidth:2,borderRadius:12,padding:10,marginBottom:8},
  shopEmoji:{width:46,height:46,borderRadius:10,alignItems:'center',justifyContent:'center'},
  shopBtn:{paddingHorizontal:10,paddingVertical:7,borderRadius:8,minWidth:42,alignItems:'center'},
  lbRow:{flexDirection:'row',alignItems:'center',borderWidth:2,borderRadius:10,padding:10,marginBottom:6,width:'100%',gap:8},
  achItem:{flexDirection:'row',alignItems:'center',borderWidth:2,borderRadius:10,padding:12,marginBottom:6,width:'100%'},
});
