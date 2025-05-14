# Ads Generator

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![AWS](https://img.shields.io/badge/AWS-SST-orange)
![React](https://img.shields.io/badge/React-Frontend-blue)
![OpenAI](https://img.shields.io/badge/OpenAI-Powered-brightgreen)
![Reference](https://img.shields.io/badge/Status-Reference-yellow)

An AI-powered application for generating compelling ad images based on your business needs. Simply describe your ad requirements, target audience, and brand information, and our AI will create professional ad images optimized for your marketing campaigns.

## Key Features

- **AI-Powered Ad Generation**: Create professional ad images with just a few inputs
- **Business Templates**: Pre-configured templates for coaches, consultants, and agencies
- **Customizable Styles**: Specify your preferred visual style and branding
- **Audience Targeting**: Optimize your ads for specific audience demographics
- **Serverless Architecture**: Built with AWS SST for scalable, cost-effective operation
- **Modern React Frontend**: Clean, responsive user interface

## Architecture

- **SST Infrastructure**: Serverless infrastructure as code
- **DynamoDB**: Scalable storage for ad data
- **React Frontend**: Modern, responsive user interface
- **OpenAI Integration**: AI-powered image generation
- **Hexagonal Architecture**: Clean, maintainable code structure with adapters and use cases

## Getting Started

1. Install dependencies:
   ```bash
   bun install
   ```

2. Install SST:
   ```bash
   bun install sst
   ```

3. Create your environment variables:
   - Copy the `.env.template` file to `.env`
   - Update the values in `.env` with your configuration

4. Set your AWS profile:
   ```bash
   export AWS_PROFILE=your-profile-name
   ```

5. Load secrets into SST:
   ```bash
   bun sst secret load .env --stage <your-stage>
   ```
   Replace `<your-stage>` with your desired stage (e.g., dev, staging, prod)

6. Start development or deploy:
   ```bash
   # For local development
   bun sst dev

   # For deployment
   bun sst deploy
   ```

## Project Structure

This project uses a modular monorepo structure with the following packages:

1. **core/**: Contains the business logic, adapters, and use cases for the ad generation service
   - Hexagonal architecture with primary and secondary adapters
   - OpenAI integration for image generation
   - Repository implementations for data persistence

2. **functions/**: AWS Lambda functions for the API endpoints
   - Request ad generation
   - Retrieve generated ads
   - User authentication and management

3. **frontend/**: React application for the user interface
   - Ad creation form with templates
   - Ad gallery and detail views
   - Responsive design for all devices

4. **metadata/**: Schema definitions and type declarations
   - Zod schemas for validation
   - TypeScript types for end-to-end type safety
   - Shared constants and enums

5. **utils/**: Utility functions and helpers
   - OpenAI client configuration
   - AWS service integrations
   - Common helper functions

## Development Workflow

1. Make changes to the codebase
2. Run tests to ensure functionality:
   ```bash
   bun test
   ```
3. Start the local development server:
   ```bash
   bun sst dev
   ```
4. Access the frontend at http://localhost:3000

## Deployment

The application can be deployed to AWS using SST:

```bash
bun sst deploy --stage prod
```

This will deploy all resources including:
- API Gateway endpoints
- Lambda functions
- DynamoDB tables
- S3 buckets for image storage
- CloudFront distributions

## License

MIT

## Reference Repository Notice

This repository serves as a reference implementation. It is provided as an example of how to build an AI-powered ad generation application using AWS SST, React, and OpenAI.

**Please Note:**
- This is a reference repository only
- Pull requests will not be accepted
- Issues will not be addressed
- Feel free to fork this repository and adapt it for your own projects
