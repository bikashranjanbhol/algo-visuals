# System Design Components Explained: A Complete Guide from Basics to Large-Scale Architecture

System design can look intimidating because architecture diagrams are often filled with boxes labeled **CDN**, **Redis**, **Kafka**, **API Gateway**, **shards**, **replicas**, **service mesh**, and dozens of other technologies.

The important thing to understand is that these boxes are not there because sophisticated systems are supposed to look complicated.

Each component exists because somebody encountered a problem.

A useful mental model is:

> **Problem → Component → How it solves the problem → Trade-off → Real-world example**

And the most important principle in this entire guide is:

> **Good system design is not about adding every possible component. It is about choosing the minimum set of components necessary to satisfy the system's requirements and constraints.**

---

# 1. The Big Picture: What Is System Design?

System design is the process of deciding **how the different parts of a software system should work together**.

Suppose we build a small online store.

The first version might look like this:

```text
User
  |
  v
Web / Mobile App
  |
  v
Backend Server
  |
  v
Database
```

The user sends an HTTP request.

The backend:

1. receives the request,
2. executes business logic,
3. reads or writes data,
4. sends a response.

For 100 users, this may be all we need.

But imagine the application becomes popular.

Now:

- 100,000 users arrive simultaneously.
- Users from different continents experience high latency.
- One backend server cannot process every request.
- The database becomes overwhelmed.
- Sending emails slows down checkout.
- Product search becomes slow.
- A server crashes.
- Attackers send millions of requests.
- You want to deploy without downtime.
- One data center loses power.

The architecture begins to evolve.

```text
                         Users
                           |
                           v
                          DNS
                           |
                           v
                          CDN
                           |
                           v
                    Load Balancer
                           |
                           v
                     API Gateway
                           |
             +-------------+-------------+
             |             |             |
             v             v             v
          App #1         App #2         App #3
             |
             +---------------------------+
                           |
                    +------+------+
                    |             |
                    v             v
                  Cache        Database
                                |
                         Replicas / Shards
                                |
                                v
                       Message / Event Bus
                          /      |      \
                         v       v       v
                      Email   Inventory Analytics
                      Worker   Worker     Worker
```

Other components surround this request path:

```text
Object Storage     Search Engine
      \                 /
       \               /
        Application Services
               |
        Observability
   Logs + Metrics + Traces

Authentication
Rate Limiting
Service Discovery
Secrets Management
Firewalls / WAF
Backups
Multi-region replication
```

Large systems must balance several competing goals.

## Scalability

Can the system support more users, requests, and data?

## Availability

Can users still access the system when something fails?

## Reliability

Does the system behave correctly over time?

## Performance

How quickly does it respond?

## Security

Can unauthorized users access data or functionality?

## Fault tolerance

Can components fail without taking down the whole system?

## Maintainability

Can engineers understand, modify, and operate the system?

## Consistency

When multiple copies of data exist, how quickly must they agree?

## Cost

How much infrastructure and engineering effort are justified?

Every component discussed below addresses one or more of these concerns.

---

# 2. Networking and Entry Layer

When a user visits:

```text
https://shop.example.com/products/123
```

several systems may process the request before it reaches your application code.

---

# 3. DNS

## What is it?

DNS stands for **Domain Name System**.

It translates human-readable names such as:

```text
example.com
```

into addresses computers can route to, such as:

```text
203.0.113.42
```

Think of DNS as the internet's directory service.

## Why do we need it?

People remember names better than IP addresses.

More importantly, infrastructure changes.

A service might move from one server to another without requiring users to learn a new address.

## How does it work?

A simplified lookup is:

```text
Browser
  |
  v
DNS Resolver
  |
  v
Root DNS
  |
  v
Top-Level Domain (.com)
  |
  v
Authoritative DNS for example.com
  |
  v
IP address
```

Results are usually **cached**, meaning the answer is temporarily stored so the entire lookup does not happen on every request.

### Common DNS records

**A record**

Maps a name to an IPv4 address.

```text
example.com -> 203.0.113.10
```

**AAAA record**

Maps a name to an IPv6 address.

**CNAME**

Aliases one name to another.

```text
www.example.com -> example.com
```

**MX**

Specifies mail servers.

**TXT**

Stores text metadata, often used for verification and email-security configuration.

## GeoDNS

GeoDNS can return different destinations depending on where the user is located.

For example:

```text
User in India  -> Asia region
User in France -> Europe region
User in Canada -> North America region
```

This reduces latency and helps build multi-region systems.

## DNS-based traffic routing

DNS can also distribute traffic across:

- regions,
- data centers,
- cloud providers,
- active and standby deployments.

## Where does DNS sit?

Usually at the very beginning:

```text
User
  |
 DNS
  |
 CDN / Load Balancer
```

## When should you use it?

Practically every internet-facing application with a domain uses DNS.

Advanced routing matters when operating:

- multiple regions,
- multiple origins,
- failover infrastructure.

## When might you not need advanced DNS?

A small internal system may require nothing beyond ordinary DNS records.

## Advantages

- Human-readable service names.
- Infrastructure can move without changing URLs.
- Enables geographic and failover routing.
- DNS caching reduces lookup overhead.

## Trade-offs

- DNS changes are not always instantaneous because of caching.
- Incorrect configuration can make an entire service unreachable.
- DNS failover is not always as fast or precise as application-level routing.

## Common technologies

Cloudflare DNS, Amazon Route 53, Google Cloud DNS and similar managed DNS systems.

## System Design Interview Insight

Usually mention DNS briefly rather than spending ten minutes designing it.

It becomes especially relevant when discussing:

- multi-region deployment,
- disaster recovery,
- geographic routing.

---

# 4. Reverse Proxy

## What is it?

A reverse proxy is a server that receives requests **on behalf of backend servers**.

```text
Client
  |
  v
Reverse Proxy
  |
  +----> Backend A
  +----> Backend B
```

The client may not even know which backend actually handled the request.

## Forward proxy vs reverse proxy

A **forward proxy** represents the client.

```text
Client -> Forward Proxy -> Internet
```

A **reverse proxy** represents servers.

```text
Internet -> Reverse Proxy -> Servers
```

## Why do we need it?

Without one, every backend may have to independently handle:

- TLS certificates,
- compression,
- request routing,
- caching,
- connection management.

A reverse proxy centralizes many of these responsibilities.

## How does it work?

The proxy accepts a connection and forwards the request according to routing rules.

For example:

```text
/api/users/*    -> User Service
/api/orders/*   -> Order Service
/static/*       -> Static server
```

It may also perform:

### TLS termination

HTTPS encryption ends at the proxy.

The proxy decrypts traffic before forwarding it internally.

### Compression

Responses may be compressed with gzip or Brotli.

### Caching

Repeated responses can sometimes be served directly by the proxy.

## Simple Example

```text
Browser
  |
 HTTPS
  |
 Nginx
  |
 HTTP
  |
Node.js application
```

Nginx manages the HTTPS certificate while Node.js focuses on application logic.

## When should you use it?

Useful when you want centralized:

- routing,
- TLS,
- compression,
- caching,
- connection handling.

## When might you not need it?

A managed cloud platform or API gateway may already perform the same role.

## Advantages

- Hides backend topology.
- Centralizes networking concerns.
- Can improve performance.
- Simplifies backend servers.

## Disadvantages

- Adds another network hop.
- Bad configuration can become a bottleneck.
- Requires redundancy because a single proxy can become a single point of failure.

## Common technologies

Nginx, HAProxy and Envoy.

## Interview Insight

Do not add a separate reverse-proxy box simply because architectures on the internet contain one.

Ask whether its responsibilities are already handled by your load balancer, CDN, ingress controller or API gateway.

---

# 5. Load Balancer

## What is it?

A load balancer distributes requests among multiple servers.

```text
                Load Balancer
                /     |     \
               v      v      v
            App 1   App 2   App 3
```

## Why do we need it?

Suppose one application server supports approximately 5,000 requests per second.

If traffic reaches 20,000 requests per second, one server is insufficient.

We add servers.

But clients now need a way to decide which server receives each request.

That is the load balancer's job.

## How does it work?

### Round robin

Requests rotate between servers.

```text
Request 1 -> A
Request 2 -> B
Request 3 -> C
Request 4 -> A
```

Simple, but it assumes servers have similar capacity and requests have similar cost.

### Weighted round robin

More powerful machines receive more requests.

```text
Server A weight = 3
Server B weight = 1
```

A may receive roughly three times as much traffic.

### Least connections

Send the next request to the server handling the fewest active connections.

Useful when requests have very different durations.

### IP hashing

Hash the client's IP address and map it to a server.

This can keep the same client routed to the same backend.

## Layer 4 vs Layer 7

### Layer 4

Routes using transport-level information such as:

- IP addresses,
- TCP ports.

It generally does not need to understand HTTP.

Advantages:

- fast,
- simple,
- works for non-HTTP traffic.

### Layer 7

Understands application-layer protocols such as HTTP.

It can route based on:

```text
/products -> Product Service
/orders   -> Order Service
```

or headers, cookies and hostnames.

## Health checks

The load balancer periodically checks backend health.

```text
GET /health
```

Suppose:

```text
A -> healthy
B -> unhealthy
C -> healthy
```

Traffic goes only to A and C.

## Sticky sessions

A sticky session tries to keep one user connected to the same backend.

Useful for stateful applications, but it weakens flexible load distribution.

Whenever possible, application servers should instead remain stateless.

## Active-active

Multiple instances serve traffic simultaneously.

```text
A = active
B = active
```

Provides capacity and resilience.

## Active-passive

One system serves traffic while another waits.

```text
A = active
B = standby
```

The standby takes over during failure.

## Placement

```text
Users
 |
CDN
 |
Load Balancer
 |
Application Servers
```

## When should you use it?

When you have multiple interchangeable service instances.

## When might you not need it?

A tiny application with one backend does not need one yet.

Managed serverless systems may also abstract it away.

## Advantages

- Horizontal scaling.
- Fault isolation.
- Health-based routing.
- Enables maintenance without total downtime.

## Trade-offs

- Extra network hop.
- Configuration complexity.
- Session handling becomes important.
- The load-balancing tier itself must be redundant.

## Common technologies

HAProxy, Nginx, Envoy, AWS Elastic Load Balancing, Google Cloud Load Balancing.

## Interview Insight

Whenever you introduce several application servers, explain how traffic reaches them.

Also discuss health checks and whether backend state is externalized.

---

# 6. CDN

## What is it?

A CDN, or **Content Delivery Network**, stores copies of content on servers physically closer to users.

These geographically distributed machines are called **edge servers**.

## Problem

Imagine your origin server is in Virginia.

A user in Singapore requests a 5 MB image.

Without a CDN:

```text
Singapore
    |
    | long network trip
    v
Virginia Origin
```

Every image request travels across the world.

With a CDN:

```text
Singapore User
      |
      v
Singapore Edge Cache
      |
      | only on miss
      v
Virginia Origin
```

## Cache hit

The requested content already exists at the edge.

```text
User -> CDN -> cached image
```

Fast.

## Cache miss

The CDN does not have the object.

```text
User
  |
 CDN
  |
Origin Server
```

The CDN retrieves the content and may cache it for future users.

Cloudflare, for example, exposes cache behavior influenced by HTTP cache-control directives and distinguishes responses that are cache misses or bypass caching.

## Cache invalidation

Suppose:

```text
/product.jpg
```

changes.

CDN nodes may still contain the old version.

Solutions include:

- short TTLs,
- explicit purge/invalidation,
- versioned URLs.

Example:

```text
/product-v18.jpg
```

## Where does it sit?

```text
User
 |
DNS
 |
CDN
 |
Origin / Load Balancer
```

## When should you use it?

Excellent for:

- images,
- JavaScript,
- CSS,
- videos,
- downloads,
- cacheable API responses.

## When might you not need it?

A small internal application serving users from one location may gain little benefit.

## Advantages

- Lower geographic latency.
- Reduces origin traffic.
- Handles large static traffic bursts.
- Often provides additional DDoS protection.

## Trade-offs

- Cache invalidation complexity.
- Stale content can be served.
- Personalized data is harder to cache safely.

## Common technologies

Cloudflare, Amazon CloudFront, Akamai, Fastly.

## Interview Insight

For image-heavy, video-heavy, download-heavy or globally distributed systems, a CDN should usually appear early in the design.

---

# 7. API Gateway

## What is it?

An API gateway is an entry point that manages application APIs.

```text
                    API Gateway
                  /      |       \
                 v       v        v
             Users    Orders   Payments
```

## Why do we need it?

Imagine clients must directly know:

```text
user-service.company.internal
order-service.company.internal
payment-service.company.internal
```

Now every mobile app is coupled to internal architecture.

Instead:

```text
api.example.com
```

becomes a stable external interface.

## Responsibilities

An API gateway may handle:

- request routing,
- authentication,
- authorization checks,
- rate limiting,
- request transformation,
- response aggregation,
- API versioning,
- logging and metrics.

### Aggregation example

A mobile home screen requires:

- user data,
- order status,
- recommendations.

Instead of three round trips:

```text
Mobile -> API Gateway
              |
        +-----+-----+
        v     v     v
       User Orders Recs
```

The gateway can combine results.

## API Gateway vs Load Balancer vs Reverse Proxy

| Component | Main concern |
|---|---|
| Reverse proxy | Proxying and routing traffic to backend systems |
| Load balancer | Distributing traffic among equivalent instances |
| API gateway | Managing API-level policies and service routing |

Their functionality overlaps.

A single product may perform several roles.

## When should you use one?

Especially useful with:

- many backend services,
- public APIs,
- mobile applications,
- centralized authentication,
- centralized rate limiting.

## When might you not need one?

A simple monolith with one HTTP API may not justify another architectural layer.

## Advantages

- Centralized cross-cutting policies.
- Hides internal topology.
- Simplifies clients.
- Provides consistent API governance.

## Trade-offs

- Can become a bottleneck.
- Can accumulate excessive business logic.
- Another operational dependency.

## Common technologies

Amazon API Gateway, Kong, Apigee, Envoy-based gateways, Azure API Management.

## Interview Insight

Do not say "API gateway" merely because the architecture contains microservices.

State exactly what responsibility it provides.

---

# 8. Application Servers

## What are they?

Application servers execute business logic.

For an e-commerce system they may:

- validate carts,
- calculate prices,
- create orders,
- retrieve products,
- enforce business rules.

## Stateless vs stateful servers

### Stateful

The server keeps user-specific state locally.

```text
User A -> Server 1

Server 1 memory:
session=A
cart=[...]
```

If the next request reaches Server 2, that state may be missing.

### Stateless

The server keeps durable or shared state elsewhere.

```text
        +-> App 1 --+
User -> |           | -> Redis / Database
        +-> App 2 --+
```

Any server can process any request.

## Why are stateless services easier to scale?

Because instances become interchangeable.

You can:

- add them,
- remove them,
- restart them,
- deploy new versions,

without moving user sessions between machines.

## Where do application servers sit?

```text
Gateway / Load Balancer
          |
          v
Application Servers
      /        \
   Cache      Database
```

## When should you use them?

Almost every backend application has some form of compute layer.

## Advantages of stateless application servers

- Easy horizontal scaling.
- Simple failure replacement.
- Easier rolling deployments.
- Better load distribution.

## Trade-off

State still has to exist somewhere.

Moving it from application memory to Redis or a database introduces another network dependency.

## Common technologies

Node.js, Java/Spring, Go, Python/Django/FastAPI, .NET, Ruby on Rails and many others.

## Interview Insight

Default to stateless application servers unless the requirements strongly suggest otherwise.

---

# 9. Horizontal vs Vertical Scaling

## Vertical scaling

Make one machine bigger.

```text
4 CPUs -> 32 CPUs
8 GB RAM -> 128 GB RAM
```

### Advantages

- Simple.
- Little architectural change.

### Disadvantages

- Machines have physical limits.
- High-end machines become expensive.
- A single large machine is still a failure domain.

## Horizontal scaling

Add more machines.

```text
1 server
   |
   v
10 servers
```

### Advantages

- Much larger potential scale.
- Better fault tolerance.

### Disadvantages

Distributed systems become harder.

Now you must handle:

- load balancing,
- shared state,
- network failures,
- coordination,
- consistency.

## Interview Insight

Vertical scaling is often the correct first optimization.

Horizontal scaling becomes necessary when one machine no longer satisfies capacity or availability requirements.

---

# 10. Autoscaling

Autoscaling automatically changes the number of running compute instances.

```text
Low traffic:
App App

High traffic:
App App App App App App App
```

## CPU-based scaling

Example:

```text
Average CPU > 70%
-> add instances
```

## Memory-based scaling

Useful for memory-intensive services.

## Request-based scaling

Scale based on requests per second or concurrent requests.

## Queue-depth-based scaling

Very useful for workers.

```text
Queue = 10 jobs
-> 2 workers

Queue = 100,000 jobs
-> 100 workers
```

## When to use

Workloads whose demand changes significantly.

## Trade-offs

Autoscaling is not instantaneous.

Poor policies can cause:

- constant scaling up/down,
- cost explosions,
- scaling too late.

## Interview Insight

Choose scaling signals that correspond to the actual bottleneck.

CPU is not always the correct metric.

---

# 11. Containers

## What is a container?

A container packages an application together with its runtime dependencies.

```text
Application
Libraries
Runtime
Configuration
```

This makes the environment consistent across development, testing and production.

## Containers vs virtual machines

A virtual machine typically includes an entire guest operating system.

```text
Hardware
  |
Host OS
  |
Hypervisor
  |
+------+------+
| VM 1 | VM 2 |
| OS   | OS   |
| App  | App  |
+------+------+
```

Containers generally share the host's operating-system kernel.

```text
Hardware
  |
Host OS
  |
Container Runtime
  |
+-----------+-----------+
| Container | Container |
| App       | App       |
+-----------+-----------+
```

That usually makes containers lighter and faster to start than full VMs.

## Why did containers become popular?

Distributed systems often consist of many services.

Containers make it easier to package and deploy them consistently.

## Advantages

- Portable deployment unit.
- Dependency isolation.
- Efficient compared with many VM workloads.
- Works well with automated deployment platforms.

## Trade-offs

- Networking and storage can become complicated.
- Images require lifecycle and security management.
- Containers do not magically solve application architecture problems.

## Common technology

Docker.

## Interview Insight

Containers are a deployment choice, not a scaling strategy by themselves.

---

# 12. Container Orchestration

Once you have hundreds or thousands of containers, somebody has to decide:

- where they run,
- when they restart,
- how they discover each other,
- how new versions deploy.

That is container orchestration.

## What does an orchestrator do?

### Scheduling

Decides which machines should run which workloads.

### Service discovery

Helps services locate each other.

### Self-healing

Replaces failed workloads.

Kubernetes, for example, can restart failed containers, replace failed replicas and remove unhealthy workloads from service endpoints.

### Scaling

Runs more or fewer replicas.

### Rolling deployments

Gradually replaces old instances with new versions.

```text
Version 1: [A][A][A][A]

Deployment:
[A][A][A][B]
[A][A][B][B]
[A][B][B][B]
[B][B][B][B]
```

## Common technology

Kubernetes.

## When should you use it?

When operational complexity from many containerized workloads justifies an orchestration platform.

## When should you NOT?

A small team running a few services can easily spend more effort operating Kubernetes than operating the actual product.

Managed platforms may be simpler.

## Interview Insight

"Use Kubernetes" is not a system-design answer.

Describe what capability you actually need: scheduling, self-healing, autoscaling or deployment automation.

---

# 13. Serverless Computing

## What is it?

Serverless platforms execute application code without developers directly managing individual servers.

A common form is **functions as a service**.

```text
Event
  |
  v
Function
  |
  v
Result
```

Examples:

- HTTP request,
- uploaded image,
- queue message,
- scheduled event.

## Automatic scaling

The platform can create more execution capacity as events arrive.

## Cold starts

If no execution environment is available, the platform may need to initialize one.

That initialization delay is called a **cold start**.

## Pricing

Function platforms commonly charge based on execution rather than keeping a server continuously allocated. AWS Lambda, for example, prices Lambda functions based partly on requests and execution duration.

## Good use cases

- event handlers,
- scheduled tasks,
- lightweight APIs,
- file-processing jobs,
- unpredictable workloads.

## Weak use cases

Potentially less attractive for:

- long-running processes,
- highly predictable always-on workloads,
- extremely latency-sensitive execution,
- workloads with unusual runtime requirements.

## Common technologies

AWS Lambda, Google Cloud Functions, Azure Functions.

## Interview Insight

Serverless removes server management, not architectural responsibility.

You still need to think about data, retries, concurrency, security and failure handling.

---

# 14. Databases: The Heart of Many System Designs

Compute instances can often be recreated.

Data usually cannot.

That makes database design one of the most important architectural decisions.

Ask:

- What data exists?
- How is it queried?
- How much data?
- How quickly does it grow?
- Do transactions matter?
- What consistency is required?
- What happens if a machine fails?
- How much write throughput is required?

---

# 15. Relational Databases

## What are they?

Relational databases organize data into tables.

```text
Users
+----+-------+
| id | name  |
+----+-------+
| 1  | Ana   |
| 2  | Ravi  |
+----+-------+
```

## Primary key

A unique identifier.

```text
users.id
```

## Foreign key

Connects records.

```text
orders.user_id -> users.id
```

## Relationships

Examples:

- one user has many orders,
- one order contains many products.

## Joins

Joins combine related records.

```sql
SELECT users.name, orders.total
FROM users
JOIN orders ON orders.user_id = users.id;
```

## Transactions

A transaction groups operations that should behave as one logical unit.

Bank transfer:

```text
1. subtract $100 from A
2. add $100 to B
```

We do not want only step 1 to succeed.

## ACID

### Atomicity

All or none of a transaction happens.

### Consistency

The transaction preserves defined database rules and constraints.

### Isolation

Concurrent transactions do not incorrectly interfere.

### Durability

Committed data survives failures according to the database's durability guarantees.

## When should you use relational databases?

Excellent when you need:

- transactions,
- structured relationships,
- flexible queries,
- strong integrity constraints.

## Common technologies

PostgreSQL, MySQL, SQL Server, Oracle.

## Advantages

- Mature query languages.
- Powerful transactions.
- Strong integrity mechanisms.
- Flexible joins.

## Trade-offs

Scaling large write-heavy relational workloads horizontally can be more complicated than some distributed data models.

## Interview Insight

A relational database is a perfectly good default.

Do not choose NoSQL merely because the expected user count sounds large.

---

# 16. NoSQL Databases

"NoSQL" describes several non-relational data models.

It is not one database design.

---

## Key-value stores

Conceptually:

```text
key -> value
```

Example:

```text
"user:123" -> {...}
```

Excellent for:

- caching,
- sessions,
- counters,
- simple high-speed lookups.

Examples include Redis and DynamoDB-style access patterns.

---

## Document databases

Store structured documents such as JSON-like objects.

```json
{
  "id": 123,
  "name": "Ana",
  "addresses": [
    {"city": "Bengaluru"}
  ]
}
```

Useful when records naturally belong together and schemas vary.

Example: MongoDB.

---

## Wide-column databases

Designed around partition keys and large distributed datasets.

Often useful for:

- telemetry,
- time-series-like access,
- huge write volumes,
- predictable query patterns.

Example: Cassandra.

---

## Graph databases

Model relationships directly.

```text
Alice --FOLLOWS--> Bob
Bob   --WORKS_AT-> Company
```

Useful for:

- social graphs,
- fraud networks,
- recommendation relationships,
- dependency graphs.

Example: Neo4j.

---

# 17. SQL vs NoSQL

| Property | SQL | NoSQL |
|---|---|---|
| Schema | Usually structured and explicit | Varies; often more flexible |
| Relationships | Excellent support | Often modeled differently |
| Joins | Native | Often limited or application-managed |
| Transactions | Strong mature support | Varies by product |
| Horizontal scaling | Possible but may require more architecture | Often designed with distribution in mind |
| Query flexibility | Usually high | Often optimized for specific access patterns |
| Consistency | Often strong by default | Depends heavily on database |
| Typical use | Orders, finance, business records | Caches, documents, massive distributed datasets, graphs |

The correct question is not:

> "SQL or NoSQL?"

It is:

> "What access patterns and consistency requirements does this data have?"

Large systems frequently use both.

---

# 18. Indexing

A database index is similar to the index at the back of a textbook.

Without an index, finding "distributed systems" might require reading every page.

With an index:

```text
distributed systems -> pages 47, 89, 131
```

Database example:

```sql
SELECT * FROM users WHERE email = 'a@example.com';
```

Without an index on `email`, the database may scan many rows.

With one, it can locate matching records much faster.

## Composite indexes

Indexes can cover several columns.

```text
(country, created_at)
```

Column ordering matters because it affects which query patterns benefit.

## Advantages

- Much faster reads.
- Faster sorting/filtering for supported queries.

## Trade-offs

Indexes consume:

- storage,
- memory,
- write time.

Every insert or update may require index maintenance.

## Interview Insight

If a query is slow, first ask whether the right index exists before immediately introducing caches or new databases.

---

# 19. Replication

Replication means keeping multiple copies of data.

```text
              Primary
              /     \
             v       v
        Replica 1  Replica 2
```

## Primary/replica model

Writes go to the primary.

Replicas copy changes.

Reads may be distributed to replicas.

## Why?

### Availability

If one copy fails, another exists.

### Read scaling

Replicas can serve read traffic.

## Replication lag

A write may reach the primary before replicas catch up.

Example:

```text
12:00:00 write profile
12:00:00.1 read replica
```

The replica may temporarily return the old profile.

## Synchronous replication

A write waits for replicas to acknowledge it.

Advantages:

- stronger durability/consistency.

Trade-off:

- greater write latency,
- replica failure may affect availability.

## Asynchronous replication

Primary acknowledges before replicas fully catch up.

Advantages:

- lower latency.

Trade-off:

- temporary inconsistency,
- recent writes could be lost during certain failovers.

## Failover

If the primary fails, a replica may be promoted.

## Interview Insight

Whenever proposing read replicas, mention replication lag and whether read-after-write consistency matters.

---

# 20. Partitioning

Partitioning means splitting a dataset into pieces.

## Horizontal partitioning

Split rows.

```text
Users 1-1M     -> Partition A
Users 1M-2M    -> Partition B
Users 2M-3M    -> Partition C
```

## Vertical partitioning

Split columns or logical groups.

```text
User identity -> table/system A
User profile  -> table/system B
Large photos  -> object storage
```

Partitioning can happen inside one database system or across infrastructure.

---

# 21. Sharding

A **shard** is an independently stored subset of data.

```text
                Users
          /       |       \
         v        v        v
      Shard A  Shard B  Shard C
```

Think of a library that has become too large for one building.

Instead of making one infinitely large building, books are divided across branches.

## Shard key

A shard key decides where data lives.

Example:

```text
hash(user_id) % number_of_shards
```

## Hash-based sharding

```text
hash(user_id) -> shard
```

Usually distributes data reasonably evenly.

Trade-off: range queries across the shard key may become harder.

## Range-based sharding

```text
A-F -> shard 1
G-M -> shard 2
N-Z -> shard 3
```

Useful for range access.

Problem: one range may become much hotter.

## Geographic sharding

```text
Europe users -> Europe database
Asia users   -> Asia database
```

Useful for latency or regulatory requirements.

## Hot shards

Suppose one celebrity creates enormous traffic and every request maps to one shard.

That shard becomes overloaded while others remain idle.

## Rebalancing

When adding shards, data may have to move.

Moving terabytes safely while serving traffic is difficult.

## Cross-shard queries

A query like:

```text
Find the top 100 users globally
```

might require querying every shard and combining results.

## When to shard

When the database's size, write throughput or operational limits genuinely require distribution.

## When NOT to shard

As early as possible.

Sharding introduces substantial complexity.

Use:

- indexes,
- stronger hardware,
- query optimization,
- replication,
- caching,

before sharding unless requirements clearly demand it.

---

# 22. Partitioning vs Sharding vs Replication

| Concept | What happens? | Main purpose |
|---|---|---|
| Partitioning | Data is divided into subsets | Manage/scale data |
| Sharding | Data subsets are distributed across independent database nodes | Horizontal database scaling |
| Replication | The same data is copied | Availability/read scaling |

You can combine them.

A shard may itself have replicas.

```text
Shard A
 |- Primary
 |- Replica

Shard B
 |- Primary
 |- Replica
```

---

# 23. Database Connection Pooling

Creating a database connection may require:

- network setup,
- authentication,
- memory allocation,
- server resources.

Opening one for every HTTP request is expensive.

Instead:

```text
Application
   |
Connection Pool
 /  |  |  \
DB connections
```

Requests temporarily borrow connections from the pool.

## Benefits

- Lower connection overhead.
- Controlled database concurrency.
- Better reuse.

## Trade-off

Too many pooled connections across hundreds of application servers can still overwhelm the database.

## Interview Insight

Connection limits are an often-overlooked scaling constraint.

---

# 24. Caching

Caching stores frequently needed data in a faster location.

Without a cache:

```text
User
 |
Server
 |
Database
```

With a cache:

```text
User
 |
Server
 |
Redis
 | \
 |  \ hit -> return
 |
 miss
 |
Database
 |
Redis
 |
User
```

Caching is powerful because many systems repeatedly request the same information.

---

# 25. Types of Cache

## Client-side cache

The client stores reusable information.

Useful for mobile applications and local application state.

## Browser cache

Browsers cache:

- images,
- JavaScript,
- CSS,
- HTTP responses.

## CDN cache

Stores content near users geographically.

## Application cache

An application instance stores data in local memory.

Fast, but different instances may have different cached values.

## Distributed cache

A shared caching cluster accessible by many application servers.

Examples: Redis and Memcached.

## Database cache

Databases themselves use memory for frequently accessed pages, query plans and other structures.

---

# 26. Cache Patterns

## Cache-aside

The application manages caching.

```text
1. Look in cache
2. Hit? Return
3. Miss? Read database
4. Put result into cache
5. Return
```

Very common.

## Read-through

The cache abstraction fetches missing data from the underlying store.

## Write-through

Writes update cache and underlying storage synchronously.

```text
Application
   |
 Cache
   |
Database
```

## Write-behind

Write cache first, persist later.

Potential benefit:

- fast writes.

Major concern:

- durability if cached data disappears before persistence.

---

# 27. TTL and Eviction

## TTL

Time to live defines how long an entry remains valid.

```text
product:123 TTL = 300 seconds
```

## Eviction

When memory fills, entries must be removed.

### LRU

Least Recently Used.

Remove entries that have not been accessed recently.

### LFU

Least Frequently Used.

Remove entries accessed least often.

Redis supports multiple eviction policies including variants of LRU and LFU.

---

# 28. Cache Invalidation

The classic caching difficulty:

> What happens when the original data changes?

Suppose:

```text
Database price = $90
Cache price    = $100
```

The system can return incorrect information.

Approaches include:

- short TTL,
- delete cache after database write,
- update cache after write,
- event-driven invalidation,
- versioned cache keys.

Caching improves performance by accepting additional consistency complexity.

---

# 29. Cache Stampede

Imagine a popular cached item expires.

At that exact moment:

```text
10,000 requests
   |
   v
Cache miss
   |
   v
Database
```

All requests hit the database simultaneously.

That is a **cache stampede**.

Mitigations include:

- request coalescing,
- locking,
- staggered TTLs,
- serving stale data while refreshing,
- prewarming popular entries.

---

# 30. Cache Penetration

Attackers or buggy clients repeatedly request data that does not exist.

```text
GET user:-999999
```

Nothing is cached, so every request reaches the database.

Solutions may include:

- negative caching,
- input validation,
- Bloom filters,
- rate limiting.

---

# 31. Hot Keys

One key receives enormous traffic.

```text
celebrity_profile -> 1 million reads/sec
```

One cache node may become overloaded.

Mitigations include:

- replication,
- local caching,
- key splitting,
- special treatment for extremely hot data.

## Interview Insight

Whenever proposing Redis, answer:

1. What is cached?
2. How is it invalidated?
3. What is the TTL?
4. What happens if Redis fails?
5. Can the database survive cache misses?

---

# 32. Message Queues and Asynchronous Processing

Suppose checkout does this synchronously:

```text
Create order
Send email
Update inventory
Generate invoice
Send analytics
Notify warehouse
Return HTTP response
```

The user waits for everything.

Worse, if the email provider fails, checkout might fail.

Instead:

```text
User places order
      |
      v
Order API
      |
Save order
      |
      v
Queue
 /      |       \
v       v        v
Email Inventory Analytics
Worker Worker    Worker
```

Now non-critical work happens asynchronously.

---

# 33. Message Queue

## Components

### Producer

Creates messages.

### Queue

Stores messages temporarily.

### Consumer

Processes messages.

### Acknowledgement

The consumer reports successful processing.

If acknowledgement never arrives, the system may retry.

## Retries

Transient failure:

```text
Attempt 1 -> fail
Attempt 2 -> fail
Attempt 3 -> success
```

## Dead-letter queue

After repeated failure, a message can be moved aside:

```text
Main Queue
   |
 repeated failure
   v
Dead-Letter Queue
```

Engineers can inspect or reprocess it later.

---

# 34. Delivery Guarantees

## At-most-once

A message is processed zero or one time.

It may be lost, but duplicates are avoided.

## At-least-once

Messages are retried until successfully acknowledged.

A message may be processed more than once.

Therefore consumers should often be **idempotent**.

## Exactly-once

The logical effect happens once.

This is significantly harder in distributed systems than the phrase suggests.

Many practical systems instead combine:

- at-least-once delivery,
- idempotency,
- deduplication.

## Common technologies

RabbitMQ, Amazon SQS, Azure Service Bus, Google Cloud Pub/Sub.

## Interview Insight

Queues are particularly useful when:

- the user does not need the result immediately,
- workloads are bursty,
- downstream services can fail,
- you want to isolate services.

---

# 35. Event Streaming

A streaming platform stores an ordered history of events.

Example:

```text
OrderCreated
OrderPaid
OrderPacked
OrderShipped
```

Apache Kafka is the classic example.

## Topic

A named stream.

```text
orders
payments
clicks
```

## Partition

A topic can be divided for parallelism.

```text
orders
  |- partition 0
  |- partition 1
  |- partition 2
```

## Offset

The position of an event within a partition.

A consumer remembers:

```text
I have processed through offset 92831
```

Kafka consumers can commit partition offsets and resume from them after restart.

## Consumer group

Several consumers cooperate.

```text
Partition 0 -> Consumer A
Partition 1 -> Consumer B
Partition 2 -> Consumer C
```

Kafka assigns partitions among consumers in a consumer group, enabling parallelism while preserving ordering within a partition.

---

# 36. Message Queue vs Event Streaming Platform

| Queue | Event stream |
|---|---|
| Often centered on work distribution | Centered on durable event history |
| Message often disappears logically after processing | Events are usually retained for a period |
| Consumers process jobs | Consumers independently follow streams |
| Great for task queues | Great for data pipelines/event-driven systems |
| Example: RabbitMQ/SQS | Example: Kafka |

The boundary is not absolute; modern products can overlap.

---

# 37. Pub/Sub

Publish/subscribe means one publisher sends an event without directly knowing every recipient.

```text
               OrderCreated
                    |
                  Topic
          /---------+---------\
         v          v          v
      Email      Analytics   Loyalty
```

Each subscriber receives the event.

Useful when multiple systems react independently.

## Trade-off

Pub/sub reduces coupling between producer and consumers, but makes end-to-end workflows harder to trace.

---

# 38. Monoliths and Microservices

## Monolithic architecture

A monolith deploys many application capabilities together.

```text
+-----------------------+
| Users                 |
| Orders                |
| Payments              |
| Products              |
| Recommendations       |
+-----------------------+
```

## Advantages

- Easy local development.
- Simple transactions.
- Straightforward deployment.
- Easier debugging.
- Fewer network calls.

For many teams, a modular monolith is an excellent architecture.

---

# 39. Microservices

Microservices split capabilities into independently deployable services.

```text
User Service
Order Service
Payment Service
Catalog Service
Shipping Service
```

## Why companies adopt them

Potential benefits include:

- independent deployments,
- separate scaling,
- team ownership,
- fault isolation,
- technology flexibility.

## Service boundaries

Good service boundaries usually correspond to meaningful business capabilities.

Bad boundary:

```text
StringFormattingService
```

Better:

```text
Payment Service
Inventory Service
Shipping Service
```

## Distributed-system complexity

Microservices introduce:

- network failures,
- distributed tracing,
- versioned APIs,
- duplicated data,
- asynchronous consistency,
- distributed transactions,
- deployment coordination,
- service discovery,
- operational overhead.

> **Do not use microservices simply because large companies use them.**

Large companies often use microservices partly because they have thousands of engineers and organizational scaling problems that smaller teams do not have.

## Interview Insight

Start with system requirements.

Do not start with "microservices."

---

# 40. Service Discovery

In dynamic infrastructure, addresses change.

Today:

```text
inventory -> 10.0.4.17
```

Tomorrow:

```text
inventory -> 10.0.9.22
```

Services need a way to find the current instances.

Service discovery provides that mapping.

```text
Order Service
      |
      v
Service Discovery
      |
      v
Inventory instances
```

---

# 41. Service Registry

A registry stores information about live services.

### Registration

```text
Inventory instance starts
-> register inventory:10.0.9.22
```

### Lookup

```text
Order Service:
"Give me an inventory instance."
```

### Removal

Failed or terminated instances disappear from the registry.

Systems such as Consul or orchestration platforms can provide these capabilities.

---

# 42. Service Mesh

A service mesh manages communication between services.

```text
Service A
   |
Proxy
   |
network
   |
Proxy
   |
Service B
```

## Capabilities

### Traffic control

Retries, routing, traffic splitting.

### Observability

Records service-to-service metrics and traces.

### mTLS

Mutual TLS means both sides authenticate each other while encrypting traffic.

### Policy enforcement

Communication rules can be centrally configured.

## Sidecar proxy

Some service meshes deploy a proxy beside every application instance.

## Common technologies

Istio, Linkerd.

## Trade-offs

A service mesh provides powerful networking controls, but adds:

- operational complexity,
- resource overhead,
- another abstraction engineers must understand.

## Interview Insight

A mesh is rarely necessary in an introductory architecture.

Add one only if service-to-service networking problems justify it.

---

# 43. Communication Protocols

Distributed systems need communication models suited to different interactions.

---

## HTTP

HTTP is a request-response application protocol.

```text
Client -> request -> Server
Client <- response <- Server
```

Good for web applications and APIs.

---

## HTTPS

HTTPS is HTTP protected by TLS.

It provides:

- encryption,
- integrity,
- server authentication.

Use HTTPS for internet communication unless you have an extremely unusual reason not to.

---

## REST

REST-style APIs commonly model resources over HTTP.

```text
GET    /users/123
POST   /orders
DELETE /cart/items/55
```

Best for:

- conventional public APIs,
- CRUD-style services,
- broadly interoperable APIs.

---

## GraphQL

Clients request exactly the fields they need.

```graphql
user(id: 123) {
  name
  orders {
    id
    total
  }
}
```

Useful when clients have diverse data needs.

Trade-offs include:

- query complexity,
- authorization complexity,
- caching complexity,
- backend query-cost control.

---

## gRPC

gRPC uses strongly defined service contracts and typically Protocol Buffers.

Useful for:

- internal service communication,
- low-overhead RPC,
- streaming.

Trade-off:

Browser/public API compatibility is less straightforward than ordinary REST.

---

## WebSockets

Creates a persistent bidirectional connection.

```text
Client <=================> Server
```

Both sides can send messages.

Excellent for:

- chat,
- collaborative editing,
- multiplayer gaming,
- realtime dashboards.

---

## Server-Sent Events

A long-lived HTTP connection where the server pushes updates to the client.

```text
Server ======> Client
```

Simpler than WebSockets when communication is mostly server-to-client.

Useful for:

- live status,
- notification feeds,
- streamed text/results.

---

## Webhooks

Your server sends an HTTP request to another server when something happens.

Example:

```text
Payment Provider
      |
payment completed
      |
      v
POST https://shop.com/payment-webhook
```

Excellent for asynchronous external integrations.

---

# 44. Communication Comparison

| Technology | Communication Model | Best For |
|---|---|---|
| REST | Request/response | Public APIs |
| GraphQL | Client-selected request/response | Flexible client data needs |
| gRPC | Request/response + streaming | Internal services |
| WebSocket | Bidirectional persistent | Chat, games, collaboration |
| SSE | Server → client | Live feeds |
| Webhook | Server → external server | Event notifications |
| Queue | Asynchronous worker communication | Background processing |
| Event stream | Durable event flow | Data/event pipelines |

---

# 45. Data Consistency

When only one database exists, consistency is relatively intuitive.

Once data has multiple copies, the question becomes:

> When must those copies agree?

---

# 46. Strong Consistency

After a successful write, subsequent reads see the new value according to the system's consistency guarantee.

Bank account balances often require strong guarantees.

```text
Balance = $100

Withdraw $90

Next authorized transaction must not behave as though balance is still $100.
```

Strong consistency simplifies application reasoning but may increase coordination and latency.

---

# 47. Eventual Consistency

Copies may temporarily disagree, but converge later.

Example:

```text
Social post:
Server A: 10,002 likes
Server B: 10,004 likes
```

For a short period, that difference may be acceptable.

Eventual consistency can improve availability and geographic performance where perfect immediate agreement is unnecessary.

---

# 48. CAP Theorem

CAP applies when a distributed data system experiences a **network partition**.

A network partition means nodes that should communicate cannot reliably communicate.

```text
Region A   X   Region B
           ^
     network partition
```

During the partition, a system faces a fundamental trade-off between:

### Consistency

Operations behave as though clients see one coherent state.

### Availability

Every request receives a non-error response from a non-failing node.

### Partition tolerance

The system continues operating despite network communication failures between nodes.

The common phrase:

> "Pick any two."

is misleading.

Distributed systems generally must tolerate network partitions.

The interesting design question is:

> **During a partition, which operations prefer consistency and which prefer availability?**

A banking transaction may reject operations rather than risk conflicting balances.

A social-media feed may continue serving slightly stale data.

---

# 49. PACELC

PACELC expands the discussion:

**If there is a Partition (P), choose between Availability (A) and Consistency (C); Else (E), choose between Latency (L) and Consistency (C).**

Even when the network is healthy, stronger coordination can increase latency.

That is an important everyday distributed-systems trade-off.

---

# 50. Quorum

Suppose data is stored on:

```text
N = 3 replicas
```

Define:

```text
W = number of replicas required for a write
R = number required for a read
```

For example:

```text
N=3
W=2
R=2
```

A read and write quorum overlap.

Quorums are used by distributed databases to reason about replica agreement and availability.

Actual consistency guarantees depend on far more than the formula alone, including failure modes and implementation semantics.

---

# 51. Consensus

Consensus means multiple machines agree on a shared decision despite failures.

Examples:

- Who is leader?
- What is the next committed operation?
- Which configuration is current?

```text
Node A \
Node B ---> agree on Leader B
Node C /
```

## Leader election

A cluster may choose one node to coordinate operations.

If the leader fails, another is elected.

## Raft

Raft is a consensus algorithm designed to make distributed consensus easier to understand.

Conceptually it coordinates:

- leader election,
- replicated logs,
- majority agreement.

## Paxos

Paxos is a foundational family of consensus protocols.

It is theoretically important but harder to explain and implement directly.

## Interview Insight

You usually do not design Raft from scratch.

You need to recognize when your architecture depends on consensus—for example databases, cluster coordination or distributed configuration systems.

---

# 52. Distributed Transactions

A normal database transaction works well inside one database.

But imagine checkout spans:

```text
Order Service
Payment Service
Inventory Service
Shipping Service
```

How do all four update atomically?

That is much harder.

---

# 53. Two-Phase Commit

2PC uses a coordinator.

## Phase 1: Prepare

```text
Coordinator:
"Can everyone commit?"

Payment: yes
Inventory: yes
Order: yes
```

## Phase 2: Commit

```text
Coordinator:
"Commit."
```

If a participant cannot prepare, the transaction is aborted.

## Advantages

Provides stronger atomic coordination.

## Disadvantages

- Participants may remain blocked while waiting.
- Coordinator failure is difficult.
- Cross-service latency increases.
- Operational complexity.

It is appropriate in some environments but undesirable for many loosely coupled microservice workflows.

---

# 54. Saga Pattern

A saga breaks a large business transaction into smaller local transactions.

Example:

```text
1. Create order
2. Reserve inventory
3. Charge payment
4. Arrange shipping
```

If step 3 fails:

```text
Undo inventory reservation
Cancel order
```

Those undo actions are **compensating transactions**.

## Choreography

Services react to events.

```text
OrderCreated
   |
Inventory reserves
   |
InventoryReserved
   |
Payment charges
```

Advantages:

- loose coupling.

Trade-off:

- flow becomes harder to understand as complexity grows.

## Orchestration

A saga coordinator directs the workflow.

```text
Saga Orchestrator
  |
  +-> Order
  +-> Inventory
  +-> Payment
```

Advantages:

- workflow is explicit.

Trade-off:

- coordinator becomes important infrastructure.

## Key point

Compensation is not always literal rollback.

If an email was already sent, you cannot "unsend" reality.

The business must define a meaningful corrective action.

---

# 55. Reliability and Fault Tolerance

Failures are normal in distributed systems.

Architectures should assume:

- machines crash,
- networks time out,
- disks fail,
- deployments contain bugs,
- regions become unreachable.

---

# 56. Redundancy

Do not depend on one instance when availability matters.

```text
Bad:
User -> Server A

Better:
User -> Load Balancer -> A
                      -> B
                      -> C
```

Redundancy applies to:

- compute,
- databases,
- network paths,
- zones,
- sometimes entire regions.

---

# 57. Failover

Failover moves work away from a failed component.

```text
Primary fails
    |
    v
Replica promoted
```

Failover may be:

- automatic,
- manual,
- active-passive,
- active-active.

Automatic failover reduces recovery time but must avoid incorrectly creating two primaries.

---

# 58. Health Checks

Health checks answer questions like:

- Is the process alive?
- Can it serve traffic?
- Can it reach essential dependencies?

A service should not advertise itself as healthy merely because its process exists.

---

# 59. Timeouts

Every network call should have a reasonable limit.

Bad:

```text
Service A -> Service B
             waits forever
```

Better:

```text
Wait 500 ms
then fail/fallback
```

Without timeouts, one failed dependency can exhaust threads, sockets and connection pools.

---

# 60. Retries

Retries help with transient failures.

But uncontrolled retries can transform a small failure into a massive outage.

Suppose 10,000 clients fail once.

If all retry five times immediately:

```text
10,000 failures
-> 50,000 extra requests
```

Now the failing service is under even more load.

---

# 61. Exponential Backoff

Increase delay between attempts.

```text
Attempt 1 -> wait 100 ms
Attempt 2 -> wait 200 ms
Attempt 3 -> wait 400 ms
Attempt 4 -> wait 800 ms
```

This gives a struggling dependency time to recover.

---

# 62. Jitter

If every client retries after exactly 800 ms, they all retry simultaneously.

Jitter adds randomness:

```text
Client A -> 713 ms
Client B -> 842 ms
Client C -> 935 ms
```

This spreads load.

---

# 63. Circuit Breaker

Think of an electrical circuit breaker.

If Payment Service is failing:

```text
Order Service
    |
Circuit Breaker
    X
Payment Service
```

Instead of continuing to bombard it, the circuit temporarily opens.

States often resemble:

```text
CLOSED -> requests flow
OPEN   -> requests fail fast
HALF-OPEN -> test whether dependency recovered
```

## Benefit

Protects both:

- the failing dependency,
- upstream callers.

---

# 64. Bulkhead Pattern

Named after watertight compartments in ships.

Do not allow one failing workload to consume every resource.

Example:

```text
Payment thread pool: 20
Search thread pool: 50
Email thread pool: 10
```

If email becomes stuck, it cannot consume every application thread.

---

# 65. Graceful Degradation

A system may provide reduced functionality instead of completely failing.

Example:

```text
Recommendation service down
```

Instead of:

```text
503 Entire Homepage Failed
```

show:

```text
Homepage without recommendations
```

Availability often comes from deciding what functionality is optional.

---

# 66. Idempotency

An operation is idempotent if repeating it does not cause additional unintended effects.

Payments are the classic example.

```text
POST /charge
```

Client times out.

Did the payment succeed?

If it blindly retries, the customer could be charged twice.

Use an idempotency key:

```text
Idempotency-Key: checkout-739291
```

The server recognizes repeated attempts as the same logical operation.

Idempotency is essential when combining:

- retries,
- message queues,
- network failures,
- payment operations.

---

# 67. Disaster Recovery

Disaster recovery asks:

> What happens when something much larger than one process fails?

## Backups

Data copies that can be restored.

Backups should be tested.

An untested backup is only a theory.

## Multi-AZ

An availability zone is an isolated infrastructure location inside a region.

Running across zones protects against zone-level failures.

## Multi-region

Deploy across geographically separate regions.

Protects against larger failures but adds enormous data-consistency complexity.

## RPO

**Recovery Point Objective**

How much data loss is acceptable?

```text
RPO = 5 minutes
```

means losing up to approximately five minutes of recent data may be acceptable.

## RTO

**Recovery Time Objective**

How long can the system remain unavailable?

```text
RTO = 30 minutes
```

## Interview Insight

Availability requirements should determine architecture.

A system requiring 99.999% availability demands very different investment from an internal reporting dashboard.

---

# 68. Rate Limiting

Rate limiting controls how frequently someone can perform an operation.

Example:

```text
100 requests/minute per API key
```

## Why?

Protect against:

- abuse,
- bugs,
- denial-of-service amplification,
- one customer monopolizing capacity,
- excessive cost.

---

# 69. Fixed Window

Count requests during fixed intervals.

```text
12:00-12:01 -> max 100
```

Simple.

Problem: a client can send 100 requests at 12:00:59 and another 100 at 12:01:01.

---

# 70. Sliding Window

Measures requests over a moving period.

More accurate, but requires more bookkeeping.

---

# 71. Token Bucket

Imagine a bucket containing permission tokens.

```text
Bucket capacity = 100
Refill = 10 tokens/sec
```

Every request consumes one token.

Allows controlled bursts while enforcing a long-term rate.

---

# 72. Leaky Bucket

Requests enter a bucket and leave at a controlled rate.

Useful for smoothing bursts.

---

# 73. Where Can Rate Limiting Happen?

```text
Client
  |
CDN
  |
API Gateway
  |
Application
  |
Distributed rate limiter
```

Blocking abusive traffic earlier generally protects more downstream capacity.

## Distributed rate limiting

When several API servers exist, counters need coordination.

A shared Redis-like system is often used.

## Interview Insight

Define the key:

```text
per user?
per IP?
per API key?
per endpoint?
global?
```

and describe behavior when the limiter itself fails.

---

# 74. Authentication and Authorization

These are different questions.

> **Authentication = Who are you?**

> **Authorization = What are you allowed to do?**

---

# 75. Sessions and Cookies

A server may create:

```text
session_id = abc123
```

The browser stores the identifier in a cookie.

```text
Browser cookie
   |
   v
Server
   |
Session Store
```

The session store maps the ID to user information.

Advantages:

- easy server-side revocation,
- credentials need not contain lots of information.

Trade-off:

- shared session storage may be needed at scale.

---

# 76. JWT

JWT stands for JSON Web Token.

A signed token can carry claims such as:

```text
user_id
roles
expiration
issuer
```

Servers can verify the signature.

Advantages:

- useful for distributed authorization contexts.

Trade-offs:

- revocation can be harder,
- oversized or long-lived tokens can cause security problems,
- signing does not automatically mean encryption.

JWT should not be treated as a universal replacement for sessions.

---

# 77. OAuth 2.0

OAuth is primarily an authorization framework.

Example:

> Allow this application limited access to my account without giving it my password.

A common flow redirects a user to an identity provider, which later issues tokens representing authorized access.

---

# 78. OpenID Connect

OpenID Connect adds an identity layer on top of OAuth 2.0.

If OAuth answers:

> "What can this application access?"

OpenID Connect helps answer:

> "Who authenticated?"

---

# 79. API Keys

Simple identifiers for calling APIs.

Useful for:

- server integrations,
- developer APIs,
- service identification.

API keys must be protected like credentials and usually combined with authorization and rate-limit rules.

---

# 80. RBAC

Role-Based Access Control.

```text
Alice -> Admin
Bob   -> Viewer

Admin  -> delete users
Viewer -> read users
```

Simple and widely useful.

---

# 81. ABAC

Attribute-Based Access Control.

Decisions use attributes.

Example:

```text
Allow if:
user.department == document.department
AND
user.clearance >= document.classification
```

More flexible but more difficult to reason about.

---

# 82. Object Storage

Large binary data usually should not be stored directly inside the main relational database unless there is a specific reason.

Examples:

- images,
- videos,
- backups,
- PDFs,
- logs,
- archives.

Object storage uses:

```text
bucket + object key -> bytes + metadata
```

Amazon S3, for example, stores objects inside buckets and addresses them using object keys.

## Architecture

```text
Application
   |
metadata
   v
Database

Application / Client
   |
file
   v
Object Storage
```

The database might contain:

```text
image_url
owner
created_at
permissions
```

while the actual image lives in object storage.

## Common technologies

Amazon S3, Google Cloud Storage, Azure Blob Storage.

---

# 83. File Storage

File storage exposes a hierarchical filesystem:

```text
/projects/team/report.pdf
```

Useful for workloads expecting normal file semantics and shared directories.

Examples include NFS-like managed file systems.

---

# 84. Block Storage

Block storage presents raw disk-like volumes.

Applications or operating systems create filesystems on top.

Commonly used for:

- VM disks,
- databases,
- low-level persistent volumes.

---

# 85. Object vs File vs Block Storage

| Type | Interface | Typical use |
|---|---|---|
| Object | Object/API | Images, videos, backups |
| File | Files/directories | Shared filesystem |
| Block | Disk blocks/volume | VM disks, databases |

---

# 86. Search Engines

Suppose an online store has 100 million products.

This query:

```sql
SELECT *
FROM products
WHERE description LIKE '%phone%';
```

is not enough for a sophisticated search experience.

Users expect:

- typo tolerance,
- ranking,
- stemming,
- relevance,
- phrase search,
- filtering,
- autocomplete.

Search engines build specialized data structures.

---

# 87. Inverted Index

Instead of:

```text
document -> words
```

store:

```text
word -> documents
```

Example:

```text
phone -> [doc1, doc8, doc52]
camera -> [doc2, doc8]
```

That is conceptually similar to a book index.

## Tokenization

Text is broken into searchable pieces.

```text
"Best Phone Cases"
```

might become:

```text
best
phone
cases
```

## Ranking

Matching documents are scored based on relevance signals.

## Architecture

```text
Application
    |
    v
Database
    |
Change events / indexing pipeline
    |
    v
Search Engine
    |
    v
Search API
```

The database remains the primary source of truth.

The search index is a specialized projection optimized for search.

## Common technologies

Elasticsearch, OpenSearch, Solr.

## Trade-off

Search results may lag behind database updates slightly.

---

# 88. Unique ID Generation

A single database can simply use:

```text
1
2
3
4
```

But distributed systems may create records in many regions or database shards simultaneously.

A central sequence can become:

- a bottleneck,
- a coordination dependency.

---

## Database sequences

Simple and ordered.

Excellent when a central database is acceptable.

---

## UUIDs

Large identifiers generated without central coordination.

Advantages:

- easy decentralized generation.

Trade-offs:

- large,
- random IDs can be unfriendly to some index structures,
- poor human readability.

---

## Snowflake-style IDs

A famous approach combines information such as:

```text
timestamp + worker identifier + sequence
```

Advantages:

- distributed generation,
- roughly time ordered,
- compact compared with many textual UUID representations.

Trade-offs:

- clock behavior and worker-ID assignment must be managed.

---

## Timestamp-based IDs

Time can form part of an identifier, but timestamp alone is insufficient because multiple events can occur simultaneously.

## Interview Insight

Ask whether IDs must be:

- globally unique,
- sortable,
- unpredictable,
- compact,
- generated offline.

---

# 89. Distributed Locks

Suppose two application servers execute:

```text
Generate monthly invoice for customer 123
```

at the same time.

Both might create duplicate invoices.

A distributed lock attempts to ensure only one participant owns a logical resource.

```text
App A ----\
           -> Lock "invoice:123"
App B ----/
```

One succeeds.

---

## Redis-based locks

A shared Redis instance can participate in lock coordination when implemented carefully.

## Database locks

Databases can lock rows or use advisory-lock features.

Often convenient when the protected resource already lives in that database.

## ZooKeeper-style coordination

Coordination systems can provide stronger distributed primitives.

## Why use cautiously?

Locks introduce:

- contention,
- deadlocks,
- availability dependencies,
- lease-expiration problems.

Imagine:

```text
A acquires lock
A pauses for 30 seconds
Lock expires
B acquires lock
A wakes up
```

Now both may think they own it.

Sometimes idempotency, optimistic concurrency or database constraints are safer than distributed locking.

---

# 90. Bloom Filters

A Bloom filter answers:

> "Could this item be present?"

It is a probabilistic data structure.

Imagine a very compact guest list.

If it says:

```text
Definitely not invited
```

you can trust that answer.

If it says:

```text
Maybe invited
```

you still need to check the real list.

## Properties

Under normal operation:

- false positives are possible,
- false negatives are not.

Meaning:

```text
Bloom filter: absent -> definitely absent
Bloom filter: present -> maybe present
```

## Why useful?

Extremely memory efficient.

## Example

Before querying a huge database:

```text
Request user 918273
       |
   Bloom filter
    /       \
 no          maybe
 |             |
return          DB lookup
not found
```

This can prevent large numbers of useless database lookups.

## Use cases

- cache penetration protection,
- database existence checks,
- storage engines,
- web crawling.

---

# 91. Consistent Hashing

Suppose we have three cache servers.

Naive approach:

```text
server = hash(key) % 3
```

Now add a fourth server:

```text
server = hash(key) % 4
```

A huge percentage of keys map somewhere different.

The cache effectively disappears because most lookups move.

---

# 92. Hash Ring

Consistent hashing maps nodes and keys around a logical ring.

```text
        Node A
      /        \
   keys        keys
  /              \
Node D          Node B
  \              /
   keys        keys
      \        /
        Node C
```

Each key belongs to the next appropriate node on the ring.

When a node is added, only part of the keyspace moves.

---

# 93. Virtual Nodes

Instead of mapping one physical server to one ring position, map it to many virtual positions.

This improves load distribution.

```text
Server A -> A1 A2 A3 A4
Server B -> B1 B2 B3 B4
```

## Uses

- distributed caches,
- distributed databases,
- partition assignment.

## Trade-off

Consistent hashing reduces redistribution; it does not automatically solve skew or hot keys.

---

# 94. Observability

A system can be running while still being unhealthy.

Observability helps engineers understand what is happening internally by examining system outputs.

Three traditional pillars are:

- logs,
- metrics,
- traces.

OpenTelemetry provides a vendor-neutral framework for generating, collecting and exporting traces, metrics and logs.

---

# 95. Logs

Logs describe discrete events.

```text
2026-10-07T10:31:41Z
order_id=9012
payment_failed
gateway_timeout
```

Logs answer:

> "What happened?"

Useful for debugging detailed events.

---

# 96. Metrics

Metrics are numerical measurements over time.

Examples:

```text
requests/sec
CPU usage
error rate
p95 latency
queue depth
```

Metrics answer:

> "How much? How often? Is the system healthy?"

---

# 97. Traces

A distributed trace follows one request through multiple services.

```text
Request 123
 |
Gateway           10 ms
 |
Order Service     40 ms
 |
Payment Service  800 ms
 |
Database          20 ms
```

Now we can see that Payment Service caused the latency.

## Correlation IDs

A request identifier included across services and logs helps connect related events.

---

# 98. Monitoring, Alerting and Dashboards

## Monitoring

Continuously observe system behavior.

## Dashboard

Visualize important signals.

## Alert

Notify humans or automation when action may be required.

Bad alert:

```text
CPU = 72%
```

Better alert:

```text
Checkout error rate > 5%
for 10 minutes
```

Alert on user-visible problems where possible.

---

# 99. SLI, SLO and SLA

## SLI

**Service Level Indicator**

A measurement.

Example:

```text
99.97% successful requests
```

## SLO

**Service Level Objective**

An internal target.

```text
99.9% successful requests per month
```

## SLA

**Service Level Agreement**

A contractual commitment, potentially with consequences.

## Interview Insight

Production readiness includes observability.

An architecture is incomplete if nobody can detect whether it is failing.

---

# 100. Background Workers and Job Scheduling

Not every task belongs in an HTTP request.

Examples:

- generating reports,
- sending email,
- resizing images,
- processing videos,
- importing files.

```text
API
 |
Queue
 |
+--------+--------+
|        |        |
Worker  Worker   Worker
```

## Worker pool

Several workers process jobs in parallel.

## Task queue

Holds work until workers can process it.

## Scheduled jobs

Run later or at specific times.

## Cron jobs

Traditional time-based scheduling.

```text
0 2 * * *
```

might represent a job running at 2 AM daily in a typical cron configuration.

## Interview Insight

If a task does not need to finish before responding to the user, consider moving it off the synchronous path.

---

# 101. Batch vs Stream Processing

## Batch processing

Collect data and process it periodically.

```text
Events all day
   |
   v
Data files
   |
midnight job
   |
   v
Daily report
```

Useful when immediate results are unnecessary.

Examples:

- nightly billing,
- weekly reports,
- historical analytics.

Apache Spark is commonly used for large data processing workloads.

---

## Stream processing

Process data continuously as it arrives.

```text
Event -> Process
Event -> Process
Event -> Process
```

Useful for:

- fraud detection,
- realtime analytics,
- monitoring,
- personalization.

Technologies include Apache Flink and Kafka Streams.

## Comparison

| Batch | Stream |
|---|---|
| Periodic | Continuous |
| Higher latency acceptable | Low-latency results |
| Often simpler | More operational complexity |
| Historical computation | Live event reaction |

---

# 102. OLTP

Online Transaction Processing systems handle application transactions.

Examples:

```text
Create order
Update profile
Process payment
```

Characteristics:

- many small operations,
- low latency,
- frequent writes,
- current operational data.

PostgreSQL/MySQL commonly serve this role.

---

# 103. OLAP

Online Analytical Processing focuses on analytical questions.

Example:

```text
What was average revenue per customer
by country
for each month
over the last five years?
```

This query might scan billions of records.

Running it repeatedly against the production checkout database would be dangerous.

---

# 104. Data Warehouse

A warehouse stores data optimized for analytics.

Examples include Snowflake, BigQuery, Redshift and other analytical databases.

```text
Application DBs
      |
     ETL
      |
      v
Data Warehouse
      |
BI / Analytics
```

---

# 105. Data Lake

A data lake stores large amounts of raw or semi-processed data, often in object storage.

```text
JSON
CSV
Parquet
Logs
Events
Images
```

Useful for large-scale analytics and machine-learning pipelines.

---

# 106. ETL and ELT

## ETL

Extract → Transform → Load.

```text
Sources
 |
Extract
 |
Transform
 |
Warehouse
```

## ELT

Extract → Load → Transform.

```text
Sources
 |
Load into analytical system
 |
Transform there
```

Modern analytical systems often have enough compute power to make ELT practical.

---

# 107. Configuration and Secret Management

Applications vary between environments.

```text
development
staging
production
```

Configuration may include:

- database host,
- feature settings,
- external endpoints.

Secrets include:

- database passwords,
- API credentials,
- private encryption keys.

---

# 108. Environment Configuration

Do not hard-code environment-specific configuration throughout application logic.

Externalize it through controlled configuration mechanisms.

---

# 109. Feature Flags

A feature flag enables functionality without necessarily deploying new code.

```text
new_checkout = false
```

Then:

```text
1% users
10%
50%
100%
```

Useful for gradual rollouts.

Trade-off: abandoned flags create complexity and should be cleaned up.

---

# 110. Secret Stores

Secrets should be protected in dedicated systems or cloud secret-management services.

Never commit secrets directly to source control.

Why?

Git history may preserve deleted values forever.

A leaked credential may give attackers access to production systems.

Secrets also need:

- access control,
- rotation,
- auditability.

---

# 111. Security Components

Security should surround every layer rather than existing as one isolated box.

```text
Internet
   |
DDoS Protection
   |
WAF
   |
TLS
   |
Gateway
   |
Authentication / Authorization
   |
Services
   |
Encrypted Storage
```

---

# 112. TLS

TLS protects data in transit.

It helps provide:

- confidentiality,
- integrity,
- identity verification.

HTTPS is HTTP over TLS.

---

# 113. Encryption at Rest

Protect stored data on:

- disks,
- databases,
- backups,
- object stores.

Useful if storage media or snapshots are compromised.

---

# 114. Encryption in Transit

Protect data crossing networks.

Typically accomplished using TLS.

Internal traffic may also require encryption depending on threat model and regulation.

---

# 115. Firewalls

Control permitted network connections.

Example:

```text
Internet -> API: allowed
Internet -> Database: denied
App subnet -> Database: allowed
```

---

# 116. WAF

A Web Application Firewall filters HTTP traffic.

It can help detect/block classes of malicious traffic.

It complements secure application code; it does not replace it.

---

# 117. DDoS Protection

Distributed Denial-of-Service attacks attempt to overwhelm capacity.

Protection may involve:

- edge networks,
- traffic scrubbing,
- rate limiting,
- autoscaling,
- filtering.

---

# 118. Network Segmentation

Do not expose every system to every other system.

Separate:

- public network layers,
- application networks,
- data networks,
- administrative systems.

This reduces attack surface.

---

# 119. Principle of Least Privilege

Give identities only the permissions they actually need.

Bad:

```text
Recommendation Service -> administrator access to all databases
```

Better:

```text
Recommendation Service -> read product features only
```

---

# 120. Multi-Region Architecture

Global applications sometimes deploy in several geographic regions.

```text
             Global DNS
             /       \
            v         v
        Europe       Asia
          |            |
        Apps          Apps
          |            |
         DB <--------> DB
```

## Why?

- lower latency,
- disaster recovery,
- data sovereignty,
- higher availability.

---

# 121. Active-Passive Multi-Region

```text
Region A = active
Region B = standby
```

Advantages:

- simpler data ownership.

Trade-off:

- failover takes time,
- standby resources may be underutilized.

---

# 122. Active-Active Multi-Region

```text
Region A = active
Region B = active
```

Advantages:

- better latency,
- more immediate failover.

Trade-off:

- concurrent writes create difficult consistency and conflict-resolution problems.

---

# 123. Geographic Routing

Users can be routed to nearby regions using DNS or global traffic management.

```text
India -> Mumbai
Germany -> Frankfurt
USA -> Virginia
```

---

# 124. Data Sovereignty

Some regulations or business requirements restrict where certain data may be stored or processed.

Architecture may therefore depend on user geography.

---

# 125. Conflict Resolution

Suppose:

```text
Region A: username changed to Alice
Region B: username changed to Alicia
```

before replication catches up.

Which wins?

Strategies include:

- one authoritative region,
- last-write-wins,
- application-specific merging,
- conflict-free data types for specialized cases.

There is no universally correct strategy.

---

# 126. How Everything Fits Together

Consider a large e-commerce platform.

```text
                         USERS
                           |
                           v
                          DNS
                           |
                           v
                          CDN
                           |
                           v
                  DDoS / WAF Layer
                           |
                           v
                    Load Balancer
                           |
                           v
                     API Gateway
                           |
                Authentication
                           |
              +------------+------------+
              |            |            |
              v            v            v
           Catalog       Order       Account
           Service       Service      Service
              |            |
              |            +------------------+
              |                               |
              v                               v
            Cache                           Database
              |                               |
              v                        Replicas/Shards
          Database                             |
                                               v
                                        Event Streaming
                                    /        |        \
                                   v         v         v
                             Inventory   Analytics  Notifications
                                Worker     Pipeline     Worker

Object Storage <------ Product media
Search Engine  <------ Product indexing pipeline

All components ------> Logs / Metrics / Traces
```

---

# 127. Walking Through One Product Request

Suppose a user opens:

```text
https://shop.example.com/products/123
```

## Step 1: DNS

The domain is translated into the appropriate edge/network destination.

## Step 2: CDN

Static assets may be served immediately.

Examples:

```text
product image
JavaScript
CSS
```

A cacheable product response may also potentially be served at the edge.

## Step 3: WAF / DDoS protection

Suspicious traffic may be filtered before it reaches expensive application infrastructure.

## Step 4: Load balancer

The request is sent to a healthy API instance.

## Step 5: API gateway

The gateway may:

- validate credentials,
- enforce quotas,
- route `/products/*` to Catalog Service.

## Step 6: Authentication

If personalized pricing or wishlists are involved, the caller's identity is verified.

## Step 7: Catalog service

The service runs product-domain logic.

## Step 8: Cache

It asks:

```text
Redis:
product:123?
```

### Cache hit

Return quickly.

### Cache miss

Query the database.

## Step 9: Database

The database returns authoritative product metadata.

The service may populate Redis for future requests.

## Step 10: Object storage/CDN

Large images come from object storage through the CDN rather than from the relational database.

## Step 11: Search

If the user searched for "wireless headphones", the request would go through a specialized search engine rather than a SQL substring scan.

## Step 12: Events

The page-view event might be written asynchronously:

```text
ProductViewed
```

## Step 13: Event consumers

Different systems process it:

```text
Analytics
Recommendations
Personalization
Fraud detection
```

## Step 14: Observability

The entire request produces:

- latency metrics,
- logs,
- possibly a distributed trace.

---

# 128. What Happens When Traffic Suddenly Increases 10×?

Protective components include:

### CDN

Absorbs static/cacheable requests.

### Load balancer

Distributes requests.

### Autoscaling

Adds application instances.

### Cache

Prevents all reads from reaching the database.

### Queue

Buffers asynchronous work.

```text
Incoming work = 100k/min
Workers capacity = 50k/min

Queue temporarily absorbs difference.
```

### Rate limiter

Protects infrastructure from unlimited traffic.

### Database replicas

Can absorb additional read traffic.

The weakest remaining bottleneck determines capacity.

That may still be:

- database writes,
- cache hot keys,
- downstream API limits,
- network capacity.

---

# 129. What Happens When One Application Server Crashes?

```text
App 1 -> healthy
App 2 -> CRASH
App 3 -> healthy
```

Health checks remove App 2.

The load balancer sends traffic to Apps 1 and 3.

An orchestrator may automatically replace App 2.

If servers are stateless, the failure should be relatively uneventful.

---

# 130. What Happens When Redis Becomes Unavailable?

A resilient system decides its behavior in advance.

Possibility:

```text
Redis unavailable
       |
       v
Database fallback
```

But this creates danger.

If millions of requests suddenly hit the database:

```text
Cache outage
   |
Database overload
   |
Application outage
```

Mitigations include:

- replicated cache,
- local fallback cache,
- request throttling,
- circuit breakers,
- graceful degradation,
- database capacity planning.

The cache should improve reliability, not turn into a hidden single point of failure.

---

# 131. What Happens When a Database Replica Fails?

The database/load-balancing layer removes it from read traffic.

```text
Primary
 |- Replica A
 |- Replica B X
 |- Replica C
```

Reads move to A and C.

If the primary remains healthy, writes may continue normally.

---

# 132. What Happens When Kafka Is Temporarily Unavailable?

Applications have several possible strategies depending on requirements:

- retry with backoff,
- temporarily buffer events,
- return an error for operations that require durable event publication,
- write transactionally to an outbox and publish later.

Do not silently discard critical events.

For example, "user viewed product" may tolerate loss.

"payment completed" probably should not.

---

# 133. What Happens When an Entire Availability Zone Fails?

Suppose:

```text
AZ A -> FAILED
AZ B -> healthy
AZ C -> healthy
```

A multi-AZ design has:

- compute in several zones,
- load balancing,
- replicated databases,
- redundant queues/caches,
- zone-independent storage where appropriate.

Traffic shifts to remaining zones.

The system may run at reduced capacity while autoscaling restores headroom.

---

# 134. From 100 Users to 100 Million Users

This section illustrates architectural evolution.

These user counts are educational examples, not universal thresholds.

Different systems have radically different workloads.

A video platform with 10,000 users may need more infrastructure than a text-based internal tool with 1 million accounts.

---

# Stage 1 — 100 Users

```text
Users
  |
Application
  |
Database
```

## Bottleneck

Probably none.

## Why this architecture works

Traffic is small.

Operational simplicity matters more than extreme scalability.

## Components

- one application,
- one database,
- basic backups,
- monitoring.

## New complexity

Almost none.

### Correct architectural decision

Do not deploy Kafka, Kubernetes, six microservices and twelve databases.

---

# Stage 2 — 10,000 Users

```text
Users
  |
Application Server
  |
Database Server
```

Separate application and database infrastructure.

## Bottleneck

App and database may compete for:

- CPU,
- memory,
- disk.

## Change

Separate responsibilities.

## Problem solved

Each layer can be scaled or tuned independently.

## New complexity

- networking,
- separate deployment/backup processes.

---

# Stage 3 — 100,000 Users

```text
                 Load Balancer
                  /    |    \
                 v     v     v
               App   App   App
                       |
                    Database
```

## Bottleneck

One application server cannot handle enough requests or is an unacceptable single failure point.

## Introduce

- load balancer,
- multiple stateless app servers.

## Solves

- compute capacity,
- server failover.

## New complexity

- shared sessions,
- distributed logs,
- deployment coordination.

---

# Stage 4 — 1 Million Users

```text
                    CDN
                     |
               Load Balancer
                /    |    \
              Apps  Apps  Apps
                 \    |    /
                    Cache
                     |
                 Primary DB
                 /        \
           Read Replica  Read Replica
```

## Bottlenecks

- repeated database reads,
- global static-asset latency,
- primary database read pressure.

## Introduce

### CDN

Reduces geographic latency and origin load.

### Cache

Removes repeated expensive database reads.

### Read replicas

Distribute read traffic.

## New complexity

- cache invalidation,
- replication lag,
- stale reads.

---

# Stage 5 — 10 Million Users

```text
                    API Layer
                        |
          +-------------+-------------+
          |                           |
        Cache                   Database Shards
                                      |
                                    Queue
                             /         |         \
                          Email    Processing   Search
                         Workers     Workers    Indexer
```

## Bottlenecks

- database write capacity,
- giant datasets,
- synchronous background work,
- inefficient search.

## Introduce

### Sharding

Distribute storage/write load.

### Queues

Decouple expensive tasks.

### Worker pools

Process asynchronous work.

### Search engine

Handle full-text retrieval.

### Object storage

Move large files out of transactional databases.

## New complexity

- shard routing,
- cross-shard operations,
- retries,
- asynchronous consistency,
- dead-letter queues,
- search-index lag.

---

# Stage 6 — 100 Million Users

A sufficiently complex business may evolve toward:

```text
                         Global Traffic
                               |
                      Multi-Region Edge
                               |
                    CDN / WAF / Gateway
                               |
          +--------------------+--------------------+
          |                    |                    |
       Users                Orders              Catalog
       Service              Service              Service
          |                    |                    |
       Cache              Sharded DB          Search Index
          |                    |
          +---------- Event Streaming ----------+
                    /        |         \
                   v         v          v
              Analytics  Inventory  Notifications

                 Multi-region replication

             Logs + Metrics + Traces + SLOs
```

## Bottlenecks

Now the company may face:

- independently scaling domains,
- many engineering teams,
- global latency,
- extreme event volumes,
- regional outages.

## Possible additions

### Microservices

Independent deployment and ownership.

### Event streaming

Connect large numbers of producers and consumers.

### Multi-region infrastructure

Serve users globally and improve disaster tolerance.

### Sophisticated observability

Debug increasingly complex request paths.

### Automated orchestration

Operate large compute fleets.

## New complexity

Enormous.

You now have:

- partial failures,
- distributed transactions,
- schema evolution,
- event ordering,
- replication conflicts,
- tracing,
- capacity management,
- multi-region consistency.

And that is why:

> **Complexity should be purchased only when requirements justify the price.**

---

# 135. Master System Design Cheat Sheet

| Component | Problem It Solves | Typical Use |
|---|---|---|
| DNS | Name resolution | Route domains |
| GeoDNS | Geographic routing | Send users to nearby regions |
| CDN | Geographic latency/origin load | Static and cacheable content |
| Reverse Proxy | Centralized request handling | TLS, routing, compression |
| Load Balancer | Traffic distribution | Multiple server instances |
| API Gateway | API management | Authentication, routing, quotas |
| WAF | Malicious HTTP traffic | Internet-facing apps |
| Rate Limiter | Abuse/excess traffic | Public APIs |
| Application Server | Business logic | Backend services |
| Autoscaling | Variable demand | Elastic compute |
| Container | Deployment consistency | Package applications |
| Kubernetes/Orchestrator | Container fleet management | Scheduling, healing, deployment |
| Serverless | Event-driven compute | Functions and irregular workloads |
| Relational DB | Structured durable data | Orders, users, payments |
| Key-value DB | Fast key lookup | Sessions, counters |
| Document DB | Flexible document data | Content/catalog data |
| Wide-column DB | Massive distributed datasets | High-volume workloads |
| Graph DB | Relationship queries | Social/fraud graphs |
| Index | Slow database lookup | Accelerate queries |
| Replica | Availability/read scaling | Database copies |
| Partition | Divide large datasets | Data management |
| Shard | Horizontal DB scaling | Huge datasets/write load |
| Connection Pool | DB connection overhead | Reuse connections |
| Cache | Slow repeated reads | Frequently accessed data |
| Redis | Fast shared in-memory state | Cache, counters, rate limits |
| Message Queue | Async task execution | Background jobs |
| Dead-Letter Queue | Persistently failing jobs | Failure isolation |
| Kafka/Event Stream | Durable event pipelines | Large event systems |
| Pub/Sub | One-to-many messaging | Independent event consumers |
| Service Discovery | Dynamic service locations | Microservices |
| Service Registry | Service registration/lookup | Dynamic infrastructure |
| Service Mesh | Service-to-service controls | Traffic, mTLS, telemetry |
| REST | HTTP resource APIs | Public/general APIs |
| GraphQL | Flexible field selection | Client-driven APIs |
| gRPC | Efficient RPC | Internal services |
| WebSocket | Bidirectional realtime traffic | Chat/games |
| SSE | Server-to-client streaming | Live updates |
| Webhook | External event notification | SaaS integrations |
| Quorum | Replica coordination | Distributed databases |
| Consensus | Distributed agreement | Leader election, replicated state |
| Saga | Cross-service workflow | Distributed business transaction |
| Circuit Breaker | Failing dependency protection | Service calls |
| Timeout | Bound dependency waiting | Network calls |
| Retry | Transient failure recovery | Distributed operations |
| Exponential Backoff | Retry pressure control | Dependency failures |
| Jitter | Retry synchronization prevention | Large client fleets |
| Bulkhead | Failure isolation | Resource pools |
| Idempotency | Duplicate operation protection | Payments/retries |
| Backup | Data recovery | Disaster recovery |
| Multi-AZ | Zone-failure tolerance | Production systems |
| Multi-region | Geographic resilience | Global/critical applications |
| Object Storage | Large unstructured objects | Images/videos/backups |
| File Storage | Shared filesystem | Legacy/shared file workloads |
| Block Storage | Disk-like persistence | Databases/VMs |
| Search Engine | Full-text relevance search | Product/content search |
| UUID/Snowflake ID | Distributed ID generation | Multi-node systems |
| Distributed Lock | Cross-node mutual exclusion | Rare coordination cases |
| Bloom Filter | Cheap membership check | Avoid unnecessary reads |
| Consistent Hashing | Stable key distribution | Caches/distributed stores |
| Logs | Event details | Debugging |
| Metrics | Numerical system health | Monitoring |
| Traces | Request path visibility | Distributed debugging |
| Alerting | Detect actionable failure | Operations |
| Worker Pool | Async processing | Email/video/report jobs |
| Scheduler/Cron | Time-based execution | Recurring jobs |
| Batch Processing | Periodic large computation | Reports/analytics |
| Stream Processing | Continuous event computation | Fraud/realtime analytics |
| OLTP DB | Operational transactions | Application data |
| Data Warehouse | Analytical queries | BI/reporting |
| Data Lake | Raw large-scale data | Analytics/ML |
| ETL/ELT | Data movement/transformation | Analytics pipelines |
| Feature Flags | Controlled rollout | Progressive deployment |
| Secret Store | Credential protection | Passwords/API keys |
| TLS | Encryption in transit | Network security |
| Encryption at Rest | Stored-data protection | DB/storage security |
| Firewall | Network access restriction | Segmentation |
| DDoS Protection | Volumetric attack defense | Public systems |

---

# 136. Common Architectural Interactions

System-design components rarely work alone.

Understanding combinations is more useful than memorizing definitions.

## Cache + database

```text
Cache speeds reads.
Database remains source of truth.
```

## Queue + worker

```text
Queue buffers work.
Workers execute work.
```

## Database + Kafka

```text
Database stores current state.
Kafka communicates state-change events.
```

## Database + search engine

```text
Database stores authoritative product data.
Search engine stores search-optimized representation.
```

## Object storage + CDN

```text
Object storage holds files.
CDN distributes them globally.
```

## Load balancer + stateless application servers

```text
Load balancer distributes requests.
Statelessness allows any server to handle them.
```

## Replication + failover

```text
Replication creates redundant data copies.
Failover switches to one when another fails.
```

## Metrics + autoscaling

```text
Metrics reveal load.
Autoscaler adjusts compute capacity.
```

## Retry + idempotency

```text
Retries improve resilience.
Idempotency prevents retries from duplicating side effects.
```

## Microservices + observability

```text
More network boundaries create harder debugging.
Tracing becomes more valuable.
```

---

# 137. Common System-Design Mistakes

## Mistake 1: Starting with technologies

Bad:

> "We'll use Kafka, Redis, Kubernetes and Cassandra."

Better:

> "We expect 200,000 writes per second and downstream consumers do not need synchronous execution, so we need durable asynchronous event processing."

The requirement should lead to the technology.

---

## Mistake 2: Premature sharding

A poorly indexed 100 GB database does not automatically need 20 shards.

Optimize first.

---

## Mistake 3: Treating Redis as magic

A cache introduces:

- invalidation,
- stale data,
- cache failures,
- eviction,
- hot keys.

Use it for a measurable reason.

---

## Mistake 4: Assuming microservices automatically scale better

A well-designed monolith can scale horizontally.

Microservices primarily change boundaries, deployment and organizational architecture.

---

## Mistake 5: Ignoring failure modes

For every dependency ask:

> What happens when this is slow?

and:

> What happens when this is completely unavailable?

---

## Mistake 6: Ignoring writes

Caching and replicas dramatically improve read-heavy systems.

They do much less for a database limited by write throughput.

---

## Mistake 7: Saying "eventually consistent" without defining acceptable delay

Eventually could mean:

- 50 milliseconds,
- 5 seconds,
- 2 hours.

Business requirements determine whether that is acceptable.

---

## Mistake 8: Designing only the happy path

A robust architecture includes:

- retries,
- idempotency,
- timeouts,
- backup strategy,
- monitoring,
- recovery behavior.

---

# 138. A Better Mental Model for Architecture

Instead of memorizing diagrams, ask what resource is under pressure.

## CPU bottleneck?

Consider:

- vertical scaling,
- horizontal scaling,
- better algorithms,
- autoscaling.

## Repeated database reads?

Consider:

- indexes,
- caching,
- replicas.

## Database write bottleneck?

Consider:

- batching,
- partitioning,
- sharding,
- data-model changes.

## User latency due to distance?

Consider:

- CDN,
- regional deployments,
- edge caching.

## Slow non-essential work?

Consider:

- queues,
- background workers.

## Search too slow or primitive?

Consider:

- search engine.

## Large binary data?

Consider:

- object storage.

## One machine failing causes outage?

Consider:

- redundancy,
- health checks,
- failover.

## Too many downstream failures?

Consider:

- timeout,
- retry with backoff,
- circuit breaker,
- graceful degradation.

## Teams cannot deploy independently?

Perhaps service decomposition becomes valuable.

Notice how the problem comes first.

---

# 139. System Design Interview: A Practical Example

Suppose the interviewer asks:

> Design an online shopping system.

Do not immediately draw 25 boxes.

Start with requirements.

### Functional requirements

Perhaps:

- browse products,
- search products,
- add to cart,
- place orders,
- pay,
- view order status.

### Non-functional requirements

Perhaps:

- high availability,
- low-latency browsing,
- no duplicate charges,
- millions of users,
- durable order history.

Now map requirements to architecture.

```text
Low-latency images
-> CDN + object storage

Product search
-> search index

Frequently viewed products
-> cache

Durable orders
-> relational database

No duplicate payment
-> idempotency

Slow email delivery
-> queue + worker

High availability
-> load balancer + multiple instances

Read-heavy product traffic
-> cache + read replicas

Large future write scale
-> consider partitioning/sharding only when needed
```

This is system-design reasoning.

---

# 140. How to Think Like a System Designer

The best system designers do not begin by drawing architecture.

They begin by reducing uncertainty.

Use the following sequence.

---

## 1. Functional Requirements

Ask:

> What must the system do?

Examples:

```text
Users can create posts.
Users can follow each other.
Users can view a feed.
```

Avoid solving functions nobody asked for.

---

## 2. Non-Functional Requirements

Ask:

> How well must the system behave?

Examples:

- availability,
- latency,
- durability,
- consistency,
- security,
- geographic reach.

"Build Twitter" is incomplete.

"Build a global social feed where reads must respond within 200 ms and temporary stale counts are acceptable" is far more useful.

---

## 3. Traffic Estimates

Estimate:

```text
daily active users
requests per second
read/write ratio
peak traffic
```

Example:

```text
10 million daily active users
20 requests/user/day

200 million requests/day

Average:
~2,300 requests/sec

Peak maybe several times higher.
```

Estimates do not need to be perfect.

They reveal the scale class.

---

## 4. Storage Estimates

Estimate:

```text
records per day
bytes per record
retention period
media volume
```

Example:

```text
10 million images/day
2 MB/image

= 20 TB/day
```

That immediately tells us the images probably belong in object storage, not ordinary database rows.

---

## 5. API Design

Define key interfaces.

Example:

```text
POST /orders
GET /orders/{id}
POST /payments
GET /products?q=headphones
```

This clarifies interactions.

---

## 6. Data Model

Identify core entities.

```text
User
Product
Order
OrderItem
Payment
Shipment
```

Ask:

- relationships?
- query patterns?
- transaction boundaries?

The data model often drives database choice.

---

## 7. High-Level Architecture

Only now draw the first architecture.

Keep version one simple.

```text
Client
 |
API
 |
Application
 |
Database
```

Then add components only where a requirement demands them.

---

## 8. Find Bottlenecks

Ask:

> What fails first?

Possibilities:

- CPU,
- memory,
- database reads,
- database writes,
- storage,
- network,
- third-party API,
- queue throughput.

Do not scale imaginary bottlenecks.

---

## 9. Choose a Scaling Strategy

Examples:

```text
App CPU bottleneck
-> horizontal scaling

Repeated reads
-> cache

Database read bottleneck
-> replicas

Database write bottleneck
-> partition/shard

Large static traffic
-> CDN

Slow background work
-> queue
```

---

## 10. Design for Failure

For every important dependency ask:

```text
What if it is slow?
What if it fails?
What if the network fails?
What if a retry duplicates an operation?
What if an entire zone disappears?
```

Introduce only the resilience mechanisms necessary:

- timeout,
- retry,
- jitter,
- circuit breaker,
- failover,
- redundancy,
- backup,
- multi-AZ,
- potentially multi-region.

---

## 11. Explain Trade-Offs

This is where strong system-design reasoning becomes visible.

Do not say:

> "Use eventual consistency."

Say:

> "Product like counts may be eventually consistent because temporary differences do not affect correctness. Payment balances require stronger consistency because stale values could permit incorrect financial operations."

Do not say:

> "Use Kafka because we need scale."

Say:

> "Several independent consumers need to process the order-event history at different speeds, and consumers may need to replay historical events, so a durable event stream is a reasonable fit."

Every decision has a cost.

---

# 141. The Final Mental Framework

When you encounter a system-design component, do not memorize:

> Redis = cache.

Instead ask:

### What problem appeared?

Repeated database reads.

### What component might help?

Cache.

### How does it help?

Stores commonly accessed values in faster memory.

### What does it cost?

- invalidation complexity,
- stale data risk,
- another dependency.

### What happens if it fails?

Requests may fall back to the database, potentially overloading it.

### What alternative exists?

- optimize queries,
- add indexes,
- use read replicas,
- compute results differently.

That reasoning process generalizes to every system in this guide.

---

# 142. Closing Perspective

At small scale, good architecture may be:

```text
Application
    |
Database
```

At larger scale, genuine requirements may produce:

```text
DNS
 |
CDN
 |
Load Balancer
 |
API Gateway
 |
Services
 |
+--------+--------+---------+
|        |        |         |
Cache    DB     Search   Object Storage
         |
      Replicas
         |
       Events
     /    |    \
 Workers Analytics Notifications
```

At even larger scale, multiple regions, shards, stream processors, orchestration systems and sophisticated observability may become justified.

But the goal is never to reach the complicated diagram.

The goal is to build the **simplest architecture that safely satisfies the current requirements while leaving sensible paths for future growth**.

The engineer who understands when **not** to introduce a component often understands system design better than the engineer who can name the most technologies.

Remember:

> **Good system design is not about adding every possible component. It is about choosing the minimum set of components necessary to satisfy the system's requirements and constraints.**

When designing a real system or answering an interview question, repeatedly ask:

```text
What requirement am I satisfying?
What is the current bottleneck?
Why does this component help?
What new failure modes does it introduce?
What simpler alternative exists?
What happens when it fails?
```

If you can answer those questions clearly, you are no longer merely memorizing system-design diagrams.

You are thinking like a system designer.
