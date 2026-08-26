# AI Image Matching Engine

An AI-powered backend application that analyzes images and finds the most relevant images based on either a text query or an uploaded image.

The system uses Google's Gemini AI to understand image content and generates structured metadata such as the subject, category, description, and tags. This metadata is then used to rank existing images according to their relevance.

## Features

- AI-powered image analysis using Gemini
- Extracts structured image metadata
- Generates:
  - Subject
  - Category
  - Description
  - Tags
  - Confidence score
- Validates generated image data using Zod
- Stores analyzed image metadata in JSON
- Text-based image matching
- Returns ranked image results
- Image upload support using Multer
- Analyzes uploaded images with Gemini
- Matches uploaded images against the existing image database
- Returns the top matching images
- File type validation
- 5 MB upload size limit
- Temporary uploaded images are automatically removed after processing

## Technology Stack

- Node.js
- Express.js
- Google Gemini API
- Multer
- Zod
- Dotenv

## Project Structure

```text
image-matching-engine/
│
├── data/
│   └── images.json
│
├── images/
│   ├── fox.jpg
│   ├── wolf.jpg
│   ├── dog.jpg
│   └── ...
│
├── src/
│   ├── index.js
│   ├── analyzeImages.js
│   └── matcher.js
│
├── uploads/
│
├── .env
├── .env.example
├── .gitignore
├── package.json
└── package-lock.json