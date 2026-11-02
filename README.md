# Interactive Clothesline Portfolio & Studio CMS

A high-performance, tactile web portfolio inspired by physical clothesline physics, featuring dynamic SVG catenary curves, pendulum swing momentum, full-fidelity case studies, and an integrated Content Management System (CMS) backed by **TiDB Cloud Serverless** and deployed on **Render**.

---

## Architecture Overview

```
                                      +--------------------------+
                                      |    Render Web Service    |
[ Visitor / Client Browser ] --------> | (Gunicorn + Flask Engine)|
         |                            +-------------+------------+
         |                                          |
         | (Fetch / Save API)                       | (TLS Connection on Port 4000)
         v                                          v
+-----------------------+              +--------------------------+
|  Studio CMS Interface |              |  TiDB Cloud (Serverless) |
|      (admin.html)     |              |  Distributed SQL DB      |
+-----------------------+              +--------------------------+
```

---

## 3-Step Production Deployment Guide

### Step 1: Push Code to GitHub

1. Initialize git in your local directory (if not already initialized):
   ```bash
   cd /home/lyrch/Documents/porfolio
   git init
   git add .
   git commit -m "feat: complete interactive clothesline portfolio and CMS"
   ```

2. Create a new repository on your GitHub account (e.g. `interactive-portfolio`).

3. Link and push your code:
   ```bash
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git branch -M main
   git push -u origin main
   ```

---

### Step 2: Set Up TiDB Cloud Serverless (Free Forever)

1. Sign up for a free account at **[tidbcloud.com](https://tidbcloud.com)** (no credit card required).
2. Click **Create Cluster** and select **Serverless**.
3. Choose your preferred region (e.g., `US East (N. Virginia)` or `Asia Pacific (Tokyo)`).
4. Once the cluster is created, click **Connect**:
   * Choose **Connection Type**: General / PyMySQL.
   * Generate a password and copy the connection parameters:
     * **Host**: (e.g., `gateway01.us-east-1.prod.aws.tidbcloud.com`)
     * **Port**: `4000`
     * **User**: (e.g., `xxxxxx.root`)
     * **Password**: `your-generated-password`
     * **Database**: `test`

> [!NOTE]
> You do **not** need to manually create tables! The server automatically executes table creation and seeds the initial projects upon first boot.

---

### Step 3: Deploy Live to Render.com

1. Sign up or log in to **[render.com](https://render.com)**.
2. In the Render Dashboard, click **New +** and select **Web Service**.
3. Connect your GitHub repository.
4. Configure the service settings:
   * **Name**: `my-portfolio` (or your choice)
   * **Runtime**: `Python 3`
   * **Build Command**: `pip install -r requirements.txt`
   * **Start Command**: `gunicorn server:app`
   * **Instance Type**: `Free`
5. Under **Environment Variables**, add the following keys from your TiDB cluster:

   | Key | Value | Description |
   | :--- | :--- | :--- |
   | `TIDB_HOST` | `gateway01.us-east-1.prod.aws.tidbcloud.com` | TiDB Cloud Gateway Host |
   | `TIDB_PORT` | `4000` | TiDB Default Port |
   | `TIDB_USER` | `xxxxxx.root` | TiDB Username |
   | `TIDB_PASSWORD` | `your-tidb-password` | TiDB Password |
   | `TIDB_DATABASE` | `test` | Target Database Name |
   | `ADMIN_PASSWORD` | `choose-a-strong-password` | Security key to protect the CMS |

6. Click **Deploy Web Service**!

Render will build the application, install dependencies, provision a free HTTPS SSL certificate, and give you your live URL (e.g., `https://my-portfolio.onrender.com`).

---

## Managing Your Live Portfolio via CMS

Once deployed:
1. Navigate to `https://my-portfolio.onrender.com/admin.html`
2. Enter the `ADMIN_PASSWORD` you configured on Render in the **Admin Key** field in the header.
3. Edit projects, reorder garments on the clothesline, adjust wire tension, or update your timeline.
4. Click **Save**: your edits are committed directly to your **TiDB Serverless** database and immediately visible to anyone visiting your portfolio worldwide!

---

## Running Locally

To run locally on your development machine:
```bash
python3 server.py
```
Open [http://localhost:8080](http://localhost:8080) in your browser. (When running locally without TiDB credentials, it automatically uses SQLite or browser storage for zero-config testing).
