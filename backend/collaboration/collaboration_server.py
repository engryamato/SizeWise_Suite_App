"""
Real-time Collaboration Server for SizeWise Suite

WebSocket-based collaboration server with operational transformation,
conflict resolution, and multi-user HVAC design support.

Features:
- Real-time document synchronization
- Operational transformation for conflict resolution
- User presence and cursor tracking
- Permission-based access control
- Document locking and version control
- Scalable room-based architecture
"""

import asyncio
import json
import logging
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Set
from dataclasses import dataclass, asdict
from uuid import uuid4

import socketio
from aiohttp import web
import aioredis
import structlog

# Configure structured logging
logger = structlog.get_logger()

@dataclass
class CollaborationUser:
    id: str
    name: str
    email: str
    avatar: Optional[str] = None
    color: str = "#3B82F6"
    cursor: Optional[Dict] = None
    last_seen: datetime = None
    is_online: bool = True
    permissions: str = "write"  # read, write, admin

@dataclass
class Operation:
    id: str
    type: str  # insert, delete, update, move, style
    user_id: str
    timestamp: datetime
    element_id: str
    path: List[str]
    old_value: Optional[any] = None
    new_value: Optional[any] = None
    position: Optional[Dict] = None
    metadata: Optional[Dict] = None

@dataclass
class CollaborationDocument:
    id: str
    project_id: str
    type: str  # hvac_design, calculation, report
    version: int
    operations: List[Operation]
    participants: List[CollaborationUser]
    permissions: Dict[str, str]
    last_modified: datetime
    is_locked: bool = False
    locked_by: Optional[str] = None

class CollaborationServer:
    def __init__(self, redis_url: str = "redis://localhost:6379"):
        # Initialize Socket.IO server
        self.sio = socketio.AsyncServer(
            cors_allowed_origins="*",
            logger=True,
            engineio_logger=True
        )
        
        # Initialize web application
        self.app = web.Application()
        self.sio.attach(self.app)
        
        # Data storage
        self.documents: Dict[str, CollaborationDocument] = {}
        self.user_sessions: Dict[str, CollaborationUser] = {}
        self.document_rooms: Dict[str, Set[str]] = {}  # document_id -> set of user_ids
        self.user_documents: Dict[str, str] = {}  # user_id -> document_id
        
        # Redis for scaling (optional)
        self.redis_url = redis_url
        self.redis = None
        
        # Operation transformation engine
        self.ot_engine = OperationalTransformEngine()
        
        # Setup event handlers
        self.setup_event_handlers()
        
        # Cleanup task
        self.cleanup_task = None

    async def initialize(self):
        """Initialize the collaboration server"""
        try:
            # Initialize Redis connection
            if self.redis_url:
                self.redis = await aioredis.from_url(self.redis_url)
                logger.info("Connected to Redis for collaboration scaling")
            
            # Start cleanup task
            self.cleanup_task = asyncio.create_task(self.cleanup_inactive_sessions())
            
            logger.info("Collaboration server initialized successfully")
            
        except Exception as e:
            logger.error("Failed to initialize collaboration server", error=str(e))
            raise

    def setup_event_handlers(self):
        """Setup Socket.IO event handlers"""
        
        @self.sio.event
        async def connect(sid, environ, auth):
            """Handle client connection"""
            try:
                # Authenticate user
                user_id = auth.get('userId') if auth else None
                token = auth.get('token') if auth else None
                
                if not user_id or not await self.authenticate_user(user_id, token):
                    logger.warning("Unauthorized connection attempt", sid=sid)
                    return False
                
                # Create user session
                user = CollaborationUser(
                    id=user_id,
                    name=auth.get('name', f'User {user_id[:8]}'),
                    email=auth.get('email', ''),
                    avatar=auth.get('avatar'),
                    color=auth.get('color', '#3B82F6'),
                    last_seen=datetime.utcnow(),
                    is_online=True
                )
                
                self.user_sessions[sid] = user
                
                logger.info("User connected", user_id=user_id, sid=sid)
                return True
                
            except Exception as e:
                logger.error("Connection error", error=str(e), sid=sid)
                return False

        @self.sio.event
        async def disconnect(sid):
            """Handle client disconnection"""
            try:
                user = self.user_sessions.get(sid)
                if user:
                    # Leave current document
                    await self.leave_document_internal(sid, user)
                    
                    # Remove user session
                    del self.user_sessions[sid]
                    
                    logger.info("User disconnected", user_id=user.id, sid=sid)
                    
            except Exception as e:
                logger.error("Disconnection error", error=str(e), sid=sid)

        @self.sio.event
        async def join_document(sid, data):
            """Handle document join request"""
            try:
                user = self.user_sessions.get(sid)
                if not user:
                    return {'success': False, 'error': 'User not authenticated'}
                
                document_id = data.get('documentId')
                project_id = data.get('projectId')
                
                if not document_id or not project_id:
                    return {'success': False, 'error': 'Missing document or project ID'}
                
                # Check permissions
                if not await self.check_document_permissions(user.id, document_id, 'read'):
                    return {'success': False, 'error': 'Insufficient permissions'}
                
                # Get or create document
                document = await self.get_or_create_document(document_id, project_id)
                
                # Join document room
                await self.join_document_internal(sid, user, document)
                
                return {'success': True, 'document': asdict(document)}
                
            except Exception as e:
                logger.error("Join document error", error=str(e), sid=sid)
                return {'success': False, 'error': str(e)}

        @self.sio.event
        async def leave_document(sid, data):
            """Handle document leave request"""
            try:
                user = self.user_sessions.get(sid)
                if user:
                    await self.leave_document_internal(sid, user)
                    
            except Exception as e:
                logger.error("Leave document error", error=str(e), sid=sid)

        @self.sio.event
        async def operation(sid, data):
            """Handle operation from client"""
            try:
                user = self.user_sessions.get(sid)
                if not user:
                    return {'success': False, 'error': 'User not authenticated'}
                
                document_id = data.get('documentId')
                operation_data = data.get('operation')
                
                if not document_id or not operation_data:
                    return {'success': False, 'error': 'Missing data'}
                
                # Check write permissions
                if not await self.check_document_permissions(user.id, document_id, 'write'):
                    return {'success': False, 'error': 'Insufficient permissions'}
                
                # Process operation
                success = await self.process_operation(document_id, operation_data, user)
                
                return {'success': success}
                
            except Exception as e:
                logger.error("Operation error", error=str(e), sid=sid)
                return {'success': False, 'error': str(e)}

        @self.sio.event
        async def cursor_update(sid, data):
            """Handle cursor position update"""
            try:
                user = self.user_sessions.get(sid)
                if not user:
                    return
                
                document_id = data.get('documentId')
                cursor = data.get('cursor')
                
                if document_id and cursor:
                    # Update user cursor
                    user.cursor = cursor
                    
                    # Broadcast to other users in document
                    await self.sio.emit('cursor_updated', {
                        'userId': user.id,
                        'cursor': cursor
                    }, room=f"doc_{document_id}", skip_sid=sid)
                    
            except Exception as e:
                logger.error("Cursor update error", error=str(e), sid=sid)

        @self.sio.event
        async def document_lock(sid, data):
            """Handle document lock/unlock request"""
            try:
                user = self.user_sessions.get(sid)
                if not user:
                    return {'success': False, 'error': 'User not authenticated'}
                
                document_id = data.get('documentId')
                lock = data.get('lock', False)
                
                # Check admin permissions for locking
                if not await self.check_document_permissions(user.id, document_id, 'admin'):
                    return {'success': False, 'error': 'Insufficient permissions'}
                
                document = self.documents.get(document_id)
                if not document:
                    return {'success': False, 'error': 'Document not found'}
                
                # Update lock status
                document.is_locked = lock
                document.locked_by = user.id if lock else None
                
                # Broadcast lock status change
                await self.sio.emit('document_locked', {
                    'locked': lock,
                    'userId': user.id
                }, room=f"doc_{document_id}")
                
                return {'success': True}
                
            except Exception as e:
                logger.error("Document lock error", error=str(e), sid=sid)
                return {'success': False, 'error': str(e)}

        @self.sio.event
        async def heartbeat(sid, data):
            """Handle heartbeat from client"""
            user = self.user_sessions.get(sid)
            if user:
                user.last_seen = datetime.utcnow()

    async def join_document_internal(self, sid: str, user: CollaborationUser, document: CollaborationDocument):
        """Internal method to join a document"""
        document_id = document.id
        room_name = f"doc_{document_id}"
        
        # Join Socket.IO room
        await self.sio.enter_room(sid, room_name)
        
        # Add to document tracking
        if document_id not in self.document_rooms:
            self.document_rooms[document_id] = set()
        self.document_rooms[document_id].add(user.id)
        self.user_documents[user.id] = document_id
        
        # Add user to document participants
        if user not in document.participants:
            document.participants.append(user)
        
        # Notify other users
        await self.sio.emit('user_joined', asdict(user), room=room_name, skip_sid=sid)
        
        logger.info("User joined document", user_id=user.id, document_id=document_id)

    async def leave_document_internal(self, sid: str, user: CollaborationUser):
        """Internal method to leave a document"""
        document_id = self.user_documents.get(user.id)
        if not document_id:
            return
        
        room_name = f"doc_{document_id}"
        
        # Leave Socket.IO room
        await self.sio.leave_room(sid, room_name)
        
        # Remove from tracking
        if document_id in self.document_rooms:
            self.document_rooms[document_id].discard(user.id)
            if not self.document_rooms[document_id]:
                del self.document_rooms[document_id]
        
        if user.id in self.user_documents:
            del self.user_documents[user.id]
        
        # Remove from document participants
        document = self.documents.get(document_id)
        if document:
            document.participants = [p for p in document.participants if p.id != user.id]
        
        # Notify other users
        await self.sio.emit('user_left', user.id, room=room_name)
        
        logger.info("User left document", user_id=user.id, document_id=document_id)

    async def process_operation(self, document_id: str, operation_data: dict, user: CollaborationUser) -> bool:
        """Process and broadcast an operation"""
        try:
            document = self.documents.get(document_id)
            if not document:
                return False
            
            # Create operation object
            operation = Operation(
                id=operation_data.get('id', str(uuid4())),
                type=operation_data['type'],
                user_id=user.id,
                timestamp=datetime.utcnow(),
                element_id=operation_data['elementId'],
                path=operation_data.get('path', []),
                old_value=operation_data.get('oldValue'),
                new_value=operation_data.get('newValue'),
                position=operation_data.get('position'),
                metadata=operation_data.get('metadata')
            )
            
            # Apply operational transformation
            transformed_operation = self.ot_engine.transform_operation(operation, document.operations)
            
            # Add to document
            document.operations.append(transformed_operation)
            document.version += 1
            document.last_modified = datetime.utcnow()
            
            # Broadcast to other users
            await self.sio.emit('operation_received', asdict(transformed_operation), 
                             room=f"doc_{document_id}", skip_sid=None)
            
            # Persist to Redis if available
            if self.redis:
                await self.redis.lpush(f"ops:{document_id}", json.dumps(asdict(transformed_operation)))
                await self.redis.expire(f"ops:{document_id}", 86400)  # 24 hours
            
            return True
            
        except Exception as e:
            logger.error("Operation processing error", error=str(e))
            return False

    async def get_or_create_document(self, document_id: str, project_id: str) -> CollaborationDocument:
        """Get existing document or create new one"""
        if document_id in self.documents:
            return self.documents[document_id]
        
        # Create new document
        document = CollaborationDocument(
            id=document_id,
            project_id=project_id,
            type='hvac_design',
            version=0,
            operations=[],
            participants=[],
            permissions={},
            last_modified=datetime.utcnow()
        )
        
        self.documents[document_id] = document
        
        # Load from Redis if available
        if self.redis:
            operations_data = await self.redis.lrange(f"ops:{document_id}", 0, -1)
            for op_data in operations_data:
                op_dict = json.loads(op_data)
                operation = Operation(**op_dict)
                document.operations.append(operation)
        
        logger.info("Document created", document_id=document_id, project_id=project_id)
        return document

    async def authenticate_user(self, user_id: str, token: str) -> bool:
        """Authenticate user token"""
        # Implement your authentication logic here
        # For now, accept any non-empty user_id
        return bool(user_id)

    async def check_document_permissions(self, user_id: str, document_id: str, required_permission: str) -> bool:
        """Check if user has required permissions for document"""
        # Implement your permission checking logic here
        # For now, allow all operations
        return True

    async def cleanup_inactive_sessions(self):
        """Cleanup inactive user sessions"""
        while True:
            try:
                await asyncio.sleep(300)  # Run every 5 minutes
                
                cutoff_time = datetime.utcnow() - timedelta(minutes=30)
                inactive_users = []
                
                for sid, user in self.user_sessions.items():
                    if user.last_seen and user.last_seen < cutoff_time:
                        inactive_users.append((sid, user))
                
                for sid, user in inactive_users:
                    await self.leave_document_internal(sid, user)
                    del self.user_sessions[sid]
                    logger.info("Cleaned up inactive session", user_id=user.id)
                    
            except Exception as e:
                logger.error("Cleanup error", error=str(e))

    async def start_server(self, host: str = "localhost", port: int = 3001):
        """Start the collaboration server"""
        await self.initialize()
        
        # Add health check endpoint
        async def health_check(request):
            return web.json_response({
                'status': 'healthy',
                'active_documents': len(self.documents),
                'active_users': len(self.user_sessions),
                'timestamp': datetime.utcnow().isoformat()
            })
        
        self.app.router.add_get('/health', health_check)
        
        # Start server
        runner = web.AppRunner(self.app)
        await runner.setup()
        site = web.TCPSite(runner, host, port)
        await site.start()
        
        logger.info("Collaboration server started", host=host, port=port)
        
        # Keep server running
        try:
            await asyncio.Future()  # Run forever
        except KeyboardInterrupt:
            logger.info("Shutting down collaboration server")
        finally:
            if self.cleanup_task:
                self.cleanup_task.cancel()
            if self.redis:
                await self.redis.close()

class OperationalTransformEngine:
    """Operational Transformation Engine for conflict resolution"""
    
    def transform_operation(self, operation: Operation, existing_operations: List[Operation]) -> Operation:
        """Transform operation against existing operations"""
        transformed_op = operation
        
        # Find concurrent operations (operations that happened after this one was created)
        concurrent_ops = [op for op in existing_operations 
                         if op.timestamp > operation.timestamp and op.user_id != operation.user_id]
        
        # Apply transformation rules
        for concurrent_op in concurrent_ops:
            transformed_op = self.transform_against(transformed_op, concurrent_op)
        
        return transformed_op
    
    def transform_against(self, op1: Operation, op2: Operation) -> Operation:
        """Transform op1 against op2"""
        if op1.element_id != op2.element_id:
            # Different elements - no transformation needed
            return op1
        
        # Same element - apply transformation rules
        if op1.type == 'update' and op2.type == 'update':
            # Last writer wins for updates
            return op1 if op1.timestamp > op2.timestamp else op2
        
        if op1.type == 'move' and op2.type == 'move':
            # Combine position changes
            if op1.position and op2.position:
                op1.position = {
                    'x': op1.position.get('x', 0) + op2.position.get('x', 0),
                    'y': op1.position.get('y', 0) + op2.position.get('y', 0)
                }
        
        return op1

# Main entry point
if __name__ == "__main__":
    import sys
    
    # Configure logging
    logging.basicConfig(level=logging.INFO)
    
    # Create and start server
    server = CollaborationServer()
    
    host = sys.argv[1] if len(sys.argv) > 1 else "localhost"
    port = int(sys.argv[2]) if len(sys.argv) > 2 else 3001
    
    asyncio.run(server.start_server(host, port))
