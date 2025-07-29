# SizeWise Suite Architecture Guide

Comprehensive technical architecture documentation for the SizeWise Suite platform.

## Table of Contents

1. [System Overview](#system-overview)
2. [Frontend Architecture](#frontend-architecture)
3. [Backend Architecture](#backend-architecture)
4. [Data Architecture](#data-architecture)
5. [Microservices Design](#microservices-design)
6. [Real-time Collaboration](#real-time-collaboration)
7. [AI/ML Integration](#aiml-integration)
8. [Security Architecture](#security-architecture)
9. [Deployment Architecture](#deployment-architecture)
10. [Monitoring and Observability](#monitoring-and-observability)

## System Overview

### High-Level Architecture

SizeWise Suite follows a modern, cloud-native architecture with the following key principles:

- **Microservices**: Modular, independently deployable services
- **Event-Driven**: Asynchronous communication and real-time updates
- **Offline-First**: Local storage with cloud synchronization
- **Scalable**: Horizontal scaling capabilities
- **Resilient**: Fault tolerance and graceful degradation

### Technology Stack

**Frontend**
- React 18 with TypeScript
- Zustand for state management
- Socket.IO for real-time communication
- ONNX.js for client-side ML
- Dexie.js for offline storage
- Recharts for data visualization

**Backend**
- FastAPI with Python 3.11
- PostgreSQL for relational data
- MongoDB for document storage
- Redis for caching and sessions
- WebSocket for real-time features
- Prometheus for monitoring

**Infrastructure**
- Docker containers
- Kubernetes orchestration
- Istio service mesh
- NGINX load balancer
- Redis cluster
- Monitoring stack (Prometheus, Grafana)

## Frontend Architecture

### Component Architecture

```
frontend/
├── components/           # Reusable UI components
│   ├── common/          # Generic components
│   ├── forms/           # Form components
│   ├── charts/          # Data visualization
│   ├── collaboration/   # Real-time features
│   └── analytics/       # Analytics dashboard
├── lib/                 # Core libraries
│   ├── hooks/           # Custom React hooks
│   ├── services/        # API and business logic
│   ├── stores/          # State management
│   └── utils/           # Utility functions
├── pages/               # Application pages
└── styles/              # Styling and themes
```

### State Management

**Zustand Stores**
- `useProjectStore`: Project data and operations
- `useCalculationStore`: HVAC calculations
- `useCollaborationStore`: Real-time collaboration
- `useUserStore`: User authentication and preferences
- `useAnalyticsStore`: Analytics and reporting data

**Store Architecture**
```typescript
interface ProjectStore {
  // State
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  loadProjects: () => Promise<void>;
  createProject: (data: CreateProjectData) => Promise<Project>;
  updateProject: (id: string, data: UpdateProjectData) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  
  // Computed
  activeProjects: Project[];
  recentProjects: Project[];
}
```

### Component Design Patterns

**Compound Components**
```typescript
<Calculator>
  <Calculator.Form>
    <Calculator.Input name="roomArea" />
    <Calculator.Input name="cfmRequired" />
  </Calculator.Form>
  <Calculator.Results>
    <Calculator.Result name="ductSize" />
    <Calculator.Result name="velocity" />
  </Calculator.Results>
</Calculator>
```

**Render Props**
```typescript
<DataFetcher url="/api/projects">
  {({ data, loading, error }) => (
    <ProjectList 
      projects={data} 
      loading={loading} 
      error={error} 
    />
  )}
</DataFetcher>
```

**Custom Hooks**
```typescript
function useHVACCalculation() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const calculate = useCallback(async (params) => {
    setLoading(true);
    try {
      const result = await hvacService.calculate(params);
      setResult(result);
    } finally {
      setLoading(false);
    }
  }, []);
  
  return { result, loading, calculate };
}
```

### Performance Optimization

**Code Splitting**
- Route-based splitting
- Component lazy loading
- Dynamic imports
- Bundle optimization

**Memoization**
- React.memo for components
- useMemo for expensive calculations
- useCallback for event handlers
- Zustand selectors for state

**Virtual Scrolling**
- Large dataset handling
- Infinite scrolling
- Windowing techniques
- Memory optimization

## Backend Architecture

### Service Architecture

```
backend/
├── api/                 # API route handlers
│   ├── auth/           # Authentication endpoints
│   ├── projects/       # Project management
│   ├── calculations/   # HVAC calculations
│   └── analytics/      # Analytics endpoints
├── core/               # Core business logic
│   ├── calculations/   # HVAC calculation engine
│   ├── auth/           # Authentication logic
│   └── utils/          # Shared utilities
├── database/           # Database layer
│   ├── models/         # Data models
│   ├── repositories/   # Data access layer
│   └── migrations/     # Database migrations
├── microservices/      # Microservice components
│   ├── service_mesh/   # Service mesh configuration
│   ├── cache/          # Distributed caching
│   └── load_balancer/  # Load balancing
├── monitoring/         # Monitoring and metrics
└── collaboration/      # Real-time collaboration
```

### API Design

**RESTful Principles**
- Resource-based URLs
- HTTP method semantics
- Status code conventions
- Consistent response formats

**API Versioning**
```python
@app.get("/api/v1/projects")
@app.get("/api/v2/projects")  # New version with enhanced features
```

**Error Handling**
```python
class APIError(Exception):
    def __init__(self, message: str, code: str, status_code: int = 400):
        self.message = message
        self.code = code
        self.status_code = status_code

@app.exception_handler(APIError)
async def api_error_handler(request: Request, exc: APIError):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
                "timestamp": datetime.utcnow().isoformat()
            }
        }
    )
```

### Business Logic Layer

**Service Pattern**
```python
class HVACCalculationService:
    def __init__(self, repository: CalculationRepository):
        self.repository = repository
    
    async def calculate_air_duct(self, params: AirDuctParams) -> AirDuctResult:
        # Validation
        self._validate_air_duct_params(params)
        
        # Calculation
        result = self._perform_air_duct_calculation(params)
        
        # Persistence
        calculation = await self.repository.save_calculation(
            type="air_duct",
            params=params.dict(),
            result=result.dict()
        )
        
        return result
```

**Repository Pattern**
```python
class ProjectRepository:
    def __init__(self, db: Database):
        self.db = db
    
    async def find_by_id(self, project_id: str) -> Optional[Project]:
        query = "SELECT * FROM projects WHERE id = $1"
        row = await self.db.fetchrow(query, project_id)
        return Project.from_row(row) if row else None
    
    async def find_by_user(self, user_id: str) -> List[Project]:
        query = "SELECT * FROM projects WHERE owner_id = $1"
        rows = await self.db.fetch(query, user_id)
        return [Project.from_row(row) for row in rows]
```

## Data Architecture

### Database Design

**PostgreSQL Schema**
```sql
-- Projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES users(id),
    building_area DECIMAL(10,2),
    building_type VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Calculations table
CREATE TABLE calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id),
    type VARCHAR(50) NOT NULL,
    parameters JSONB NOT NULL,
    results JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Collaboration sessions
CREATE TABLE collaboration_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id),
    user_id UUID NOT NULL REFERENCES users(id),
    joined_at TIMESTAMP DEFAULT NOW(),
    last_activity TIMESTAMP DEFAULT NOW()
);
```

**MongoDB Collections**
```javascript
// Project documents with embedded calculations
{
  _id: ObjectId("..."),
  projectId: "proj_123",
  calculations: [
    {
      id: "calc_456",
      type: "air_duct",
      parameters: { roomArea: 500, cfmRequired: 2000 },
      results: { ductSize: { width: 14, height: 10 } },
      createdAt: ISODate("...")
    }
  ],
  collaborationHistory: [
    {
      userId: "user_789",
      action: "calculation_created",
      timestamp: ISODate("..."),
      details: { calculationId: "calc_456" }
    }
  ]
}
```

### Data Flow

**Read Operations**
1. API request received
2. Authentication/authorization check
3. Repository query
4. Data transformation
5. Response serialization

**Write Operations**
1. API request with data
2. Input validation
3. Business logic processing
4. Database transaction
5. Event publication
6. Response confirmation

**Event-Driven Updates**
```python
class ProjectEventHandler:
    async def handle_project_updated(self, event: ProjectUpdatedEvent):
        # Update search index
        await self.search_service.update_project(event.project_id)
        
        # Notify collaborators
        await self.collaboration_service.notify_project_update(
            event.project_id, 
            event.changes
        )
        
        # Update analytics
        await self.analytics_service.track_project_update(event)
```

## Microservices Design

### Service Mesh Architecture

**Istio Configuration**
```yaml
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: sizewise-api
spec:
  http:
  - match:
    - uri:
        prefix: /api/calculations
    route:
    - destination:
        host: calculation-service
        port:
          number: 8000
  - match:
    - uri:
        prefix: /api/projects
    route:
    - destination:
        host: project-service
        port:
          number: 8001
```

**Service Discovery**
```python
class ServiceRegistry:
    def __init__(self):
        self.services = {}
    
    async def register_service(self, name: str, endpoint: str):
        self.services[name] = endpoint
        await self._health_check(endpoint)
    
    async def discover_service(self, name: str) -> str:
        if name not in self.services:
            raise ServiceNotFoundError(f"Service {name} not found")
        return self.services[name]
```

### Circuit Breaker Pattern

```python
class CircuitBreaker:
    def __init__(self, failure_threshold: int = 5, timeout: int = 60):
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.failure_count = 0
        self.last_failure_time = None
        self.state = "CLOSED"  # CLOSED, OPEN, HALF_OPEN
    
    async def call(self, func, *args, **kwargs):
        if self.state == "OPEN":
            if time.time() - self.last_failure_time > self.timeout:
                self.state = "HALF_OPEN"
            else:
                raise CircuitBreakerOpenError()
        
        try:
            result = await func(*args, **kwargs)
            self._on_success()
            return result
        except Exception as e:
            self._on_failure()
            raise e
```

## Real-time Collaboration

### WebSocket Architecture

**Connection Management**
```python
class CollaborationManager:
    def __init__(self):
        self.rooms = {}  # room_id -> set of connections
        self.users = {}  # connection_id -> user_info
    
    async def join_room(self, connection, room_id: str, user: User):
        if room_id not in self.rooms:
            self.rooms[room_id] = set()
        
        self.rooms[room_id].add(connection)
        self.users[connection.id] = user
        
        # Notify other users
        await self.broadcast_to_room(room_id, {
            "type": "user_joined",
            "user": user.dict(),
            "timestamp": datetime.utcnow().isoformat()
        }, exclude=connection)
```

**Operational Transformation**
```python
class OperationalTransform:
    def transform_operations(self, op1: Operation, op2: Operation) -> Tuple[Operation, Operation]:
        """Transform two concurrent operations for consistency"""
        if op1.type == "insert" and op2.type == "insert":
            if op1.position <= op2.position:
                return op1, Operation(
                    type="insert",
                    position=op2.position + len(op1.content),
                    content=op2.content
                )
            else:
                return Operation(
                    type="insert",
                    position=op1.position + len(op2.content),
                    content=op1.content
                ), op2
```

## AI/ML Integration

### ONNX.js Integration

**Model Loading**
```typescript
class AIOptimizationService {
  private session: InferenceSession | null = null;
  
  async loadModel(modelPath: string) {
    this.session = await InferenceSession.create(modelPath);
  }
  
  async predict(inputData: Float32Array): Promise<OptimizationResult> {
    if (!this.session) {
      throw new Error('Model not loaded');
    }
    
    const feeds = { input: new Tensor('float32', inputData, [1, inputData.length]) };
    const results = await this.session.run(feeds);
    
    return this.parseResults(results);
  }
}
```

**Feature Engineering**
```typescript
class FeatureExtractor {
  extractHVACFeatures(system: HVACSystem, building: BuildingData): Float32Array {
    const features = [
      system.capacity / 100000,  // Normalized capacity
      building.area / 10000,     // Normalized area
      building.occupancy / 100,  // Normalized occupancy
      this.encodeClimateZone(building.climateZone),
      this.encodeBuildingType(building.type)
    ];
    
    return new Float32Array(features);
  }
}
```

## Security Architecture

### Authentication & Authorization

**JWT Implementation**
```python
class JWTManager:
    def __init__(self, secret_key: str, algorithm: str = "HS256"):
        self.secret_key = secret_key
        self.algorithm = algorithm
    
    def create_token(self, user_id: str, permissions: List[str]) -> str:
        payload = {
            "user_id": user_id,
            "permissions": permissions,
            "exp": datetime.utcnow() + timedelta(hours=24),
            "iat": datetime.utcnow()
        }
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
    
    def verify_token(self, token: str) -> Dict:
        try:
            return jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
        except jwt.ExpiredSignatureError:
            raise AuthenticationError("Token expired")
        except jwt.InvalidTokenError:
            raise AuthenticationError("Invalid token")
```

**Permission System**
```python
class PermissionChecker:
    def __init__(self):
        self.permissions = {
            "project.read": ["viewer", "editor", "admin"],
            "project.write": ["editor", "admin"],
            "project.delete": ["admin"],
            "calculation.create": ["editor", "admin"],
            "collaboration.join": ["viewer", "editor", "admin"]
        }
    
    def check_permission(self, user_role: str, permission: str) -> bool:
        return user_role in self.permissions.get(permission, [])
```

### Data Encryption

**At Rest**
- Database encryption (PostgreSQL TDE)
- File system encryption
- Backup encryption
- Key management with HashiCorp Vault

**In Transit**
- TLS 1.3 for all communications
- Certificate pinning
- HSTS headers
- Secure WebSocket connections

## Deployment Architecture

### Kubernetes Configuration

**Deployment Manifest**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sizewise-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: sizewise-backend
  template:
    metadata:
      labels:
        app: sizewise-backend
    spec:
      containers:
      - name: backend
        image: sizewise/backend:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
```

**Service Configuration**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: sizewise-backend-service
spec:
  selector:
    app: sizewise-backend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8000
  type: LoadBalancer
```

### Auto-scaling

**Horizontal Pod Autoscaler**
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: sizewise-backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: sizewise-backend
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

## Monitoring and Observability

### Metrics Collection

**Prometheus Configuration**
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'sizewise-backend'
    static_configs:
      - targets: ['backend:8000']
    metrics_path: /metrics
    scrape_interval: 5s
```

**Custom Metrics**
```python
from prometheus_client import Counter, Histogram, Gauge

# Request metrics
REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint'])
REQUEST_DURATION = Histogram('http_request_duration_seconds', 'HTTP request duration')
ACTIVE_USERS = Gauge('active_users_total', 'Number of active users')

# HVAC-specific metrics
CALCULATION_COUNT = Counter('hvac_calculations_total', 'Total HVAC calculations', ['type'])
CALCULATION_DURATION = Histogram('hvac_calculation_duration_seconds', 'HVAC calculation duration', ['type'])
```

### Logging Strategy

**Structured Logging**
```python
import structlog

logger = structlog.get_logger()

async def calculate_air_duct(params: AirDuctParams):
    logger.info(
        "Starting air duct calculation",
        user_id=params.user_id,
        project_id=params.project_id,
        room_area=params.room_area,
        cfm_required=params.cfm_required
    )
    
    try:
        result = perform_calculation(params)
        logger.info(
            "Air duct calculation completed",
            calculation_id=result.id,
            duration=result.duration
        )
        return result
    except Exception as e:
        logger.error(
            "Air duct calculation failed",
            error=str(e),
            error_type=type(e).__name__
        )
        raise
```

### Distributed Tracing

**OpenTelemetry Integration**
```python
from opentelemetry import trace
from opentelemetry.exporter.jaeger.thrift import JaegerExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

# Configure tracing
trace.set_tracer_provider(TracerProvider())
tracer = trace.get_tracer(__name__)

jaeger_exporter = JaegerExporter(
    agent_host_name="jaeger",
    agent_port=6831,
)

span_processor = BatchSpanProcessor(jaeger_exporter)
trace.get_tracer_provider().add_span_processor(span_processor)

# Use in code
@tracer.start_as_current_span("calculate_air_duct")
async def calculate_air_duct(params: AirDuctParams):
    span = trace.get_current_span()
    span.set_attribute("room_area", params.room_area)
    span.set_attribute("cfm_required", params.cfm_required)
    
    # Perform calculation
    result = await perform_calculation(params)
    
    span.set_attribute("calculation_id", result.id)
    return result
```

## Enterprise Security Framework

### Multi-Factor Authentication (MFA)

**TOTP Implementation**
```python
import pyotp
import qrcode
from io import BytesIO

class MFAService:
    def __init__(self):
        self.issuer_name = "SizeWise Suite"

    def generate_secret(self, user_id: str) -> str:
        """Generate TOTP secret for user"""
        secret = pyotp.random_base32()
        return secret

    def generate_qr_code(self, user_email: str, secret: str) -> bytes:
        """Generate QR code for authenticator app setup"""
        totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
            name=user_email,
            issuer_name=self.issuer_name
        )

        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(totp_uri)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        return buffer.getvalue()

    def verify_token(self, secret: str, token: str) -> bool:
        """Verify TOTP token"""
        totp = pyotp.TOTP(secret)
        return totp.verify(token, valid_window=1)
```

**Hardware Security Key Support**
```typescript
class WebAuthnService {
  async registerCredential(userId: string): Promise<PublicKeyCredential> {
    const challenge = await this.generateChallenge();

    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
      challenge: new Uint8Array(challenge),
      rp: {
        name: "SizeWise Suite",
        id: "sizewise.com",
      },
      user: {
        id: new TextEncoder().encode(userId),
        name: userId,
        displayName: "SizeWise User",
      },
      pubKeyCredParams: [
        { alg: -7, type: "public-key" },  // ES256
        { alg: -257, type: "public-key" } // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: "cross-platform",
        userVerification: "required"
      },
      timeout: 60000,
      attestation: "direct"
    };

    return await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions
    }) as PublicKeyCredential;
  }

  async authenticateCredential(credentialId: string): Promise<PublicKeyCredential> {
    const challenge = await this.generateChallenge();

    const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
      challenge: new Uint8Array(challenge),
      allowCredentials: [{
        id: new Uint8Array(Buffer.from(credentialId, 'base64')),
        type: 'public-key'
      }],
      timeout: 60000,
      userVerification: "required"
    };

    return await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions
    }) as PublicKeyCredential;
  }
}
```

### Role-Based Access Control (RBAC)

**Permission System**
```python
from enum import Enum
from typing import List, Dict, Set
from dataclasses import dataclass

class Permission(Enum):
    # Project permissions
    PROJECT_CREATE = "project:create"
    PROJECT_READ = "project:read"
    PROJECT_UPDATE = "project:update"
    PROJECT_DELETE = "project:delete"
    PROJECT_SHARE = "project:share"

    # Calculation permissions
    CALC_BASIC = "calculation:basic"
    CALC_ADVANCED = "calculation:advanced"
    CALC_EXPORT = "calculation:export"

    # Collaboration permissions
    COLLAB_JOIN = "collaboration:join"
    COLLAB_MODERATE = "collaboration:moderate"

    # Admin permissions
    USER_MANAGE = "user:manage"
    SYSTEM_CONFIG = "system:config"
    AUDIT_VIEW = "audit:view"

@dataclass
class Role:
    name: str
    permissions: Set[Permission]
    description: str

class RBACService:
    def __init__(self):
        self.roles = {
            "viewer": Role(
                name="Viewer",
                permissions={
                    Permission.PROJECT_READ,
                    Permission.CALC_BASIC,
                    Permission.COLLAB_JOIN
                },
                description="Read-only access to projects and basic calculations"
            ),
            "engineer": Role(
                name="Engineer",
                permissions={
                    Permission.PROJECT_CREATE,
                    Permission.PROJECT_READ,
                    Permission.PROJECT_UPDATE,
                    Permission.CALC_BASIC,
                    Permission.CALC_ADVANCED,
                    Permission.CALC_EXPORT,
                    Permission.COLLAB_JOIN
                },
                description="Full engineering capabilities"
            ),
            "admin": Role(
                name="Administrator",
                permissions=set(Permission),  # All permissions
                description="Full system administration"
            )
        }

    def check_permission(self, user_roles: List[str], required_permission: Permission) -> bool:
        """Check if user has required permission"""
        for role_name in user_roles:
            role = self.roles.get(role_name)
            if role and required_permission in role.permissions:
                return True
        return False

    def get_user_permissions(self, user_roles: List[str]) -> Set[Permission]:
        """Get all permissions for user"""
        permissions = set()
        for role_name in user_roles:
            role = self.roles.get(role_name)
            if role:
                permissions.update(role.permissions)
        return permissions
```

### Security Audit Trail

**Audit Logging System**
```python
from datetime import datetime
from typing import Optional, Dict, Any
import json

@dataclass
class AuditEvent:
    event_id: str
    user_id: str
    action: str
    resource_type: str
    resource_id: Optional[str]
    timestamp: datetime
    ip_address: str
    user_agent: str
    details: Dict[str, Any]
    risk_level: str  # LOW, MEDIUM, HIGH, CRITICAL

class SecurityAuditService:
    def __init__(self, db_service):
        self.db = db_service

    async def log_event(self, event: AuditEvent):
        """Log security event to audit trail"""
        await self.db.audit_events.insert_one({
            "event_id": event.event_id,
            "user_id": event.user_id,
            "action": event.action,
            "resource_type": event.resource_type,
            "resource_id": event.resource_id,
            "timestamp": event.timestamp,
            "ip_address": event.ip_address,
            "user_agent": event.user_agent,
            "details": event.details,
            "risk_level": event.risk_level
        })

        # Alert on high-risk events
        if event.risk_level in ["HIGH", "CRITICAL"]:
            await self.send_security_alert(event)

    async def log_authentication(self, user_id: str, success: bool, ip_address: str, user_agent: str):
        """Log authentication attempt"""
        event = AuditEvent(
            event_id=self.generate_event_id(),
            user_id=user_id,
            action="authentication",
            resource_type="user",
            resource_id=user_id,
            timestamp=datetime.utcnow(),
            ip_address=ip_address,
            user_agent=user_agent,
            details={"success": success},
            risk_level="MEDIUM" if not success else "LOW"
        )
        await self.log_event(event)

    async def log_data_access(self, user_id: str, resource_type: str, resource_id: str, action: str):
        """Log data access event"""
        event = AuditEvent(
            event_id=self.generate_event_id(),
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            timestamp=datetime.utcnow(),
            ip_address=self.get_client_ip(),
            user_agent=self.get_user_agent(),
            details={"action": action},
            risk_level="LOW"
        )
        await self.log_event(event)
```

### Data Encryption

**Encryption at Rest**
```python
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64
import os

class EncryptionService:
    def __init__(self, master_key: str):
        self.master_key = master_key.encode()
        self.fernet = self._create_fernet()

    def _create_fernet(self) -> Fernet:
        """Create Fernet cipher from master key"""
        salt = b'sizewise_salt_2024'  # In production, use random salt per encryption
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(self.master_key))
        return Fernet(key)

    def encrypt_data(self, data: str) -> str:
        """Encrypt sensitive data"""
        encrypted = self.fernet.encrypt(data.encode())
        return base64.urlsafe_b64encode(encrypted).decode()

    def decrypt_data(self, encrypted_data: str) -> str:
        """Decrypt sensitive data"""
        encrypted_bytes = base64.urlsafe_b64decode(encrypted_data.encode())
        decrypted = self.fernet.decrypt(encrypted_bytes)
        return decrypted.decode()

    def encrypt_file(self, file_path: str) -> str:
        """Encrypt file and return encrypted file path"""
        with open(file_path, 'rb') as file:
            file_data = file.read()

        encrypted_data = self.fernet.encrypt(file_data)
        encrypted_path = f"{file_path}.encrypted"

        with open(encrypted_path, 'wb') as encrypted_file:
            encrypted_file.write(encrypted_data)

        return encrypted_path
```

---

This architecture guide provides a comprehensive overview of the SizeWise Suite technical architecture. For specific implementation details, refer to the codebase and additional technical documentation.
