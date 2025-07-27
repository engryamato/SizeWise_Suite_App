# Sentry Usage Guidelines for SizeWise Suite

These rules provide guidance for correctly implementing Sentry functionality within the SizeWise Suite project.

**Note**: This file includes both official Sentry AI rules and SizeWise Suite-specific patterns for comprehensive guidance.

## Exception Catching

Use `Sentry.captureException(error)` to capture an exception and log the error in Sentry.
Use this in try catch blocks or areas where exceptions are expected

```javascript
try {
  // risky operation
  await processCalculation();
} catch (error) {
  Sentry.captureException(error);
  throw error; // re-throw if needed
}
```

## Tracing Examples

Spans should be created for meaningful actions within applications like button clicks, API calls, and function calls.
Use the `Sentry.startSpan` function to create a span.
Child spans can exist within a parent span.

### Custom Span instrumentation in component actions

The `name` and `op` properties should be meaningful for the activities in the call.
Attach attributes based on relevant information and metrics from the request.

```javascript
function DrawingToolComponent() {
  const handleDrawingAction = () => {
    // Create a transaction/span to measure performance
    Sentry.startSpan(
      {
        op: "ui.drawing",
        name: "Drawing Tool Action",
      },
      (span) => {
        const toolType = "duct";
        const projectId = currentProject?.id;

        // Metrics can be added to the span
        span.setAttribute("tool_type", toolType);
        span.setAttribute("project_id", projectId);

        performDrawingAction();
      },
    );
  };

  return (
    <button type="button" onClick={handleDrawingAction}>
      Draw Duct
    </button>
  );
}
```

### Custom span instrumentation in API calls

The `name` and `op` properties should be meaningful for the activities in the call.
Attach attributes based on relevant information and metrics from the request.

```javascript
async function fetchCalculationData(calculationId) {
  return Sentry.startSpan(
    {
      op: "http.client",
      name: `GET /api/calculations/${calculationId}`,
    },
    async () => {
      const response = await fetch(`/api/calculations/${calculationId}`);
      const data = await response.json();
      return data;
    },
  );
}
```

## Logs

Where logs are used, ensure Sentry is imported using `import * as Sentry from "@sentry/nextjs"`
Enable logging in Sentry using `Sentry.init({ _experiments: { enableLogs: true } })`
Reference the logger using `const { logger } = Sentry`
Sentry offers a consoleLoggingIntegration that can be used to log specific console error types automatically without instrumenting the individual logger calls.

## Configuration

In NextJS the client side Sentry initialization is in `instrumentation-client.ts`, the server initialization is in `sentry.server.config.ts` and the edge initialization is in `sentry.edge.config.ts`
Initialization does not need to be repeated in other files, it only needs to happen in the files mentioned above. You should use `import * as Sentry from "@sentry/nextjs"` to reference Sentry functionality.

### SizeWise Suite DSN
Use the correct DSN for SizeWise Suite:
```
https://7c66eaefa7b2dde6957e18ffb03bf28f@o4509734387056640.ingest.us.sentry.io/4509734389481472
```

### Baseline Configuration

```javascript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://7c66eaefa7b2dde6957e18ffb03bf28f@o4509734387056640.ingest.us.sentry.io/4509734389481472",

  _experiments: {
    enableLogs: true,
  },
});
```

### Logger Integration

```javascript
Sentry.init({
  dsn: "https://7c66eaefa7b2dde6957e18ffb03bf28f@o4509734387056640.ingest.us.sentry.io/4509734389481472",
  integrations: [
    // send console.log, console.error, and console.warn calls as logs to Sentry
    Sentry.consoleLoggingIntegration({ levels: ["log", "error", "warn"] }),
  ],
});
```

## Logger Examples

`logger.fmt` is a template literal function that should be used to bring variables into the structured logs.

```javascript
const { logger } = Sentry;

logger.trace("Starting calculation process", { calculationType: "ductSizing" });
logger.debug(logger.fmt`Cache miss for project: ${projectId}`);
logger.info("Calculation completed", { calculationId: 345, duration: "2.3s" });
logger.warn("Performance threshold exceeded", {
  operation: "3d_rendering",
  duration: 5000,
  threshold: 3000
});
logger.error("Failed to save project", {
  projectId: "proj_123",
  userId: "user_456",
  error: error.message
});
logger.fatal("Database connection lost", {
  database: "sizewise_projects",
  activeConnections: 0
});
```

## Official Sentry AI Rules

The following are the official Sentry AI rules for reference:

### Generic Component Example

```javascript
function TestComponent() {
  const handleTestButtonClick = () => {
    // Create a transaction/span to measure performance
    Sentry.startSpan(
      {
        op: "ui.click",
        name: "Test Button Click",
      },
      (span) => {
        const value = "some config";
        const metric = "some metric";

        // Metrics can be added to the span
        span.setAttribute("config", value);
        span.setAttribute("metric", metric);

        doSomething();
      },
    );
  };

  return (
    <button type="button" onClick={handleTestButtonClick}>
      Test Sentry
    </button>
  );
}
```

### Generic API Call Example

```javascript
async function fetchUserData(userId) {
  return Sentry.startSpan(
    {
      op: "http.client",
      name: `GET /api/users/${userId}`,
    },
    async () => {
      const response = await fetch(`/api/users/${userId}`);
      const data = await response.json();
      return data;
    },
  );
}
```

## SizeWise Suite Specific Patterns

### Calculation Tracing
```javascript
async function performDuctCalculation(params) {
  return Sentry.startSpan(
    {
      op: "calculation.duct_sizing",
      name: "Duct Sizing Calculation",
    },
    async (span) => {
      span.setAttribute("duct_type", params.ductType);
      span.setAttribute("airflow_cfm", params.airflow);
      span.setAttribute("pressure_class", params.pressureClass);
      
      const result = await calculateDuctSize(params);
      span.setAttribute("result_size", result.size);
      return result;
    },
  );
}
```

### Authentication Tracing
```javascript
async function authenticateUser(credentials) {
  return Sentry.startSpan(
    {
      op: "auth.login",
      name: "User Authentication",
    },
    async (span) => {
      span.setAttribute("auth_method", "local");
      span.setAttribute("tier", credentials.tier);
      
      try {
        const result = await validateCredentials(credentials);
        span.setAttribute("success", true);
        return result;
      } catch (error) {
        span.setAttribute("success", false);
        span.setAttribute("error_type", error.type);
        Sentry.captureException(error);
        throw error;
      }
    },
  );
}
```

### Project Operations Tracing
```javascript
async function saveProject(projectData) {
  return Sentry.startSpan(
    {
      op: "project.save",
      name: "Save Project",
    },
    async (span) => {
      span.setAttribute("project_type", projectData.type);
      span.setAttribute("element_count", projectData.elements?.length || 0);
      span.setAttribute("file_size_kb", Math.round(JSON.stringify(projectData).length / 1024));
      
      const result = await persistProject(projectData);
      span.setAttribute("project_id", result.id);
      return result;
    },
  );
}
```
