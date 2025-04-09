<p align="center">
  <img src="https://readme-typing-svg.herokuapp.com?font=Fira+Code&size=35&duration=3000&pause=1000&center=true&vCenter=true&width=435&lines=🚀+Welcome+to+JobFlow!" alt="JobFlow Banner" />
</p>


# JobFlow  

A scalable job scraping and tracking platform with advanced autofill tools, resume intelligence, and real-time analytics to empower your job hunt.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Installation](#installation)
- [Project Structure](#project-structure)
- [Features](#features)
- [TODO](#todo)
- [Contributors](#contributors)
- [Contact](#contact)

---

## Tech Stack

- **Frontend**: Next.js 15+ (SSR)
- **Backend**: Python + WSGI (Flask + Gunicorn)
- **Search**: Elasticsearch
- **Scraping**: Scrapy (via Cron)
- **Streaming**: Kafka
- **Analytics**: Apache Spark
- **Database**: PostgreSQL
- **Monitoring**: Prometheus + Grafana
- **Infrastructure**: Docker, Kubernetes, Terraform

---

## Architecture

```mermaid
graph TD
    A[User (Browser)] --> B[Next.js SSR Frontend]
    B --> C[API Routes / Auth]
    C --> D[Flask REST API]
    D --> E[PostgreSQL]
    D --> F[Elasticsearch]
    D --> G[Kafka]
    H[Scraper Cron Job] --> E
    H --> F
    G --> I[Spark Analytics]
    I --> E
```

Also see `diagram.py` for a rendered system diagram using the Python diagrams library.

---

## Installation

```bash
# Clone the repository
git clone https://github.com/sagarpatel211/jobflow.git
cd jobflow

# If using Windows, run setup.bat
setup.bat

# If using Linux/MacOS, run setup.sh
setup.sh
```

Make sure `.env.local` is configured in `apps/frontend` and `apps/backend` and no ports (5432, 5000, 9200) are occupied.

---

## TODO

### Dev Tasks
- [ ] Complete server-side rendering for all pages
- [ ] Add proper domain handling in `next.config.ts`
- [ ] Finish dark/light mode landing page
- [ ] Use AI-enhanced resume editing in job tracker
- [ ] Add resume/cover letter auto-generation tool

### Scaling & System
- [ ] Migrate from microservices to centralized monolith for cost-saving
- [ ] Replace Docker Compose with full Kubernetes manifests
- [ ] Add Excalidraw system diagram in README
- [ ] Write unit tests and CI pipeline

### Chrome Extension
- [ ] Build job queue dashboard
- [ ] Autofill LinkedIn/Workday flows
- [ ] Auto-archive stale listings intelligently
- [ ] Sync resume info with backend for autofill

---

## Contributors

| <a href="https://github.com/sagarpatel211" target="_blank">**Sagar Patel**</a> |
|:---:|
| [![Sagar Patel](https://avatars1.githubusercontent.com/u/34544263?s=200)](https://github.com/sagarpatel211) |
| <a href="https://github.com/sagarpatel211" target="_blank">`github.com/sagarpatel211`</a> |

---

## Contact

#### Sagar  
📧 [sa24pate@uwaterloo.ca](mailto:sa24pate@uwaterloo.ca)  
🌐 [sagarpatel211.github.io](https://sagarpatel211.github.io/)

---