//input
export interface PublishPayload{
  variantId: string;
  content: string;
  mediaUrls? : string
}

//output
export interface PublishResult {
  success: boolean;
  externalPostId?: string;
  errorMessage?: string;
}

// abstract implementation for the publisher
export interface ISocialPublisher {
  readonly platformName: string;
  publish(payload: PublishPayload): Promise<PublishResult>;
}
