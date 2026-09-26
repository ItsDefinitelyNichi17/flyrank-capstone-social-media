# Evidence  
## **Ingestion**: 
A post enters as a URL or as Markdown, and is stored. Generation reads only the stored post.
![](./assets/ingest.1.png)
![](./assets/ingest.2.png)
![](./assets/ingest.3.png)
## **Constraints**: 
length, tone rules, and hashtag count per platform. A test proves that a badvariant is blocked
  * `npm run test:constraints` <br>
![](./assets/constraints.png)
## **1 test 4 boxes**: 
blocked variant, refused schedule, duplicate publish, adapter swap
  * `npm run test:services` <br>
![](./assets/4.png)
## **Idempotent publish** : 
the same variant and slot never post two times, even under retries. A test proves it.
  * `npm run test:idempotent` <br>
  * ![](./assets/idempotent.png)
## **Publish History**:
  * `GET /variant/schedule` <br>
  * ![](./assets/history.png)
## **SecretClean and README.md**:
  * check [readme.md](../README.md) and [env.example](../.env.example)
