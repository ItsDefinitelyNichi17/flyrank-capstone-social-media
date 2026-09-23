# Social Media Platform
## About
  A social media service that converts blog post into social media campagin. The service create one variant for each social media platform (X, LinkedIn, Discord). Both X and LinkedIn uses Mock API, only the Discord uses the actual publisher using Discord Webhook. 

  An approved variant can be scheduled and publish to the respective social media platform. Variants are created using Gemini LLM with its own rules depending on the platform.

## Purpose
  This is a requirement for Flyrank AI Internship Backend Capstone. The point of this project is not the API calls, but publishing the system that survives real world production.
  * Retry must not publish the same post two times.
  * Worker that stops in the middle of a batch must continue safely.
  * Unapproved variant must never go out.

## How to: 
  * Run the project using: `npm run start`
  * Run the image services using: `docker-compose up`
  * Create project image(Make sure to run this on the root): 
  ```
  sudo docker build -f src/Dockerfile -t <project-name> .
  ```
  * Test the project requirements: `npm run test`

## Technology and Services Used
* Redis and BullMQ : For Scheduling tasks
* Jest : For Testing
* turndown : For converting HTML to Markdown
* PostgresSQL & pg: For storing data
* Docker: For containerizing the application and running isolated services.
* Express Framework : For building the API.
* Yaak : Main application used to send requests/test my API.

## Endpoints:
| METHOD | ENDPOINT                     | DESCRIPTION                                     | BODY PARAMETERS                                  |
|--------|------------------------------|-------------------------------------------------|--------------------------------------------------|
| GET    | /articles/                   | Get all Article Description. [articles](src/services/mock-articles/)                   | n/a                                              |
| GET    | /articles/:article_name      | Retrieve  Specific Article                      | n/a                                              |
| POST   | /post/                       | Ingest the post, accepts URL or Markdown        | JSON: {content: URL\|markdown}                   |
| GET    | /variant/                    | Retrieve all variants details                   | n/a                                              |
| PATCH  | /variant/status/:variant_id  | Change the variant status 'approved', 'rejected | JSON: {status: approve\|rejected post_id : UUID} |
| POST   | /variant/schedule/:variantId | Schedule the variant                            | JSON: {schedule: Timestampz}                     |
| GET    | /variant/schedule/           | Get all scheduled publish and queued variants   | n/a                                              |
|        |                              |                                                 |                                                  |
