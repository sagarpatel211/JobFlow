# Architecture

This document outlines the architecture of the **Job Scraper and Tracker** project. The design focuses on scalability, fault-tolerance, and leveraging modern tools to ensure a production-ready system.

## **High-Level Architecture**

```
                +-----------------------+
                |       Frontend        |
                |     (Next.js)         |
                +----------+------------+
                           |
                           v
                +----------+------------+
                |   API Gateway (GraphQL) |
                |     (Apollo Server)     |
                +----------+------------+
                           |
        +------------------+------------------+
        |                                     |
        v                                     v
+-------------------+          +---------------------------+
|    Job Tracker    |          |      Job Scraper          |
| (tRPC Microservice)|          | (Airflow + Scrapy + Kafka)|
+-------------------+          +---------------------------+
        |                                     |
        v                                     v
+-------------------+          +---------------------------+
|      Database     |          |     Data Pipeline         |
| (PostgreSQL +     |          |  (Kafka, S3, Spark)       |
|  Elasticsearch)   |          +---------------------------+
+-------------------+



```

---

## **System Components**

### **1. Frontend**

- **Framework**: [Next.js](https://nextjs.org/) with TypeScript.
- **Key Features**:
  - User authentication (Sign-up, Login).
  - Pages for tracking job applications, uploading resumes for ATS scans, and visualizing analytics.
  - Dynamic data fetching using GraphQL or tRPC.
- **Deployment**: Hosted on **Vercel** for server-side rendering (SSR) and static site generation (SSG).

---

### **2. API Gateway**

- **Framework**: Apollo Server (GraphQL) for flexible, schema-based API queries.
- **Features**:
  - Acts as the entry point for all requests from the frontend.
  - Handles authentication and authorization via JWT.
- **Alternative**: Use **tRPC** for full-stack type safety.
- **Scalability**: Deployed as a Docker container in Kubernetes.

---

### **3. Job Tracker Service**

- **Framework**: Built with **tRPC** (TypeScript) as a microservice.
- **Key Responsibilities**:
  - CRUD operations for tracking job applications (status, company, position, etc.).
  - Integration with the database (PostgreSQL + Elasticsearch).
- **Deployment**: Containerized using Docker and orchestrated with Kubernetes.

---

### **4. Job Scraper Service**

- **Workflow Orchestration**: [Apache Airflow](https://airflow.apache.org/) to schedule scraping workflows.
- **Scraping Tools**:
  - [Scrapy](https://scrapy.org/) for efficient scraping from job platforms.
  - [Playwright](https://playwright.dev/) for sites requiring browser automation.
- **Data Streaming**: Pushes scraped data to **Apache Kafka** for real-time processing.
- **Data Storage**:
  - Raw data stored in **S3**.
  - Processed data forwarded to **PostgreSQL** and **Elasticsearch**.

---

### **5. ATS Scanner**

- **Framework**: Python-based microservice using:
  - **spaCy** and **Hugging Face** for natural language processing.
  - Pre-trained models for skill extraction and resume-job match scoring.
- **Workflow**:
  - User uploads resume -> Service compares it against job descriptions stored in Elasticsearch -> Generates a match score and highlights.
- **Integration**: Accessible via the API Gateway.

---

### **6. Data Storage**

- **Relational Database**: PostgreSQL for structured data (user accounts, jobs, resumes).
  - Optimized with indexing and partitioning for scalability.
- **Search Engine**: Elasticsearch for full-text search on job descriptions and resumes.
- **Object Storage**: S3 for storing raw scraped data and uploaded resumes.

---

### **7. Data Pipeline**

- **Message Queue**: Kafka for streaming job data from the scraper to consumers.
- **Distributed Processing**: Apache Spark processes large-scale job data for analytics.

---

### **8. Authentication and Authorization**

- **Auth Provider**: [Auth0](https://auth0.com/) or [NextAuth.js](https://next-auth.js.org/) for OAuth and JWT-based authentication.
- **Security**:
  - Enforce HTTPS.
  - Encrypt sensitive user data using AWS KMS.

---

### **9. Cloud Infrastructure**

- **Provider**: AWS.
- **Key Services**:
  - EC2: For hosting Dockerized services.
  - ECS or EKS: For container orchestration.
  - S3: For object storage.
  - RDS: For PostgreSQL.
  - Lambda: Event-driven processing.
  - CloudWatch: Logging and monitoring.

---

### **10. Monitoring and Analytics**

- **Monitoring Tools**:
  - **Prometheus** for metrics collection.
  - **Grafana** for dashboard visualization.
- **Logging**:
  - Centralized logging with **Elasticsearch** and **Kibana**.

---

## **Scalability Features**

- **Horizontal Scaling**: Use Kubernetes to scale services independently.
- **Load Balancing**: NGINX or AWS ALB for distributing traffic.
- **Caching**: Redis for caching API responses and user session data.
- **Auto-scaling**: Leverage AWS EC2 auto-scaling groups.

---

## **Future Improvements**

- Add **serverless functions** (e.g., AWS Lambda) for lightweight, event-driven tasks.
- Implement **CI/CD pipelines** using GitHub Actions for automated deployment.
- Explore **fine-tuned models** for better ATS scoring.

---

This architecture provides a scalable, production-ready system while incorporating modern tools and technologies to maximize learning opportunities.

        +---------------------+
        |   User's Browser    |
        +----------+----------+
                   |
                   v
        +---------------------+
        |  Next.js Frontend   |   (Server Components render HTML with SSR)
        |   (NextAuth, SSR)   |
        +----------+----------+
                   |
       Pre-fetched data / API calls
                   |
                   v
        +---------------------+
        | Next.js API Routes  |   (Authentication & proxy layer)
        |  (/api/profile/...) |
        +----------+----------+
                   |
                   v
        +---------------------+
        |  Go Backend API     |   (Business logic, data storage)
        | (Load Balanced &    |
        |   Scalable)         |
        +---------------------+


https://chatgpt.com/c/67b01268-a988-8011-af86-7b7c8ef78a16

https://chatgpt.com/c/67b0263d-972c-8011-8f2d-4003eede0401


┌────────────────┐       Publish      ┌────────────┐       Consume      ┌─────────────┐       Query      ┌───────────────┐
│ LinkedIn Scraper│ ───────────────► │ Kafka Topic │ ───────────────► │ Backend API│ ───────────────► │ Next.js Frontend │
└────────────────┘                    └────────────┘                    └─────────────┘                    └───────────────┘
