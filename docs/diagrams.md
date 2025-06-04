# System Diagrams

This page contains all the architectural and flow diagrams for the Ace Stream HLS system.

## High-Level System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        WB[Web Browser<br/>React App]
        VLC[VLC Player]
        TV[Smart TV/iOS]
    end

    subgraph "API Gateway Layer"
        BE[Express.js Backend<br/>Port 3001]
    end

    subgraph "Business Logic Layer"
        SS[Stream Service]
        DS[Database Service]
        AS[Ace Stream Service]
    end

    subgraph "Data Layer"
        DB[(SQLite Database)]
    end

    subgraph "External Services"
        AE[Ace Stream Engine<br/>Port 6878]
        P2P[P2P Network]
    end

    WB -->|HTTP/HLS| BE
    VLC -->|HLS Requests| BE
    TV -->|HLS Requests| BE

    BE --> SS
    BE --> DS
    BE --> AS

    SS --> DB
    DS --> DB

    AS -->|HTTP API| AE
    AE -->|BitTorrent| P2P

    style WB fill:#e1f5fe
    style BE fill:#f3e5f5
    style AE fill:#fff3e0
    style DB fill:#e8f5e8
```

## Stream Initialization Sequence

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant E as Engine
    participant P as P2P Network

    U->>F: Enter Ace Stream ID
    F->>F: Validate ID format
    F->>B: POST /api/streams/start/:aceId

    B->>B: Create session
    B->>E: GET /ace/manifest.m3u8?id=:aceId&format=json

    E->>P: Start torrent session
    E->>P: Discover peers
    P-->>E: Peer responses

    E->>E: Begin downloading
    E-->>B: Session URLs

    B->>B: Store session
    B-->>F: Session response with HLS URL

    F->>F: Display stream controls
    F->>F: Start statistics polling
```

## HLS Playback Flow

```mermaid
sequenceDiagram
    participant P as HLS Player
    participant B as Backend
    participant E as Engine

    P->>B: GET /api/streams/hls/:sessionId/manifest.m3u8
    B->>E: GET /ace/manifest.m3u8?id=:aceId

    E-->>B: Original manifest
    B->>B: Rewrite segment URLs
    B-->>P: Modified manifest

    P->>P: Parse manifest

    loop Every segment
        P->>B: GET /api/streams/proxy/c/:hash/:segment
        B->>E: GET /ace/c/:hash/:segment

        alt Segment available
            E-->>B: TS segment data
            B-->>P: Proxied segment
        else Segment not ready
            E-->>B: HTTP 500
            B-->>P: Error response
            P->>P: Retry logic
        end
    end
```

## Frontend Component Architecture

```mermaid
graph TB
    subgraph "React Application"
        subgraph "Components"
            APP[App Component<br/>Main Container]
            HP[HLS Player<br/>hls.js Integration]
            SC[Stream Controls<br/>Start/Stop/Status]
            ST[Statistics Display<br/>Real-time Metrics]
        end

        subgraph "Services"
            API[API Service<br/>HTTP Client]
            HS[HLS Service<br/>Stream Management]
        end

        subgraph "State Management"
            RS[React State<br/>Component State]
            ES[Effect Hooks<br/>Side Effects]
        end
    end

    subgraph "External Libraries"
        HLS[hls.js Library]
        TC[Tailwind CSS]
    end

    APP --> HP
    APP --> SC
    APP --> ST

    HP --> HS
    SC --> API
    ST --> API

    HP --> HLS
    APP --> TC

    API --> RS
    HS --> ES

    style APP fill:#e3f2fd
    style HP fill:#f1f8e9
    style API fill:#fce4ec
    style HLS fill:#fff3e0
```

## Backend Service Architecture

```mermaid
graph TB
    subgraph "Express.js Application"
        subgraph "Route Handlers"
            SR[Stream Routes<br/>/api/streams/*]
            CR[Channel Routes<br/>/api/channels/*]
            HR[Health Routes<br/>/api/health/*]
        end

        subgraph "Middleware"
            CORS[CORS Handler]
            ERR[Error Handler]
            LOG[Request Logger]
        end

        subgraph "Services"
            ASS[Ace Stream Service]
            DSS[Database Service]
            SS[Statistics Service]
        end

        subgraph "Data Models"
            SM[Stream Session Model]
            CM[Channel Model]
            STM[Statistics Model]
        end
    end

    SR --> ASS
    CR --> DSS
    HR --> SS

    ASS --> SM
    DSS --> CM
    SS --> STM

    CORS --> SR
    CORS --> CR
    CORS --> HR

    ERR --> SR
    ERR --> CR
    ERR --> HR

    style SR fill:#e8f5e8
    style ASS fill:#fff3e0
    style DSS fill:#f3e5f5
    style CORS fill:#e1f5fe
```

## Error Handling Flow

```mermaid
sequenceDiagram
    participant UI as Frontend
    participant API as Backend
    participant ENG as Engine
    participant HLS as HLS Player

    Note over UI,HLS: Segment Load Error Scenario

    HLS->>API: GET /api/streams/proxy/c/:hash/:segment
    API->>ENG: GET /ace/c/:hash/:segment

    alt Engine Error
        ENG-->>API: HTTP 500
        API-->>HLS: HTTP 500 with error
        HLS->>HLS: Trigger retry logic
        HLS->>HLS: Exponential backoff
        HLS->>API: Retry segment request
    end

    alt Network Error
        ENG-->>API: Connection timeout
        API-->>HLS: HTTP 503
        HLS->>HLS: Fatal error handling
        HLS->>UI: Emit error event
        UI->>UI: Display error message
    end

    alt Engine Unavailable
        API->>ENG: Connection refused
        API-->>UI: HTTP 500
        UI->>UI: Display engine error
        UI->>UI: Disable controls
    end
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "Development Environment"
        subgraph "Host Machine"
            subgraph "Node.js Process"
                FE[Frontend Dev Server<br/>Vite - Port 3000]
                BA[Backend Dev Server<br/>Port 3001]
            end

            subgraph "Docker Container"
                AE[Ace Stream Engine<br/>Port 6878]
            end

            subgraph "File System"
                DB[(SQLite DB)]
            end
        end
    end

    subgraph "Production Environment"
        subgraph "Container Orchestration"
            FEP[Frontend Container<br/>Nginx + Static Files]
            BAP[Backend Container<br/>Node.js + Express]
            AEP[Ace Stream Container]
            DBP[(Persistent Volume)]
        end
    end

    FE -->|Proxy Requests| BA
    BA -->|Engine API| AE
    BA -->|SQLite| DB

    style FE fill:#e1f5fe
    style BA fill:#f3e5f5
    style AE fill:#fff3e0
    style DB fill:#e8f5e8
```

## Technology Stack

```mermaid
graph TB
    subgraph "Frontend Technologies"
        subgraph "Core Framework"
            R19[React 19<br/>UI Framework]
            TS[TypeScript<br/>Type Safety]
            V6[Vite<br/>Build Tool]
        end

        subgraph "Styling"
            TW4[Tailwind CSS v4<br/>Utility-First CSS]
            CSS[Modern CSS<br/>Grid, Flexbox]
        end

        subgraph "Video Streaming"
            HLS[hls.js<br/>HLS Player Library]
            WEB[Web APIs<br/>Media Source Extensions]
        end
    end

    subgraph "Backend Technologies"
        subgraph "Runtime & Framework"
            N22[Node.js 22<br/>JavaScript Runtime]
            E5[Express.js v5<br/>Web Framework]
            TS2[TypeScript<br/>Type Safety]
        end

        subgraph "Database"
            SQL[SQLite<br/>Embedded Database]
            SQL3[sqlite3<br/>Node.js Driver]
        end
    end

    subgraph "Infrastructure"
        subgraph "Containerization"
            DOC[Docker<br/>Container Platform]
            AS3[Ace Stream 3.2.3<br/>P2P Engine]
        end

        subgraph "Monorepo"
            NX[NX<br/>Build System]
            NPM[npm<br/>Package Manager]
        end
    end

    R19 --> TS
    R19 --> TW4
    R19 --> HLS

    N22 --> E5
    E5 --> TS2
    E5 --> SQL

    DOC --> AS3
    NX --> NPM

    style R19 fill:#e3f2fd
    style HLS fill:#f1f8e9
    style N22 fill:#e8f5e8
    style DOC fill:#e1f5fe
```

## Data Flow Overview

```mermaid
flowchart LR
    A[User Input<br/>Ace Stream ID] --> B[Frontend Validation]
    B --> C[Backend Session Creation]
    C --> D[Engine Request]
    D --> E[P2P Discovery]
    E --> F[Content Download]
    F --> G[HLS Generation]
    G --> H[Stream Playback]

    I[Statistics Polling] --> J[Engine Metrics]
    J --> K[UI Updates]

    L[Segment Requests] --> M[Proxy Handler]
    M --> N[Engine Segments]
    N --> O[Player Decode]

    style A fill:#e1f5fe
    style D fill:#fff3e0
    style E fill:#e8f5e8
    style H fill:#f1f8e9
```

## System Health Monitoring

```mermaid
graph TB
    subgraph "Health Checks"
        SH[System Health<br/>/api/health]
        DB_H[Database Health<br/>/api/health/database]
        AS_H[Engine Health<br/>/api/health/acestream]
    end

    subgraph "Monitoring Tools"
        PM2[PM2 Process Monitor]
        DOC_S[Docker Stats]
        LOG[Application Logs]
    end

    subgraph "Alerts & Recovery"
        AUTO[Auto Restart]
        NOTIF[Notifications]
        DIAG[Diagnostics]
    end

    SH --> PM2
    DB_H --> DOC_S
    AS_H --> LOG

    PM2 --> AUTO
    DOC_S --> NOTIF
    LOG --> DIAG

    style SH fill:#e8f5e8
    style PM2 fill:#f3e5f5
    style AUTO fill:#fff3e0
```

These diagrams provide comprehensive visual documentation of the Ace Stream HLS system architecture, data flows, and component interactions.
