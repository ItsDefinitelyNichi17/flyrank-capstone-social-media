//input
export interface PublishPayload {
  variantId: string | undefined;
  slotId?: string | undefined;
  content: string;
  mediaUrls?: string;
}

//output
export interface PublishResult {
  success: boolean;
  errorMessage?: string;
  alreadyPublished?: boolean;
}

// abstract implementation for the publisher
export interface ISocialPublisher {
  readonly platformName: string;
  publish(payload: PublishPayload): Promise<PublishResult>;
}
