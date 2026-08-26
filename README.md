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
<img width="1053" height="160" alt="ebeb67da-168a-4e09-acff-b5d4430b7ad6-Screenshot-2026-08-26-165935.png" src="https://github.com/user-attachments/assets/aec13e29-bcab-47f9-bb38-be0291ce517f" />
<img width="1057" height="802" alt="5f51d82a-d514-4e65-b320-ad134ff8482f-Screenshot-2026-08-26-115648.png" src="https://github.com/user-attachments/assets/2343cda0-fb84-4cfd-b212-0e5362b34d2e" />
