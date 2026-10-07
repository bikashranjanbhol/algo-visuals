# System Design Components Explained: A Crystal-Clear Guide from Basics to Distributed Systems

System design can feel overwhelming at first.

You hear terms such as:

**Load Balancer, CDN, Cache, Reverse Proxy, Message Queue, Database Sharding, Replication, API Gateway, Kafka, Consistent Hashing, Service Discovery, Circuit Breaker...**

And suddenly designing something as simple as a URL shortener feels like designing Google.

The good news is that most large systems are built using the **same fundamental components**.

Once you understand:

1. **What each component does**
2. **Why it exists**
3. **When you should use it**
4. **What problem it solves**
5. **What trade-offs it introduces**

system design becomes much easier.

This guide explains the major system-design components from first principles.

---

# 1. Client

Every system starts with a **client**.

A client is simply something that communicates with your system.

Examples include:

- Web browsers
- Mobile applications
- Desktop applications
- Smart TVs
- IoT devices
- Other backend services

Suppose you open Instagram.

Your mobile application might send a request such as:

```text
GET /feed
```

The request travels through several components before reaching the database.

A simplified architecture might look like:

```text
Client
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
Application Servers
   |
   +------> Cache
   |
   +------> Database
```

The rest of system design is largely about deciding **what should happen between the client and the data**.

---

# 2. DNS — Domain Name System

Computers communicate using IP addresses.

Humans prefer names.

Instead of remembering:

```text
142.250.193.46
```

we prefer:

```text
google.com
```

DNS translates a domain name into an IP address.

Think of DNS as the **phone book of the internet**.

When someone visits:

```text
api.example.com
```

DNS may resolve it to:

```text
203.0.113.20
```

The client can then connect to that server.

## Why DNS matters in system design

DNS can also help route users geographically.

For example:

```text
User in India
     |
     v
India Data Center

User in Europe
     |
     v
European Data Center
```

This reduces latency.

DNS can therefore participate in:

- Geographic routing
- Disaster recovery
- Multi-region architectures
- Traffic distribution

---

# 3. Web Server

A **web server** accepts HTTP requests and returns responses.

Popular examples include:

- Nginx
- Apache HTTP Server
- Caddy

A web server may serve static resources such as:

```text
HTML
CSS
JavaScript
Images
```

It may also forward dynamic requests to an application server.

For example:

```text
Browser
   |
   v
Nginx
   |
   v
Node.js / Java / Go Backend
```

---

# 4. Application Server

The application server contains your **business logic**.

For example, suppose a user sends:

```text
POST /orders
```

The application server might:

1. Validate the request.
2. Check whether the product exists.
3. Check inventory.
4. Calculate the price.
5. Create the order.
6. Save it to the database.
7. Trigger payment processing.
8. Send an order-confirmation event.

Application servers may be written using technologies such as:

```text
Java + Spring Boot
Node.js
Python + Django/FastAPI
Go
C#
Rust
```

In modern architectures, you usually run **multiple application servers**.

That leads us to the next component.

---

# 5. Load Balancer

Imagine your system receives:

```text
100,000 requests/second
```

One server probably cannot handle everything.

So you create multiple servers:

```text
Server 1
Server 2
Server 3
Server 4
```

Now we need something that decides:

> Which server should receive each request?

That component is the **Load Balancer**.

```text
             +------------+
Client ----> |   Load     |
             |  Balancer  |
             +------------+
              /    |    \
             /     |     \
            v      v      v
          App1   App2   App3
```

## Common load-balancing algorithms

### Round Robin

Requests are distributed one after another.

```text
Request 1 -> Server A
Request 2 -> Server B
Request 3 -> Server C
Request 4 -> Server A
```

### Weighted Round Robin

More powerful servers receive more traffic.

For example:

```text
Server A weight = 5
Server B weight = 2
```

Server A receives more requests.

### Least Connections

Traffic goes to the server currently handling the fewest connections.

### IP Hash

The client's IP determines which server receives the request.

This can help provide session affinity.

## Layer 4 vs Layer 7 Load Balancing

### Layer 4

Routes based on networking information such as:

```text
IP
TCP
UDP
Port
```

It is usually very fast.

### Layer 7

Understands application-level protocols such as HTTP.

It can route based on:

```text
URL
Headers
Cookies
HTTP Method
Host
```

For example:

```text
/api/payments -> Payment Service

/api/users -> User Service
```

---

# 6. Horizontal Scaling

When traffic increases, we need more computing capacity.

There are two main approaches.

## Vertical scaling

Increase the power of one machine.

```text
Before:
4 CPU
8 GB RAM

After:
32 CPU
128 GB RAM
```

This is called **scaling up**.

Advantages:

- Simple
- No distributed-system complexity

Disadvantages:

- Hardware limits exist
- Expensive
- Larger failure domain

## Horizontal scaling

Add more machines.

```text
1 server

becomes

10 servers
```

This is called **scaling out**.

Modern distributed systems usually prefer horizontal scaling.

---

# 7. Reverse Proxy

A reverse proxy sits in front of backend servers.

```text
Client
   |
   v
Reverse Proxy
   |
   v
Backend Servers
```

The client does not communicate directly with your backend servers.

The reverse proxy can provide:

- Load balancing
- TLS termination
- Compression
- Authentication
- Caching
- Routing
- Rate limiting
- Security filtering

Popular reverse proxies include:

- Nginx
- HAProxy
- Envoy
- Traefik

## Forward Proxy vs Reverse Proxy

A **forward proxy** hides the client.

```text
Client -> Proxy -> Internet
```

A **reverse proxy** hides the server.

```text
Internet -> Reverse Proxy -> Backend
```

---

# 8. API Gateway

An API Gateway is the entry point for APIs, particularly in a microservices architecture.

Suppose you have:

```text
User Service
Order Service
Payment Service
Search Service
Recommendation Service
```

Instead of exposing every service directly:

```text
Client
   |
   v
API Gateway
   |
   +--> User Service
   |
   +--> Order Service
   |
   +--> Payment Service
```

The API Gateway can handle:

- Authentication
- Authorization
- Rate limiting
- Routing
- Request transformation
- Response aggregation
- Logging
- API versioning

Example:

```text
GET /users/123
```

may route to:

```text
User Service
```

while:

```text
POST /payments
```

routes to:

```text
Payment Service
```

---

# 9. CDN — Content Delivery Network

A CDN stores content near users geographically.

Imagine your application's servers are in the United States.

A user in India requests:

```text
logo.png
```

Without a CDN:

```text
India
  |
  |
  | Long network trip
  |
  v
USA Server
```

With a CDN:

```text
India User
    |
    v
Nearby CDN Edge
```

The file may be served from Bengaluru, Mumbai, Chennai or another nearby edge location instead of traveling to the origin server.

CDNs commonly cache:

- Images
- JavaScript
- CSS
- Videos
- Fonts
- Downloadable files
- Sometimes API responses

Benefits include:

- Lower latency
- Reduced origin-server load
- Better availability
- Faster global delivery

Popular CDN providers include Cloudflare, Akamai, Fastly and major cloud providers.

---

# 10. Cache

A database query might take:

```text
50 ms
```

Fetching the same information from memory might take:

```text
1 ms
```

Instead of repeatedly querying the database, we can store frequently requested data inside a **cache**.

```text
Application
    |
    v
  Cache
    |
Cache hit?
 /       \
Yes       No
 |         |
 v         v
Return   Database
```

Popular caching technologies include:

- Redis
- Memcached

## Example

Without cache:

```text
GET user 123
   |
Database
```

Every request hits the database.

With cache:

```text
GET user 123
   |
Redis
   |
Database only if missing
```

---

# 11. Cache Hit and Cache Miss

If requested data exists in cache:

```text
Cache Hit
```

If it does not exist:

```text
Cache Miss
```

Example:

```text
GET product:123
```

If Redis contains:

```text
product:123 = {...}
```

that is a cache hit.

Otherwise the application queries the database and may place the result into Redis.

---

# 12. Cache-Aside Pattern

One of the most common caching strategies is **cache-aside**.

The application first checks the cache.

```text
Read Cache
   |
Found?
 /   \
Yes   No
 |     |
Return DB
        |
        v
     Cache Data
```

Pseudo-flow:

```text
data = cache.get(key)

if data is null:
    data = database.get(key)
    cache.set(key, data)

return data
```

It is simple and widely used.

---

# 13. Cache Eviction

Caches have limited memory.

Eventually something must be removed.

Common eviction strategies include:

### LRU

Least Recently Used.

Remove the item that has not been accessed for the longest time.

### LFU

Least Frequently Used.

Remove items accessed infrequently.

### FIFO

First In, First Out.

Remove the oldest item.

### TTL

Time To Live.

For example:

```text
cache.set("user:123", data, TTL = 5 minutes)
```

After five minutes the cache entry expires.

---

# 14. Cache Invalidation

Caching creates a difficult problem.

Suppose:

```text
Database:
username = "John"

Cache:
username = "John"
```

The user changes their name:

```text
username = "Mike"
```

The database now contains Mike, but the cache may still contain John.

This is called **stale data**.

Possible solutions include:

- Delete the cache entry after database updates.
- Update both cache and database.
- Use short TTL values.
- Use events to invalidate caches.

There is a famous joke in computer science:

> There are only two hard things in Computer Science: cache invalidation and naming things.

Caching is extremely powerful, but keeping cached information correct requires careful design.

---

# 15. Database

The database stores persistent application data.

Examples:

```text
Users
Orders
Products
Payments
Messages
Posts
Comments
```

Databases broadly fall into two major families:

```text
SQL
NoSQL
```

---

# 16. SQL Databases

SQL databases organize information using tables.

Example:

```text
Users

+----+---------+-------------------+
| id | name    | email             |
+----+---------+-------------------+
| 1  | Alice   | alice@example.com |
| 2  | Bob     | bob@example.com   |
+----+---------+-------------------+
```

Common SQL databases include:

- PostgreSQL
- MySQL
- Oracle
- SQL Server

SQL databases are often strong choices when you need:

- Transactions
- Structured relationships
- Joins
- Strong consistency
- Complex querying
- Well-defined schemas

---

# 17. NoSQL Databases

NoSQL databases provide alternative data models.

Several categories exist.

## Key-value databases

Example:

```text
user:123 -> {...}
```

Examples:

- Redis
- DynamoDB-style key-value usage

Good for:

- Sessions
- Caching
- Simple high-scale lookups

## Document databases

Store JSON-like documents.

Example:

```json
{
  "id": 123,
  "name": "Alice",
  "skills": ["Java", "AWS"]
}
```

Examples:

- MongoDB
- Couchbase

## Wide-column databases

Examples:

- Cassandra
- HBase

Useful for massive distributed workloads.

## Graph databases

Data is modeled using nodes and relationships.

Examples:

- Neo4j
- Amazon Neptune

Useful for:

```text
Social networks
Fraud detection
Recommendation relationships
Knowledge graphs
```

---

# 18. Database Index

Imagine a table containing:

```text
500 million users
```

You run:

```sql
SELECT *
FROM users
WHERE email = 'alice@example.com';
```

Without an index, the database might scan a huge portion of the table.

An **index** creates a data structure that helps locate values quickly.

Conceptually:

```text
alice@example.com -> Row 823499
bob@example.com   -> Row 384293
```

Indexes dramatically improve read performance.

However, they are not free.

Every new index:

- Uses storage
- Consumes memory
- Makes writes somewhat slower

because indexes must also be updated.

---

# 19. Database Replication

Suppose your database server dies.

If it is your only copy of the data, your application may stop working.

Replication creates multiple copies.

```text
             Primary
              /   \
             /     \
            v       v
        Replica 1 Replica 2
```

The primary may handle writes:

```text
INSERT
UPDATE
DELETE
```

while replicas may handle reads.

Example:

```text
Write Request
     |
     v
   Primary

Read Requests
   /      \
  v        v
Replica1 Replica2
```

Benefits include:

- Higher availability
- Read scalability
- Disaster recovery

The main challenge is **replication lag**.

A replica may temporarily contain slightly older information than the primary.

---

# 20. Database Partitioning

As data becomes huge, one database server may no longer be enough.

We can split the data into pieces.

This is called **partitioning**.

Example:

```text
Users A-F -> Partition 1
Users G-M -> Partition 2
Users N-Z -> Partition 3
```

Each partition contains only part of the dataset.

---

# 21. Database Sharding

Sharding is a form of horizontal partitioning where different pieces of data are stored on different servers.

For example:

```text
user_id 1-1,000,000
        |
        v
     Shard A

user_id 1,000,001-2,000,000
        |
        v
     Shard B
```

Or using hashing:

```text
shard = hash(user_id) % number_of_shards
```

For four shards:

```text
hash(user123) % 4 = 2

-> Shard 2
```

Benefits:

- More storage
- Higher write capacity
- Horizontal scalability

Challenges include:

- Cross-shard queries
- Cross-shard transactions
- Rebalancing
- Choosing the right shard key
- Hot shards

---

# 22. Consistent Hashing

Suppose we have three cache servers:

```text
Cache A
Cache B
Cache C
```

A simple strategy might be:

```text
server = hash(key) % 3
```

But if we add another server:

```text
hash(key) % 4
```

many keys suddenly map to different servers.

That causes massive cache reshuffling.

**Consistent hashing** solves this problem.

Servers and keys are placed conceptually on a hash ring:

```text
        Server A
       /        \
      /          \
Server D        Server B
      \          /
       \        /
        Server C
```

Keys map to the next server on the ring.

If a server is added or removed, only a relatively small portion of keys need to move.

Consistent hashing is commonly used in:

- Distributed caches
- Distributed databases
- Storage systems

---

# 23. Message Queue

Not every task needs to happen immediately.

Suppose a user places an order.

The system may need to:

```text
Create order
Process payment
Send email
Update analytics
Notify warehouse
Update recommendations
Generate invoice
```

If one HTTP request performs all of these synchronously, it becomes slow and fragile.

Instead:

```text
Order Service
     |
     v
Message Queue
 /      |       \
v       v        v
Email  Analytics Warehouse
```

The request can finish quickly while background workers handle other tasks.

Common messaging technologies include:

- RabbitMQ
- Amazon SQS
- Apache Kafka
- Google Pub/Sub
- Azure Service Bus

---

# 24. Producer and Consumer

Messaging systems usually involve:

```text
Producer
Queue/Topic
Consumer
```

A producer sends messages.

Example:

```text
OrderCreated
```

A consumer processes them.

```text
Order Service
     |
Producer
     |
     v
   Queue
     |
     v
Consumer
     |
     v
Email Service
```

---

# 25. Event-Driven Architecture

Instead of services constantly calling each other, services can react to events.

Example:

```text
OrderCreated
```

Several services may listen:

```text
OrderCreated
    |
    +--> Payment Service
    |
    +--> Inventory Service
    |
    +--> Email Service
    |
    +--> Analytics Service
```

Services become more loosely coupled.

The Order Service does not necessarily need to know who consumes the event.

---

# 26. Apache Kafka

Kafka is commonly used for high-throughput event streaming.

A simplified Kafka architecture is:

```text
Producer
   |
   v
 Topic
   |
   +--> Partition 0
   +--> Partition 1
   +--> Partition 2
             |
             v
         Consumers
```

Kafka is particularly useful for:

- Event-driven systems
- Streaming pipelines
- Analytics
- Log processing
- Change-data capture
- High-throughput messaging

Unlike a simple queue, Kafka typically retains events for a configured period, allowing consumers to replay them.

---

# 27. Queue vs Kafka-Style Event Stream

A traditional queue often behaves like:

```text
Producer -> Queue -> Consumer
```

After successful processing, the message may disappear.

An event log behaves more like:

```text
Event 1
Event 2
Event 3
Event 4
Event 5
```

Consumers maintain their own position in that log.

This enables replaying history.

---

# 28. Publish/Subscribe

Publish/Subscribe, or **Pub/Sub**, allows multiple subscribers to receive the same event.

Example:

```text
OrderCreated
     |
     +--> Email Service
     |
     +--> Analytics Service
     |
     +--> Inventory Service
```

Compare that with a work queue where usually one worker processes each task.

Pub/Sub is powerful when several independent systems need to react to the same event.

---

# 29. Dead Letter Queue

What happens when a message repeatedly fails?

Example:

```text
Process payment
   |
Failure
   |
Retry
   |
Failure
   |
Retry
   |
Failure
```

Instead of retrying forever, the message can be placed into a **Dead Letter Queue (DLQ)**.

```text
Main Queue
   |
Failed repeatedly
   |
   v
Dead Letter Queue
```

Engineers can inspect or reprocess the failed events later.

---

# 30. Retry Mechanism

Distributed systems fail.

A service may temporarily be unavailable.

Instead of failing immediately, clients may retry.

Bad retry strategy:

```text
retry
retry
retry
retry
retry
```

This can make an overloaded service even worse.

A better strategy is **exponential backoff**:

```text
Retry after 1 second
Retry after 2 seconds
Retry after 4 seconds
Retry after 8 seconds
```

Often a small amount of randomness called **jitter** is added so thousands of clients do not retry at exactly the same moment.

---

# 31. Idempotency

Suppose a payment request times out.

The client does not know whether the payment succeeded.

It retries:

```text
POST /payment
```

Without protection, the customer might be charged twice.

An operation is **idempotent** if repeating the same request produces the same logical result.

For payment APIs, a client might send:

```text
Idempotency-Key: order_123_payment_1
```

The server remembers that key.

If the same request arrives again, the server returns the original result instead of charging the customer again.

Idempotency is extremely important in:

- Payments
- Orders
- Financial transactions
- Messaging
- Retry-heavy distributed systems

---

# 32. Rate Limiter

Imagine someone sends:

```text
1 million requests/second
```

to your API.

Your system may collapse.

A rate limiter controls how frequently a user or client can make requests.

Example:

```text
100 requests/minute per user
```

After that:

```text
HTTP 429 Too Many Requests
```

Popular algorithms include:

- Token Bucket
- Leaky Bucket
- Fixed Window
- Sliding Window
- Sliding Window Log

Rate limiting protects systems from:

- Abuse
- Bots
- Accidental loops
- Resource exhaustion
- Some denial-of-service patterns

---

# 33. Token Bucket

Imagine every user has a bucket containing tokens.

Each request consumes one token.

```text
Bucket capacity = 10 tokens
```

If tokens exist:

```text
Allow request
```

If no tokens remain:

```text
Reject request
```

Tokens are gradually added back.

This allows controlled bursts while enforcing an overall rate.

---

# 34. Authentication

Authentication answers:

> Who are you?

For example:

```text
Username + Password
OAuth
Session Cookie
JWT
API Key
Biometric authentication
```

A user might log in and receive:

```text
access_token
```

Future requests contain the token.

The server validates it before processing requests.

---

# 35. Authorization

Authorization answers:

> What are you allowed to do?

Suppose:

```text
Alice = Admin
Bob = Normal User
```

Alice may be allowed to:

```text
DELETE /users/123
```

Bob may not.

Common authorization models include:

- RBAC — Role-Based Access Control
- ABAC — Attribute-Based Access Control
- ACL — Access Control List

Authentication identifies the user.

Authorization checks permissions.

---

# 36. Session Storage

After login, a server may create a session:

```text
session_id = abc123
```

The server stores:

```text
abc123 -> user_id 42
```

Because a system may have multiple application servers, session information should usually not live only in one server's local memory.

Instead:

```text
App Server 1
App Server 2
App Server 3
       |
       v
     Redis
```

All servers can access shared session information.

---

# 37. Object Storage

Relational databases are usually not the best place for huge files.

For objects such as:

```text
Images
Videos
PDFs
Backups
Audio
Documents
```

systems commonly use object storage.

Examples include:

- Amazon S3
- Google Cloud Storage
- Azure Blob Storage

Architecture:

```text
Application
    |
    v
Object Storage
    |
    v
CDN
    |
    v
Users
```

---

# 38. File Storage vs Object Storage

Traditional file storage looks like:

```text
/folder/subfolder/image.jpg
```

Object storage typically uses objects identified by keys:

```text
bucket:
users/123/profile.jpg
```

Object storage is designed to scale to enormous amounts of data.

---

# 39. Search Engine

Databases can perform text searches, but very large or sophisticated search functionality often benefits from specialized search systems.

Examples include:

- Elasticsearch
- OpenSearch
- Solr

Suppose a user searches:

```text
"wireless headphones"
```

A search engine may consider:

- Keyword relevance
- Typo tolerance
- Stemming
- Synonyms
- Filters
- Ranking
- Popularity

Architecture:

```text
Primary Database
      |
      v
Search Index
      |
      v
Search API
```

The primary database remains the source of truth, while the search engine maintains a searchable representation.

---

# 40. Service Discovery

In microservices, services constantly appear and disappear.

Suppose the Payment Service currently has:

```text
10.1.0.4
10.1.0.8
10.1.0.11
```

Tomorrow those addresses may change.

How does the Order Service find the Payment Service?

Through **service discovery**.

Conceptually:

```text
Order Service
     |
     v
Service Registry
     |
     v
Payment Service Instances
```

In modern container environments, orchestration platforms often provide service discovery automatically.

---

# 41. Microservices

Instead of building one huge application:

```text
User + Order + Payment + Inventory + Search
```

we may separate functionality into services:

```text
User Service
Order Service
Payment Service
Inventory Service
Search Service
```

Benefits:

- Independent deployment
- Independent scaling
- Team ownership
- Fault isolation
- Technology flexibility

Challenges:

- Network failures
- Distributed transactions
- Observability
- Debugging
- Deployment complexity
- Data consistency
- Versioning

Microservices are not automatically better.

For many applications, starting with a well-structured monolith is simpler.

---

# 42. Monolith

A monolith packages most functionality inside one application.

```text
            Application
      +----------------------+
      | Users                |
      | Orders               |
      | Payments             |
      | Inventory            |
      | Notifications        |
      +----------------------+
                |
                v
             Database
```

Advantages:

- Easy development
- Simple deployment
- Easy debugging
- Easy transactions
- Fewer network calls

Disadvantages appear as the application and organization grow.

The right architecture depends on scale and organizational needs.

---

# 43. Service Mesh

When hundreds of microservices communicate, network concerns become complex.

Every service needs things such as:

```text
TLS
Retries
Tracing
Traffic policies
Metrics
Authentication
Circuit breaking
```

A **service mesh** moves many networking concerns into infrastructure.

Architecture conceptually becomes:

```text
Service A
   |
Proxy
   |
Proxy
   |
Service B
```

Examples include systems built around technologies such as Istio and Envoy.

---

# 44. Circuit Breaker

Imagine:

```text
Order Service
    |
    v
Payment Service
```

The Payment Service goes down.

If the Order Service keeps calling it thousands of times per second, resources are wasted.

A **circuit breaker** temporarily stops requests.

It typically has three states:

```text
CLOSED
OPEN
HALF-OPEN
```

### Closed

Requests flow normally.

### Open

Requests fail immediately without calling the broken service.

### Half-open

A small number of test requests are allowed.

If they succeed:

```text
Circuit closes.
```

If they fail:

```text
Circuit opens again.
```

---

# 45. Health Check

Load balancers must know whether a server is healthy.

They periodically call endpoints such as:

```text
GET /health
```

If a server responds successfully:

```text
Healthy
```

If it repeatedly fails:

```text
Unhealthy
```

The load balancer stops sending traffic to it.

Health checks are fundamental to high availability.

---

# 46. Heartbeat

A heartbeat is a periodic signal meaning:

> I am still alive.

Example:

```text
Server -> Coordinator
Server -> Coordinator
Server -> Coordinator
```

If heartbeats stop arriving, the coordinator can assume the server is unavailable.

Heartbeats are commonly used in distributed systems to detect failures.

---

# 47. Leader Election

Some distributed tasks should be performed by only one node.

For example:

```text
Running scheduled billing
Coordinating a cluster
Updating a shared resource
```

Several servers may be available, but one becomes the **leader**.

```text
Node A -> Leader
Node B -> Follower
Node C -> Follower
```

If the leader fails, the system elects a new one.

Distributed coordination systems and consensus algorithms help with this process.

---

# 48. Distributed Lock

Suppose two servers try to process the same critical operation.

```text
Server A -> Update inventory
Server B -> Update inventory
```

We may need only one server to execute it at a time.

A distributed lock allows one participant to acquire a lock:

```text
Lock acquired by Server A
```

Server B must wait or fail.

Distributed locking must be designed very carefully because network partitions and process failures can make lock correctness difficult.

---

# 49. Database Transaction

Suppose transferring ₹1,000 requires:

```text
Subtract ₹1,000 from Alice
Add ₹1,000 to Bob
```

It would be disastrous if only one step succeeded.

A transaction allows multiple operations to behave as one logical unit.

Traditional database transactions commonly aim to satisfy ACID properties.

---

# 50. ACID

ACID stands for:

## Atomicity

Everything succeeds or everything fails.

## Consistency

Database rules remain valid.

## Isolation

Concurrent transactions should not corrupt each other.

## Durability

After committing, data should survive failures.

ACID transactions are especially valuable for financial and strongly consistent operations.

---

# 51. Distributed Transactions

Things become harder when one logical operation touches multiple services.

Example:

```text
Order Service
Payment Service
Inventory Service
```

An order may require:

```text
Create order
Charge card
Reduce inventory
```

If one action fails after the others succeed, how do we recover?

Traditional distributed transactions may use protocols such as two-phase commit, but modern systems frequently use patterns such as the **Saga pattern**.

---

# 52. Saga Pattern

A Saga represents a long business transaction as a series of smaller transactions.

Example:

```text
1. Create Order
2. Reserve Inventory
3. Charge Payment
4. Arrange Shipment
```

If payment fails, compensating actions may run:

```text
Release Inventory
Cancel Order
```

Instead of a single global rollback, each service performs a compensating operation.

---

# 53. SQL Join

A join combines related records.

Suppose we have:

```text
Users
Orders
```

An SQL query can join them:

```sql
SELECT users.name, orders.total
FROM users
JOIN orders
ON users.id = orders.user_id;
```

Joins are powerful in relational databases but become more complicated when related data is distributed across different shards or microservices.

---

# 54. Denormalization

Normalized databases try to avoid duplicated information.

Distributed systems sometimes intentionally duplicate information to improve reads.

For example, instead of repeatedly joining:

```text
Post
+
User
```

you might store:

```text
post_id
content
author_id
author_name
author_avatar
```

This is called **denormalization**.

Benefits:

- Faster reads
- Fewer joins

Cost:

- Duplicate data
- Harder updates
- Possible temporary inconsistencies

---

# 55. Read Replica

When a system has many reads but relatively few writes, read replicas are extremely useful.

Example:

```text
             Primary
            /   |   \
           v    v    v
        Read1 Read2 Read3
```

Writes:

```text
-> Primary
```

Reads:

```text
-> Replicas
```

This pattern is common for read-heavy applications.

---

# 56. CQRS

CQRS stands for:

**Command Query Responsibility Segregation**

The idea is to separate:

```text
Writes
```

from:

```text
Reads
```

For example:

```text
Write API
   |
   v
Transactional Database
   |
   v
Events
   |
   v
Read Database
   |
   v
Read API
```

The write model can be optimized for correctness.

The read model can be optimized for fast queries.

CQRS is powerful but adds complexity and should not be used unnecessarily.

---

# 57. Event Sourcing

Traditional databases usually store the current state.

For example:

```text
Account Balance = ₹10,000
```

Event sourcing stores the events that created the state:

```text
AccountCreated
Deposit ₹5,000
Deposit ₹7,000
Withdraw ₹2,000
```

Current state can be reconstructed from those events.

Benefits include:

- Complete history
- Auditability
- Replay
- Temporal debugging

Challenges include:

- Complexity
- Event versioning
- Storage
- Rebuilding state

---

# 58. CAP Theorem

CAP is one of the most famous distributed-system concepts.

It states that when a network partition occurs, a distributed system cannot simultaneously guarantee both:

```text
Consistency
Availability
```

The three letters are:

### C — Consistency

Every read sees the latest successful write.

### A — Availability

Every request receives a non-error response.

### P — Partition Tolerance

The system continues operating despite network communication failures between nodes.

Because network partitions can happen in distributed systems, engineers often have to choose the behavior they prefer during such failures.

---

# 59. Strong Consistency

Strong consistency means that after a successful write, subsequent reads observe the latest value.

Example:

```text
Write:
balance = ₹5,000

Read:
balance = ₹5,000
```

Immediately.

This matters greatly in areas such as:

- Banking
- Inventory constraints
- Financial transactions
- Security permissions

---

# 60. Eventual Consistency

Eventual consistency means different replicas may temporarily disagree.

For example:

```text
Replica A:
followers = 1,001

Replica B:
followers = 1,000
```

After replication catches up:

```text
Replica A = 1,001
Replica B = 1,001
```

For something like a social-media follower count, temporary inconsistency may be perfectly acceptable.

The right consistency model depends on the business requirement.

---

# 61. Availability

Availability describes how often your system is operational.

For example:

```text
99% availability
99.9%
99.99%
99.999%
```

Each extra nine significantly reduces acceptable downtime.

High availability generally requires:

- Redundancy
- Multiple servers
- Database replicas
- Health checks
- Automatic failover
- Multiple availability zones
- Sometimes multiple geographic regions

---

# 62. Failover

Suppose the primary database fails.

The system may promote a replica:

```text
Before:

Primary A
Replica B

After A fails:

Primary B
```

This is called **failover**.

Failover can be:

```text
Manual
Automatic
```

Automatic failover reduces downtime but requires careful coordination.

---

# 63. Single Point of Failure

A **Single Point of Failure**, or SPOF, is a component whose failure brings the entire system down.

Bad architecture:

```text
Users
  |
  v
One Server
  |
  v
One Database
```

Both components are single points of failure.

More resilient architecture:

```text
Users
  |
Load Balancer
 /        \
App1      App2
 \        /
Database Cluster
```

Good system design tries to remove critical single points of failure.

---

# 64. Redundancy

Redundancy means having extra components available.

Instead of:

```text
1 server
```

use:

```text
Server A
Server B
Server C
```

If one fails, the others continue.

Redundancy may exist at many levels:

```text
Server
Database
Network
Disk
Power supply
Availability zone
Region
```

---

# 65. Multi-Region Architecture

Very large systems may operate in multiple geographic regions.

```text
              Global Routing
               /          \
              v            v
         India Region    US Region
          /      \        /      \
        App      DB      App      DB
```

Benefits:

- Lower latency
- Disaster recovery
- Geographic resilience

Challenges:

- Data replication
- Conflict resolution
- Cost
- Cross-region latency
- Consistency

---

# 66. Availability Zone

Cloud regions often contain multiple physically separate facilities known as availability zones.

For example:

```text
Region
 |
 +-- AZ-1
 +-- AZ-2
 +-- AZ-3
```

A resilient application might distribute servers across all three.

If one data-center zone fails, the application continues operating.

---

# 67. Auto Scaling

Traffic is rarely constant.

Maybe your site receives:

```text
10 requests/sec at 3 AM
10,000 requests/sec at 8 PM
```

Instead of permanently running hundreds of servers, auto scaling adds and removes capacity.

```text
Low Traffic
3 servers

High Traffic
30 servers

Traffic falls
5 servers
```

Scaling decisions may be based on:

- CPU
- Memory
- Request count
- Queue depth
- Latency
- Custom business metrics

---

# 68. Container

Containers package applications together with the dependencies they need.

For example:

```text
Application
Runtime
Libraries
Configuration
```

Technologies such as Docker made containers popular because they provide consistent environments.

Conceptually:

```text
Developer Laptop
     |
Docker Image
     |
     v
Production Server
```

The same packaged application can run in both environments.

---

# 69. Container Orchestration

If you have:

```text
5 containers
```

you can manage them manually.

If you have:

```text
5,000 containers
```

you need orchestration.

Container orchestrators such as Kubernetes can handle:

- Scheduling
- Auto scaling
- Restarting failed containers
- Service discovery
- Rolling deployments
- Configuration
- Secrets
- Networking

---

# 70. Stateless Server

A stateless server does not depend on data stored only in its local memory between requests.

For example:

```text
Request 1 -> Server A
Request 2 -> Server C
Request 3 -> Server B
```

All requests still work.

State is stored in shared systems such as:

```text
Database
Redis
Object Storage
```

Stateless application servers are much easier to horizontally scale.

---

# 71. Stateful System

A stateful service maintains important local state.

Examples may include:

```text
Database nodes
Some messaging brokers
Certain game servers
Storage nodes
```

Stateful systems are usually harder to scale and recover than stateless application servers.

---

# 72. Batch Processing

Batch processing handles data in groups.

Example:

```text
Every night at 2 AM:

Read yesterday's transactions
Calculate reports
Generate invoices
Update analytics
```

This is useful when results do not need to be available instantly.

---

# 73. Stream Processing

Stream processing handles events continuously.

```text
Event
Event
Event
Event
Event
   |
   v
Stream Processor
```

Examples include:

- Fraud detection
- Live dashboards
- Real-time analytics
- Monitoring
- Recommendation updates

Technologies in this space include Kafka Streams, Apache Flink and Spark Structured Streaming.

---

# 74. Scheduler

A scheduler triggers jobs at specific times.

Examples:

```text
Send monthly invoice
Delete expired sessions
Generate daily report
Run backup
```

Conceptually:

```text
Scheduler
    |
    v
Job Queue
    |
    v
Workers
```

---

# 75. Worker

A worker performs background processing.

Example:

```text
Queue:
GenerateThumbnail(image_123)
```

A worker receives the task:

```text
Worker
  |
  v
Resize image
  |
  v
Store result
```

Running multiple workers allows tasks to be processed in parallel.

---

# 76. WebSocket

Normal HTTP often looks like:

```text
Client -> Request
Server -> Response
Connection finishes
```

For real-time communication we may want a long-lived connection.

WebSocket allows bidirectional communication.

```text
Client <----------------> Server
```

Both sides can send messages.

Common use cases include:

- Chat
- Multiplayer games
- Live trading
- Collaborative editing
- Real-time notifications

---

# 77. Server-Sent Events

Sometimes the client only needs the server to continuously push information.

```text
Server -------> Client
```

Server-Sent Events, or SSE, can be simpler than WebSocket for scenarios such as:

- Notifications
- Live dashboards
- Streaming AI responses
- Progress updates

---

# 78. Long Polling

Before widespread WebSocket adoption, systems sometimes used long polling.

The client sends a request:

```text
Any new messages?
```

The server holds the connection until data becomes available or a timeout occurs.

Then the client immediately opens another request.

It can simulate real-time behavior but is generally less efficient than a true persistent connection.

---

# 79. Bloom Filter

A Bloom filter is a memory-efficient probabilistic data structure.

It answers:

> Might this item exist?

or:

> This item definitely does not exist.

For example, before querying a huge database:

```text
Bloom Filter
     |
Could exist?
 /          \
No           Maybe
 |             |
Stop        Database
```

Bloom filters can reduce unnecessary database or storage lookups.

However, they can produce **false positives**.

They do not produce false negatives when implemented correctly.

---

# 80. Database Connection Pool

Creating a new database connection for every request is expensive.

Instead:

```text
Application
    |
    v
Connection Pool
 /    |    \
C1    C2    C3
 \    |    /
   Database
```

Connections are reused.

This improves performance and prevents the application from overwhelming the database with too many connections.

---

# 81. API Pagination

Imagine an API contains:

```text
100 million posts
```

Returning them all is impossible.

Instead we paginate.

Example:

```text
GET /posts?limit=20
```

Pagination can use:

### Offset pagination

```text
?page=10&limit=20
```

Simple, but inefficient at high offsets and unstable when records change.

### Cursor pagination

```text
?cursor=abc123
```

The cursor identifies where to continue.

Cursor pagination usually performs better for large, frequently changing datasets.

---

# 82. Data Compression

Network bandwidth is expensive and latency matters.

Responses may be compressed using formats such as:

```text
gzip
Brotli
```

For example:

```text
1 MB JSON
```

might compress to:

```text
200 KB
```

This makes responses faster, especially over slower networks.

---

# 83. Serialization

Services need a format for transmitting data.

Common formats include:

### JSON

Easy for humans to read.

```json
{
  "id": 123,
  "name": "Alice"
}
```

### Protocol Buffers

Compact binary serialization often used with gRPC.

### Avro

Common in data pipelines and Kafka ecosystems.

Serialization format affects:

- Network size
- Parsing speed
- Schema evolution
- Developer usability

---

# 84. REST

REST-style APIs typically operate around resources.

Examples:

```text
GET /users/123

POST /users

PUT /users/123

DELETE /users/123
```

REST is widely used because it works naturally with HTTP.

---

# 85. gRPC

gRPC is a high-performance RPC framework commonly used for service-to-service communication.

It often uses:

```text
HTTP/2
Protocol Buffers
```

Benefits include:

- Efficient serialization
- Strong schemas
- Streaming
- Code generation
- Good internal-service performance

A common architecture is:

```text
External Client
      |
     REST
      |
 API Gateway
      |
     gRPC
      |
Internal Services
```

---

# 86. GraphQL

GraphQL allows clients to request exactly the fields they need.

Instead of:

```text
GET /user
GET /user/posts
GET /user/followers
```

a client might request:

```graphql
user {
  name
  posts {
    title
  }
}
```

GraphQL provides flexibility, but server-side caching, authorization and query-cost management can be more complicated.

---

# 87. Observability

Once your system contains hundreds of servers, you cannot manually inspect each one.

You need **observability**.

The three major pillars are often described as:

```text
Logs
Metrics
Traces
```

---

# 88. Logging

Logs record events.

Example:

```text
2026-10-07 10:30:15
Payment failed
order_id=123
user_id=456
reason=insufficient_funds
```

Centralized logging allows engineers to search logs across thousands of machines.

---

# 89. Metrics

Metrics are numerical measurements over time.

Examples:

```text
Requests/sec
CPU usage
Memory usage
Error rate
Database connections
P95 latency
Queue depth
```

Metrics help answer:

> Is the system healthy?

---

# 90. Distributed Tracing

Imagine one request flows through:

```text
API Gateway
   |
User Service
   |
Order Service
   |
Payment Service
   |
Database
```

The request takes:

```text
2.4 seconds
```

Where is the delay?

Distributed tracing assigns a trace identifier to the request and records timing across services.

Example:

```text
API Gateway      30 ms
Order Service   100 ms
Payment Service 2.1 sec
Database         50 ms
```

Now the bottleneck is clear.

---

# 91. Alerting

Monitoring is useless if nobody knows when something breaks.

Alerts may trigger when:

```text
Error rate > 5%

CPU > 90%

P99 latency > 3 seconds

Queue backlog > 1 million

Database disk > 90%
```

Alerts can notify engineers through incident-management systems, chat, SMS or phone calls.

---

# 92. Latency

Latency is the amount of time required for an operation.

Example:

```text
Request sent
      |
    100 ms
      |
Response received
```

Latency can come from:

- Network travel
- Database queries
- Cache misses
- Disk operations
- Cross-region calls
- Queue processing
- CPU-intensive work

Reducing latency is one of the central goals of system design.

---

# 93. Throughput

Throughput measures how much work a system can perform over time.

Examples:

```text
10,000 requests/second

1 million messages/minute

500 MB/second
```

Latency and throughput are related but different.

A system can have high throughput while individual requests are relatively slow.

---

# 94. P50, P95 and P99 Latency

Average latency can hide problems.

Suppose:

```text
99 requests = 100 ms
1 request   = 10 seconds
```

The average does not tell the full story.

Instead engineers examine percentiles.

### P50

50% of requests are faster than this.

### P95

95% are faster.

### P99

99% are faster.

P99 is particularly important for understanding the slowest user experiences.

---

# 95. Backpressure

Suppose producers generate:

```text
100,000 events/sec
```

but consumers can process only:

```text
10,000 events/sec
```

The queue keeps growing.

Backpressure prevents producers from overwhelming downstream components.

Strategies may include:

- Slow producers
- Buffer temporarily
- Reject requests
- Scale consumers
- Drop low-priority data

---

# 96. Throttling

Throttling intentionally limits resource usage.

Example:

```text
Free users:
100 API calls/minute

Premium users:
10,000 API calls/minute
```

Throttling protects infrastructure and enforces product limits.

---

# 97. Timeout

Never allow network calls to wait forever.

Example:

```text
Call Payment Service

Timeout = 3 seconds
```

If no response arrives within three seconds, stop waiting.

Without timeouts, blocked requests can consume threads, memory and connections until the entire system becomes unhealthy.

---

# 98. Bulkhead Pattern

Ships contain separate compartments so damage in one area does not sink the whole vessel.

Distributed systems can use the same principle.

Suppose:

```text
Recommendation Service
```

starts hanging.

If it shares every thread and connection with checkout traffic, checkout might also fail.

Separate resource pools isolate failures:

```text
Checkout Pool
Search Pool
Recommendation Pool
```

One overloaded feature does not necessarily destroy the others.

---

# 99. Feature Flags

A feature flag lets you turn functionality on or off without deploying new code.

```text
new_checkout = true
```

You can enable it for:

```text
1% users
10% users
50% users
100% users
```

Feature flags are useful for:

- Gradual rollouts
- Experiments
- Emergency shutdowns
- Beta testing

---

# 100. Blue-Green Deployment

Suppose the current production version is:

```text
Blue
```

You deploy the new version separately:

```text
Green
```

Architecture:

```text
            Load Balancer
             /        \
          Blue        Green
         Old App     New App
```

After testing Green, traffic switches from Blue to Green.

Rollback is easy because Blue still exists.

---

# 101. Canary Deployment

Instead of sending everyone to the new version immediately:

```text
95% -> Version 1
5%  -> Version 2
```

Observe metrics.

If everything looks good:

```text
50% -> Version 2
```

Eventually:

```text
100% -> Version 2
```

This limits the impact of bad deployments.

---

# 102. Configuration Management

Applications require configuration:

```text
Database URL
Cache Address
Feature Flags
Timeout Values
Service Endpoints
```

Configuration should usually be separate from application code.

That allows different settings for:

```text
Development
Testing
Staging
Production
```

---

# 103. Secret Management

Sensitive values should not be stored directly in source code.

Examples:

```text
Database passwords
API keys
Encryption keys
Private certificates
```

Secrets should be stored in secure secret-management systems with restricted access and rotation policies.

---

# 104. Encryption

Systems commonly need encryption in two places.

## Encryption in transit

Protects data moving across networks.

Usually implemented through TLS/HTTPS.

```text
Client
  |
Encrypted Connection
  |
Server
```

## Encryption at rest

Protects stored information.

Examples:

```text
Database disks
Backups
Object storage
```

---

# 105. Hashing

Hashing converts data into a fixed-size value.

Example:

```text
"hello"
   |
 hash
   |
   v
2cf24d...
```

Hashing is used for:

- Integrity checks
- Data partitioning
- Password-storage systems when combined with appropriate password-hashing algorithms
- Deduplication
- Consistent hashing

Hashing is not the same thing as encryption.

Encryption is designed to be reversible with a key.

Cryptographic hashing is designed to be one-way.

---

# 106. Checksum

Checksums help detect data corruption.

Suppose you download a file.

The sender provides:

```text
SHA-256 checksum
```

You calculate the checksum locally.

If the values differ, the file may have been corrupted or altered.

Checksums are widely used in storage and distributed data transfer.

---

# 107. Data Backup

Replication is not the same as backup.

Suppose someone accidentally runs:

```sql
DELETE FROM users;
```

Replication may faithfully copy that deletion to every replica.

A backup provides historical recovery.

Common backup strategies include:

```text
Full backups
Incremental backups
Snapshots
Point-in-time recovery
```

---

# 108. Disaster Recovery

Disaster recovery answers:

> What happens if an entire region or critical infrastructure fails?

A disaster-recovery plan may include:

```text
Secondary region
Database backups
Cross-region replication
DNS failover
Recovery procedures
```

Two important terms are:

### RPO — Recovery Point Objective

How much data can you afford to lose?

Example:

```text
RPO = 5 minutes
```

### RTO — Recovery Time Objective

How long can the system remain unavailable?

Example:

```text
RTO = 30 minutes
```

---

# 109. Data Warehouse

Transactional databases are optimized for operations such as:

```text
Create order
Update user
Process payment
```

Analytics may involve completely different workloads.

Example:

```text
What were total sales per country over the last five years?
```

Large analytical workloads often belong in a **data warehouse**.

Examples include systems such as:

- BigQuery
- Snowflake
- Redshift

A simplified pipeline is:

```text
Application Databases
        |
        v
   Data Pipeline
        |
        v
   Data Warehouse
        |
        v
BI / Analytics
```

---

# 110. Data Lake

A data lake stores large amounts of raw or semi-structured data.

Examples:

```text
Logs
JSON
Images
Events
CSV files
Parquet files
Clickstream data
```

Unlike a traditional warehouse, data does not necessarily need to be fully transformed before storage.

Modern analytical architectures may combine data-lake and warehouse concepts.

---

# Putting Everything Together

Now consider a large e-commerce platform.

A request might flow like this:

```text
                         USER
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
              +------------+------------+
              |            |            |
              v            v            v
          User Service  Order Service  Search Service
              |            |            |
              v            v            v
            Cache       Database    Search Engine
                           |
                           v
                      Message Broker
                     /      |       \
                    v       v        v
                Payment   Email   Inventory
                Service  Service   Service
```

Supporting all of this may be:

```text
Object Storage
Monitoring
Logging
Metrics
Tracing
Rate Limiting
Service Discovery
Auto Scaling
Container Orchestration
Backups
Replication
Failover
Secret Management
```

This is what a modern distributed system begins to look like.

---

# The Most Important Lesson in System Design

You do **not** add all of these components to every system.

That would create unnecessary complexity.

Instead, system design is the process of asking:

```text
What problem do I currently have?
```

and then introducing the component that solves that problem.

For example:

```text
One server cannot handle traffic
        ↓
Add horizontal scaling
        ↓
Need to distribute traffic
        ↓
Add load balancer
```

Then:

```text
Database receives too many repeated reads
        ↓
Add cache
```

Then:

```text
Images load slowly around the world
        ↓
Add CDN
```

Then:

```text
Background work makes requests slow
        ↓
Add message queue
```

Then:

```text
Database cannot handle read traffic
        ↓
Add read replicas
```

Then:

```text
Database becomes too large for one machine
        ↓
Introduce partitioning/sharding
```

Then:

```text
Microservices depend on unreliable networks
        ↓
Add timeout + retry + circuit breaker
```

This way of thinking is far more important than memorizing architecture diagrams.

---

# A Practical System Design Mental Model

When solving a system-design problem, think through the following layers.

## Layer 1 — Users

Ask:

```text
How many users?
Where are they located?
What devices do they use?
```

## Layer 2 — Traffic

Estimate:

```text
Requests per second
Read/write ratio
Peak traffic
Bandwidth
```

## Layer 3 — Entry Layer

Consider:

```text
DNS
CDN
Load Balancer
API Gateway
Rate Limiter
```

## Layer 4 — Compute Layer

Consider:

```text
Application Servers
Microservices
Workers
Auto Scaling
Containers
```

## Layer 5 — Data Layer

Consider:

```text
SQL
NoSQL
Indexes
Cache
Replication
Sharding
Object Storage
Search Engine
```

## Layer 6 — Asynchronous Processing

Consider:

```text
Queues
Kafka
Pub/Sub
Workers
Schedulers
Event-driven architecture
```

## Layer 7 — Reliability

Consider:

```text
Replication
Failover
Health Checks
Retries
Timeouts
Circuit Breakers
Backups
Multi-AZ
Multi-Region
```

## Layer 8 — Security

Consider:

```text
Authentication
Authorization
TLS
Encryption
Secret Management
Rate Limiting
```

## Layer 9 — Observability

Consider:

```text
Logs
Metrics
Tracing
Alerts
Dashboards
```

---

# System Design Component Cheat Sheet

Here is a simple summary.

| Component | Main Purpose |
|---|---|
| DNS | Convert domain names to addresses and help route traffic |
| CDN | Serve content close to users |
| Load Balancer | Distribute traffic across servers |
| Reverse Proxy | Protect and route traffic to backend servers |
| API Gateway | Front door for APIs and microservices |
| Application Server | Execute business logic |
| Cache | Make repeated reads faster |
| SQL Database | Structured transactional storage |
| NoSQL Database | Flexible or highly scalable storage |
| Index | Speed up database searches |
| Replication | Create copies for reliability/read scaling |
| Sharding | Split huge datasets across servers |
| Consistent Hashing | Distribute keys with minimal remapping |
| Message Queue | Process tasks asynchronously |
| Kafka/Event Stream | High-throughput event distribution and replay |
| Pub/Sub | Deliver one event to multiple subscribers |
| Worker | Perform background jobs |
| Scheduler | Run jobs at certain times |
| Object Storage | Store files and large objects |
| Search Engine | Provide fast full-text search |
| Rate Limiter | Control request frequency |
| Service Discovery | Locate service instances |
| Circuit Breaker | Stop calls to unhealthy dependencies |
| Retry | Recover from temporary failures |
| Timeout | Stop waiting indefinitely |
| DLQ | Store repeatedly failing messages |
| WebSocket | Persistent two-way communication |
| SSE | Server-to-client streaming |
| Bloom Filter | Avoid unnecessary lookups |
| Connection Pool | Reuse database connections |
| Auto Scaling | Automatically adjust compute capacity |
| Containers | Package applications consistently |
| Orchestration | Manage large numbers of containers |
| Feature Flags | Control functionality without redeployment |
| Logs | Record system events |
| Metrics | Measure system behavior |
| Tracing | Follow requests across services |
| Alerts | Notify teams about failures |
| Backups | Recover old data |
| Failover | Replace failed components |
| Multi-Region | Improve geographic resilience and latency |
| Data Warehouse | Perform large analytical queries |
| Data Lake | Store large volumes of raw data |

---

# What You Should Learn First

If you are preparing for system-design interviews, do not try to memorize everything at once.

A useful learning order is:

```text
1. Client-server architecture
2. DNS
3. HTTP
4. Load balancing
5. Horizontal scaling
6. SQL databases
7. Indexes
8. Replication
9. Cache
10. CDN
11. Message queues
12. NoSQL
13. Sharding
14. Consistent hashing
15. Rate limiting
16. API Gateway
17. Object storage
18. Search engines
19. Microservices
20. Event-driven architecture
21. Kafka
22. WebSockets
23. CAP theorem
24. Consistency models
25. Reliability patterns
26. Observability
27. Multi-region architecture
```

Once these concepts become familiar, systems such as:

```text
YouTube
Netflix
Uber
WhatsApp
Instagram
Twitter/X
Amazon
Google Drive
Dropbox
Slack
Spotify
```

stop looking like mysterious giant architectures.

They become combinations of familiar building blocks.

---

# Final Principle

The biggest mistake beginners make in system design is asking:

> Which technologies should I use?

A better question is:

> What problem am I trying to solve?

Then choose the component that solves it.

If reads are slow:

```text
Think cache or indexes.
```

If one server cannot handle traffic:

```text
Think horizontal scaling and load balancing.
```

If background operations make requests slow:

```text
Think queues and workers.
```

If the database cannot handle read volume:

```text
Think caching and read replicas.
```

If one database cannot hold the dataset:

```text
Think partitioning and sharding.
```

If users around the world experience slow static content:

```text
Think CDN.
```

If services are failing because dependencies are unhealthy:

```text
Think timeouts, retries and circuit breakers.
```

If you cannot understand why production is slow:

```text
Think logs, metrics and traces.
```

That is the essence of system design:

**Understand the bottleneck, understand the trade-off, and introduce the simplest component that solves the problem.**

Once you learn to think this way, system design becomes much less about memorizing diagrams and much more about engineering decisions.
