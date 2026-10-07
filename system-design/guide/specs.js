// Diagram specs for the System Design guide page (one section at a time). Engine: /assets/anim.js
(function () {
  const N = (id, label, c, r, sub, kind, extra) => Object.assign({ id, label, c, r, sub, kind }, extra || {});
  const S = window.ANIM_SPECS = window.ANIM_SPECS || {};

  /* ===== 1. The Big Picture ===== */
  S.g1_simple = { nodes: [N('u','User',0,0,'','client'), N('app','Web / Mobile App',1,0), N('be','Backend Server',2,0,'business logic'), N('db','Database',3,0,'','db')],
    edges: [['u','app'],['app','be'],['be','db']],
    frames: [
      { cap: '1. The user taps "buy"; the app sends an HTTP request to the backend.', send: [{ path: ['u','app','be'], label: 'POST /orders' }] },
      { cap: '2–3. The backend runs the business logic, then reads or writes data.', send: [{ path: ['be','db'], label: 'INSERT order' }, { path: ['db','be'], label: 'ok', delay: 800, color: 'ok' }] },
      { cap: '4. It sends the response back. For 100 users, this is all you need.', send: [{ path: ['be','app','u'], label: '201 created', color: 'ok' }] }
    ] };

  S.g1_evolved = { nodes: [
      N('u','Users',2,0,'','client'), N('dns','DNS',2,1), N('cdn','CDN',2,2), N('lb','Load Balancer',2,3), N('gw','API Gateway',2,4),
      N('a1','App #1',1,5), N('a2','App #2',2,5), N('a3','App #3',3,5),
      N('cache','Cache',1,6,'','mem'), N('db','Database',3,6,'','db'), N('rep','Replicas / Shards',3,7,'','db'),
      N('bus','Message / Event Bus',3,8,'','queue'), N('em','Email Worker',2,9), N('inv','Inventory Worker',3,9), N('an','Analytics Worker',4,9)],
    edges: [['u','dns'],['dns','cdn'],['cdn','lb'],['lb','gw'],['gw','a1'],['gw','a2'],['gw','a3'],['a2','cache'],['a2','db'],['db','rep'],['rep','bus'],['bus','em'],['bus','inv'],['bus','an']],
    frames: [
      { cap: 'A product page: DNS finds the address, the CDN serves what it has cached, the load balancer picks a healthy app server.', send: [{ path: ['u','dns','cdn','lb','gw','a2'], label: 'GET /products/123' }] },
      { cap: 'The app reads from the cache first; only on a miss does it go to the database.', send: [{ path: ['a2','cache'], label: 'product:123?' }, { path: ['cache','a2'], label: 'hit', delay: 800, color: 'ok' }] },
      { cap: 'A second request lands on a different app server. Any of the three can serve it.', send: [{ path: ['u','dns','cdn','lb','gw','a3'], label: 'GET /cart' }] },
      { cap: 'An order is written to the database and replicated to replicas or shards.', send: [{ path: ['u','dns','cdn','lb','gw','a2','db'], label: 'POST /orders' }, { path: ['db','rep'], label: 'replicate', delay: 4400 }] },
      { cap: 'The order event goes onto the bus; email, inventory and analytics workers pick it up without slowing checkout.', send: [{ path: ['rep','bus'], label: 'OrderCreated' }, { path: ['bus','em'], label: '', delay: 800 }, { path: ['bus','inv'], label: '', delay: 950 }, { path: ['bus','an'], label: '', delay: 1100 }] }
    ] };

  S.g1_surround = { nodes: [
      N('os','Object Storage',0,0,'images, videos','db'), N('se','Search Engine',2,0,'full-text index','mem'),
      N('svc','Application Services',1,1),
      N('obs','Observability',1,2,'Logs + Metrics + Traces'),
      N('cc','Cross-cutting concerns',3,0,'','group',{ w: 2, h: 4 }),
      N('auth','Authentication',3,0), N('rl','Rate Limiting',3,1), N('sd','Service Discovery',3,2),
      N('sec','Secrets Management',4,0), N('fw','Firewalls / WAF',4,1), N('bk','Backups',4,2),
      N('mr','Multi-region replication',3,3,'','',{ w: 2 })],
    edges: [['svc','os'],['svc','se'],['svc','obs']],
    frames: [
      { cap: 'A user uploads a product photo: the service stores the file in object storage, not in the database.', send: [{ path: ['svc','os'], label: 'photo.jpg' }] },
      { cap: 'A search for "wireless headphones" goes to the search engine, which is built for ranking and typo tolerance.', send: [{ path: ['svc','se'], label: 'query' }, { path: ['se','svc'], label: 'results', delay: 800, color: 'ok' }] },
      { cap: 'Every request emits logs, metrics and traces so engineers can see what the system is doing.', send: [{ path: ['svc','obs'], label: 'log' }, { path: ['svc','obs'], label: 'metric', delay: 300 }, { path: ['svc','obs'], label: 'trace', delay: 600 }] },
      { cap: 'Around all of it sit the concerns that touch every request: who you are, how often you may call, where services live, secrets, network defences, backups, and copies in other regions.', states: { auth: 'on', rl: 'on', sd: 'on', sec: 'on', fw: 'on', bk: 'on', mr: 'on' }, t: 3200 }
    ] };
})();
