# Cursor Full Stack Template
![Alpha Version](https://img.shields.io/badge/version-alpha-blue)

This is an opinionated starter template for building full-stack applications with AWS, SST, and React. It provides a solid foundation with pre-configured infrastructure, authentication, and API integrations to help you get started quickly.

You'll want to customize this template to fit your specific project needs. The modular structure allows you to easily modify components, add new features, and adapt the infrastructure as your application grows.

Key features:
- SST infrastructure as code
- DynamoDB tables for data storage
- React frontend with modern tooling
- Authentication ready with Clerk 
- API key management with Unkey
- Credit based billing with Stripe
- Email with Resend
- Modular Monorepo with service based architecture


## Get started


1. Install dependencies:
   ```bash
   bun install
   ```

2. Install sst: 
   ```
   bun install sst
   ```

2. Create your environment variables:
   - Copy the `.env.template` file to `.env`
   - Update the values in `.env` with your configuration

4. Set your AWS profile:
   ```bash
   export AWS_PROFILE=your-profile-name
   ```
3. Load secrets into SST:
   ```bash
   bun sst secret load .env --stage <your-stage>
   ```
   Replace `<your-stage>` with your desired stage (e.g., dev, staging, prod)

5. Start development or deploy:
   ```bash
   # For local development
   bun sst dev

   # For deployment
   bun sst deploy
   ```



## Usage

This template uses [Workspaces](https://bun.sh/docs/install/workspaces). It has 5 packages to start with and you can add more if needed:

1. `core/`
   
   The core package contains foundational libraries and orchestration logic for your application. It includes AWS service integrations, shared business logic, and core functionality that other packages depend on. This is the central shared code that can be imported by other packages in your project.

2. `functions/`

   This package contains your AWS Lambda functions that handle API requests and other serverless operations. It uses the `core` package as a local dependency to access shared business logic and AWS integrations. Examples include authentication, billing, and agent runtime functions.

3. `frontend/`

   The frontend package contains a Next.js web application with Tailwind CSS for styling. This is where your user interface components, pages, and client-side logic reside. It provides the visual interface for interacting with your backend services.

4. `metadata/`

   The metadata package serves as a central repository for schema definitions, type declarations, and data models. It uses Zod for schema validation and type inference. This package defines the structure of your data entities, API contracts, and standardizes response formats across your application.

5. `utils/`

   The utils package contains utility functions, helpers, and tools that can be used across multiple packages. It provides common functionality that doesn't belong in the core business logic but is still needed throughout the application.


### Infrastructure

The `infra/` directory allows you to logically split the infrastructure of your app into separate files. This can be helpful as your app grows.

In the template, `web.ts`. These export the created resources. And are imported in the `sst.config.ts`.

For more guidance on how to define your infrastructure, head over to [sst docs](https://sst.dev/docs/).

To see examples of different set ups, see [sst examples](https://sst.dev/docs/examples/).

# Chat With This Repo
You can chat with this repo [here](https://deepwiki.com/tfcbot/fs-template/1.1-project-architecture)