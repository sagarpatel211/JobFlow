"use client";

import React from "react";
import { FaDocker, FaPython } from "react-icons/fa";
import {
  SiRedis,
  SiPostgresql,
  SiNextdotjs,
  SiNginx,
  SiElasticsearch,
  SiMinio,
  SiFlask,
  SiGunicorn,
  SiSqlalchemy,
} from "react-icons/si";
import ReactFlow, { MiniMap, Controls, Background, Node, Edge } from "react-flow-renderer";

const iconStyle = { fontSize: 24, marginRight: 8 };

const nodeStyles = {
  border: "1px solid #ccc",
  padding: 10,
  borderRadius: 5,
  background: "#fff",
  display: "flex",
  alignItems: "center",
};

const getNode = (id: string, label: string, Icon: React.ElementType, position: { x: number; y: number }): Node => ({
  id,
  data: {
    label: (
      <div style={nodeStyles}>
        <Icon style={iconStyle} />
        <span>{label}</span>
      </div>
    ),
  },
  position,
  type: "default",
});

const initialNodes: Node[] = [
  getNode("client", "Client (Browser)", SiNextdotjs, { x: -200, y: 0 }),
  getNode("frontend", "Next.js Frontend", SiNextdotjs, { x: 0, y: 0 }),
  getNode("loadbalancer", "Load Balancer (NGINX)", SiNginx, { x: 200, y: 100 }),
  getNode("microservice", "Flask + Gunicorn + SQLAlchemy", FaPython, { x: 600, y: 200 }),
  getNode("flask", "Flask", SiFlask, { x: 600, y: 260 }),
  getNode("gunicorn", "Gunicorn", SiGunicorn, { x: 600, y: 320 }),
  getNode("sqlalchemy", "SQLAlchemy", SiSqlalchemy, { x: 600, y: 380 }),
  getNode("redis", "Redis Cache", SiRedis, { x: 200, y: 300 }),
  getNode("postgres", "PostgreSQL DB", SiPostgresql, { x: 400, y: 400 }),
  getNode("elasticsearch", "Elasticsearch", SiElasticsearch, { x: 800, y: 100 }),
  getNode("minio", "MinIO Storage", SiMinio, { x: 800, y: 200 }),
  getNode("docker", "Docker Compose (orchestration)", FaDocker, { x: 400, y: -100 }),
];

const initialEdges: Edge[] = [
  { id: "e0-1", source: "client", target: "frontend", animated: true },
  { id: "e1-2", source: "frontend", target: "loadbalancer", animated: true },
  { id: "e2-3", source: "loadbalancer", target: "microservice", animated: true },
  { id: "e3-4", source: "microservice", target: "flask", animated: true },
  { id: "e4-5", source: "flask", target: "gunicorn", animated: true },
  { id: "e5-6", source: "gunicorn", target: "sqlalchemy", animated: true },
  { id: "e3-7", source: "microservice", target: "redis", animated: true },
  { id: "e3-8", source: "microservice", target: "postgres", animated: true },
  { id: "e3-9", source: "microservice", target: "elasticsearch", animated: true },
  { id: "e3-10", source: "microservice", target: "minio", animated: true },
  { id: "e1-11", source: "frontend", target: "docker", animated: true },
  { id: "e11-3", source: "docker", target: "microservice", animated: true },
  { id: "e11-7", source: "docker", target: "redis", animated: true },
  { id: "e11-8", source: "docker", target: "postgres", animated: true },
  { id: "e11-9", source: "docker", target: "elasticsearch", animated: true },
  { id: "e11-10", source: "docker", target: "minio", animated: true },
];

const TechStackPage = () => {
  return (
    <div className="flex flex-col items-center p-8 space-y-8">
      <h1 className="text-4xl font-bold">Tech Stack Diagram</h1>
      <div className="w-full h-[700px] max-w-6xl rounded-lg shadow border">
        <ReactFlow nodes={initialNodes} edges={initialEdges} fitView>
          <MiniMap />
          <Controls />
          <Background />
        </ReactFlow>
      </div>
    </div>
  );
};

export default TechStackPage;
