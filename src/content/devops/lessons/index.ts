import type { LessonBody } from "@content/types";

const cicd: LessonBody = {
  id: "devops-cicd",
  blocks: [
    {
      type: "md",
      md: `**Continuous integration** means every change is built and tested automatically, so \`main\` is always releasable. **Continuous delivery** means every green build *can* go to production with one click; **continuous deployment** means it *does*, automatically.

A good pipeline is fast (minutes, not an hour), deterministic, and stops bad changes as early and cheaply as possible.`,
    },
    {
      type: "steps",
      title: "A typical pipeline for a Spring service",
      items: [
        {
          title: "Build & unit test",
          md: "`./mvnw verify`: compile, unit tests, static analysis. Cache dependencies between runs.",
        },
        {
          title: "Integration tests",
          md: "Testcontainers for Postgres/Kafka: real dependencies, no shared test environment.",
        },
        {
          title: "Package",
          md: "Build the container image once, tag it with the commit SHA, push to a registry.",
        },
        {
          title: "Deploy to staging",
          md: "Same image, different config. Run smoke tests.",
        },
        {
          title: "Promote to production",
          md: "Manual approval or automatic; progressive rollout with health checks and automated rollback.",
        },
      ],
    },
    {
      type: "code",
      lang: "yaml",
      title: "GitHub Actions: build and test",
      code: `name: ci
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: "21"
          cache: maven          # reuse ~/.m2 between runs
      - run: ./mvnw -B verify`,
    },
    {
      type: "callout",
      tone: "insight",
      title: "Build once, deploy many",
      md: "Promote the *same* artifact (image digest) through environments. Rebuilding per environment means production runs something you never tested.",
    },
    {
      type: "checklist",
      title: "Pitfalls",
      items: [
        "Flaky tests that train everyone to re-run until green",
        "Secrets hard-coded in pipeline files instead of a secret store",
        "Rebuilding images per environment",
        "Long pipelines that encourage batching big risky changes",
      ],
    },
    { type: "quiz", ids: ["cicd-q1", "cicd-q2"] },
  ],
  quiz: [
    {
      id: "cicd-q1",
      prompt: "Continuous delivery vs continuous deployment?",
      choices: [
        "They're the same",
        "Delivery: every green build can be released; deployment: every green build is released automatically",
        "Deployment is manual",
        "Delivery skips tests",
      ],
      answer: 1,
      explanation: "The difference is the final automatic step to production.",
    },
    {
      id: "cicd-q2",
      prompt: "Why tag images with the commit SHA and promote the same image?",
      choices: ["Shorter names", "Production runs exactly what was tested, and rollbacks are precise", "Registries require it", "It's faster to build"],
      answer: 1,
      explanation: "Immutable, traceable artifacts.",
    },
  ],
  cards: [
    {
      id: "cicd-c1",
      front: "CI vs CD (delivery) vs CD (deployment)?",
      back: "CI: build/test every change. Delivery: always releasable. Deployment: automatically released.",
    },
    {
      id: "cicd-c2",
      front: "Build once, deploy many?",
      back: "Promote the same immutable artifact through every environment; only config changes.",
    },
    {
      id: "cicd-c3",
      front: "Integration testing real dependencies in CI?",
      back: "Testcontainers: throwaway Docker containers per test run.",
    },
  ],
};

const docker: LessonBody = {
  id: "devops-docker",
  blocks: [
    {
      type: "md",
      md: `A container image is a stack of read-only **layers** plus metadata. Each Dockerfile instruction adds a layer, and layers are cached, so **order instructions from least to most frequently changing** and builds become fast.`,
    },
    {
      type: "code",
      lang: "docker",
      title: "Multi-stage build for a Spring Boot app",
      code: `# 1. Build stage: full JDK and Maven
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app
COPY pom.xml mvnw ./
COPY .mvn .mvn
RUN ./mvnw -B dependency:go-offline        # cached until pom.xml changes
COPY src src
RUN ./mvnw -B package -DskipTests

# 2. Runtime stage: small JRE image, non-root user
FROM eclipse-temurin:21-jre
WORKDIR /app
RUN useradd --system app
USER app
COPY --from=build /app/target/*.jar app.jar
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]`,
    },
    {
      type: "compare",
      title: "Image hygiene",
      headers: ["Practice", "Why"],
      rows: [
        ["Multi-stage builds", "Build tools never ship to production"],
        ["Pin base image versions", "Reproducible builds"],
        ["Run as non-root", "Limits damage if the app is compromised"],
        [".dockerignore", "Smaller context, no secrets or target/ copied"],
        ["One process per container", "Clean lifecycle, logs, and restarts"],
      ],
    },
    {
      type: "callout",
      tone: "insight",
      title: "JVM in a container",
      md: "Size the heap relative to the container limit (`-XX:MaxRAMPercentage`) and leave headroom for metaspace, threads and direct buffers. Exceeding the limit gets the container OOM-killed, without a Java stack trace.",
    },
    { type: "quiz", ids: ["dock-q1", "dock-q2"] },
  ],
  quiz: [
    {
      id: "dock-q1",
      prompt: "Why copy pom.xml and download dependencies before copying src?",
      choices: ["Security", "Layer caching: dependencies are only re-downloaded when pom.xml changes", "Docker requires it", "Smaller image"],
      answer: 1,
      explanation: "Source changes often; dependencies rarely.",
    },
    {
      id: "dock-q2",
      prompt: "Main benefit of a multi-stage build?",
      choices: ["Faster runtime", "The final image contains only what's needed to run, not build tools", "It enables caching", "It runs tests"],
      answer: 1,
      explanation: "Smaller, safer images.",
    },
  ],
  cards: [
    {
      id: "dock-c1",
      front: "How to keep Docker builds fast?",
      back: "Order layers from least to most frequently changing; copy dependency manifests before source.",
    },
    {
      id: "dock-c2",
      front: "Multi-stage build benefit?",
      back: "Build tooling stays in the builder stage; runtime image is small and safer.",
    },
    {
      id: "dock-c3",
      front: "Container OOM-kill with the JVM?",
      back: "Heap + non-heap exceeded the container limit; size heap with MaxRAMPercentage and leave headroom.",
    },
  ],
};

const k8sCore: LessonBody = {
  id: "devops-k8s-core",
  blocks: [
    {
      type: "md",
      md: `Kubernetes is a **desired-state** system: you declare what should run, and controllers continuously work to make reality match. Most services need just six object types.`,
    },
    {
      type: "compare",
      title: "The objects you'll use daily",
      headers: ["Object", "What it does"],
      rows: [
        ["Pod", "One or more containers sharing a network namespace; the unit of scheduling"],
        ["Deployment", "Keeps N identical pods running; handles rolling updates and rollbacks"],
        ["Service", "Stable virtual IP and DNS name load-balancing to matching pods"],
        ["ConfigMap / Secret", "Configuration and credentials injected as env vars or files"],
        ["Ingress", "HTTP routing from outside the cluster to Services"],
        ["HorizontalPodAutoscaler", "Scales a Deployment's replicas by metrics"],
      ],
    },
    {
      type: "code",
      lang: "yaml",
      title: "A minimal Deployment and Service",
      code: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: orders
spec:
  replicas: 3
  selector:
    matchLabels: { app: orders }
  template:
    metadata:
      labels: { app: orders }
    spec:
      containers:
        - name: orders
          image: registry.example.com/orders:3f2a9c1
          ports: [{ containerPort: 8080 }]
          envFrom: [{ configMapRef: { name: orders-config } }]
---
apiVersion: v1
kind: Service
metadata:
  name: orders
spec:
  selector: { app: orders }        # routes to pods with this label
  ports: [{ port: 80, targetPort: 8080 }]`,
    },
    {
      type: "callout",
      tone: "insight",
      title: "Labels are the glue",
      md: "Services and Deployments find pods by **label selectors**, not names. A typo in a label means a Service with zero endpoints, the most common 'it deploys but nothing answers' bug.",
    },
    { type: "quiz", ids: ["k8s-q1", "k8s-q2"] },
  ],
  quiz: [
    {
      id: "k8s-q1",
      prompt: "How does a Service know which pods to send traffic to?",
      choices: ["By pod name", "By label selector", "By IP list in the manifest", "By namespace only"],
      answer: 1,
      explanation: "Endpoints are the ready pods whose labels match the selector.",
    },
    {
      id: "k8s-q2",
      prompt: "Which object performs rolling updates?",
      choices: ["Pod", "Service", "Deployment", "ConfigMap"],
      answer: 2,
      explanation: "A Deployment manages ReplicaSets and rolls pods over gradually.",
    },
  ],
  cards: [
    {
      id: "k8s-c1",
      front: "Kubernetes core model?",
      back: "Declarative desired state, reconciled continuously by controllers.",
    },
    {
      id: "k8s-c2",
      front: "Pod vs Deployment?",
      back: "Pod: running containers. Deployment: keeps N pods running and manages rollouts.",
    },
    {
      id: "k8s-c3",
      front: "What connects a Service to pods?",
      back: "Label selectors.",
    },
    {
      id: "k8s-c4",
      front: "ConfigMap vs Secret?",
      back: "Both inject config; Secrets are for sensitive data (base64-encoded, access-controlled, ideally encrypted at rest).",
    },
  ],
};

const k8sOps: LessonBody = {
  id: "devops-k8s-ops",
  blocks: [
    {
      type: "md",
      md: `Running a service well on Kubernetes comes down to telling the platform three things honestly: **is it alive, is it ready, and what does it need?**`,
    },
    {
      type: "code",
      lang: "yaml",
      title: "Probes and resources for a Spring Boot pod",
      code: `containers:
  - name: orders
    image: registry.example.com/orders:3f2a9c1
    resources:
      requests: { cpu: "500m", memory: "768Mi" }   # used for scheduling
      limits:   { memory: "768Mi" }                # exceed → OOM-killed
    startupProbe:
      httpGet: { path: /actuator/health/liveness, port: 8080 }
      failureThreshold: 30
      periodSeconds: 5          # up to 150 s to start before liveness kicks in
    livenessProbe:
      httpGet: { path: /actuator/health/liveness, port: 8080 }
    readinessProbe:
      httpGet: { path: /actuator/health/readiness, port: 8080 }`,
    },
    {
      type: "compare",
      title: "Probes",
      headers: ["Probe", "Failing means", "Kubernetes does"],
      rows: [
        ["Startup", "Still booting", "Waits; holds off other probes"],
        ["Liveness", "Process is stuck", "Restarts the container"],
        ["Readiness", "Can't serve right now", "Removes the pod from Service endpoints"],
      ],
    },
    {
      type: "callout",
      tone: "warning",
      title: "Don't check dependencies in liveness",
      md: "If liveness fails when the database is down, every pod restarts at once and makes the outage worse. Dependencies belong in readiness (if at all).",
    },
    {
      type: "code",
      lang: "bash",
      title: "Debugging toolkit",
      code: `kubectl get pods -l app=orders                    # status, restarts
kubectl describe pod orders-7d9f…                 # events: OOMKilled, probe failures, scheduling
kubectl logs orders-7d9f… --previous              # logs of the crashed container
kubectl get endpoints orders                      # does the Service have ready pods?
kubectl rollout undo deployment/orders            # roll back`,
    },
    { type: "quiz", ids: ["ops-q1", "ops-q2"] },
  ],
  quiz: [
    {
      id: "ops-q1",
      prompt: "A pod is running but receives no traffic. Most likely cause?",
      choices: ["Liveness failing", "Readiness failing, so it's removed from endpoints", "Image pull error", "CPU limit too high"],
      answer: 1,
      explanation: "Not-ready pods are excluded from the Service.",
    },
    {
      id: "ops-q2",
      prompt: "Why shouldn't liveness probes check the database?",
      choices: ["They're too slow", "A DB outage would restart every pod, amplifying the incident", "Kubernetes forbids it", "It leaks credentials"],
      answer: 1,
      explanation: "Liveness should only detect a stuck process.",
    },
  ],
  cards: [
    {
      id: "ops-c1",
      front: "Liveness vs readiness?",
      back: "Liveness fail → restart container. Readiness fail → stop sending traffic.",
    },
    {
      id: "ops-c2",
      front: "Why a startupProbe for JVM apps?",
      back: "Slow starts would otherwise fail liveness and cause restart loops.",
    },
    {
      id: "ops-c3",
      front: "Requests vs limits?",
      back: "Requests: scheduling guarantee. Limits: hard cap (memory over limit → OOM-kill; CPU → throttling).",
    },
    {
      id: "ops-c4",
      front: "Logs of a crashed container?",
      back: "kubectl logs <pod> --previous",
    },
  ],
};

const release: LessonBody = {
  id: "devops-release",
  blocks: [
    {
      type: "md",
      md: `Deploying and releasing are different things. A deployment puts new code on servers; a **release** exposes it to users. Separating them is how teams ship many times a day without fear.`,
    },
    {
      type: "compare",
      title: "Strategies",
      headers: ["Strategy", "How", "Rollback", "Cost"],
      rows: [
        ["Rolling", "Replace pods gradually", "Roll forward/back gradually", "Cheap; both versions live briefly"],
        ["Blue-green", "Full new environment, switch traffic at once", "Instant switch back", "Double capacity during release"],
        ["Canary", "Small % of traffic to new version, watch metrics, widen", "Shift traffic back", "Needs good metrics and traffic splitting"],
        ["Feature flags", "Code ships dark, enabled per user/percentage", "Toggle off, no deploy", "Flag debt if never cleaned up"],
      ],
    },
    {
      type: "callout",
      tone: "insight",
      title: "Database changes need two steps",
      md: "Use **expand and contract**: first add the new column or table (compatible with old and new code), deploy, migrate data, and only later remove the old column. Never ship a migration that breaks the version still running.",
    },
    {
      type: "checklist",
      title: "Pitfalls",
      items: [
        "Canary without automated metric checks (it's just a slow rollout)",
        "Breaking schema changes deployed alongside code",
        "Feature flags never removed",
        "No rehearsed rollback path",
      ],
    },
    { type: "quiz", ids: ["rel-q1", "rel-q2"] },
  ],
  quiz: [
    {
      id: "rel-q1",
      prompt: "Which strategy gives an instant rollback by switching traffic back?",
      choices: ["Rolling", "Blue-green", "Recreate", "Manual SSH"],
      answer: 1,
      explanation: "The old environment stays intact until you're confident.",
    },
    {
      id: "rel-q2",
      prompt: "How should you rename a database column safely?",
      choices: [
        "Rename in the same deploy",
        "Expand and contract: add new, dual-write/migrate, switch reads, then drop old",
        "Drop and recreate the table",
        "Use a feature flag only",
      ],
      answer: 1,
      explanation: "Both old and new code versions must work during the rollout.",
    },
  ],
  cards: [
    {
      id: "rel-c1",
      front: "Deploy vs release?",
      back: "Deploy: code on servers. Release: users can see it (often via flags).",
    },
    {
      id: "rel-c2",
      front: "Canary release?",
      back: "Send a small share of traffic to the new version, compare metrics, then widen or roll back.",
    },
    {
      id: "rel-c3",
      front: "Expand and contract?",
      back: "Add the new schema, migrate and switch, then remove the old: every step backward-compatible.",
    },
  ],
};

const lessons: LessonBody[] = [cicd, docker, k8sCore, k8sOps, release];
export default lessons;
