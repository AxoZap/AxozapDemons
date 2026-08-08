// Bulk Level ID updater for AxoZap Demons
// Run with: node bulk_update_level_ids.mjs YOUR_ADMIN_PASSWORD

const API_URL = 'https://vtuicybayinxdcbfubyl.supabase.co/functions/v1/make-server-7e6e6986';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0dWljeWJheWlueGRjYmZ1YnlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNjI0NTcsImV4cCI6MjA4NTYzODQ1N30.GySpDxd4IS3GTYAdRAPDd4XfFIzSmDptr3UlXHrPOqI';
const password = process.argv[2];

if (!password) {
  console.error('Usage: node bulk_update_level_ids.mjs YOUR_ADMIN_PASSWORD');
  process.exit(1);
}

// Manual mapping: database ID → GD Level ID
// Key = database record ID, Value = GD level ID string
// Matched by name + gauntlet/weekly/event context from the live demon list
const LEVEL_ID_MAP = {
  // === ID 1-176 (sequential, added early) ===
  '1':  '90475473',  // Change of Scene (non-gauntlet)
  '2':  '566659',   // Demon Mixed
  '3':  '55520',    // The Lightning Road (timeless real)
  // 4 = Clubstep (official GD level, not on GDDL typically) — skip
  '5':  '13519',    // The Nightmare
  // 6 = Boss Rush (Moon) — skip
  // 7 = Theory of Everything 2 (official) — skip
  // 8 = Stella Infection (Moon) — skip
  // 9 = Maethrillian (Moon) — skip
  // 10 = Deadlocked (official) — skip
  // 11 = Flame Arena 1 (Moon) — skip
  // 12 = Back Again (Moon) — skip
  '13': '5904109',  // Platinum Adventures
  // 14 = Jungle Swing (Moon) — skip
  '15': '45932196', // abcdefghijklmnopqrs
  '16': '57012656', // Ship
  '17': '98071844', // Star Road (weekly)
  '18': '98071844', // Star Road (non-weekly)
  '21': '848722',   // Lights and Thunder
  '22': '34085027', // B
  // 23 = A Platformer Level (Moon) — skip
  // 26 = Switchscapes (Moon) — skip
  // 27 = Fast N Accuracy (Moon) — skip
  // 30 = FlipSwap Factory (Moon) — skip
  '31': '14850167', // Horizon
  '32': '83294687', // Caput Mundi (gauntlet)
  '33': '83294687', // Caput Mundi (non-gauntlet)
  '35': '89886591', // ISpyWithMyLittleEye (non-gauntlet)
  '36': '100117857',// Speed
  '38': '186646',   // Crescendo
  '39': '15427055', // Megalovania
  '40': '8660411',  // Death Moon (non-gauntlet)
  '41': '105524765',// Necrus (non-gauntlet, non-weekly)
  '42': '105524765',// Necrus (weekly)
  '43': '36670741', // Horizon Zero
  '44': '104138684',// Explorers
  '47': '65765662', // iS
  '48': '56210242', // Shiver
  '50': '4284013',  // Nine Circles
  // 51 = Coaster Mountain (Moon) — skip
  '52': '56287',    // Extreme Park
  // 53 = Ufo Trials (Moon) — skip
  // 54 = Twenty Trials (Moon) — skip
  // 55 = 60 Seconds (Moon) — skip
  '56': '428765',   // Electroman Adven V2
  '57': '112204024',// Citadel (event)
  '58': '112204024',// Citadel (non-event)
  '59': '113049620',// Cheat Codes (event)
  '61': '26245696', // Trump Circles
  '62': '2997354',  // Decode
  '63': '118509879',// Skeletal Shenanigans (event)
  // 64 = Ore Clicker II (Moon) — skip
  '65': '118509879',// Skeletal Shenanigans (non-event)
  // 66 = Enter The Grid (Moon) — skip
  '67': '3543219',  // Speed Racer
  '68': '56587109', // Phjork
  '69': '61348317', // What Is It
  '70': '66689817', // Shock Therapy
  '71': '76208050', // Thien Long
  '72': '84847786', // Distal Corridor
  '73': '90277849', // Step Closer To Death
  '74': '91021939', // Shattering Light
  '75': '106219235',// Retrospect
  '76': '107968410',// Lonely Path
  '77': '96732638', // Im Dead (gauntlet)
  '78': '96732638', // Im Dead (non-gauntlet)
  '79': '70680001', // Last Abyss (gauntlet)
  '80': '70680001', // Last Abyss (non-gauntlet)
  '81': '69487890', // Deathstep III (gauntlet)
  '82': '89886591', // ISpyWithMyLittleEye (gauntlet)
  '83': '8660411',  // Death Moon (gauntlet)
  '84': '110067',   // XYZ Step
  '85': '213862',   // Demon Step
  '86': '318864',   // Ice Cave
  '87': '453613',   // Insane Club
  '88': '61168641', // Firewall
  '89': '55731450', // High Rebound
  '90': '92716951', // I Made This 4 Fun
  '91': '113049620',// Cheat Codes (non-event)
  // 92 = Forsaken City (Moon) — skip
  // 93 = The Lightning Road (Moon) — skip
  // 94 = 100 Jumps (Moon) — skip
  '95': '305550',   // Demon Forest
  '96': '839175',   // Electrodynamix V2
  '97': '2891681',  // Shadow Temple
  '98': '59315849', // Double Dash
  '99': '11402965', // Forest Temple
  '100': '85383554',// Stereo Extremeness
  '101': '39387387',// Mountain King
  '102': '341613',  // xStep v2
  '103': '94229906',// Impossible Demon
  '104': '40945673',// CraZy
  '105': '47620786',// CraZy II
  '106': '94147402',// Make It Funkier
  '107': '120432',  // Bicycle
  '108': '91674875',// Sunfall
  '109': '56568010',// Magma Bound
  '110': '3979721', // Cataclysm (spelled "Catalysm" in DB)
  '111': '90251922',// Sinless Ash (gauntlet)
  '112': '90475473',// Change of Scene (gauntlet)
  '113': '110610038',// Next Cab Soon (gauntlet)
  '114': '109432148',// The Incinerator (gauntlet)
  '115': '18025697',// SideStep (gauntlet)
  '116': '23189196',// Traction (gauntlet)
  '117': '27786218',// Mechanical Showdown (gauntlet)
  '118': '27728679',// Vibration (gauntlet)
  '119': '25706351',// HeLL (gauntlet)
  '120': '38427291',// Extinction (gauntlet)
  '121': '38514054',// Buried Angel (gauntlet)
  '122': '36966088',// Shrill Hallway (gauntlet)
  '123': '38398923',// Nowise (gauntlet)
  '124': '36745142',// Darkness Keeper (gauntlet)
  '125': '33244195',// Adust (gauntlet)
  '126': '33244195',// Adust (non-gauntlet)
  '127': '35418014',// The Behemoth (gauntlet)
  '128': '95484955',// Petal Patch (gauntlet)
  '129': '106517747',// Astralith (gauntlet)
  '130': '110772842',// Uprising (gauntlet)
  '131': '15619194',// Motion (gauntlet)
  '132': '90809996',// Metal Magic (gauntlet)
  '133': '57871639',// Submerged (gauntlet)
  '134': '82135935',// Trek (gauntlet)
  '135': '81764520',// Soar (gauntlet)
  '136': '108372523',// Great Asset (gauntlet)
  '137': '108372523',// Great Asset (non-gauntlet)
  '138': '70511594',// Fall Apart (gauntlet)
  '139': '70511594',// Fall Apart (non-gauntlet)
  '140': '82977900',// Not A Phobia (gauntlet)
  '141': '69954089',// Crystal Corridor (gauntlet)
  '142': '115528545',// Silhouette Garden (gauntlet)
  '143': '92275315',// Radiant Rift (gauntlet)
  '144': '68790607',// Ablaze (gauntlet)
  '145': '68790607',// Ablaze (non-gauntlet)
  '146': '75603568',// Tabasco (gauntlet)
  '147': '57066554',// Inferno (gauntlet)
  '148': '49941534',// In Silico (gauntlet)
  '149': '80218929',// Crush (gauntlet)
  '150': '95436164',// Glorious Fortress (gauntlet)
  '151': '64302902',// Sky Tower (gauntlet)
  '152': '65044525',// CastleMania (gauntlet)
  '153': '66960655',// Still Life (gauntlet)
  '154': '81451870',// Down Unda (gauntlet)
  '155': '81451870',// Down Unda (non-gauntlet)
  '156': '83323867',// Fizzy Fossils (gauntlet)
  '157': '83320529',// Koenigstein (gauntlet)
  '158': '83315343',// Xin Chao (gauntlet)
  '159': '83324930',// Xanadu (gauntlet)
  '160': '110681124',// Slasher (gauntlet)
  '161': '110774310',// I See Stars (gauntlet)
  '162': '110638716',// Neozenith (gauntlet)
  '163': '110638716',// Neozenith (non-gauntlet)
  '164': '110473393',// Magistro (gauntlet)
  '165': '110473393',// Magistro (non-gauntlet)
  '166': '110774330',// Wanna Cry (non-gauntlet)
  '167': '83323273',// Ruta Del Sol (gauntlet)
  '168': '83025300',// Bismarck (gauntlet)
  '169': '83025300',// Bismarck (non-gauntlet)
  '170': '83296274',// Lutetia (gauntlet)
  '171': '83256789',// Pabrik (gauntlet)
  '172': '83323659',// Asadal (gauntlet)
  '173': '80044470',// Ocean Rush (gauntlet)
  '174': '110774330',// Wanna Cry (gauntlet)
  '175': '92971865',// Calypso Blitz (gauntlet)
  '176': '92971865',// Calypso Blitz (non-gauntlet)

  // === Timestamp IDs (added later) ===
  '1770083010170': '358750',   // Clutterfunk V2
  '1770084252047': '369294',   // Theory Of Every v2
  '1770348277694': '60887211', // Ultra Violence
  '1770862903738': '102765',   // Hextec Flow
  '1771470682518': '541953',   // ClubDrop
  '1771797871272': '2158028',  // Monstrosity
  '1772254110087': '132322947',// Shanty
  '1773193768951': '65044525', // CastleMania (non-gauntlet online)
  '1775418825349': '5098465',  // Speed Of Light
  '1775879667385': '497514',   // Radioactive Demon
  '1775881121536': '840397',   // Chaotic
  '1775881127475': '413504',   // Crazy Bolt
  '1777941968467': '114532158',// Troll Madness
  '1778115830691': '100841803',// Dashplorers
  '1778352145503': '105524765',// Necrus (gauntlet)
  '1778352718680': '83158255', // Absolute Garbage (gauntlet)
  '1778356414274': '13785846', // -Sirius-
  '1778357591573': '92270379', // Hello Fitzgerald
  '1778524310067': '6939821',  // Jawbreaker
  '1778599435558': '44062068', // Future Funk
  '1781548633494': '83158255', // Absolute Garbage (non-gauntlet)
  '1781548949235': '88123146', // Second Chance
  '1781550059440': '97929930', // Dont Let Me
  '1781630418537': '61079355', // Acu
  '1781740606298': '61417747', // Potal
  '1782004126514': '58270823', // Nantendo
  '1782171852715': '7116121',  // Problematic
  // 1782329768887 = How to Spider (Moon) — skip
  '1782331773608': '21337579', // Gold Temple
  '1782343312989': '2842129',  // Fire Temple
  '1782402018283': '4727649',  // Lava Temple
  '1782407206463': '1864168',  // Water Temple
  '1783611033479': '59495189', // SaDrop
  '1783611614463': '54527858', // WilDrop
  '1783611926998': '56764573', // DeaDrop
  '1783619558794': '62390000', // BlooDrop
  '1783822643725': '6300721',  // Forsaken Neon
  '1783886142927': '513137',   // PG Clubstep
  '1783891653520': '735154',   // Death Step
  '1783893396233': '741635',   // DarnoCant Let Go
  '1783894178681': '776919',   // Genesis
  '1783898581832': '897987',   // Flappy Weird
  '1783899600042': '682941',   // Restricted Area
  '1783978280241': '5232805',  // Death Note
  // 1786209226747 = Boss Rush 2 (Moon) — skip
};

// Fetch all demons
const res = await fetch(`${API_URL}/demons`, { headers: { Authorization: `Bearer ${KEY}` } });
const demons = await res.json();

let updated = 0;
let skipped = 0;
let failed = 0;

for (const demon of demons) {
  const levelId = LEVEL_ID_MAP[demon.id];
  
  if (!levelId) {
    console.log(`⏭  SKIP  [${demon.id}] ${demon.name}`);
    skipped++;
    continue;
  }

  // Already has this levelId, skip
  if (demon.levelId === levelId) {
    console.log(`✅ ALREADY SET [${demon.id}] ${demon.name} → ${levelId}`);
    skipped++;
    continue;
  }

  const updateRes = await fetch(`${API_URL}/demons/${demon.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${KEY}`,
    },
    body: JSON.stringify({
      password,
      demon: { ...demon, levelId },
    }),
  });

  if (updateRes.ok) {
    console.log(`✅ UPDATED [${demon.id}] ${demon.name} → Level ID: ${levelId}`);
    updated++;
  } else {
    const err = await updateRes.json().catch(() => ({}));
    console.error(`❌ FAILED  [${demon.id}] ${demon.name}: ${err.error || updateRes.status}`);
    failed++;
  }

  // Small delay to avoid hammering the API
  await new Promise(r => setTimeout(r, 100));
}

console.log(`\n🎉 Done! Updated: ${updated}, Skipped: ${skipped}, Failed: ${failed}`);
